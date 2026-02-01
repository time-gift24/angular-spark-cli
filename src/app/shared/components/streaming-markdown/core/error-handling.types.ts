/**
 * Error Handling Models
 *
 * This module defines comprehensive error handling types for the
 * code highlighting system, ensuring graceful degradation.
 *
 * Phase 6, Task 6.1: Define Error Types
 */

/**
 * Error severity levels
 */
export type ErrorSeverity = 'critical' | 'high' | 'medium' | 'low';

/**
 * Error categories
 */
export type ErrorCategory =
  | 'initialization'    // Shini WASM loading failures
  | 'highlighting'      // Code highlighting execution errors
  | 'language'          // Unsupported language errors
  | 'theme'             // Theme-related errors
  | 'rendering'         // UI rendering errors
  | 'clipboard';        // Copy operation errors

/**
 * Base error interface for all highlighting errors
 */
export interface HighlightingError {
  /** Error category */
  category: ErrorCategory;

  /** Severity level */
  severity: ErrorSeverity;

  /** Human-readable error message */
  message: string;

  /** Technical error details */
  technical?: string;

  /** Error code for programmatic handling */
  code: string;

  /** Timestamp when error occurred */
  timestamp: number;

  /** Whether error is recoverable */
  recoverable: boolean;

  /** Suggested recovery action */
  recoveryAction?: string;
}

/**
 * Phase 6, Task 6.2: Define Specific Error Types
 */

/**
 * Shini initialization error
 */
export interface InitializationError extends HighlightingError {
  category: 'initialization';
  code: 'SHINI_INIT_FAILED' | 'WASM_LOAD_FAILED' | 'LANGUAGE_LOAD_FAILED';
  recoverable: false;
}

/**
 * Code highlighting error
 */
export interface HighlightingExecutionError extends HighlightingError {
  category: 'highlighting';
  code: 'HIGHLIGHT_FAILED' | 'PARSE_ERROR' | 'TIMEOUT';
  recoverable: true;
  recoveryAction: 'fallback_to_plain_text' | 'retry' | 'skip_block';
}

/**
 * Language not supported error
 */
export interface UnsupportedLanguageError extends HighlightingError {
  category: 'language';
  code: 'LANGUAGE_NOT_SUPPORTED' | 'LANGUAGE_LOAD_FAILED';
  recoverable: true;
  recoveryAction: 'fallback_to_plain_text';
  language: string;
}

/**
 * Theme error
 */
export interface ThemeError extends HighlightingError {
  category: 'theme';
  code: 'THEME_NOT_FOUND' | 'THEME_LOAD_FAILED';
  recoverable: true;
  recoveryAction: 'use_default_theme';
  theme: string;
}

/**
 * Phase 6, Task 6.3: Define Error Handler Interface
 */

/**
 * Error handler result
 */
export interface ErrorHandlerResult {
  /** Whether error was handled */
  handled: boolean;

  /** Action taken */
  action: string;

  /** Fallback content (if applicable) */
  fallbackContent?: string;

  /** Whether to log the error */
  shouldLog: boolean;

  /** Log level */
  logLevel: 'error' | 'warn' | 'info';
}

/**
 * Error handler interface
 */
export interface IErrorHandler {
  /**
   * Handle a highlighting error.
   * @param error - The error to handle
   * @returns Handler result with action taken
   */
  handle(error: HighlightingError): ErrorHandlerResult;

  /**
   * Create a fallback result for a given error.
   * @param error - The error to create fallback for
   * @param code - Original code content
   * @returns HTML-escaped fallback content
   */
  createFallback(error: HighlightingError, code: string): string;
}

/**
 * Phase 6, Task 6.4: Define Error Logging Types
 */

/**
 * Error log entry
 */
export interface ErrorLogEntry {
  /** Unique identifier for this error instance */
  id: string;

  /** Error details */
  error: HighlightingError;

  /** Stack trace (if available) */
  stackTrace?: string;

  /** User context (what they were doing) */
  context?: string;

  /** Browser/environment info */
  environment: {
    userAgent: string;
    language: string;
    theme: string;
  };
}

/**
 * Error logger configuration
 */
export interface ErrorLoggerConfig {
  /** Whether logging is enabled */
  enabled: boolean;

  /** Minimum severity to log */
  minSeverity: ErrorSeverity;

  /** Maximum number of errors to keep in memory */
  maxEntries: number;

  /** Whether to send errors to remote service */
  remoteLogging: boolean;

  /** Remote logging endpoint */
  remoteEndpoint?: string;
}

/**
 * Phase 6, Task 6.5: Define Error Recovery Types
 */

/**
 * Recovery strategy
 */
export type RecoveryStrategy =
  | 'fallback'           // Use fallback (plain text, default theme)
  | 'retry'              // Retry the operation
  | 'skip'               // Skip this operation
  | 'abort';             // Abort the entire process

/**
 * Recovery result
 */
export interface RecoveryResult {
  /** Strategy used */
  strategy: RecoveryStrategy;

  /** Whether recovery was successful */
  success: boolean;

  /** Fallback content (if strategy was 'fallback') */
  fallbackContent?: string;

  /** Error message if recovery failed */
  error?: string;
}

/**
 * Phase 6, Task 6.6: Define Error Factory Types
 */

/**
 * Error factory interface
 * Creates typed error objects with consistent structure
 */
export interface IErrorFactory {
  /**
   * Create an initialization error.
   * @param message - Error message
   * @param technical - Technical details
   * @returns Initialization error
   */
  createInitError(message: string, technical?: string): InitializationError;

  /**
   * Create a highlighting error.
   * @param message - Error message
   * @param technical - Technical details
   * @returns Highlighting error
   */
  createHighlightError(
    message: string,
    technical?: string
  ): HighlightingExecutionError;

  /**
   * Create an unsupported language error.
   * @param language - Language that failed
   * @returns Unsupported language error
   */
  createLanguageError(language: string): UnsupportedLanguageError;

  /**
   * Create a theme error.
   * @param theme - Theme that failed
   * @returns Theme error
   */
  createThemeError(theme: string): ThemeError;
}
