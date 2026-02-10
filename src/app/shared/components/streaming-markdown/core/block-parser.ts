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
  BlockType
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

    // Collect footnote defs from stable blocks (if any FOOTNOTE_DEF block exists)
    const mergedFootnoteDefs = new Map<string, string>();
    const stableBlocksWithoutFootnotes = stableBlocks.filter(b => {
      if (b.type === BlockType.FOOTNOTE_DEF && b.footnoteDefs) {
        b.footnoteDefs.forEach((v, k) => mergedFootnoteDefs.set(k, v));
        return false;
      }
      return true;
    });

    if (!tailText.trim()) {
      const allBlocks = [...stableBlocksWithoutFootnotes];
      if (mergedFootnoteDefs.size > 0) {
        allBlocks.push({
          id: this.generateStableId('footnote_def', allBlocks.length),
          type: BlockType.FOOTNOTE_DEF,
          content: '',
          isComplete: true,
          position: allBlocks.length,
          footnoteDefs: mergedFootnoteDefs
        });
      }
      this.cache = { parsedText: newText, stableBlocks: [...stableBlocks], stableTextEnd: lastBoundary };
      return { blocks: allBlocks, hasIncompleteBlock };
    }

    try {
      // Extract footnotes from tail before tokenizing
      const { cleanedText: cleanedTail, footnoteDefs: tailFootnoteDefs } = this.extractFootnotes(tailText);
      tailFootnoteDefs.forEach((v, k) => mergedFootnoteDefs.set(k, v));

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
      if (mergedFootnoteDefs.size > 0) {
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
          blocks: nestedBlocks.length > 0 ? nestedBlocks : undefined
        };
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
    if (!tokens || !Array.isArray(tokens)) return [];

    const result: MarkdownInline[] = [];
    for (const token of tokens) {
      switch (token.type) {
        case 'strong': {
          const children = token.tokens ? this.parseInlineTokens(token.tokens) : undefined;
          result.push({ type: 'bold', content: token.text || '', children });
          break;
        }
        case 'em': {
          const children = token.tokens ? this.parseInlineTokens(token.tokens) : undefined;
          result.push({ type: 'italic', content: token.text || '', children });
          break;
        }
        case 'del': {
          const children = token.tokens ? this.parseInlineTokens(token.tokens) : undefined;
          result.push({ type: 'strikethrough', content: token.text || '', children });
          break;
        }
        case 'codespan':
          result.push({ type: 'code', content: token.text || '' });
          break;
        case 'link': {
          const children = token.tokens ? this.parseInlineTokens(token.tokens) : undefined;
          result.push({ type: 'link', content: token.text || '', href: token.href, children });
          break;
        }
        case 'image':
          result.push({ type: 'image', content: token.text || '', src: token.href, alt: token.text || '' });
          break;
        case 'br':
          result.push({ type: 'hard-break', content: '' });
          break;
        case 'html': {
          const raw: string = token.raw || token.text || '';
          // Parse <sup>...</sup> and <sub>...</sub>
          const supMatch = raw.match(/^<sup>([\s\S]*?)<\/sup>$/i);
          if (supMatch) {
            result.push({ type: 'sup', content: supMatch[1] });
            break;
          }
          const subMatch = raw.match(/^<sub>([\s\S]*?)<\/sub>$/i);
          if (subMatch) {
            result.push({ type: 'sub', content: subMatch[1] });
            break;
          }
          // Fallback: render raw HTML as text
          result.push({ type: 'text', content: raw });
          break;
        }
        case 'text':
        default: {
          // marked.js text tokens can themselves contain nested tokens
          if (token.tokens && token.tokens.length > 0) {
            result.push(...this.parseInlineTokens(token.tokens));
          } else {
            result.push({ type: 'text', content: token.text || token.raw || '' });
          }
          break;
        }
      }
    }
    return result;
  }

  /**
   * Extract footnote definitions from text and convert references to sup tags.
   * Definitions: `[^id]: text` → removed from text, stored in map
   * References: `[^id]` → converted to `<sup>` for marked.js to handle
   */
  private extractFootnotes(text: string): { cleanedText: string; footnoteDefs: Map<string, string> } {
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
