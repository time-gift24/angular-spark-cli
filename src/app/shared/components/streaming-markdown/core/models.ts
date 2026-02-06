/**
 * Streaming Markdown - Core Domain Models
 *
 * This module defines all TypeScript types and interfaces for the streaming markdown system.
 * These models represent the core domain entities used throughout the markdown parsing
 * and rendering pipeline.
 */

import { Signal } from '@angular/core';

/**
 * Enumeration of all supported markdown block types.
 * Each block type corresponds to a specific markdown syntax structure.
 */
export enum BlockType {
  PARAGRAPH = 'paragraph',
  HEADING = 'heading',
  CODE_BLOCK = 'code',
  LIST = 'list',
  BLOCKQUOTE = 'blockquote',
  THEMATIC_BREAK = 'hr',
  HTML = 'html',
  // Future extensions
  TABLE = 'table',
  CALLOUT = 'callout',
  // Fallback types
  UNKNOWN = 'unknown',
  RAW = 'raw'
}

/**
 * Streaming status enumeration
 */
export type StreamingStatus = 'idle' | 'streaming' | 'completed' | 'error';

/**
 * Inline element types for rich text within paragraphs and list items
 */
export interface MarkdownInline {
  type: 'text' | 'bold' | 'italic' | 'code' | 'link' | 'hard-break';
  content: string;
  href?: string; // for link type
}

/**
 * A single syntax-highlighted token within a code line.
 * Produced by Shiki's codeToTokensBase().
 */
export interface SyntaxToken {
  content: string;
  color?: string;
  /** 1 = italic, 2 = bold, 4 = underline (bitmask from Shiki FontStyle) */
  fontStyle?: number;
}

/**
 * A single line of syntax-highlighted code.
 */
export interface CodeLine {
  lineNumber: number;
  tokens: SyntaxToken[];
}

/**
 * Code block highlighting result (token-based)
 */
export interface HighlightResult {
  lines: CodeLine[];
  fallback: boolean;
}

/**
 * Represents a single markdown block in the document.
 * Each block has a unique identifier and contains all necessary metadata
 * for rendering and state management.
 */
export interface MarkdownBlock {
  /** Unique identifier (UUID) for this block */
  id: string;

  /** Block type from the BlockType enumeration */
  type: BlockType;

  /** Raw markdown content of this block */
  content: string;

  /** Indicates whether the block is fully received or still streaming */
  isComplete: boolean;

  /** Whether the block is currently streaming (alternative to isComplete) */
  streaming?: boolean;

  /** Position of this block in the document (0-indexed) */
  position: number;

  /** Heading level (1-6), only applicable for HEADING type blocks */
  level?: number;

  /** Programming language, only applicable for CODE_BLOCK type */
  language?: string;

  // === New fields for structured rendering ===

  /** Subtype distinction (e.g., for lists: 'ordered' | 'unordered') */
  subtype?: 'heading' | 'ordered' | 'unordered';

  /** Original raw content (for code blocks, before highlighting) */
  rawContent?: string;

  /** Structured inline elements (for rich text paragraphs) */
  children?: MarkdownInline[];

  /** Nested list items (for list blocks) */
  items?: MarkdownBlock[];

  /** Table data, only for TABLE type blocks */
  tableData?: {
    headers: string[];
    rows: string[][];
    align?: (string | null)[];
  };

  /** Highlighted HTML output (for code blocks with syntax highlighting) */
  highlightedHTML?: string;

  /** Signal-based highlight result (for reactive highlighting) */
  highlightResult?: Signal<HighlightResult | null>;
}

/**
 * Represents the current state of the markdown streaming process.
 * This interface maintains all active blocks and accumulated content.
 */
export interface StreamingState {
  /** Array of completed blocks ready for rendering */
  blocks: MarkdownBlock[];

  /** Currently streaming block (may be incomplete) */
  currentBlock: MarkdownBlock | null;

  /** Accumulated raw markdown text received so far */
  rawContent: string;
}

/**
 * Result object returned by the markdown parser.
 * Contains parsed blocks and status information about incomplete blocks.
 */
export interface ParserResult {
  /** Array of parsed markdown blocks */
  blocks: MarkdownBlock[];

  /** Flag indicating whether there's an incomplete block at the end */
  hasIncompleteBlock: boolean;
}

/**
 * Factory function to create an empty StreamingState.
 * Used to initialize the streaming markdown system.
 *
 * @returns A new StreamingState object with empty values
 */
export const createEmptyState = (): StreamingState => ({
  blocks: [],
  currentBlock: null,
  rawContent: ''
});
