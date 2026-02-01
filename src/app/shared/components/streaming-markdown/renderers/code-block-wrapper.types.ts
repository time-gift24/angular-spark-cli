/**
 * Code Block Wrapper - Domain Types and Interfaces
 *
 * This module defines all TypeScript types and interfaces for the
 * CodeBlockWrapper component that provides IDE-like features for code blocks.
 *
 * Phase 2, Task 2.1: Define CodeBlockWrapper Component Inputs
 */

/**
 * Code block wrapper component inputs
 * Controls the appearance and behavior of the code block display
 */
export interface CodeBlockWrapperInputs {
  /** Shini-generated HTML with syntax highlighting */
  highlightedHtml: string;

  /** Language name for display (e.g., "TypeScript", "Python") */
  language: string;

  /** Whether to show line numbers (default: true) */
  showLineNumbers?: boolean;

  /** Optional copy button text (default: "Copy") */
  copyButtonText?: string;

  /** Text to show after successful copy (default: "已复制") */
  copySuccessText?: string;
}

/**
 * Code block display options
 * Configurable behavior for different use cases
 */
export interface CodeBlockDisplayOptions {
  /** Show line numbers */
  showLineNumbers: boolean;

  /** Show language tag */
  showLanguageTag: boolean;

  /** Show copy button */
  showCopyButton: boolean;

  /** Maximum height before scrolling (null = no limit) */
  maxHeight: number | null;

  /** Enable word wrap in code */
  wordWrap: boolean;
}

/**
 * Default display options
 */
export const DEFAULT_CODE_BLOCK_OPTIONS: CodeBlockDisplayOptions = {
  showLineNumbers: true,
  showLanguageTag: true,
  showCopyButton: true,
  maxHeight: null,
  wordWrap: false
} as const;

/**
 * Copy button states
 *
 * Discriminated union representing all possible states of the copy button.
 */
export type CopyButtonState =
  | { type: 'default' }
  | { type: 'copied' }
  | { type: 'error'; message: string }
  | { type: 'unavailable' };

/**
 * Copy button feedback configuration
 */
export interface CopyButtonFeedback {
  /** Text to show in default state */
  defaultText: string;

  /** Text to show when copied successfully */
  successText: string;

  /** Text to show when copy fails */
  errorText: string;

  /** Duration to show success text (milliseconds) */
  successDuration: number;
}

/**
 * Default copy button feedback
 */
export const DEFAULT_COPY_FEEDBACK: CopyButtonFeedback = {
  defaultText: 'Copy',
  successText: '已复制',
  errorText: '复制失败',
  successDuration: 2000
} as const;

/**
 * Phase 2, Task 2.2: Define Line Number Models
 */

/**
 * Line number generation result
 */
export interface LineNumbers {
  /** Array of line number strings (1-indexed) */
  lines: string[];

  /** Total number of lines */
  count: number;

  /** Width of the largest line number (for column sizing) */
  maxWidth: number;
}

/**
 * Line number display options
 */
export interface LineNumberOptions {
  /** Starting line number (default: 1) */
  startFrom: number;

  /** Line number format (default: decimal) */
  format: 'decimal' | 'hexadecimal';
}

/**
 * Phase 2, Task 2.3: Define Copy State Models
 */

/**
 * Copy operation state
 */
export interface CopyState {
  /** Current button state */
  buttonState: CopyButtonState;

  /** Timestamp when current state started (for auto-reset) */
  stateSince: number;

  /** Error message if in error state */
  errorMessage?: string;
}

/**
 * Copy operation result
 */
export interface CopyResult {
  /** Whether copy succeeded */
  success: boolean;

  /** Error message if failed */
  error?: string;
}
