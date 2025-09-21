import { createHash } from "node:crypto";

import type { ContextChunk, MerkleNode } from "./types.js";

export function sha256(data: string): string {
  return createHash("sha256").update(data).digest("hex");
}

export function hashChunkContent(
  chunk: Pick<ContextChunk, "path" | "symbol" | "range">,
  content: string,
): string {
  const key = [
    chunk.path,
    chunk.symbol,
    `${chunk.range.start.offset}:${chunk.range.end.offset}`,
    content,
  ].join("|#|");
  return sha256(key);
}

export function buildMerkleTree(chunks: Array<ContextChunk>): MerkleNode {
  const leaves = chunks.map<MerkleNode>((chunk) => ({
    hash: sha256(chunk.hash),
    chunk,
    children: [],
  }));

  if (leaves.length === 0) {
    return { hash: sha256("empty"), children: [] };
  }

  let layer = leaves;
  while (layer.length > 1) {
    const nextLayer: Array<MerkleNode> = [];
    for (let index = 0; index < layer.length; index += 2) {
      const left = layer[index];
      const right = layer[index + 1];
      const combined = createHash("sha256");
      combined.update(left.hash);
      if (right) {
        combined.update(right.hash);
      }
      const parent: MerkleNode = {
        hash: combined.digest("hex"),
        children: right ? [left, right] : [left],
      };
      nextLayer.push(parent);
    }
    layer = nextLayer;
  }

  return layer[0];
}

export function collectChunkHashes(node: MerkleNode): Array<string> {
  if (node.chunk) {
    return [node.chunk.hash];
  }
  return node.children.flatMap((child) => collectChunkHashes(child));
}
