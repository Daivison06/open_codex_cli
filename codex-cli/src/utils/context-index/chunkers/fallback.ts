import type { ChunkDescriptor } from "../types.js";

const DEFAULT_CHUNK_SIZE = parseInt(
  process.env["CODEX_CONTEXT_FALLBACK_CHARS"] || "2000",
  10,
);

function createDescriptor(
  symbol: string,
  startOffset: number,
  endOffset: number,
  startLine: number,
  endLine: number,
): ChunkDescriptor {
  return {
    symbol,
    range: {
      start: { offset: startOffset, line: startLine, column: 1 },
      end: { offset: endOffset, line: endLine, column: 1 },
    },
  };
}

export function fallbackChunk(
  filePath: string,
  sourceText: string,
  chunkSize: number = DEFAULT_CHUNK_SIZE,
): Array<ChunkDescriptor> {
  if (chunkSize <= 0) {
    chunkSize = DEFAULT_CHUNK_SIZE;
  }

  const descriptors: Array<ChunkDescriptor> = [];
  let start = 0;
  let chunkIndex = 0;
  const totalLength = sourceText.length;

  if (totalLength === 0) {
    descriptors.push(createDescriptor(`${filePath}:empty`, 0, 0, 1, 1));
    return descriptors;
  }

  const lineOffsets: Array<number> = [0];
  for (let i = 0; i < totalLength; i += 1) {
    if (sourceText[i] === "\n") {
      lineOffsets.push(i + 1);
    }
  }
  lineOffsets.push(totalLength);

  const getLineForOffset = (offset: number): number => {
    let low = 0;
    let high = lineOffsets.length - 1;
    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      const current = lineOffsets[mid] ?? 0;
      if (current <= offset) {
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }
    return Math.max(0, high) + 1;
  };

  while (start < totalLength) {
    const end = Math.min(totalLength, start + chunkSize);
    const startLine = getLineForOffset(start);
    const endLine = getLineForOffset(end);
    descriptors.push(
      createDescriptor(
        `${filePath}:chunk-${chunkIndex + 1}`,
        start,
        end,
        startLine,
        endLine,
      ),
    );
    start = end;
    chunkIndex += 1;
  }

  return descriptors;
}
