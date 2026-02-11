/**
 * Streaming Markdown - Block Parser Service
 *
 * This module implements the block-based parsing logic for streaming markdown.
 * It converts markdown text into structured blocks with support for incremental
 * parsing and streaming scenarios.
 *
 * Performance optimizations:
 * - Deterministic block IDs (type-position) for stable DOM reuse via @for track
 * - Incremental parsing with cache: only re-tokenize the "tail" after last stable boundary
 * - No UUID dependency
 */

import { Inject, Injectable, Optional } from '@angular/core';
import { marked } from 'marked';
import { Token } from 'marked';
import {
  MarkdownBlock,
  MarkdownInline,
  ParserResult,
  BlockType,
  ListBlock
} from './models';
import {
  BLOCK_COMPONENT_REGISTRY,
  BlockComponentRegistry,
  BlockParseBase,
  BlockParserContext,
  TokenHandlerInput
} from './plugin';

// Type alias for Marked.js tokens
type MarkedToken = Token;

/** Internal cache for incremental parsing */
interface IncrementalCache {
  /** Text that has been fully parsed into stable blocks */
  parsedText: string;
  /** Blocks from parsedText (all complete, stable IDs) */
  stableBlocks: MarkdownBlock[];
  /** Byte offset where the last stable block ends in parsedText */
  stableTextEnd: number;
}

interface BoundaryScanState {
  lastStableBoundary: number;
  inFenceAtEnd: boolean;
}

/**
 * Main block parser interface.
 * Parses markdown text into structured blocks with support for streaming scenarios.
 */
export interface IBlockParser {
  parse(text: string): ParserResult;
  parseIncremental(previousText: string, newText: string): ParserResult;
  /** Clear internal cache (call when stream$ changes) */
  reset(): void;
}

/**
 * Implementation of the block parser service.
 * Uses marked.js for tokenization and custom logic for block assembly.
 */
@Injectable()
export class BlockParser implements IBlockParser {
  private cache: IncrementalCache = { parsedText: '', stableBlocks: [], stableTextEnd: 0 };
  private extractTextCache: WeakMap<object, string> | null = null;

  private readonly parserContext: BlockParserContext = {
    parseInlineTokens: (tokens) => this.parseInlineTokens(tokens),
    extractText: (token) => this.extractText(token),
    tokenToBlock: (token, position) => this.tokenToBlock(token, position),
    generateStableId: (type, position) => this.generateStableId(type, position)
  };

  constructor(
    @Optional() @Inject(BLOCK_COMPONENT_REGISTRY)
    private readonly registry?: BlockComponentRegistry
  ) {}

  /**
   * Generate deterministic ID from block type + position.
   * Same block at same position always gets same ID → Angular @for track reuses DOM nodes.
   */
  private generateStableId(type: string, position: number): string {
    return `${type}-${position}`;
  }

  /**
   * Parses markdown text into blocks.
   */
  parse(text: string): ParserResult {
    if (!text || text.trim().length === 0) {
      return { blocks: [], hasIncompleteBlock: false };
    }

    const blocks: MarkdownBlock[] = [];
    let position = 0;
    const hasIncompleteBlock = this.detectIncompleteBlock(text);

    // Extract footnote definitions before parsing
    const { cleanedText, footnoteDefs } = this.extractFootnotes(text);

    try {
      this.extractTextCache = new WeakMap<object, string>();
      const tokens = marked.lexer(cleanedText);

      for (const token of tokens) {
        const block = this.tokenToBlock(token, position);
        if (block) {
          blocks.push(block);
          position++;
        }
      }

      // Append footnote definitions block if any exist
      if (footnoteDefs.size > 0) {
        blocks.push({
          id: this.generateStableId('footnote_def', position),
          type: BlockType.FOOTNOTE_DEF,
          content: '',
          isComplete: true,
          position,
          footnoteDefs
        });
      }

      return {
        blocks,
        hasIncompleteBlock
      };
    } catch (error) {
      console.error('[BlockParser] Parse error:', error);
      return { blocks, hasIncompleteBlock: false };
    } finally {
      this.extractTextCache = null;
    }
  }

