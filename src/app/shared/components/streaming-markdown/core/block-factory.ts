/**
 * Block Factory Interface - Phase 1 (Task 1.3)
 *
 * Defines the factory interface for creating standardized MarkdownBlock objects.
 * Implementation will be provided in Phase 2 (Task 2.3).
 */

import { MarkdownBlock, BlockType } from './models';

/**
 * Block Factory interface
 * Provides factory methods for creating different types of markdown blocks
 * with consistent structure and unique identifiers.
 */
export interface IBlockFactory {
  /**
   * Create a heading block
   * @param content - The heading text content
   * @param level - Heading level (1-6)
   * @param streaming - Whether the block is still streaming (affects isComplete)
   * @returns A new MarkdownBlock of type HEADING
   */
  createHeading(content: string, level: number, streaming?: boolean): MarkdownBlock;

  /**
   * Create a paragraph block
   * @param content - The paragraph text content
   * @param streaming - Whether the block is still streaming (affects isComplete)
   * @returns A new MarkdownBlock of type PARAGRAPH
   */
  createParagraph(content: string, streaming?: boolean): MarkdownBlock;

  /**
   * Create a code block
   * @param code - The code content
   * @param language - Programming language identifier
   * @param streaming - Whether the block is still streaming (affects isComplete)
   * @returns A new MarkdownBlock of type CODE
   */
  createCode(code: string, language?: string, streaming?: boolean): MarkdownBlock;

  /**
   * Create a list block
   * @param items - Array of list item strings
   * @param ordered - Whether the list is ordered (true) or unordered (false)
   * @param streaming - Whether the block is still streaming (affects isComplete)
   * @returns A new MarkdownBlock of type LIST
   */
  createList(items: string[], ordered?: boolean, streaming?: boolean): MarkdownBlock;

  /**
   * Create a blockquote block
   * @param content - The quoted text content
   * @param streaming - Whether the block is still streaming (affects isComplete)
   * @returns A new MarkdownBlock of type BLOCKQUOTE
   */
  createBlockquote(content: string, streaming?: boolean): MarkdownBlock;

  /**
   * Create a fallback block for unknown or unsupported content
   * @param content - The raw content to display
   * @returns A new MarkdownBlock of type UNKNOWN
   */
  createFallback(content: string): MarkdownBlock;
}

/**
 * Block ID Generator interface
 * Provides unique identifiers for markdown blocks
 */
export interface IBlockIdGenerator {
  /**
   * Generate a unique block identifier
   * @returns A unique string ID
   */
  generate(): string;
}

/**
 * Block Factory Implementation - Phase 2 (Task 2.3)
 */

import { Injectable } from '@angular/core';

/**
 * Block ID Generator implementation
 * Generates unique IDs using timestamp and counter
 */
@Injectable({ providedIn: 'root' })
export class BlockIdGenerator implements IBlockIdGenerator {
  private counter = 0;

  generate(): string {
    return `block-${Date.now()}-${this.counter++}`;
  }
}

/**
 * Block Factory implementation
 * Creates standardized markdown blocks with unique IDs
 */
@Injectable({ providedIn: 'root' })
export class BlockFactory implements IBlockFactory {
  constructor(private idGenerator: BlockIdGenerator) {
    // Dependency injection will provide BlockIdGenerator instance
  }

  createHeading(content: string, level: number, streaming = false): MarkdownBlock {
    return {
      id: this.idGenerator.generate(),
      type: BlockType.HEADING,
      content,
      level,
      isComplete: !streaming,
      position: 0 // Will be set by the parser
    };
  }

  createParagraph(content: string, streaming = false): MarkdownBlock {
    return {
      id: this.idGenerator.generate(),
      type: BlockType.PARAGRAPH,
      content,
      isComplete: !streaming,
      position: 0 // Will be set by the parser
    };
  }

  createCode(code: string, language = 'text', streaming = false): MarkdownBlock {
    return {
      id: this.idGenerator.generate(),
      type: BlockType.CODE_BLOCK,
      content: code,
      language,
      rawContent: code,
      isComplete: !streaming,
      position: 0 // Will be set by the parser
    };
  }

  createList(items: string[], ordered = false, streaming = false): MarkdownBlock {
    return {
      id: this.idGenerator.generate(),
      type: BlockType.LIST,
      content: '',
      items: [], // TODO: Will be populated by list parser in Task 3.4
      subtype: ordered ? 'ordered' : 'unordered',
      isComplete: !streaming,
      position: 0 // Will be set by the parser
    };
  }

  createBlockquote(content: string, streaming = false): MarkdownBlock {
    return {
      id: this.idGenerator.generate(),
      type: BlockType.BLOCKQUOTE,
      content,
      isComplete: !streaming,
      position: 0 // Will be set by the parser
    };
  }

  createFallback(content: string): MarkdownBlock {
    return {
      id: this.idGenerator.generate(),
      type: BlockType.UNKNOWN,
      content,
      isComplete: true,
      position: 0
    };
  }
}

