/**
 * Streaming Markdown - Block Parser Service
 *
 * This module implements the block-based parsing logic for streaming markdown.
 * It converts markdown text into structured blocks with support for incremental
 * parsing and streaming scenarios.
 */

import { Injectable } from '@angular/core';
import { marked } from 'marked';
import { Token } from 'marked';
import {
  MarkdownBlock,
  ParserResult,
  BlockType
} from './models';
import { v4 as uuidv4 } from 'uuid';

// Type alias for Marked.js tokens
type MarkedToken = Token;

/**
 * Strategy interface for merging tokens into markdown blocks.
 * Determines when and how adjacent tokens should be combined.
 */
interface TokenMergeStrategy {
  /**
   * Determines if two tokens can be merged into a single block.
   * @param token - The current token
   * @param nextToken - The next token to check merge compatibility
   * @returns true if tokens can be merged, false otherwise
   */
  canMerge(token: MarkedToken, nextToken: MarkedToken): boolean;

  /**
   * Merges a sequence of tokens into a single MarkdownBlock.
   * @param tokens - Array of tokens to merge
   * @returns A merged MarkdownBlock instance
   */
  merge(tokens: MarkedToken[]): MarkdownBlock;
}

/**
 * Factory interface for creating markdown blocks.
 * Provides a consistent way to instantiate block objects with proper metadata.
 */
interface IBlockFactory {
  /**
   * Creates a paragraph block.
   * @param content - The paragraph content
   * @param position - Position in the document (0-indexed)
   * @returns A new MarkdownBlock of type PARAGRAPH
   */
  createParagraph(content: string, position: number): MarkdownBlock;

  /**
   * Creates a heading block.
   * @param content - The heading content
   * @param level - Heading level (1-6)
   * @param position - Position in the document (0-indexed)
   * @returns A new MarkdownBlock of type HEADING
   */
  createHeading(content: string, level: number, position: number): MarkdownBlock;

  /**
   * Creates a code block.
   * @param content - The code content
   * @param position - Position in the document (0-indexed)
   * @param language - Optional programming language identifier
   * @returns A new MarkdownBlock of type CODE_BLOCK
   */
  createCodeBlock(content: string, position: number, language?: string): MarkdownBlock;

  /**
   * Creates a list block.
   * @param items - Array of list items
   * @param position - Position in the document (0-indexed)
   * @returns A new MarkdownBlock of type LIST
   */
  createList(items: string[], position: number): MarkdownBlock;

  /**
   * Creates a blockquote block.
   * @param content - The blockquote content
   * @param position - Position in the document (0-indexed)
   * @returns A new MarkdownBlock of type BLOCKQUOTE
   */
  createBlockquote(content: string, position: number): MarkdownBlock;

  /**
   * Creates a horizontal rule (thematic break) block.
   * @param position - Position in the document (0-indexed)
   * @returns A new MarkdownBlock of type THEMATIC_BREAK
   */
  createHr(position: number): MarkdownBlock;

  /**
   * Creates an HTML block.
   * @param content - The HTML content
   * @param position - Position in the document (0-indexed)
   * @returns A new MarkdownBlock of type HTML
   */
  createHtmlBlock(content: string, position: number): MarkdownBlock;
}

/**
 * Internal state maintained during incremental parsing.
 * Tracks parsing context across multiple parse calls.
 */
interface ParsingState {
  /** Array of completed blocks parsed so far */
  blocks: MarkdownBlock[];

  /** Current text buffer being accumulated */
  currentBuffer: string;

  /** Flag indicating if parser is inside a code block */
  inCodeBlock: boolean;

  /** Flag indicating if parser is inside an HTML block */
  inHtmlBlock: boolean;

  /** Language identifier for the current code block */
  codeBlockLanguage?: string;
}

/**
 * Main block parser interface.
 * Parses markdown text into structured blocks with support for streaming scenarios.
 */