  /**
   * Performs incremental parsing for streaming scenarios.
   *
   * Algorithm:
   * 1. If !newText.startsWith(cache.parsedText) → reset cache, full parse
   * 2. Find last double-newline boundary in text → stableTextEnd
   * 3. stableBlocks = blocks from text[0..stableTextEnd] (cached, not re-parsed)
   * 4. tailText = text[stableTextEnd..end]
   * 5. tailTokens = marked.lexer(tailText) — only parse the tail
   * 6. tailBlocks = tailTokens.map(tokenToBlock) with position offset
   * 7. return { blocks: [...stableBlocks, ...tailBlocks], hasIncompleteBlock }
   * 8. Update cache
   */
  parseIncremental(previousText: string, newText: string): ParserResult {
    // Edge case: no previous text (first chunk)
    if (!previousText || previousText.length === 0) {
      const result = this.parse(newText);
      this.updateCache(newText, result.blocks);
      return result;
    }

    // Edge case: new text is shorter or completely different
    if (!newText.startsWith(previousText)) {
      this.reset();
      const result = this.parse(newText);
      this.updateCache(newText, result.blocks);
      return result;
    }

    // Find the last double-newline boundary — everything before it is "stable"
    const boundaryState = this.scanBoundaryState(newText);
    const lastBoundary = boundaryState.lastStableBoundary;

    if (lastBoundary <= 0) {
      // No stable boundary found, full parse
      const result = this.parse(newText);
      this.cache = { parsedText: newText, stableBlocks: [], stableTextEnd: 0 };
      return result;
    }

    // Check if we can reuse cached stable blocks
    let stableBlocks: MarkdownBlock[];
    if (
      this.cache.parsedText.length > 0 &&
      this.cache.stableTextEnd === lastBoundary &&
      this.hasSamePrefix(newText, this.cache.parsedText, lastBoundary)
    ) {
      // Cache hit: stable portion unchanged
      stableBlocks = this.cache.stableBlocks;
    } else {
      // Cache miss: re-parse stable portion
      const stableResult = this.parse(newText.substring(0, lastBoundary));
      stableBlocks = stableResult.blocks;
    }

    // Parse only the tail
    const tailText = newText.substring(lastBoundary);
    const hasIncompleteBlock = this.detectIncompleteBlock(newText, boundaryState.inFenceAtEnd);

    // Collect footnote defs from stable blocks (if any FOOTNOTE_DEF block exists)
    let mergedFootnoteDefs: Map<string, string> | null = null;
    let stableBlocksWithoutFootnotes: MarkdownBlock[] = stableBlocks;
    let stableBlocksTrimmed = false;

    for (let i = 0; i < stableBlocks.length; i++) {
      const block = stableBlocks[i];
      if (block.type !== BlockType.FOOTNOTE_DEF || !block.footnoteDefs) {
        if (stableBlocksTrimmed) {
          stableBlocksWithoutFootnotes.push(block);
        }
        continue;
      }

      if (!mergedFootnoteDefs) {
        mergedFootnoteDefs = new Map<string, string>();
      }
      block.footnoteDefs.forEach((value, key) => mergedFootnoteDefs!.set(key, value));

      if (!stableBlocksTrimmed) {
        stableBlocksTrimmed = true;
        stableBlocksWithoutFootnotes = stableBlocks.slice(0, i);
      }
    }

    if (!this.hasNonWhitespace(tailText)) {
      const allBlocks = [...stableBlocksWithoutFootnotes];
      if (mergedFootnoteDefs && mergedFootnoteDefs.size > 0) {
        allBlocks.push({
          id: this.generateStableId('footnote_def', allBlocks.length),
          type: BlockType.FOOTNOTE_DEF,
          content: '',
          isComplete: true,
          position: allBlocks.length,
          footnoteDefs: mergedFootnoteDefs
        });
      }
      this.cache = { parsedText: newText, stableBlocks, stableTextEnd: lastBoundary };
      return { blocks: allBlocks, hasIncompleteBlock };
    }

    try {
      // Extract footnotes from tail before tokenizing
      const { cleanedText: cleanedTail, footnoteDefs: tailFootnoteDefs } = this.extractFootnotes(tailText);
      if (tailFootnoteDefs.size > 0) {
        if (!mergedFootnoteDefs) {
          mergedFootnoteDefs = new Map<string, string>();
        }
        tailFootnoteDefs.forEach((v, k) => mergedFootnoteDefs!.set(k, v));
      }

      const tailTokens = marked.lexer(cleanedTail);
      const positionOffset = stableBlocksWithoutFootnotes.length;
      const tailBlocks: MarkdownBlock[] = [];

      let tailPos = 0;
      for (const token of tailTokens) {
        const block = this.tokenToBlock(token, positionOffset + tailPos);
        if (block) {
          tailBlocks.push(block);
          tailPos++;
        }
      }

      const allBlocks = [...stableBlocksWithoutFootnotes, ...tailBlocks];

      // Append merged footnote defs if any
      if (mergedFootnoteDefs && mergedFootnoteDefs.size > 0) {
        allBlocks.push({
          id: this.generateStableId('footnote_def', allBlocks.length),
          type: BlockType.FOOTNOTE_DEF,
          content: '',
          isComplete: true,
          position: allBlocks.length,
          footnoteDefs: mergedFootnoteDefs
        });
      }

      // Update cache
      this.cache = { parsedText: newText, stableBlocks, stableTextEnd: lastBoundary };

      return { blocks: allBlocks, hasIncompleteBlock };
    } catch (error) {
      console.error('[BlockParser] Incremental parse error:', error);
      // Fallback to full parse
      const result = this.parse(newText);
      this.updateCache(newText, result.blocks);
      return result;
    }
  }

