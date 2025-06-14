import { Readable } from "stream";
import type { ResponseItem, ResponseStreamEvent } from "openai/resources/responses/responses.mjs";
import { randomUUID } from "node:crypto";

/*
 This is a stream adapter for the Groq provider.
 It converts the Groq stream into an OpenAI-like stream.
 Updated to handle tool calls from Groq streaming responses.
*/
export function GroqAdapterStream(groqStream: AsyncIterable<any>): Readable {
  const responseId = `groq-${randomUUID()}`;
  const buffer: string[] = [];
  let toolCalls: any[] = [];

  const adapted = Readable.from((async function* () {
    for await (const chunk of groqStream) {
      const choice = chunk.choices?.[0];
      const delta = choice?.delta;

      // Handle regular content
      if (delta?.content) {
        buffer.push(delta.content);
      }

      // Handle tool calls
      if (delta?.tool_calls) {
        for (const toolCall of delta.tool_calls) {
          // Find existing tool call or create new one
          let existingToolCall = toolCalls.find(tc => tc.id === toolCall.id);
          
          if (!existingToolCall) {
            existingToolCall = {
              id: toolCall.id || `call_${randomUUID().slice(0, 8)}`,
              type: toolCall.type || "function",
              function: {
                name: toolCall.function?.name || "",
                arguments: toolCall.function?.arguments || ""
              }
            };
            toolCalls.push(existingToolCall);
          } else {
            // Append to existing arguments if streaming
            if (toolCall.function?.arguments) {
              existingToolCall.function.arguments += toolCall.function.arguments;
            }
            if (toolCall.function?.name) {
              existingToolCall.function.name = toolCall.function.name;
            }
          }
        }
      }

      // Handle completion
      if (choice?.finish_reason === "stop" || choice?.finish_reason === "tool_calls") {
        let item: ResponseItem;

        if (toolCalls.length > 0) {
          // Create function call output item for tool calls
          item = {
            id: responseId,
            type: "function_call",
            role: "assistant",
            name: toolCalls[0].function.name,
            call_id: toolCalls[0].id,
            arguments: toolCalls[0].function.arguments,
            status: "completed",
          } as ResponseItem;

          // For multiple tool calls, emit each one separately
          for (const toolCall of toolCalls) {
            const toolItem: ResponseItem = {
              id: `${responseId}_${toolCall.id}`,
              type: "function_call",
              role: "assistant", 
              name: toolCall.function.name,
              call_id: toolCall.id,
              arguments: toolCall.function.arguments,
              status: "completed",
            } as ResponseItem;

            yield <ResponseStreamEvent>{ 
              type: "response.output_item.done", 
              item: toolItem 
            };
          }
        } else {
          // Regular text response
          const fullText = buffer.join("").trim();
          
          item = {
            id: responseId,
            type: "message",
            role: "assistant",
            content: [
              {
                type: "output_text",
                text: fullText,
                annotations: [],
              },
            ],
            status: "completed",
          };

          yield <ResponseStreamEvent>{ type: "response.output_item.done", item };
        }

        yield <ResponseStreamEvent>{
          type: "response.completed",
          response: {
            output: toolCalls.length > 0 ? toolCalls.map(tc => ({
              id: `${responseId}_${tc.id}`,
              type: "function_call",
              role: "assistant",
              name: tc.function.name,
              call_id: tc.id,
              arguments: tc.function.arguments,
              status: "completed",
            })) : [item],
            status: "completed",
            id: responseId,
          },
        };

        // Reset for next response
        buffer.length = 0;
        toolCalls = [];
      }
    }
  })());

  return adapted;
}
