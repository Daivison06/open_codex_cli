import { describe, expect, test, beforeEach, afterEach } from "vitest";
import fs from "node:fs/promises";
import { mkdtempSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { typescriptChunker } from "../src/utils/context-index/chunkers/typescript.js";
import {
  indexContext,
  loadContextIndex,
  searchContextChunks,
  type ContextIndexData,
} from "../src/utils/context-index/index.js";
import { formatIndexStats, formatShowMatches } from "../src/utils/context-index/renderers.js";
import type { SummaryGenerator } from "../src/utils/context-index/types.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function createTempDir(prefix: string): string {
  return mkdtempSync(path.join(os.tmpdir(), prefix));
}

describe("context index", () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = createTempDir("context-index-");
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  test("TypeScript chunker extracts AST symbols", () => {
    const source = `export class Greeter {\n  greet(name: string) {\n    return \`Hello, \${name}\`;\n  }\n}\n\nexport function helper() {\n  return 42;\n}\n\nconst local = () => 'ok';\n`;

    const descriptors = typescriptChunker.extract("sample.ts", source);
    const symbols = descriptors.map((descriptor) => descriptor.symbol);

    expect(symbols).toContain("Greeter");
    expect(symbols).toContain("Greeter.greet");
    expect(symbols).toContain("helper");
    expect(symbols).toContain("local");

    const greeter = descriptors.find((descriptor) => descriptor.symbol === "Greeter");
    expect(greeter?.range.start.line).toBe(1);
    expect(greeter?.range.end.line).toBeGreaterThanOrEqual(5);
  });

  test("indexContext reuses summaries when Merkle root is unchanged", async () => {
    const filePath = path.join(tempDir, "module.ts");
    await fs.writeFile(
      filePath,
      `export function alpha() {\n  return 1;\n}\n`,
      "utf-8",
    );

    let summaryCalls = 0;
    const generator: SummaryGenerator = async ({ chunk, content }) => {
      summaryCalls += 1;
      return `summary:${chunk.symbol}:${content.length}`;
    };

    const first = await indexContext({
      rootPath: tempDir,
      summaryGenerator: generator,
    });
    expect(first.stats.filesProcessed).toBe(1);
    expect(first.stats.summariesGenerated).toBeGreaterThan(0);
    expect(summaryCalls).toBe(first.stats.summariesGenerated);

    summaryCalls = 0;
    const second = await indexContext({
      rootPath: tempDir,
      summaryGenerator: generator,
    });
    expect(second.stats.filesUpdated).toBe(0);
    expect(summaryCalls).toBe(0);

    await fs.writeFile(
      filePath,
      `export function alpha() {\n  return 2;\n}\n`,
      "utf-8",
    );

    summaryCalls = 0;
    const third = await indexContext({
      rootPath: tempDir,
      summaryGenerator: generator,
    });
    expect(third.stats.filesUpdated).toBe(1);
    expect(summaryCalls).toBeGreaterThan(0);
  });

  test("context CLI commands build and display the index", async () => {
    const filePath = path.join(tempDir, "feature.ts");
    await fs.writeFile(
      filePath,
      `export function display(value: string) {\n  return value.toUpperCase();\n}\n`,
      "utf-8",
    );

    const generator: SummaryGenerator = async ({ chunk }) =>
      `mock-summary:${chunk.symbol}`;

    const { stats, indexPath } = await indexContext({
      rootPath: tempDir,
      summaryGenerator: generator,
    });
    const summaryLine = formatIndexStats(stats, indexPath);
    expect(summaryLine).toContain("Indexed 1 file");
    expect(summaryLine).toContain(indexPath);

    const index: ContextIndexData | null = await loadContextIndex(tempDir);
    expect(index).not.toBeNull();
    const matches = index ? searchContextChunks(index, "display") : [];
    expect(matches.length).toBeGreaterThan(0);

    const { lines } = await formatShowMatches(matches, tempDir, 5);
    expect(lines.some((line) => line.includes("display"))).toBe(true);
    expect(lines.some((line) => line.includes("mock-summary"))).toBe(true);
  });
});