  /** Clear internal cache (call when stream$ changes) */
  reset(): void {
    this.cache = { parsedText: '', stableBlocks: [], stableTextEnd: 0 };
  }

  /**
   * Find last stable boundary for incremental parsing.
   *
   * Boundary rule:
   * - only blank-line boundaries outside fenced code blocks are considered stable
   * - fences inside blockquotes are also respected
   */
  private findLastStableBoundary(text: string): number {
    return this.scanBoundaryState(text).lastStableBoundary;
  }

  private scanBoundaryState(text: string): BoundaryScanState {
    if (!text) {
      return { lastStableBoundary: 0, inFenceAtEnd: false };
    }

    let inFence = false;
    let fenceChar: '`' | '~' | null = null;
    let fenceLength = 0;
    let cursor = 0;
    let lastBoundary = 0;

    while (cursor <= text.length) {
      const newlineIndex = text.indexOf('\n', cursor);
      const hasNewline = newlineIndex !== -1;
      const lineEnd = hasNewline ? newlineIndex : text.length;
      const line = text.slice(cursor, lineEnd);
      const normalizedStart = this.findFenceStartIndex(line);

      if (!inFence) {
        const openingFence = this.getFenceOpeningAt(line, normalizedStart);
        if (openingFence) {
          inFence = true;
          fenceChar = openingFence.char;
          fenceLength = openingFence.length;
        }
      } else if (fenceChar && this.isFenceClosingAt(line, normalizedStart, fenceChar, fenceLength)) {
        inFence = false;
        fenceChar = null;
        fenceLength = 0;
      }

      if (hasNewline && !inFence && this.isBlankLine(line)) {
        lastBoundary = lineEnd + 1;
      }

      if (!hasNewline) {
        break;
      }

      cursor = lineEnd + 1;
    }

    return {
      lastStableBoundary: lastBoundary,
      inFenceAtEnd: inFence
    };
  }

  private getFenceOpeningAt(line: string, start: number): { char: '`' | '~'; length: number } | null {
    if (start >= line.length) {
      return null;
    }

    const char = line[start];
    if (char !== '`' && char !== '~') {
      return null;
    }

    let markerLength = 0;
    while (start + markerLength < line.length && line[start + markerLength] === char) {
      markerLength++;
    }

    if (markerLength < 3) {
      return null;
    }

    return {
      char,
      length: markerLength
    };
  }

  private isFenceClosingAt(
    line: string,
    start: number,
    fenceChar: '`' | '~',
    minimumLength: number
  ): boolean {
    if (start >= line.length) {
      return false;
    }

    let markerLength = 0;
    while (start + markerLength < line.length && line[start + markerLength] === fenceChar) {
      markerLength++;
    }

    if (markerLength < minimumLength) {
      return false;
    }

    for (let i = start + markerLength; i < line.length; i++) {
      if (!this.isInlineWhitespace(line[i])) {
        return false;
      }
    }

    return true;
  }

