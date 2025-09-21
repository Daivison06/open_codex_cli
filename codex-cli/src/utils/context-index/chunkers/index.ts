import { typescriptChunker } from "./typescript.js";
import type { Chunker } from "../types.js";

const REGISTERED_CHUNKERS: Array<Chunker> = [typescriptChunker];

export function getChunkerForPath(filePath: string): Chunker | undefined {
  return REGISTERED_CHUNKERS.find((chunker) => chunker.test(filePath));
}

export function registerChunker(chunker: Chunker): void {
  REGISTERED_CHUNKERS.push(chunker);
}