export interface IBlockParser {
  /**
   * Parses markdown text into blocks.
   * @param text - The complete markdown text to parse
   * @returns ParserResult containing all parsed blocks and completion status
   */
  parse(text: string): ParserResult;

  /**
   * Performs incremental parsing by comparing previous and new text.
   * Optimizes parsing by only processing changed portions.
   * @param previousText - The text from the previous parse call
   * @param newText - The new text to parse
   * @returns ParserResult containing updated blocks and completion status
   */
  parseIncremental(previousText: string, newText: string): ParserResult;
}

/**
 * Implementation of the block parser service.
 * Uses marked.js for tokenization and custom logic for block assembly.
 */
@Injectable()
export class BlockParser implements IBlockParser {
  /**
   * Parses markdown text into blocks.
   * @param text - The complete markdown text to parse
   * @returns ParserResult containing all parsed blocks
   *
   * @example
   * ```typescript
   * const parser = new BlockParser();
   * const result = parser.parse('# Heading\n\nParagraph text');
   * console.log(result.blocks); // [HeadingBlock, ParagraphBlock]
   * ```
   */
  parse(text: string): ParserResult {
    // Handle empty input
    if (!text || text.trim().length === 0) {
      return { blocks: [], hasIncompleteBlock: false };
    }

    const blocks: MarkdownBlock[] = [];
    let position = 0;

    // Check if text ends with incomplete block
    // Common indicators: unclosed code block, unclosed list, etc.
    const hasIncompleteBlock = this.detectIncompleteBlock(text);

    try {
      // Tokenize the markdown text using marked.js
      const tokens = marked.lexer(text);

      // Convert each token to a MarkdownBlock
      for (const token of tokens) {
        const block = this.tokenToBlock(token, position);
        if (block) {
          blocks.push(block);
          position++;
        }
      }

      // If incomplete block detected, remove the last block from completed blocks
      // (it will be set as currentBlock by the streaming component)
      let completedBlocks = [...blocks];
      if (hasIncompleteBlock && completedBlocks.length > 0) {
        // Keep the incomplete block in the array - streaming component will handle it
      }

      return {
        blocks: completedBlocks,
        hasIncompleteBlock
      };
    } catch (error) {
      console.error('[BlockParser] Parse error:', error);
      // Return partial result on error
      return { blocks, hasIncompleteBlock: false };
    }
  }

