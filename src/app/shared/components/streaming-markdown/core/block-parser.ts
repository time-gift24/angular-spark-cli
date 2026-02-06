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

import { Injectable } from '@angular/core';
import { marked } from 'marked';
import { Token } from 'marked';
import {
  MarkdownBlock,
  MarkdownInline,
  ParserResult,
  BlockType
} from './models';

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

    try {
      const tokens = marked.lexer(text);

      for (const token of tokens) {
        const block = this.tokenToBlock(token, position);
        if (block) {
          blocks.push(block);
          position++;
        }
      }

      return {
        blocks,
        hasIncompleteBlock
      };
    } catch (error) {
      console.error('[BlockParser] Parse error:', error);
      return { blocks, hasIncompleteBlock: false };
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
    const lastBoundary = this.findLastStableBoundary(newText);

    if (lastBoundary <= 0) {
      // No stable boundary found, full parse
      const result = this.parse(newText);
      this.updateCache(newText, result.blocks);
      return result;
    }

    // Check if we can reuse cached stable blocks
    const stableText = newText.substring(0, lastBoundary);

    let stableBlocks: MarkdownBlock[];
    if (this.cache.parsedText.length > 0 && stableText.startsWith(this.cache.parsedText.substring(0, this.cache.stableTextEnd)) && this.cache.stableTextEnd === lastBoundary) {
      // Cache hit: stable portion unchanged
      stableBlocks = this.cache.stableBlocks;
    } else {
      // Cache miss: re-parse stable portion
      const stableResult = this.parse(stableText);
      stableBlocks = stableResult.blocks;
    }

    // Parse only the tail
    const tailText = newText.substring(lastBoundary);
    const hasIncompleteBlock = this.detectIncompleteBlock(newText);

    if (!tailText.trim()) {
      const allBlocks = [...stableBlocks];
      this.cache = { parsedText: newText, stableBlocks: [...stableBlocks], stableTextEnd: lastBoundary };
      return { blocks: allBlocks, hasIncompleteBlock };
    }

    try {
      const tailTokens = marked.lexer(tailText);
      const positionOffset = stableBlocks.length;
      const tailBlocks: MarkdownBlock[] = [];

      let tailPos = 0;
      for (const token of tailTokens) {
        const block = this.tokenToBlock(token, positionOffset + tailPos);
        if (block) {
          tailBlocks.push(block);
          tailPos++;
        }
      }

      const allBlocks = [...stableBlocks, ...tailBlocks];

      // Update cache
      this.cache = { parsedText: newText, stableBlocks: [...stableBlocks], stableTextEnd: lastBoundary };

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
   * Find the last stable boundary (double newline) in text.
   * Everything before this boundary is considered "stable" and won't change.
   */
  private findLastStableBoundary(text: string): number {
    const lastDoubleNewline = text.lastIndexOf('\n\n');
    if (lastDoubleNewline === -1) return 0;
    // Return position after the double newline
    return lastDoubleNewline + 2;
  }

  /** Update the incremental cache after a parse */
  private updateCache(text: string, blocks: MarkdownBlock[]): void {
    const boundary = this.findLastStableBoundary(text);
    if (boundary > 0) {
      // Only cache blocks that fall within the stable boundary
      const stableResult = this.parse(text.substring(0, boundary));
      this.cache = {
        parsedText: text,
        stableBlocks: stableResult.blocks,
        stableTextEnd: boundary
      };
    } else {
      this.cache = { parsedText: text, stableBlocks: [], stableTextEnd: 0 };
    }
  }

  /**
   * Detects if the text ends with an incomplete block.
   */
  private detectIncompleteBlock(text: string): boolean {
    const trimmed = text.trim();

    // Check for unclosed code blocks (odd number of ``` or ~~~)
    const codeBlockCount = (trimmed.match(/```|~~~/g) || []).length;
    if (codeBlockCount % 2 !== 0) {
      return true;
    }

    const lines = trimmed.split('\n');
    const lastNonEmptyLine = lines.reverse().find(line => line.trim().length > 0);

    if (lastNonEmptyLine) {
      if (/^#{1,6}\s*$/.test(lastNonEmptyLine)) return true;
      if (/^[\*\-+]\s*$/.test(lastNonEmptyLine)) return true;
      if (/^\d+\.\s*$/.test(lastNonEmptyLine)) return true;
      if (/^>\s*$/.test(lastNonEmptyLine)) return true;
    }

    return false;
  }

  /**
   * Converts a marked.js token to a MarkdownBlock.
   */
  private tokenToBlock(token: MarkedToken, position: number): MarkdownBlock | null {
    const baseBlock = {
      id: this.generateStableId(token.type, position),
      position,
      isComplete: true
    };

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
        return {
          ...baseBlock,
          type: BlockType.CODE_BLOCK,
          content: (token as any).text || '',
          rawContent: (token as any).text || '',
          language: (token as any).lang || undefined
        };

      case 'list': {
        const listToken = token as any;
        const items = listToken.items || [];
        const subtype = listToken.ordered ? 'ordered' : 'unordered';
        const parsedItems: MarkdownBlock[] = items.map((item: any, i: number) => {
          const itemId = `${baseBlock.id}-item-${i}`;
          const itemBlock: MarkdownBlock = {
            id: itemId,
            type: BlockType.PARAGRAPH,
            content: item.text || '',
            isComplete: true,
            position: i
          };
          // Handle nested lists
          if (item.tokens) {
            const nestedLists = item.tokens.filter((t: any) => t.type === 'list');
            if (nestedLists.length > 0) {
              const nestedList = nestedLists[0];
              const nestedItems = (nestedList.items || []).map((ni: any, j: number) => ({
                id: `${itemId}-nested-${j}`,
                type: BlockType.PARAGRAPH,
                content: ni.text || '',
                isComplete: true,
                position: j
              }));
              itemBlock.items = nestedItems;
              itemBlock.subtype = nestedList.ordered ? 'ordered' : 'unordered';
            }
          }
          return itemBlock;
        });
        return {
          ...baseBlock,
          type: BlockType.LIST,
          content: items.map((item: any) => item.text || '').join('\n'),
          subtype: subtype as 'ordered' | 'unordered',
          items: parsedItems
        };
      }

      case 'blockquote':
        return {
          ...baseBlock,
          type: BlockType.BLOCKQUOTE,
          content: this.extractText(token)
        };

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
        const headerCells = tableToken.header?.map((h: any) => h.text || '') || [];
        const bodyRows = tableToken.rows?.map((row: any) =>
          row.map((cell: any) => cell.text || '')
        ) || [];
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

  /**
   * Parse marked.js inline tokens into MarkdownInline array.
   * Maps: strong→bold, em→italic, codespan→code, link→link, br→hard-break, text→text
   */
  private parseInlineTokens(tokens: any[]): MarkdownInline[] {
    if (!tokens || !Array.isArray(tokens)) return [];

    const result: MarkdownInline[] = [];
    for (const token of tokens) {
      switch (token.type) {
        case 'strong':
          result.push({ type: 'bold', content: token.text || '' });
          break;
        case 'em':
          result.push({ type: 'italic', content: token.text || '' });
          break;
        case 'codespan':
          result.push({ type: 'code', content: token.text || '' });
          break;
        case 'link':
          result.push({ type: 'link', content: token.text || '', href: token.href });
          break;
        case 'br':
          result.push({ type: 'hard-break', content: '' });
          break;
        case 'text':
        default:
          result.push({ type: 'text', content: token.text || token.raw || '' });
          break;
      }
    }
    return result;
  }

  /**
   * Extracts text content from a token.
   */
  private extractText(token: any): string {
    if (!token) return '';

    // For headings, use text property (without # symbols)
    if (token.type === 'heading') {
      return token.text || '';
    }

    // Prefer raw property for other types (preserves formatting)
    if (token.raw) return token.raw;

    // Fallback to text property for code blocks
    if (token.text) return token.text;

    // If token has tokens array (nested tokens), join their raw content
    if (token.tokens && Array.isArray(token.tokens)) {
      return token.tokens
        .map((t: any) => this.extractText(t))
        .join('');
    }

    return '';
  }
}
