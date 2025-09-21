import { getChunkContent } from "./index.js";
import type { IndexStats, SearchMatch } from "./types.js";

export function formatIndexStats(stats: IndexStats, indexPath: string): string {
  return `Indexed ${stats.filesProcessed} file(s). Updated ${stats.filesUpdated}, discovered ${stats.chunksDiscovered} chunk(s), generated ${stats.summariesGenerated} new summar${
    stats.summariesGenerated === 1 ? "y" : "ies"
  }.\nContext index written to ${indexPath}`;
}

export async function formatShowMatches(
  matches: Array<SearchMatch>,
  rootPath: string,
  limit: number,
): Promise<{ lines: Array<string>; truncated: boolean }>
{
  const output: Array<string> = [];
  const selected = matches.slice(0, limit);
  for (const match of selected) {
    const rangeText = `${match.range.start.line}-${match.range.end.line}`;
    const summary = match.summary ? `\nSummary: ${match.summary}` : "";
    const snippet = await getChunkContent(rootPath, match);
    output.push(`\n${match.symbol} (${match.path}:${rangeText})${summary}\n---\n${snippet}`);
  }
  return { lines: output, truncated: matches.length > selected.length };
}
