/**
 * Common interface for all LLM providers
 * This ensures consistent behavior across different provider implementations
 */
export interface ProviderInterface {
  /**
   * List available models from the provider
   */
  listModels(): Promise<any>;

  /**
   * Create a streaming response for chat interactions
   */
  createStream(params: {
    model: string;
    instructions: string;
    previous_response_id?: string;
    input: Array<any>;
    reasoning?: any;
  }): Promise<any>;

  /**
   * Create a simple chat completion without streaming
   * This method should be implemented by all providers to ensure compatibility
   */
  createChatCompletion(params: {
    model: string;
    messages: Array<{ role: string; content: string }>;
  }): Promise<string>;
}

/**
 * Response format for chat completions
 * Standardized across all providers
 */
export interface ChatCompletionResponse {
  content: string;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
} 