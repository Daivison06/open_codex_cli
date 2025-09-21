import fs from "node:fs/promises";
import path from "node:path";

import {
  loadIgnorePatterns,
  shouldIgnorePath,
} from "../singlepass/context_files.js";
import { fallbackChunk } from "./chunkers/fallback.js";
import { getChunkerForPath } from "./chunkers/index.js";
import { buildMerkleTree, hashChunkContent } from "./merkle.js";
import { SummaryCache } from "./summaries.js";
import type {
  ChunkDescriptor,
  ContextChunk,
  ContextIndexData,
  FileIndexEntry,
  IndexOptions,
  IndexStats,
  SearchMatch,
} from "./types.js";

const INDEX_VERSION = 1;
export const CONTEXT_INDEX_FILENAME = "context-index.json";

async function readIndexFile(filePath: string): Promise<ContextIndexData | null> {
  try {
    const raw = await fs.readFile(filePath, "utf-8");
    const parsed = JSON.parse(raw) as ContextIndexData;
    return parsed;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return null;
    }
    throw error;
  }
}

async function writeIndexFile(
  filePath: string,
  data: ContextIndexData,
): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`);
}

async function walkFiles(
  dir: string,
  ignorePatterns: Array<RegExp>,
): Promise<Array<string>> {
  const queue: Array<string> = [dir];
  const files: Array<string> = [];

  while (queue.length > 0) {
    const current = queue.pop();
    if (!current) {
      continue;
    }
    const entries = await fs.readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      const absolute = path.join(current, entry.name);
      if (shouldIgnorePath(absolute, ignorePatterns)) {
        continue;
      }
      if (entry.isDirectory()) {
        queue.push(absolute);
      } else if (entry.isFile()) {
        files.push(absolute);
      }
    }
  }

  files.sort();
  return files;
}

function toRelative(rootPath: string, filePath: string): string {
  const relative = path.relative(rootPath, filePath);
  return relative || path.basename(filePath);
}

function normaliseRefreshPaths(
  rootPath: string,
  refreshPaths: Array<string> | undefined,
): Set<string> {
  if (!refreshPaths || refreshPaths.length === 0) {
    return new Set();
  }
  return new Set(
    refreshPaths.map((input) =>
      path.relative(rootPath, path.resolve(rootPath, input)),
    ),
  );
}

function ensureChunks(
  filePath: string,
  content: string,
  descriptors: Array<ChunkDescriptor>,
  fallbackSize?: number,
): Array<ChunkDescriptor> {
  if (descriptors.length > 0) {
    return descriptors;
  }
  return fallbackChunk(filePath, content, fallbackSize);
}

function sliceContent(content: string, start: number, end: number): string {
  return content.slice(start, end);
}

function pruneSummaries(
  data: Record<string, string>,
  usedHashes: Set<string>,
): Record<string, string> {
  const pruned: Record<string, string> = {};
  for (const [hash, summary] of Object.entries(data)) {
    if (usedHashes.has(hash)) {
      pruned[hash] = summary;
    }
  }
  return pruned;
}

export async function loadContextIndex(
  rootPath: string,
): Promise<ContextIndexData | null> {
  const resolvedRoot = path.resolve(rootPath);
  const indexPath = path.join(resolvedRoot, ".codex", CONTEXT_INDEX_FILENAME);
  const index = await readIndexFile(indexPath);
  if (!index) {
    return null;
  }

  // Fill in summaries on the chunk structures for convenience.
  for (const entry of Object.values(index.files)) {
    for (const chunk of entry.chunks) {
      chunk.summary = index.summaries[chunk.hash];
    }
  }
  return index;
}

export async function indexContext(
  options: IndexOptions,
): Promise<{
  index: ContextIndexData;
  stats: IndexStats;
  indexPath: string;
}> {
  const rootPath = path.resolve(options.rootPath);
  const targetPath = options.targetPath
    ? path.resolve(rootPath, options.targetPath)
    : rootPath;
  const indexPath = path.join(rootPath, ".codex", CONTEXT_INDEX_FILENAME);
  const ignorePatterns = loadIgnorePatterns();
  const refreshSet = normaliseRefreshPaths(rootPath, options.refreshPaths);
  const previousIndex = await readIndexFile(indexPath);
  const summaryCache = new SummaryCache(
    previousIndex?.summaries ?? {},
    options.summaryGenerator,
  );
  const fallbackSize = options.fallbackChunkSize;

  const absoluteFiles = await walkFiles(targetPath, ignorePatterns);
  const files: Record<string, FileIndexEntry> = {};
  let filesUpdated = 0;
  let chunksDiscovered = 0;

  for (const absolutePath of absoluteFiles) {
    const relativePath = toRelative(rootPath, absolutePath);
    const content = await fs.readFile(absolutePath, "utf-8");
    const chunker = getChunkerForPath(absolutePath);
    const descriptors = ensureChunks(
      relativePath,
      content,
      chunker ? chunker.extract(absolutePath, content) : [],
      fallbackSize,
    );

    const chunks: Array<ContextChunk> = descriptors.map((descriptor) => {
      const chunk: ContextChunk = {
        path: relativePath,
        symbol: descriptor.symbol,
        range: descriptor.range,
        hash: "",
      };
      const chunkContent = sliceContent(
        content,
        descriptor.range.start.offset,
        descriptor.range.end.offset,
      );
      chunk.hash = hashChunkContent(chunk, chunkContent);
      return chunk;
    });

    const merkle = buildMerkleTree(chunks);
    const previousEntry = previousIndex?.files[relativePath];
    const refreshFile = refreshSet.has(relativePath);
    if (!previousEntry || previousEntry.merkle.hash !== merkle.hash || refreshFile) {
      filesUpdated += 1;
    }

    for (const chunk of chunks) {
      const chunkContent = sliceContent(
        content,
        chunk.range.start.offset,
        chunk.range.end.offset,
      );
      const summary = await summaryCache.ensureSummary(chunk, chunkContent, {
        force: refreshFile,
      });
      chunk.summary = summary;
    }

    files[relativePath] = { path: relativePath, merkle, chunks };
    chunksDiscovered += chunks.length;
  }

  const usedHashes = new Set<string>();
  for (const entry of Object.values(files)) {
    for (const chunk of entry.chunks) {
      usedHashes.add(chunk.hash);
    }
  }

  const index: ContextIndexData = {
    version: INDEX_VERSION,
    generatedAt: new Date().toISOString(),
    files,
    summaries: pruneSummaries(summaryCache.toJSON(), usedHashes),
  };

  await writeIndexFile(indexPath, index);

  const stats: IndexStats = {
    filesProcessed: absoluteFiles.length,
    filesUpdated,
    chunksDiscovered,
    summariesGenerated: summaryCache.getGeneratedCount(),
  };

  return { index, stats, indexPath };
}

export function searchContextChunks(
  index: ContextIndexData,
  filter: string,
): Array<SearchMatch> {
  const normalized = filter.trim().toLowerCase();
  if (!normalized) {
    return [];
  }

  const matches: Array<SearchMatch> = [];
  for (const entry of Object.values(index.files)) {
    for (const chunk of entry.chunks) {
      const haystack = `${chunk.symbol.toLowerCase()} ${chunk.path.toLowerCase()}`;
      if (haystack.includes(normalized)) {
        matches.push({
          ...chunk,
          summary: index.summaries[chunk.hash] ?? chunk.summary,
          fileSummary: entry.merkle.hash,
        });
      }
    }
  }

  matches.sort((a, b) => a.path.localeCompare(b.path));
  return matches;
}

export async function getChunkContent(
  rootPath: string,
  chunk: ContextChunk,
): Promise<string> {
  const absolute = path.resolve(rootPath, chunk.path);
  const content = await fs.readFile(absolute, "utf-8");
  return sliceContent(content, chunk.range.start.offset, chunk.range.end.offset);
}

export type {
  ContextChunk,
  ContextIndexData,
  FileIndexEntry,
  IndexOptions,
  IndexStats,
  SearchMatch,
} from "./types.js";
