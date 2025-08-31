import { OpenAIProvider } from "./providers/openai-provider";
import { GroqProvider } from "./providers/groq-provider";
export enum LLMProviderType {
  OPENAI = "openai",
  GROQ = "groq",
}

const PROVIDER_REGISTRY: Record<LLMProviderType, any> = {
  [LLMProviderType.OPENAI]: OpenAIProvider,
  [LLMProviderType.GROQ]: GroqProvider,
};

export function getModelProvider(providerFlag?: string) {
  // Priority: 1) CLI flag, 2) Environment variable, 3) Default (openai)
  const providerType = (providerFlag || process.env["LLM_PROVIDER"] || "openai") as LLMProviderType;
  
  const ProviderClass = PROVIDER_REGISTRY[providerType];
  if (!ProviderClass) {
    throw new Error(`Unknown provider: "${providerType}". Available providers: ${Object.keys(PROVIDER_REGISTRY).join(", ")}`);
  }
  
  return new ProviderClass();
}

/**
 * Get the default model for a specific provider
 */
export function getProviderDefaultModel(providerType: string): string {
  const normalizedProvider = providerType as LLMProviderType;
  const ProviderClass = PROVIDER_REGISTRY[normalizedProvider];
  
  if (!ProviderClass) {
    throw new Error(`Unknown provider: "${providerType}". Available providers: ${Object.keys(PROVIDER_REGISTRY).join(", ")}`);
  }
  
  const providerInstance = new ProviderClass();
  return providerInstance.getDefaultModel();
}