  private findFenceStartIndex(line: string): number {
    let cursor = 0;

    while (cursor < line.length) {
      let probe = cursor;
      let leadingSpaces = 0;
      while (leadingSpaces < 3 && probe < line.length && line[probe] === ' ') {
        leadingSpaces++;
        probe++;
      }

      if (probe >= line.length || line[probe] !== '>') {
        break;
      }

      probe++;
      if (probe < line.length && line[probe] === ' ') {
        probe++;
      }

      cursor = probe;
    }

    while (cursor < line.length && this.isInlineWhitespace(line[cursor])) {
      cursor++;
    }

    return cursor;
  }

  private isBlankLine(line: string): boolean {
    for (let i = 0; i < line.length; i++) {
      if (!this.isInlineWhitespace(line[i])) {
        return false;
      }
    }

    return true;
  }

  private isInlineWhitespace(char: string): boolean {
    return char === ' ' || char === '\t' || char === '\r';
  }

  /** Update the incremental cache after a parse */
  private updateCache(text: string, blocks: MarkdownBlock[]): void {
    const boundary = this.findLastStableBoundary(text);
    if (boundary > 0) {
      const canReuseCachedStable =
        this.cache.stableTextEnd === boundary &&
        this.cache.stableBlocks.length > 0 &&
        this.hasSamePrefix(text, this.cache.parsedText, boundary);

      // If all text is stable, reuse current blocks and avoid re-parse.
      const stableBlocks = boundary >= text.length
        ? blocks
        : canReuseCachedStable
          ? this.cache.stableBlocks
          : this.parse(text.substring(0, boundary)).blocks;
      this.cache = {
        parsedText: text,
        stableBlocks,
        stableTextEnd: boundary
      };
    } else {
      this.cache = { parsedText: text, stableBlocks: [], stableTextEnd: 0 };
    }
  }

  private hasSamePrefix(left: string, right: string, length: number): boolean {
    if (length < 0 || left.length < length || right.length < length) {
      return false;
    }

    for (let i = 0; i < length; i++) {
      if (left[i] !== right[i]) {
        return false;
      }
    }

    return true;
  }

  private hasNonWhitespace(text: string): boolean {
    for (let i = 0; i < text.length; i++) {
      if (!this.isGeneralWhitespace(text[i])) {
        return true;
      }
    }
    return false;
  }

  /**
   * Detects if the text ends with an incomplete block.
   */
  private detectIncompleteBlock(text: string, inFenceAtEnd?: boolean): boolean {
    const trimmed = text.trim();
    if (!trimmed) {
      return false;
    }

    const hasUnclosedFence = inFenceAtEnd ?? this.scanBoundaryState(text).inFenceAtEnd;
    if (hasUnclosedFence) {
      return true;
    }

    const lastNonEmptyLine = this.findLastNonEmptyLine(trimmed);

    return !!lastNonEmptyLine && this.isIncompleteTrailingLine(lastNonEmptyLine);
  }

  private findLastNonEmptyLine(text: string): string | null {
    let end = text.length - 1;
    while (end >= 0 && this.isGeneralWhitespace(text[end])) {
      end--;
    }
    if (end < 0) {
      return null;
    }

    let start = end;
    while (start >= 0 && text[start] !== '\n' && text[start] !== '\r') {
      start--;
    }

    const line = text.slice(start + 1, end + 1).trim();
    return line || null;
  }

  private isGeneralWhitespace(char: string): boolean {
    return char === ' ' || char === '\t' || char === '\n' || char === '\r';
  }

  private isIncompleteTrailingLine(line: string): boolean {
    return this.isIncompleteHeadingLine(line)
      || this.isIncompleteBulletLine(line)
      || this.isIncompleteOrderedLine(line)
      || this.isIncompleteQuoteLine(line);
  }

  private isIncompleteHeadingLine(line: string): boolean {
    let i = 0;
    while (i < line.length && line[i] === '#') {
      i++;
    }
    if (i < 1 || i > 6) {
      return false;
    }
    for (; i < line.length; i++) {
      if (!this.isInlineWhitespace(line[i])) {
        return false;
      }
    }
    return true;
  }

  private isIncompleteBulletLine(line: string): boolean {
    const marker = line[0];
    if (marker !== '*' && marker !== '-' && marker !== '+') {
      return false;
    }
    for (let i = 1; i < line.length; i++) {
      if (!this.isInlineWhitespace(line[i])) {
        return false;
      }
    }
    return true;
  }