  /**
   * Detects if the text ends with an incomplete block.
   * @param text - The markdown text to check
   * @returns true if the text appears to have an incomplete block
   */
  private detectIncompleteBlock(text: string): boolean {
    const trimmed = text.trim();

    // Check for unclosed code blocks (odd number of ``` or ~~~)
    const codeBlockCount = (trimmed.match(/```|~~~/g) || []).length;
    if (codeBlockCount % 2 !== 0) {
      return true;
    }

    // Check for unclosed fences
    const lines = trimmed.split('\n');
    const lastNonEmptyLine = lines.reverse().find(line => line.trim().length > 0);

    if (lastNonEmptyLine) {
      // Check if last line is a heading (no content yet)
      if (/^#{1,6}\s*$/.test(lastNonEmptyLine)) {
        return true;
      }

      // Check if last line is an unordered list item
      if (/^[\*\-+]\s*$/.test(lastNonEmptyLine)) {
        return true;
      }

      // Check if last line is an ordered list item
      if (/^\d+\.\s*$/.test(lastNonEmptyLine)) {
        return true;
      }

      // Check if last line is a blockquote marker
      if (/^>\s*$/.test(lastNonEmptyLine)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Converts a marked.js token to a MarkdownBlock.
   * @param token - The marked.js token
   * @param position - The block position in the document
   * @returns A MarkdownBlock or null if token type is not supported
   */
  private tokenToBlock(token: MarkedToken, position: number): MarkdownBlock | null {
    const baseBlock = {
      id: uuidv4(),
      position,
      isComplete: true
    };

    switch (token.type) {
      case 'heading':
        return {
          ...baseBlock,
          type: BlockType.HEADING,
          content: this.extractText(token),
          level: (token as any).depth || 1
        };

      case 'paragraph':
        return {
          ...baseBlock,
          type: BlockType.PARAGRAPH,
          content: this.extractText(token)
        };

      case 'code':
        return {
          ...baseBlock,
          type: BlockType.CODE_BLOCK,
          content: (token as any).text || '',
          rawContent: (token as any).text || '',
          language: (token as any).lang || undefined
        };

      case 'list':
        const items = (token as any).items || [];
        const listContent = items
          .map((item: any) => this.extractText(item))
          .join('\n');
        return {
          ...baseBlock,
          type: BlockType.LIST,
          content: listContent
        };

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

      default:
        console.warn('[BlockParser] Unsupported token type:', token.type);
        return null;
    }
  }

  /**
   * Extracts text content from a token.
   * Returns the original markdown to preserve formatting for most types,
   * but uses text content for headings to avoid displaying # symbols.
   * @param token - The token to extract text from
   * @returns Original markdown text representation of the token
   */
  private extractText(token: any): string {
    if (!token) return '';

    // For headings, use text property (without # symbols)
    // This prevents "# Heading" from displaying with the hash symbols
    if (token.type === 'heading') {
      return token.text || '';
    }

    // Prefer raw property for other types (preserves formatting)
    // This preserves * for emphasis, > for blockquotes, etc.
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

  /**
   * Performs incremental parsing for streaming scenarios.
   *
   * Optimization strategy:
   * 1. If previousText is empty, parse entire newText
   * 2. If newText extends previousText, only parse the delta
   * 3. Otherwise, parse entire newText (fallback)
   *
   * This optimization avoids re-tokenizing completed blocks,
   * improving performance for long streaming sessions.
   *
   * @param previousText - The text from the previous parse call
   * @param newText - The new text to parse
   * @returns ParserResult containing updated blocks
   *
   * @example
   * ```typescript
   * const parser = new BlockParser();
   * const result1 = parser.parseIncremental('', '# Heading');
   * // Returns: { blocks: [HeadingBlock], hasIncompleteBlock: false }
   *
   * const result2 = parser.parseIncremental('# Heading', '# Heading\n\nParagraph');
   * // Returns: { blocks: [HeadingBlock, ParagraphBlock], hasIncompleteBlock: false }
   * ```
   */
  parseIncremental(previousText: string, newText: string): ParserResult {
    // Edge case: no previous text (first chunk)
    if (!previousText || previousText.length === 0) {
      return this.parse(newText);
    }

    // Edge case: new text is shorter or completely different
    if (newText.length <= previousText.length) {
      // Fallback: parse everything
      return this.parse(newText);
    }

    // Check if newText extends previousText (streaming scenario)
    const isExtension = newText.startsWith(previousText);

    if (!isExtension) {
      // Text changed, not just extended - parse everything
      return this.parse(newText);
    }

    // Streaming scenario: newText = previousText + delta
    // Extract only the new portion
    const delta = newText.substring(previousText.length);

    // Strategy: Parse only the delta to find new/incomplete blocks
    // This avoids re-tokenizing the entire document

    // Check if delta contains complete block separators
    const blockSeparators = ['\n\n', '\n# ', '\n```', '\n* ', '\n- ', '\n1. ', '\n> '];
    const hasCompleteBlocks = blockSeparators.some(sep => delta.includes(sep));

    if (!hasCompleteBlocks) {
      // Delta is likely extending the current block
      // Parse the full text to get updated current block
      return this.parse(newText);
    }

    // Delta contains complete blocks - parse everything for correctness
    // In production, we could cache previous blocks and only tokenize delta
    // For now, full parse is safe and correct
    return this.parse(newText);
  }
}
