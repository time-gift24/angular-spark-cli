/**
 * Component Input/Output Interfaces - Phase 2 (Task 2.1)
 *
 * Defines TypeScript interfaces for all component inputs/outputs.
 * These interfaces provide type safety and documentation for component APIs.
 */

import { MarkdownBlock, MarkdownInline, StreamingStatus } from './models';

/**
 * Generic Block component input
 * Used by the router component for all block types
 */
export interface BlockComponentInput {
  /** The markdown block to render */
  block: MarkdownBlock;

  /** Whether the block is currently streaming */
  isStreaming?: boolean;
}

/**
 * Heading component input
 */
export interface HeadingBlockInput {
  /** Heading level (1-6) */
  level: number;

  /** Heading text content */
  content: string;

  /** Whether the heading is streaming */
  streaming?: boolean;
}

/**
 * Paragraph component input
 */
export interface ParagraphBlockInput {
  /** Paragraph text content */
  content: string;

  /** Optional structured inline elements for rich text */
  inlines?: MarkdownInline[];

  /** Whether the paragraph is streaming */
  streaming?: boolean;
}

/**
 * Code component input
 */
export interface CodeBlockInput {
  /** The code content to display */
  code: string;

  /** Programming language identifier for syntax highlighting */
  language?: string;

  /** Whether the code block is streaming */
  streaming?: boolean;
}

/**
 * List component input
 */
export interface ListBlockInput {
  /** Array of list items (can be nested) */
  items: MarkdownBlock[];

  /** Whether the list is ordered (true) or unordered (false) */
  ordered?: boolean;

  /** Nesting depth for styling (default: 0) */
  depth?: number;

  /** Whether the list is streaming */
  streaming?: boolean;
}

/**
 * Blockquote component input
 */
export interface BlockquoteBlockInput {
  /** The quoted text content */
  content: string;

  /** Whether the blockquote is streaming */
  streaming?: boolean;
}

/**
 * Streaming Markdown component input
 * Used by the main container component
 */
export interface StreamingMarkdownInput {
  /** Observable stream of markdown text chunks */
  stream$: import('rxjs').Observable<string>;

  /** Optional initial markdown content */
  initialContent?: string;
}
