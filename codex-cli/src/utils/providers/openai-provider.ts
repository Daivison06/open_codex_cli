import OpenAI from "openai";
import { OPENAI_BASE_URL, OPENAI_TIMEOUT_MS } from "../config.js";
import type { ResponseInputItem } from "openai/resources/responses/responses.mjs";
import { CLI_VERSION, getSessionId, ORIGIN } from "../session.js";
import { randomUUID } from "node:crypto";
import { zodResponseFormat } from "openai/helpers/zod.mjs";
import { EditedFilesSchema } from "../singlepass/file_ops.js";
import { ProviderInterface } from "./provider-interface.js";

export class OpenAIProvider implements ProviderInterface {
  private static readonly DEFAULT_MODEL = "o4-mini";
  
  private oai: OpenAI;

  private apiKey = process.env["OPENAI_API_KEY"] ?? "";
  private timeoutMs = OPENAI_TIMEOUT_MS;

  /**
   * Constructor for the OpenAIProvider class.
   * 
   * This constructor initializes the OpenAI client with the provided API key, base URL, and timeout.
   * It also sets default headers for the client, including the originator, version, and session ID.
   * 
   * @returns {OpenAIProvider} A new instance of the OpenAIProvider class.
   */
  constructor() {
    this.oai = new OpenAI({
      ...(this.apiKey ? { apiKey: this.apiKey } : {}),
      baseURL: OPENAI_BASE_URL,
      defaultHeaders: {
        originator: ORIGIN,
        version: CLI_VERSION,
        session_id: getSessionId() || randomUUID().replaceAll("-", ""),
      },
      ...(this.timeoutMs !== undefined ? { timeout: this.timeoutMs } : {}),
    });
  }

  /**
   * Get the default model for OpenAI provider
   */
  getDefaultModel(): string {
    return OpenAIProvider.DEFAULT_MODEL;
  }

  /**
   * Initializes the OpenAIProvider with the necessary configuration.
   * 
   * This constructor sets up the OpenAI client with the provided API key, base URL, and timeout.
   * It also sets default headers for the client, including the originator, version, and session ID.
   * 
   * @param {string} apiKey - The API key for OpenAI.
   * @param {number} timeoutMs - The timeout in milliseconds for OpenAI requests.
   */
  async listModels() {
    return this.oai.models.list();
  }

  /**
   * Creates a stream of responses from the OpenAI API.
   * 
   * This method sends a request to the OpenAI API to create a stream of responses.
   * It includes parameters for the model, instructions, previous response ID, input, reasoning, and tools.
   * 
   * @param {Object} params - The parameters for the request.
   * @param {string} params.model - The model to use for the request.
   * @param {string} params.instructions - The instructions for the request.
   * @param {string} [params.previous_response_id] - The ID of the previous response.
   * @param {Array<ResponseInputItem>} params.input - The input for the request.
   * @param {any} [params.reasoning] - The reasoning for the request.
   * @returns {Promise<OpenAI.Response>} A promise that resolves to the response from the OpenAI API.
   */
  async createStream(params: {
    model: string;
    instructions: string;
    previous_response_id?: string;
    input: Array<ResponseInputItem>;
    reasoning?: any;
  }) {
    return this.oai.responses.create({
      model: params.model,
      instructions: params.instructions,
      previous_response_id: params.previous_response_id,
      input: params.input,
      stream: true,
      parallel_tool_calls: false,
      reasoning: params.reasoning,
      tools: [
        {
          type: "function",
          name: "shell",
          description: "Runs a shell command, and returns its output.",
          strict: false,
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
                description:
                  "The maximum time to wait for the command to complete in milliseconds.",
              },
            },
            required: ["command"],
            additionalProperties: false,
          },
        },
      ],
    });
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
      const completion = await this.oai.chat.completions.create({
        model: params.model,
        messages: params.messages.map(msg => ({
          role: msg.role as "system" | "user" | "assistant",
          content: msg.content,
        })),
      });
      
      return completion.choices[0]?.message?.content || "";
    } catch (error) {
      console.error("OpenAI createChatCompletion error:", error);
      throw error;
    }
  }

  /**
   * Parses a completion using the OpenAI API.
   * 
   * This method sends a request to the OpenAI API to parse a completion.
   * It includes parameters for the model, messages, and response format.
   *
   * @param {Object} config - The configuration for the request.
   * @param {string} config.model - The model to use for the request.
   * @param {Array<{ role: string; content: string }>} config.messages - The messages for the request.
   * @param {string} taskContextStr - The task context string for the request.
   * @returns {Promise<OpenAI.Response>} A promise that resolves to the response from the OpenAI API.
   */
  async parseCompletion(config: {
    model: string;
    messages: Array<{ role: string; content: string }>;
  }, taskContextStr: string) {
    return await this.oai.beta.chat.completions.parse({
      model: config.model,
      messages: [
        {
          role: "user",
          content: taskContextStr,
        },
      ],
      response_format: zodResponseFormat(EditedFilesSchema, "schema"),
    });
  }
} 