  private isIncompleteOrderedLine(line: string): boolean {
    let i = 0;
    while (i < line.length && line[i] >= '0' && line[i] <= '9') {
      i++;
    }
    if (i === 0 || i >= line.length || line[i] !== '.') {
      return false;
    }
    for (i = i + 1; i < line.length; i++) {
      if (!this.isInlineWhitespace(line[i])) {
        return false;
      }
    }
    return true;
  }

  private isIncompleteQuoteLine(line: string): boolean {
    if (line[0] !== '>') {
      return false;
    }
    for (let i = 1; i < line.length; i++) {
      if (!this.isInlineWhitespace(line[i])) {
        return false;
      }
    }
    return true;
  }

  /**
   * Converts a marked.js token to a MarkdownBlock.
   */
  private tokenToBlock(token: MarkedToken, position: number): MarkdownBlock | null {
    const baseBlock: BlockParseBase = {
      id: this.generateStableId(token.type, position),
      position,
      isComplete: true
    };

    const extensionBlock = this.tryExtensionHandlers(token, position, baseBlock);
    if (extensionBlock !== undefined) {
      return extensionBlock;
    }

    switch (token.type) {
      case 'heading': {
        const headingToken = token as any;
        const children = headingToken.tokens ? this.parseInlineTokens(headingToken.tokens) : undefined;
        return {
          ...baseBlock,
          type: BlockType.HEADING,
          content: this.extractText(token),
          level: headingToken.depth || 1,
          children
        };
      }

      case 'paragraph': {
        const paraToken = token as any;
        const children = paraToken.tokens ? this.parseInlineTokens(paraToken.tokens) : undefined;
        return {
          ...baseBlock,
          type: BlockType.PARAGRAPH,
          content: this.extractText(token),
          children
        };
      }

      case 'code':
        const normalizedLanguage = this.normalizeCodeFenceLanguage((token as any).lang);
        return {
          ...baseBlock,
          type: BlockType.CODE_BLOCK,
          content: (token as any).text || '',
          rawContent: (token as any).text || '',
          language: normalizedLanguage
        };

      case 'list': {
        const listToken = token as any;
        const items = listToken.items || [];

        return {
          ...baseBlock,
          type: BlockType.LIST,
          content: this.buildListContent(items),
          subtype: listToken.ordered ? 'ordered' : 'unordered',
          items: this.parseListItems(items, `${baseBlock.id}-item`)
        } satisfies ListBlock;
      }

      case 'blockquote': {
        const bqToken = token as any;
        const nestedBlocks: MarkdownBlock[] = [];
        if (bqToken.tokens && Array.isArray(bqToken.tokens)) {
          let nestedPos = 0;
          for (const nestedToken of bqToken.tokens) {
            const nestedBlock = this.tokenToBlock(nestedToken, nestedPos);
            if (nestedBlock) {
              nestedBlocks.push(nestedBlock);
              nestedPos++;
            }
          }
        }
        return {
          ...baseBlock,
          type: BlockType.BLOCKQUOTE,
          content: this.extractText(token),
          blocks: nestedBlocks
        } as const;
      }

      case 'hr':
        return {
          ...baseBlock,
          type: BlockType.THEMATIC_BREAK,
          content: '---'
        };

      case 'html':
        return {
          ...baseBlock,
          type: BlockType.HTML,
          content: (token as any).raw || ''
        };

      case 'table': {
        const tableToken = token as any;
        const headerSource = tableToken.header || [];
        const headerCells = new Array<string>(headerSource.length);
        for (let i = 0; i < headerSource.length; i++) {
          headerCells[i] = headerSource[i]?.text || '';
        }

        const rowSource = tableToken.rows || [];
        const bodyRows = new Array<string[]>(rowSource.length);
        for (let i = 0; i < rowSource.length; i++) {
          const row = rowSource[i] || [];
          const cells = new Array<string>(row.length);
          for (let j = 0; j < row.length; j++) {
            cells[j] = row[j]?.text || '';
          }
          bodyRows[i] = cells;
        }

        const alignments = tableToken.align || [];
        return {
          ...baseBlock,
          type: BlockType.TABLE,
          content: '',
          tableData: { headers: headerCells, rows: bodyRows, align: alignments }
        };
      }

      case 'space':
        // Whitespace-only tokens — skip silently
        return null;

      default:
        // Silently skip unsupported token types
        return null;
    }
  }


