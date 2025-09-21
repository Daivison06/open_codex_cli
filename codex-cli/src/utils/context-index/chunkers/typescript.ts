import ts from "typescript";
import path from "node:path";

import type { ChunkDescriptor, ChunkRange, Chunker } from "../types.js";

function createRange(
  sourceFile: ts.SourceFile,
  start: number,
  end: number,
): ChunkRange {
  const startPos = sourceFile.getLineAndCharacterOfPosition(start);
  const endPos = sourceFile.getLineAndCharacterOfPosition(end);
  return {
    start: {
      offset: start,
      line: startPos.line + 1,
      column: startPos.character + 1,
    },
    end: {
      offset: end,
      line: endPos.line + 1,
      column: endPos.character + 1,
    },
  };
}

function extractSymbolName(node: ts.Node, sourceFile: ts.SourceFile): string | null {
  if (ts.isFunctionDeclaration(node) || ts.isClassDeclaration(node)) {
    return node.name?.getText(sourceFile) ?? null;
  }

  if (ts.isMethodDeclaration(node) || ts.isGetAccessor(node) || ts.isSetAccessor(node)) {
    const classDecl = node.parent;
    const className = ts.isClassLike(classDecl)
      ? classDecl.name?.getText(sourceFile) ?? "anonymous-class"
      : "anonymous-class";
    const memberName = node.name?.getText(sourceFile) ?? "anonymous-member";
    return `${className}.${memberName}`;
  }

  if (ts.isArrowFunction(node) || ts.isFunctionExpression(node)) {
    // Attempt to find an identifier the function is assigned to.
    if (
      ts.isVariableDeclaration(node.parent) &&
      node.parent.name &&
      ts.isIdentifier(node.parent.name)
    ) {
      return node.parent.name.getText(sourceFile);
    }

    if (
      ts.isBinaryExpression(node.parent) &&
      node.parent.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
      ts.isIdentifier(node.parent.left)
    ) {
      return node.parent.left.getText(sourceFile);
    }
  }

  if (ts.isInterfaceDeclaration(node) || ts.isTypeAliasDeclaration(node)) {
    return node.name.getText(sourceFile);
  }

  return null;
}

function collectChunkDescriptors(
  sourceFile: ts.SourceFile,
): Array<ChunkDescriptor> {
  const descriptors: Array<ChunkDescriptor> = [];
  const visited = new Set<string>();

  function pushDescriptor(node: ts.Node, symbolName: string) {
    const start = node.getStart(sourceFile, false);
    const end = node.getEnd();
    const key = `${symbolName}:${start}:${end}`;
    if (visited.has(key)) {
      return;
    }
    visited.add(key);
    descriptors.push({ symbol: symbolName, range: createRange(sourceFile, start, end) });
  }

  function visit(node: ts.Node) {
    const symbol = extractSymbolName(node, sourceFile);
    if (symbol) {
      pushDescriptor(node, symbol);
    }

    node.forEachChild(visit);
  }

  visit(sourceFile);

  descriptors.sort((a, b) => a.range.start.offset - b.range.start.offset);
  return descriptors;
}

const SUPPORTED_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx"]);

export const typescriptChunker: Chunker = {
  test(filePath: string) {
    return SUPPORTED_EXTENSIONS.has(path.extname(filePath));
  },
  extract(filePath: string, sourceText: string) {
    const sourceFile = ts.createSourceFile(
      filePath,
      sourceText,
      ts.ScriptTarget.Latest,
      true,
      path.extname(filePath) === ".tsx"
        ? ts.ScriptKind.TSX
        : path.extname(filePath) === ".jsx"
          ? ts.ScriptKind.JSX
          : ts.ScriptKind.TS,
    );

    return collectChunkDescriptors(sourceFile);
  },
};

export default typescriptChunker;
