import type {
  ContextChunk,
  SummaryGenerator,
  SummaryGeneratorInput,
} from "./types.js";

function fallbackSummary({ chunk, content }: SummaryGeneratorInput): string {
  const normalized = content.trim().replace(/\s+/g, " ");
  if (!normalized) {
    return `Context chunk for ${chunk.symbol}`;
  }
  return `${chunk.symbol}: ${normalized.slice(0, 180)}${
    normalized.length > 180 ? "…" : ""
  }`;
}

export function createDefaultSummaryGenerator(): SummaryGenerator {
  const mode = process.env["CODEX_CONTEXT_SUMMARY_MODE"];
  const explicitModel = process.env["CODEX_CONTEXT_SUMMARY_MODEL"];
  let providerPromise:
    | Promise<{ provider: any; defaultModel: string }>
    | null = null;

  async function ensureProvider(): Promise<{ provider: any; defaultModel: string }> {
    if (!providerPromise) {
      providerPromise = import("../get-provider.js").then(({ getModelProvider }) => {
        const providerInstance = getModelProvider();
        return {
          provider: providerInstance,
          defaultModel: providerInstance.getDefaultModel(),
        };
      });
    }
    return providerPromise;
  }

  return async (input: SummaryGeneratorInput): Promise<string> => {
    if (mode === "mock") {
      return fallbackSummary(input);
    }

    const { provider, defaultModel } = await ensureProvider();
    const model = explicitModel || defaultModel;
    try {
      const response = await provider.createChatCompletion({
        model,
        messages: [
          {
            role: "system",
            content:
              "Summarize the following code snippet in one or two sentences, focusing on its intent and important details.",
          },
          {
            role: "user",
            content: `File: ${input.chunk.path}\nSymbol: ${input.chunk.symbol}\n\n${input.content}`,
          },
        ],
      });
      const trimmed = response.trim();
      if (trimmed) {
        return trimmed;
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn(
        "Failed to generate chunk summary via provider, falling back to heuristic summary:",
        error,
      );
    }

    return fallbackSummary(input);
  };
}

export class SummaryCache {
  private cache: Record<string, string>;

  private generator: SummaryGenerator;

  private generatedCount = 0;

  constructor(
    initial: Record<string, string> = {},
    generator: SummaryGenerator = createDefaultSummaryGenerator(),
  ) {
    this.cache = { ...initial };
    this.generator = generator;
  }

  get(hash: string): string | undefined {
    return this.cache[hash];
  }

  invalidate(hash: string): void {
    delete this.cache[hash];
  }

  async ensureSummary(
    chunk: ContextChunk,
    content: string,
    options: { force?: boolean } = {},
  ): Promise<string> {
    if (!options.force) {
      const existing = this.cache[chunk.hash];
      if (existing) {
        return existing;
      }
    } else {
      this.invalidate(chunk.hash);
    }

    const summary = await this.generator({ chunk, content });
    this.cache[chunk.hash] = summary;
    this.generatedCount += 1;
    return summary;
  }

  getGeneratedCount(): number {
    return this.generatedCount;
  }

  toJSON(): Record<string, string> {
    return { ...this.cache };
  }
}
