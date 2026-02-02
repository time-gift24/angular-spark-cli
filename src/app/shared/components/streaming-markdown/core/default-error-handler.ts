/**
 * Default Error Handler Implementation
 *
 * Simple console-based error handler for development.
 * Production implementations may log to external services.
 */

import { Injectable } from '@angular/core';
import {
  IErrorHandler,
  ComponentError,
  ComponentErrorType
} from './error-handling';
import { MarkdownBlock, BlockType } from './models';

/**
 * Default implementation of IErrorHandler
 * Logs errors to console and provides fallback blocks
 */
@Injectable({ providedIn: 'root' })
export class DefaultErrorHandler implements IErrorHandler {
  handle(error: ComponentError): void {
    const timestamp = new Date().toISOString();

    // Log error to console
    console.error(`[DefaultErrorHandler] ${error.type}: ${error.message}`, {
      timestamp,
      originalError: error.originalError,
      context: error.context
    });
  }

  createFallback(content: string): MarkdownBlock {
    return {
      id: `fallback-${Date.now()}`,
      type: BlockType.PARAGRAPH,
      content,
      isComplete: true,
      position: 0
    };
  }

  isRecoverable(error: ComponentError): boolean {
    // All errors are recoverable by default
    // Specific error types may require special handling
    switch (error.type) {
      case ComponentErrorType.HIGHLIGHT_FAILED:
        // Syntax highlighting failures are recoverable
        return true;

      case ComponentErrorType.INVALID_INPUT:
        // Input validation errors are not recoverable
        return false;

      case ComponentErrorType.PARSE_FAILED:
        // Parse failures may be recoverable depending on context
        return true;

      case ComponentErrorType.TIMEOUT:
        // Timeouts are recoverable with retry
        return true;

      case ComponentErrorType.NETWORK_ERROR:
        // Network errors may be recoverable
        return true;

      default:
        // Unknown errors are treated as recoverable
        return true;
    }
  }
}
