// LLM Provider abstraction using the generic provider system

import { getModelProvider } from "./get-provider.js";

/**
 * Generate a chat completion using the configured provider.
 * Provider is determined by the LLM_PROVIDER environment variable.
 * Falls back to OpenAI if no provider is configured.
 * 
 * @param params - Chat completion parameters
 * @returns Promise resolving to the completion content
 */
export async function generateChatCompletion(params: {
  model: string;
  messages: Array<{ role: string; content: string }>;
  providerFlag?: string;
}): Promise<string> {
  const { providerFlag, ...completionParams } = params;
  const provider = getModelProvider(providerFlag);
  return await provider.createChatCompletion(completionParams);
} 