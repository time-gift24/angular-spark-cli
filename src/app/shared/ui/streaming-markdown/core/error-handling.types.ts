/**
 * Streaming Markdown - Unified Error Types
 *
 * Single source of truth for all error-related types.
 */

import type { MarkdownBlock } from './models';

export type ErrorSeverity = 'critical' | 'high' | 'medium' | 'low';

export enum ComponentErrorType {
  INVALID_INPUT = 'INVALID_INPUT',
  HIGHLIGHT_FAILED = 'HIGHLIGHT_FAILED',
  PARSE_FAILED = 'PARSE_FAILED',
  TIMEOUT = 'TIMEOUT',
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNKNOWN = 'UNKNOWN'
}

export type ErrorCode =
  | 'INVALID_INPUT'
  | 'HIGHLIGHT_FAILED'
  | 'PARSE_FAILED'
  | 'TIMEOUT'
  | 'NETWORK_ERROR'
  | 'UNKNOWN'
  | 'SHINI_INIT_FAILED'
  | 'WASM_LOAD_FAILED'
  | 'LANGUAGE_LOAD_FAILED'
  | 'PARSE_ERROR'
  | 'LANGUAGE_NOT_SUPPORTED'
  | 'THEME_NOT_FOUND'
  | 'THEME_LOAD_FAILED';

export type ErrorCategory =
  | 'initialization'
  | 'highlighting'
  | 'language'
  | 'theme'
  | 'rendering'
  | 'clipboard'
  | 'input'
  | 'parsing'
  | 'network'
  | 'unknown';

export interface StreamingMarkdownError {
  category: ErrorCategory;
  severity: ErrorSeverity;
  code: ErrorCode;
  message: string;
  technical?: string;
  timestamp: number;
  recoverable: boolean;
  recoveryAction?: string;
  originalError?: unknown;
  context?: Record<string, unknown>;
}

export interface ComponentError {
  type: ComponentErrorType;
  message: string;
  originalError?: unknown;
  timestamp?: number;
  context?: Record<string, unknown>;
}

export type ErrorInput = StreamingMarkdownError | ComponentError;
export type HighlightingError = StreamingMarkdownError;

export interface InitializationError extends StreamingMarkdownError {
  category: 'initialization';
  code: 'SHINI_INIT_FAILED' | 'WASM_LOAD_FAILED' | 'LANGUAGE_LOAD_FAILED';
  recoverable: false;
}

export interface HighlightingExecutionError extends StreamingMarkdownError {
  category: 'highlighting';
  code: 'HIGHLIGHT_FAILED' | 'PARSE_ERROR' | 'TIMEOUT';
  recoverable: true;
  recoveryAction: 'fallback_to_plain_text' | 'retry' | 'skip_block';
}

export interface UnsupportedLanguageError extends StreamingMarkdownError {
  category: 'language';
  code: 'LANGUAGE_NOT_SUPPORTED' | 'LANGUAGE_LOAD_FAILED';
  recoverable: true;
  recoveryAction: 'fallback_to_plain_text';
  language: string;
}

export interface ThemeError extends StreamingMarkdownError {
  category: 'theme';
  code: 'THEME_NOT_FOUND' | 'THEME_LOAD_FAILED';
  recoverable: true;
  recoveryAction: 'use_default_theme';
  theme: string;
}

export interface ErrorHandlerResult {
  handled: boolean;
  action: string;
  fallbackContent?: string;
  shouldLog: boolean;
  logLevel: 'error' | 'warn' | 'info';
}

export interface IErrorHandler {
  handle(error: ErrorInput): ErrorHandlerResult | void;
  createFallback(content: string): MarkdownBlock;
  createFallback(error: ErrorInput, code: string): string;
  isRecoverable?(error: ErrorInput): boolean;
}

export interface ErrorBoundaryState {
  error: ErrorInput | null;
  recovered: boolean;
  retryCount: number;
}

export interface RetryConfig {
  maxRetries: number;
  retryDelay: number;
  exponentialBackoff: boolean;
}

export interface ErrorLogEntry {
  id: string;
  error: StreamingMarkdownError;
  stackTrace?: string;
  context?: string;
  environment: {
    userAgent: string;
    language: string;
    theme: string;
  };
}

export interface ErrorLoggerConfig {
  enabled: boolean;
  minSeverity: ErrorSeverity;
  maxEntries: number;
  remoteLogging: boolean;
  remoteEndpoint?: string;
}

export type RecoveryStrategy = 'fallback' | 'retry' | 'skip' | 'abort';

export interface RecoveryResult {
  strategy: RecoveryStrategy;
  success: boolean;
  fallbackContent?: string;
  error?: string;
}

export interface IErrorFactory {
  createInitError(message: string, technical?: string): InitializationError;
  createHighlightError(message: string, technical?: string): HighlightingExecutionError;
  createLanguageError(language: string): UnsupportedLanguageError;
  createThemeError(theme: string): ThemeError;
}

