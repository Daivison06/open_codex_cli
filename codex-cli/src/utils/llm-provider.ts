// LLM Provider abstraction using the generic provider system

import { getModelProvider } from "./get-provider.js";

/**
 * Generate a chat completion using the configured LLM provider.
 * Automatically supports all providers (OpenAI, Groq, etc.) through the generic provider system.
 * Provider is determined by the LLM_PROVIDER environment variable.
 *
 * @param messages Array of chat messages with role and content
 * @param model The model identifier to use for the completion
 * @returns Promise that resolves to the completion text
 */
export async function generateChatCompletion({
  messages,
  model,
}: {
  messages: Array<{ role: string; content: string }>;
  model: string;
}): Promise<string> {
  try {
    const provider = getModelProvider();
    return await provider.createChatCompletion({ model, messages });
  } catch (error) {
    console.error("generateChatCompletion error:", error);
    throw error;
  }
} 