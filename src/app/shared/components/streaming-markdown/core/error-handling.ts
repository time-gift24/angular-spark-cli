/**
 * Error Handling Interfaces - Phase 2 (Task 2.2)
 *
 * Defines error types and handler interfaces for robust error management.
 */

import { MarkdownBlock } from './models';

/**
 * Enumeration of all possible component error types
 */
export enum ComponentErrorType {
  /** Input validation failed */
  INVALID_INPUT = 'INVALID_INPUT',

  /** Syntax highlighting failed */
  HIGHLIGHT_FAILED = 'HIGHLIGHT_FAILED',

  /** Markdown parsing failed */
  PARSE_FAILED = 'PARSE_FAILED',

  /** Operation timeout */
  TIMEOUT = 'TIMEOUT',

  /** Network or stream error */
  NETWORK_ERROR = 'NETWORK_ERROR',

  /** Unknown error */
  UNKNOWN = 'UNKNOWN'
}

/**
 * Structured component error
 */
export interface ComponentError {
  /** Type of error */
  type: ComponentErrorType;

  /** Human-readable error message */
  message: string;

  /** Original error object for debugging */
  originalError?: unknown;

  /** Timestamp when error occurred */
  timestamp?: number;

  /** Additional context */
  context?: Record<string, unknown>;
}

/**
 * Error handler interface
 */
export interface IErrorHandler {
  /**
   * Handle a component error
   * @param error - The error to handle
   */
  handle(error: ComponentError): void;

  /**
   * Create a fallback block for error recovery
   * @param content - The content to display in the fallback block
   * @returns A markdown block with type UNKNOWN
   */
  createFallback(content: string): MarkdownBlock;

  /**
   * Check if an error is recoverable
   * @param error - The error to check
   * @returns true if the error can be recovered from
   */
  isRecoverable(error: ComponentError): boolean;
}

/**
 * Error boundary state
 */
export interface ErrorBoundaryState {
  /** Current active error (if any) */
  error: ComponentError | null;

  /** Whether the error has been recovered */
  recovered: boolean;

  /** Number of retry attempts */
  retryCount: number;
}

/**
 * Retry configuration
 */
export interface RetryConfig {
  /** Maximum number of retry attempts */
  maxRetries: number;

  /** Delay between retries in milliseconds */
  retryDelay: number;

  /** Whether to use exponential backoff */
  exponentialBackoff: boolean;
}
