import { getModelProvider } from "./get-provider";
import { isLoggingEnabled, log } from "./agent/log";

const MODEL_LIST_TIMEOUT_MS = 2_000; // 2 seconds
export const RECOMMENDED_MODELS: Array<string> = ["o4-mini", "o3"];

/**
 * Background model loader / cache.
 *
 * We start fetching the list of available models from Model once the CLI
 * enters interactive mode.  The request is made exactly once during the
 * lifetime of the process and the results are cached for subsequent calls.
 */

const cachedModelsByProvider: Map<string, Array<string>> = new Map();

/**
 * Get a list of available models from the current provider.
 * Results are cached for performance.
 */
export async function getAvailableModels(providerFlag?: string): Promise<Array<string>> {
  const providerType = providerFlag || process.env["LLM_PROVIDER"] || "openai";
  
  if (cachedModelsByProvider.has(providerType)) {
    return cachedModelsByProvider.get(providerType)!;
  }

  try {
    const provider = getModelProvider(providerFlag);
    const response = await provider.listModels();
    
    let models: Array<string> = [];
    
    // Different providers return different response formats
    if (Array.isArray(response)) {
      models = response;
    } else if (response?.data && Array.isArray(response.data)) {
      models = response.data.map((model: any) => model.id || model.name || model);
    } else {
      if (isLoggingEnabled()) {
        log(`Unexpected response format from listModels(): ${JSON.stringify(response)}`);
      }
      models = [];
    }
    
    cachedModelsByProvider.set(providerType, models);
    return models;
  } catch (error) {
    if (isLoggingEnabled()) {
      log(`Error fetching models: ${error}`);
    }
    const emptyArray: Array<string> = [];
    cachedModelsByProvider.set(providerType, emptyArray);
    return emptyArray;
  }
}

/**
 * Preload the models list in the background.
 * This is called early in the CLI to warm the cache.
 */
export function preloadModels(providerFlag?: string): void {
  getAvailableModels(providerFlag).catch(() => {
    // Silently ignore preload errors
  });
}

/**
 * Verify that the provided model identifier is present in the set returned by
 * {@link getAvailableModels}. The list of models is fetched from the OpenAI
 * `/models` endpoint the first time it is required and then cached in‑process.
 */
export async function isModelSupportedForResponses(
  model: string | undefined | null,
  providerFlag?: string,
): Promise<boolean> {
  if (
    typeof model !== "string" ||
    model.trim() === "" ||
    RECOMMENDED_MODELS.includes(model)
  ) {
    return true;
  }

  try {
    const models = await Promise.race<Array<string>>([
      getAvailableModels(providerFlag),
      new Promise<Array<string>>((resolve) =>
        setTimeout(() => resolve([]), MODEL_LIST_TIMEOUT_MS),
      ),
    ]);

    // If the timeout fired we get an empty list → treat as supported to avoid
    // false negatives.
    if (models.length === 0) {
      return true;
    }

    return models.includes(model.trim());
  } catch {
    // Network or library failure → don't block start‑up.
    return true;
  }
}
