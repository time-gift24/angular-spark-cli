/**
 * Streaming Markdown - Core Domain Models
 *
 * This module defines all TypeScript types and interfaces for the streaming markdown system.
 * These models represent the core domain entities used throughout the markdown parsing
 * and rendering pipeline.
 */

import { Signal } from '@angular/core';

// ============================================================================
// DOMAIN MODELS - Discriminated Union Types
//
// Type-safe domain model using discriminated unions.
// Each block type has only its relevant fields.
// ============================================================================

/**
 * Base interface for all markdown blocks.
 * Contains fields shared by all block types.
 */
export interface MarkdownBlockBase {
  /** Unique identifier (UUID) for this block */
  id: string;

  /**
   * Block type.
   * Built-in blocks use BlockType enum values; plugins may use custom strings.
   */
  type: BlockType | string;

  /** Raw markdown content of this block */
  content: string;

  /** Indicates whether the block is fully received or still streaming */
  isComplete: boolean;

  /** Position of this block in the document (0-indexed) */
  position: number;
}

/**
 * Paragraph block type.
 * Contains inline elements for rich text rendering.
 */
export interface ParagraphBlock extends MarkdownBlockBase {
  type: BlockType.PARAGRAPH;
  /** Structured inline elements (for rich text paragraphs) */
  children?: MarkdownInline[];
}

/**
 * Heading block type.
 * Has a required level field (1-6) and optional inline elements.
 */
export interface HeadingBlock extends MarkdownBlockBase {
  type: BlockType.HEADING;
  /** Heading level (1-6) */
  level: 1 | 2 | 3 | 4 | 5 | 6;
  /** Structured inline elements (for rich text headings) */
  children?: MarkdownInline[];
}

/**
 * Code block type.
 * Contains language and raw content for syntax highlighting.
 */
export interface CodeBlock extends MarkdownBlockBase {
  type: BlockType.CODE_BLOCK;
  /** Programming language (e.g., 'typescript', 'python', 'javascript') */
  language?: string;
  /** Original raw content (before highlighting) */
  rawContent?: string;
  /** Highlighted HTML output (for code blocks with syntax highlighting) */
  highlightedHTML?: string;
  /** Signal-based highlight result (for reactive highlighting) */
  highlightResult?: import('@angular/core').Signal<HighlightResult | null>;
  /** Whether this block has been syntax-highlighted */
  isHighlighted?: boolean;
  /** Whether this block is eligible for lazy highlighting */
  canLazyHighlight?: boolean;
}

/**
 * List block type.
 * Has a required subtype and nested items.
 */
export interface MarkdownListItem {
  /** Stable item identifier (used by Angular track expressions) */
  id: string;
  /** Plain-text fallback content for this list item */
  content: string;
  /** Structured inline content for rich list item rendering */
  children?: MarkdownInline[];
  /** Nested block content inside this list item (e.g. child lists, blockquotes, code) */
  blocks?: MarkdownBlock[];
  /** Whether this is a task-list item (`- [ ]` / `- [x]`) */
  task?: boolean;
  /** Checked state for task-list items */
  checked?: boolean;
}

/**
 * List block type.
 * Has a required subtype and structured list items.
 */
export interface ListBlock extends MarkdownBlockBase {
  type: BlockType.LIST;
  /** List subtype distinction */
  subtype: 'ordered' | 'unordered';
  /** Structured list items with inline + nested block support */
  items: MarkdownListItem[];
}

/**
 * Blockquote block type.
 * Contains nested blocks.
 */
export interface BlockquoteBlock extends MarkdownBlockBase {
  type: BlockType.BLOCKQUOTE;
  /** Nested blocks (contains MarkdownBlock objects) */
  blocks: MarkdownBlock[];
}

/**
 * Table block type.
 * Contains structured table data.
 */
export interface TableBlock extends MarkdownBlockBase {
  type: BlockType.TABLE;
  /** Table data structure */
  tableData: {
    /** Column headers */
    headers: string[];
    /** Table rows */
    rows: string[][];
    /** Column alignment (left, center, right, or null) */
    align?: (string | null)[];
  };
}

/**
 * Thematic break (horizontal rule) block type.
 * Simple block with no additional fields.
 */
export interface ThematicBreakBlock extends MarkdownBlockBase {
  type: BlockType.THEMATIC_BREAK;
}

/**
 * HTML block type.
 * Contains raw HTML content.
 */
export interface HtmlBlock extends MarkdownBlockBase {
  type: BlockType.HTML;
}

/**
 * Footnote definition block type.
 * Contains footnote reference information.
 */
export interface FootnoteDefBlock extends MarkdownBlockBase {
  type: BlockType.FOOTNOTE_DEF;
  /** Footnote identifier */
  footnoteId?: string;
  /** Footnote definitions map */
  footnoteDefs: Map<string, string>;
}

/**
 * Unknown block type.
 * Fallback for unrecognized markdown structures.
 */
export interface UnknownBlock extends MarkdownBlockBase {
  type: BlockType.UNKNOWN;
}

/**
 * Raw block type.
 * Contains unprocessed content.
 */
export interface RawBlock extends MarkdownBlockBase {
  type: BlockType.RAW;
}

/**
 * Custom block type for plugin-defined blocks.
 * Enables extensions to introduce new block discriminators without changing core union.
 */
export interface CustomBlock extends MarkdownBlockBase {
  type: string;
  [key: string]: unknown;
}

