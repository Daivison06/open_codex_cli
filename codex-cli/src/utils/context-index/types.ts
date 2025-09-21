export interface ChunkPosition {
  /** Zero-based character offset in the file. */
  offset: number;
  /** One-based line number for display. */
  line: number;
  /** One-based column number for display. */
  column: number;
}

export interface ChunkRange {
  start: ChunkPosition;
  end: ChunkPosition;
}

export interface ContextChunk {
  /** File path relative to the indexed root. */
  path: string;
  /** Symbol or label associated with the chunk. */
  symbol: string;
  /** Range within the file represented by the chunk. */
  range: ChunkRange;
  /** Deterministic SHA-256 hash of the chunk contents. */
  hash: string;
  /** Optional cached summary text. */
  summary?: string;
}

export interface MerkleNode {
  /** Combined hash for this node and all descendants. */
  hash: string;
  /** Optional chunk if this is a leaf node. */
  chunk?: ContextChunk;
  /** Child nodes. */
  children: Array<MerkleNode>;
}

export interface FileIndexEntry {
  /** Relative path for the file. */
  path: string;
  /** Root Merkle node representing the file. */
  merkle: MerkleNode;
  /** Ordered list of chunks contained in the file. */
  chunks: Array<ContextChunk>;
}

export interface ContextIndexData {
  /** Version for the on-disk index schema. */
  version: number;
  /** ISO timestamp for the last successful indexing run. */
  generatedAt: string;
  /** Map of relative file paths to their chunk data. */
  files: Record<string, FileIndexEntry>;
  /** Map of chunk hash to cached summary text. */
  summaries: Record<string, string>;
}

export interface ChunkDescriptor {
  symbol: string;
  range: ChunkRange;
}

export interface Chunker {
  /** Returns true when this chunker can process the given file path. */
  test: (filePath: string) => boolean;
  /** Extracts structured chunks from the file contents. */
  extract: (filePath: string, sourceText: string) => Array<ChunkDescriptor>;
}

export interface SummaryGeneratorInput {
  chunk: ContextChunk;
  content: string;
}

export type SummaryGenerator = (
  input: SummaryGeneratorInput,
) => Promise<string>;

export interface IndexStats {
  filesProcessed: number;
  filesUpdated: number;
  chunksDiscovered: number;
  summariesGenerated: number;
}

export interface IndexOptions {
  /** Root directory that owns the .codex folder. */
  rootPath: string;
  /** Optional explicit directory to index (defaults to rootPath). */
  targetPath?: string;
  /** Optional relative or absolute file path to refresh. */
  refreshPaths?: Array<string>;
  /** Maximum number of characters per fallback chunk. */
  fallbackChunkSize?: number;
  /** Custom summary generator, primarily for testing. */
  summaryGenerator?: SummaryGenerator;
}

export interface SearchMatch extends ContextChunk {
  fileSummary?: string;
}
