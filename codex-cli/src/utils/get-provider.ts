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

export function getModelProvider() {
  const providerType = process.env["LLM_PROVIDER"] as LLMProviderType;
  
  // Se não há provider definido, usar OpenAI como padrão
  if (!providerType) {
    console.warn("LLM_PROVIDER not set, defaulting to 'openai'");
    return new OpenAIProvider();
  }
  
  const ProviderClass = PROVIDER_REGISTRY[providerType];
  if (!ProviderClass) {
    throw new Error(`Unknown provider: "${providerType}". Available providers: ${Object.keys(PROVIDER_REGISTRY).join(", ")}`);
  }
  return new ProviderClass();
}