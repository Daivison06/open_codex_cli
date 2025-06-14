import type { ResponseInputItem } from "openai/resources/responses/responses.mjs";

export type ChatCompatibleMessage = {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  name?: string;
  tool_call_id?: string;
};

/**
 * Convert input to messages
 *
 * @param input Array of ResponseInputItem
 * @param instructions Optional system prompt
 * @returns Array of messages compatible with providers like Groq, OpenAI chat completions, etc.
 */
export function convertInputToMessages(
  input: ResponseInputItem[],
  instructions?: string
): ChatCompatibleMessage[] {
  const messages: ChatCompatibleMessage[] = [];

  if (instructions) {
    messages.push({
      role: "system",
      content: instructions,
    });
  }

  for (const item of input) {
    if (item.type === "message") {
      const textPart = Array.isArray(item.content) 
        ? item.content.find(
            (c: { type: string }) => c.type === "input_text" || c.type === "output_text"
          )
        : null;
      if (textPart && 'text' in textPart) {
        messages.push({
          role: item.role as "user" | "assistant" | "system",
          content: textPart.text,
        });
      }
    }

    if (item.type === "function_call_output") {
      messages.push({
        role: "tool",
        content: item.output,
        tool_call_id: item.call_id,
      });
    }
  }

  return messages;
}
