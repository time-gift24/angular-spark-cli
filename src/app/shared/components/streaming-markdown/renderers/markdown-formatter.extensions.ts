/**
 * Markdown Formatter Service Extensions
 *
 * This module extends MarkdownFormatterService with code highlighting capabilities.
 *
 * Phase 3, Task 3.1: Extend Formatter Interface for Code Blocks
 */

import { MarkdownBlock } from '../core/models';
import { ShiniLanguage, ShiniTheme } from '../core/shini-types';

/**
 * Extended formatter options including theme
 */
export interface FormatterOptions {
  /** Theme for code highlighting ('light' or 'dark') */
  theme?: ShiniTheme;

  /** Whether to use Shini highlighting (falls back if unavailable) */
  enableHighlighting?: boolean;
}

/**
 * Code block metadata extracted from MarkdownBlock
 */
export interface CodeBlockMetadata {
  /** Raw code content */
  code: string;

  /** Language identifier (e.g., 'typescript', 'python') */
  language: ShiniLanguage;

  /** Position in document (for error reporting) */
  position: number;
}

/**
 * Formatted code block result
 */
export interface FormattedCodeBlock {
  /** HTML with syntax highlighting (or escaped plain text) */
  html: string;

  /** Language used for highlighting */
  language: string;

  /** Whether highlighting was applied */
  isHighlighted: boolean;

  /** Whether result is fallback (plain text) */
  isFallback: boolean;

  /** Error message if formatting failed */
  error?: string;
}

/**
 * Extended markdown formatter interface with code highlighting
 */
export interface IMarkdownFormatterExtended {
  /**
   * Format a markdown block with optional theme support.
   * @param block - MarkdownBlock containing raw markdown content
   * @param options - Formatter options including theme
   * @returns Sanitized HTML string ready for rendering
   */
  format(block: MarkdownBlock, options?: FormatterOptions): string;

  /**
   * Extract code block metadata from a MarkdownBlock.
   * @param block - MarkdownBlock to analyze
   * @returns Code block metadata or null if not a code block
   */
  extractCodeMetadata(block: MarkdownBlock): CodeBlockMetadata | null;

  /**
   * Format a code block with syntax highlighting.
   * @param code - Raw code string
   * @param language - Programming language identifier
   * @param theme - Theme for highlighting
   * @returns Formatted code block result
   */
  formatCodeBlock(
    code: string,
    language: ShiniLanguage,
    theme: ShiniTheme
  ): FormattedCodeBlock;
}

/**
 * Phase 3, Task 3.2: Define Fallback Strategy Types
 */

/**
 * Fallback strategy for when Shini is unavailable
 */
export type FallbackStrategy =
  | 'plain' // HTML-escaped plain text
  | 'placeholder'; // Show loading placeholder

/**
 * Fallback formatter result
 */
export interface FallbackResult {
  /** HTML-escaped plain text */
  html: string;

  /** Strategy used */
  strategy: FallbackStrategy;

  /** Reason for fallback */
  reason: 'not_initialized' | 'unsupported_language' | 'highlight_error';
}

/**
 * Phase 3, Task 3.3: Define Theme Integration Types
 */

/**
 * Theme change event
 */
export interface ThemeChangeEvent {
  /** New theme ('light' or 'dark') */
  theme: ShiniTheme;

  /** Timestamp of change */
  timestamp: number;
}

/**
 * Theme-aware formatter state
 */
export interface ThemeAwareFormatterState {
  /** Current theme */
  currentTheme: ShiniTheme;

  /** Whether Shini is ready */
  shiniReady: boolean;

  /** Cache of formatted blocks (key = code + language + theme) */
  formatCache: Map<string, string>;
}