/**
 * Discriminated union type for all markdown blocks.
 *
 * This union provides type-safe access to block-specific fields.
 * Use the type guard functions (isCodeBlock, isHeadingBlock, etc.) for
 * runtime narrowing.
 */
export type MarkdownBlock =
  | ParagraphBlock
  | HeadingBlock
  | CodeBlock
  | ListBlock
  | BlockquoteBlock
  | TableBlock
  | ThematicBreakBlock
  | HtmlBlock
  | FootnoteDefBlock
  | UnknownBlock
  | RawBlock
  | CustomBlock;

// ============================================================================
// TYPE GUARD FUNCTIONS
//
// Runtime type narrowing functions for the discriminated union.
// Use these to safely access block-specific fields.
// ============================================================================

/**
 * Type guard for CodeBlock.
 * Use this to safely access language and rawContent fields.
 */
export function isCodeBlock(block: MarkdownBlock): block is CodeBlock {
  return block.type === BlockType.CODE_BLOCK;
}

/**
 * Type guard for HeadingBlock.
 * Use this to safely access level field.
 */
export function isHeadingBlock(block: MarkdownBlock): block is HeadingBlock {
  return block.type === BlockType.HEADING;
}

/**
 * Type guard for ListBlock.
 * Use this to safely access subtype and items fields.
 */
export function isListBlock(block: MarkdownBlock): block is ListBlock {
  return block.type === BlockType.LIST;
}

/**
 * Type guard for BlockquoteBlock.
 * Use this to safely access blocks field.
 */
export function isBlockquoteBlock(block: MarkdownBlock): block is BlockquoteBlock {
  return block.type === BlockType.BLOCKQUOTE;
}

/**
 * Type guard for TableBlock.
 * Use this to safely access tableData field.
 */
export function isTableBlock(block: MarkdownBlock): block is TableBlock {
  return block.type === BlockType.TABLE;
}

/**
 * Type guard for ParagraphBlock.
 */
export function isParagraphBlock(block: MarkdownBlock): block is ParagraphBlock {
  return block.type === BlockType.PARAGRAPH;
}

/**
 * Type guard for ThematicBreakBlock.
 */
export function isThematicBreakBlock(block: MarkdownBlock): block is ThematicBreakBlock {
  return block.type === BlockType.THEMATIC_BREAK;
}

/**
 * Type guard for HtmlBlock.
 */
export function isHtmlBlock(block: MarkdownBlock): block is HtmlBlock {
  return block.type === BlockType.HTML;
}

/**
 * Type guard for FootnoteDefBlock.
 */
export function isFootnoteDefBlock(block: MarkdownBlock): block is FootnoteDefBlock {
  return block.type === BlockType.FOOTNOTE_DEF;
}

/**
 * Type guard for UnknownBlock.
 */
export function isUnknownBlock(block: MarkdownBlock): block is UnknownBlock {
  return block.type === BlockType.UNKNOWN;
}

/**
 * Type guard for RawBlock.
 */
export function isRawBlock(block: MarkdownBlock): block is RawBlock {
  return block.type === BlockType.RAW;
}

/**
 * Type guard for plugin-defined custom block types.
 */
export function isCustomBlock(block: MarkdownBlock): block is CustomBlock {
  return !Object.values(BlockType).includes(block.type as BlockType);
}

// ============================================================================

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
  FOOTNOTE_DEF = 'footnote_def',
  // Fallback types
  UNKNOWN = 'unknown',
  RAW = 'raw'
}

/**
 * Streaming status enumeration
 */
export type StreamingStatus = 'idle' | 'streaming' | 'completed' | 'error';

/**
 * Inline element types for rich text within paragraphs and list items.
 * Supports nesting via optional `children` array (e.g. bold+italic).
 */
export interface MarkdownInline {
  type: 'text' | 'bold' | 'italic' | 'strikethrough' | 'code' | 'link' | 'image' | 'hard-break' | 'sup' | 'sub' | 'footnote-ref' | 'math';
  content: string;
  href?: string;
  src?: string;
  alt?: string;
  displayMode?: boolean;
  children?: MarkdownInline[];
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
 * Configuration for virtual scrolling behavior.
 * Allows tuning of performance vs. rendering characteristics.
 */
export interface VirtualScrollConfig {
  /** Enable virtual scrolling (default: true for 100+ blocks) */
  enabled: boolean;

  /** Number of blocks to render outside viewport (default: 5) */
  overscan?: number;

  /** Estimated block height in pixels (default: 60) */
  estimatedBlockHeight?: number;

  /** Minimum block count to trigger virtual scrolling (default: 100) */
  minBlocksForVirtual?: number;
}

/**
 * Represents the visible window of blocks in a virtual scroll container.
 * Computed based on viewport position and scroll offset.
 */
export interface VirtualWindow {
  /** Start index of visible window */
  start: number;

  /** End index of visible window */
  end: number;

  /** Total scrollable height */
  totalHeight: number;

  /** Offset in pixels for content positioning */
  offsetTop: number;
}

/**
 * Default virtual scroll configuration.
 * Provides sensible defaults for most use cases.
 */
export const DEFAULT_VIRTUAL_SCROLL_CONFIG: VirtualScrollConfig = {
  enabled: true,
  overscan: 5,
  estimatedBlockHeight: 60,
  minBlocksForVirtual: 100
};

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