  private parseListItems(items: any[], idPrefix: string): (string | MarkdownBlock)[] {
    const parsedItems: (string | MarkdownBlock)[] = [];

    items.forEach((item: any, itemIndex: number) => {
      const tokens = Array.isArray(item?.tokens) ? item.tokens : [];
      const nestedListTokens: any[] = [];
      const inlineTextParts: string[] = [];

      for (const token of tokens) {
        if (token?.type === 'list') {
          nestedListTokens.push(token);
          continue;
        }

        const text = this.extractText(token);
        if (text) {
          inlineTextParts.push(text);
        }
      }

      const textFromTokens = inlineTextParts.length > 0 ? inlineTextParts.join('').trim() : '';
      const itemText = (textFromTokens || item?.text || '').trim();

      if (itemText) {
        parsedItems.push(itemText);
      }

      nestedListTokens.forEach((nestedToken: any, nestedIndex: number) => {
        parsedItems.push(
          this.parseNestedListBlock(
            nestedToken,
            `${idPrefix}-${itemIndex}-${nestedIndex}`,
            itemIndex + nestedIndex
          )
        );
      });

      if (!itemText && nestedListTokens.length === 0) {
        parsedItems.push('');
      }
    });

    return parsedItems;
  }

  private parseNestedListBlock(listToken: any, id: string, position: number): ListBlock {
    const items = listToken.items || [];

    return {
      id,
      type: BlockType.LIST,
      content: this.buildListContent(items),
      subtype: listToken.ordered ? 'ordered' : 'unordered',
      items: this.parseListItems(items, `${id}-item`),
      isComplete: true,
      position
    } satisfies ListBlock;
  }

  private buildListContent(items: any[]): string {
    if (!items || items.length === 0) {
      return '';
    }

    let result = '';
    for (let i = 0; i < items.length; i++) {
      if (i > 0) {
        result += '\n';
      }
      result += items[i]?.text || '';
    }
    return result;
  }

  private tryExtensionHandlers(
    token: MarkedToken,
    position: number,
    baseBlock: BlockParseBase
  ): MarkdownBlock | null | undefined {
    const extensions = this.registry?.parserExtensions;
    if (!extensions || extensions.length === 0) {
      return undefined;
    }

    for (const { extension } of extensions) {
      if (extension.type && extension.type !== token.type) {
        continue;
      }

      if (extension.match && !extension.match(token)) {
        continue;
      }

      const input: TokenHandlerInput = {
        token,
        position,
        baseBlock,
        context: this.parserContext
      };

      return extension.handler(input);
    }

    return undefined;
  }

