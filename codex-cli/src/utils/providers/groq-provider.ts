import Groq from "groq-sdk";
import { GROQ_BASE_URL, GROQ_TIMEOUT_MS, GROQ_API_KEY } from "../config.js";
import type { ResponseInputItem, ResponseStreamEvent } from "openai/resources/responses/responses.mjs";
import { CLI_VERSION, getSessionId, ORIGIN } from "../session.js";
import { randomUUID } from "node:crypto";
import { Stream } from "openai/streaming.mjs";
import { isLoggingEnabled } from "../agent/log.js";
import { log } from "../agent/log.js";
import { GroqAdapterStream } from "./groq/GroqAdapterStream.js";
import { convertInputToMessages } from "./groq/convertInputToMessages.js";
import { ProviderInterface } from "./provider-interface.js";

export class GroqProvider implements ProviderInterface {
  private static readonly DEFAULT_MODEL = "llama-3.3-70b-versatile";

  private gq: Groq;

  private apiKey = GROQ_API_KEY;
  private timeoutMs = GROQ_TIMEOUT_MS;

  /**
   * Constructor for the GroqProvider class.
   * 
   * This constructor initializes the Groq client with the provided API key, base URL, and timeout.
   * It also sets default headers for the client, including the originator, version, and session ID.
   * 
   * @returns {GroqProvider} A new instance of the GroqProvider class.
   */
  constructor() {
    this.gq = new Groq({
      ...(this.apiKey ? { apiKey: this.apiKey } : {}),
      baseURL: GROQ_BASE_URL,
      defaultHeaders: {
        originator: ORIGIN,
        version: CLI_VERSION,
        session_id: getSessionId() || randomUUID().replaceAll("-", ""),
      },
      ...(this.timeoutMs !== undefined ? { timeout: this.timeoutMs } : {}),
    });
  }

  /**
   * Get the default model for Groq provider
   */
  getDefaultModel(): string {
    return GroqProvider.DEFAULT_MODEL;
  }

  /**
   * Initializes the GroqProvider with the necessary configuration.
   * 
   * This constructor sets up the Groq client with the provided API key, base URL, and timeout.
   * It also sets default headers for the client, including the originator, version, and session ID.
   * 
   * @param {string} apiKey - The API key for Groq.
   * @param {number} timeoutMs - The timeout in milliseconds for Groq requests.
   */
  async listModels() {
    return this.gq.models.list();
  }

  /**
   * Creates a stream of responses from the Groq API.
   * 
   * This method sends a request to the Groq API to create a stream of responses.
   * It includes parameters for the model, instructions, previous response ID, input, reasoning, and tools.
   * 
   * @param {Object} params - The parameters for the request.
   * @param {string} params.model - The model to use for the request.
   * @param {string} params.instructions - The instructions for the request.
   * @param {string} [params.previous_response_id] - The ID of the previous response.
   * @param {Array<ResponseInputItem>} params.input - The input for the request.
   * @param {any} [params.reasoning] - The reasoning for the request.
   * @returns {Promise<OpenAI.Response>} A promise that resolves to the response from the Groq API.
   */
  async createStream(params: {
    model: string;
    instructions: string;
    previous_response_id?: string;
    input: Array<ResponseInputItem>;
    reasoning?: any;
  }): Promise<Stream<ResponseStreamEvent>> {
    const messages = convertInputToMessages(params.input, params.instructions);
    const response = await this.gq.chat.completions.create({
      model: params.model,
      messages: messages as Groq.Chat.ChatCompletionMessageParam[],
      stream: true,
      tools: [
        {
          type: "function",
          function: {
            name: "shell",
            description: "Runs a shell command, and returns its output.",
            parameters: {
              type: "object",
              properties: {
                command: { type: "array", items: { type: "string" } },
                workdir: {
                  type: "string",
                  description: "The working directory for the command.",
                },
                timeout: {
                  type: "number",
                  description: "The timeout for the command in milliseconds.",
                },
              },
              required: ["command", "workdir"],
            },
          },
        },
      ],
      tool_choice: "auto",
    });

    if (isLoggingEnabled()) {
      log("Groq Provider" + JSON.stringify(response));
    }

    return GroqAdapterStream(response) as unknown as Stream<ResponseStreamEvent>;
  }

  /**
   * Creates a simple chat completion without streaming
   * This method implements the ProviderInterface requirement
   *
   * @param {Object} params - The parameters for the request.
   * @param {string} params.model - The model to use for the request.
   * @param {Array<{ role: string; content: string }>} params.messages - The messages for the request.
   * @returns {Promise<string>} A promise that resolves to the response content.
   */
  async createChatCompletion(params: {
    model: string;
    messages: Array<{ role: string; content: string }>;
  }): Promise<string> {
    try {
      const completion = await this.gq.chat.completions.create({
        model: params.model,
        messages: params.messages.map(msg => ({
          role: msg.role as "system" | "user" | "assistant",
          content: msg.content,
        })) as Groq.Chat.ChatCompletionMessageParam[],
      });
      
      return completion.choices[0]?.message?.content || "";
    } catch (error) {
      console.error("Groq createChatCompletion error:", error);
      throw error;
    }
  }
} 