  /**
   * Normalize fenced-code language for streaming safety.
   * Markdown streaming may temporarily produce malformed language strings
   * such as "Value |"; sanitize to a safe identifier or undefined.
   */
  private normalizeCodeFenceLanguage(rawLanguage: unknown): string | undefined {
    if (typeof rawLanguage !== 'string') {
      return undefined;
    }

    const trimmed = rawLanguage.trim().toLowerCase();
    if (!trimmed) {
      return undefined;
    }

    const firstToken = trimmed.split(/[\s|,:;]+/)[0] || '';
    const cleaned = firstToken.replace(/[^a-z0-9+#._-]/g, '');

    return cleaned || undefined;
  }

  /**
   * Parse marked.js inline tokens into MarkdownInline array.
   * Recursively handles nested tokens (e.g. bold containing italic).
   * Maps: strong→bold, em→italic, del→strikethrough, codespan→code,
   *       link→link, image→image, br→hard-break, html→sup/sub/footnote-ref
   */
  private parseInlineTokens(tokens: any[] | undefined): MarkdownInline[] {
    if (!tokens || !Array.isArray(tokens) || tokens.length === 0) {
      return [];
    }

    const result: MarkdownInline[] = [];
    this.appendInlineTokens(tokens, result);
    return result;
  }

  private appendInlineTokens(tokens: any[], target: MarkdownInline[]): void {
    for (const token of tokens) {
      switch (token.type) {
        case 'strong': {
          const children = token.tokens ? this.parseInlineTokens(token.tokens) : undefined;
          target.push({ type: 'bold', content: token.text || '', children });
          break;
        }
        case 'em': {
          const children = token.tokens ? this.parseInlineTokens(token.tokens) : undefined;
          target.push({ type: 'italic', content: token.text || '', children });
          break;
        }
        case 'del': {
          const children = token.tokens ? this.parseInlineTokens(token.tokens) : undefined;
          target.push({ type: 'strikethrough', content: token.text || '', children });
          break;
        }
        case 'codespan':
          target.push({ type: 'code', content: token.text || '' });
          break;
        case 'link': {
          const children = token.tokens ? this.parseInlineTokens(token.tokens) : undefined;
          target.push({ type: 'link', content: token.text || '', href: token.href, children });
          break;
        }
        case 'image':
          target.push({ type: 'image', content: token.text || '', src: token.href, alt: token.text || '' });
          break;
        case 'br':
          target.push({ type: 'hard-break', content: '' });
          break;
        case 'html': {
          const raw: string = token.raw || token.text || '';
          // Parse <sup>...</sup> and <sub>...</sub>
          const supMatch = raw.match(/^<sup>([\s\S]*?)<\/sup>$/i);
          if (supMatch) {
            target.push({ type: 'sup', content: supMatch[1] });
            break;
          }
          const subMatch = raw.match(/^<sub>([\s\S]*?)<\/sub>$/i);
          if (subMatch) {
            target.push({ type: 'sub', content: subMatch[1] });
            break;
          }
          // Fallback: render raw HTML as text
          target.push({ type: 'text', content: raw });
          break;
        }
        case 'text':
        default: {
          // marked.js text tokens can themselves contain nested tokens
          if (token.tokens && token.tokens.length > 0) {
            this.appendInlineTokens(token.tokens, target);
          } else {
            target.push({ type: 'text', content: token.text || token.raw || '' });
          }
          break;
        }
      }
    }
  }

  /**
   * Extract footnote definitions from text and convert references to sup tags.
   * Definitions: `[^id]: text` → removed from text, stored in map
   * References: `[^id]` → converted to `<sup>` for marked.js to handle
   */
  private extractFootnotes(text: string): { cleanedText: string; footnoteDefs: Map<string, string> } {
    if (text.indexOf('[^') === -1) {
      return { cleanedText: text, footnoteDefs: new Map<string, string>() };
    }

    const footnoteDefs = new Map<string, string>();

    // Extract definitions: [^id]: text (at start of line)
    let cleanedText = text.replace(/^\[\^([^\]]+)\]:\s*(.+)$/gm, (_match, id, content) => {
      footnoteDefs.set(id, content.trim());
      return '';
    });

    // Convert references: [^id] → <sup><a href="#fn-id">[id]</a></sup>
    if (footnoteDefs.size > 0) {
      cleanedText = cleanedText.replace(/\[\^([^\]]+)\]/g, (_match, id) => {
        return `<sup><a href="#fn-${id}">[${id}]</a></sup>`;
      });
    }

    return { cleanedText, footnoteDefs };
  }

  /**
   * Extracts text content from a token.
   */
  private extractText(token: any): string {
    if (!token) return '';
    if (typeof token !== 'object') {
      return '';
    }

    const cache = this.extractTextCache;
    if (cache) {
      const cached = cache.get(token);
      if (cached !== undefined) {
        return cached;
      }
    }

    // For headings, use text property (without # symbols)
    if (token.type === 'heading') {
      const value = token.text || '';
      if (cache) {
        cache.set(token, value);
      }
      return value;
    }

    // Prefer raw property for other types (preserves formatting)
    if (token.raw) {
      const value = token.raw;
      if (cache) {
        cache.set(token, value);
      }
      return value;
    }

    // Fallback to text property for code blocks
    if (token.text) {
      const value = token.text;
      if (cache) {
        cache.set(token, value);
      }
      return value;
    }

    // If token has tokens array (nested tokens), join their raw content
    if (token.tokens && Array.isArray(token.tokens)) {
      let combined = '';
      for (const childToken of token.tokens) {
        combined += this.extractText(childToken);
      }
      if (cache) {
        cache.set(token, combined);
      }
      return combined;
    }

    if (cache) {
      cache.set(token, '');
    }
    return '';
  }
}
