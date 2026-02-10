/**
 * Default Error Handler Implementation
 *
 * Simple console-based error handler for development.
 * Production implementations may log to external services.
 */

import { Injectable } from '@angular/core';
import {
  IErrorHandler,
  ErrorInput,
  ComponentErrorType
} from './error-handling.types';
import { MarkdownBlock, BlockType } from './models';

/**
 * Default implementation of IErrorHandler
 * Logs errors to console and provides fallback blocks
 */
@Injectable({ providedIn: 'root' })
export class DefaultErrorHandler implements IErrorHandler {
  handle(error: ErrorInput): void {
    const timestamp = new Date().toISOString();
    const normalized = this.normalizeError(error);

    // Log error to console
    console.error(`[DefaultErrorHandler] ${normalized.type}: ${normalized.message}`, {
      timestamp,
      originalError: normalized.originalError,
      context: normalized.context
    });
  }

  createFallback(content: string): MarkdownBlock;
  createFallback(error: ErrorInput, code: string): string;
  createFallback(input: string | ErrorInput, code?: string): MarkdownBlock | string {
    if (typeof input === 'string') {
      return this.createFallbackBlock(input);
    }

    const rawCode = code ?? '';
    return this.escapeHtml(rawCode);
  }

  private createFallbackBlock(content: string): MarkdownBlock {
    return {
      id: `fallback-${Date.now()}`,
      type: BlockType.PARAGRAPH,
      content,
      isComplete: true,
      position: 0
    };
  }

  isRecoverable(error: ErrorInput): boolean {
    const normalized = this.normalizeError(error);

    // All errors are recoverable by default
    // Specific error types may require special handling
    switch (normalized.type) {
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

  private normalizeError(error: ErrorInput): {
    type: ComponentErrorType;
    message: string;
    originalError?: unknown;
    context?: Record<string, unknown>;
  } {
    if ('type' in error) {
      return {
        type: error.type,
        message: error.message,
        originalError: error.originalError,
        context: error.context
      };
    }

    return {
      type: this.mapCodeToType(error.code),
      message: error.message,
      originalError: error.originalError,
      context: error.context
    };
  }

  private mapCodeToType(code: string): ComponentErrorType {
    switch (code) {
      case ComponentErrorType.INVALID_INPUT:
        return ComponentErrorType.INVALID_INPUT;
      case ComponentErrorType.HIGHLIGHT_FAILED:
      case 'LANGUAGE_NOT_SUPPORTED':
      case 'LANGUAGE_LOAD_FAILED':
      case 'THEME_NOT_FOUND':
      case 'THEME_LOAD_FAILED':
        return ComponentErrorType.HIGHLIGHT_FAILED;
      case ComponentErrorType.PARSE_FAILED:
      case 'PARSE_ERROR':
        return ComponentErrorType.PARSE_FAILED;
      case ComponentErrorType.TIMEOUT:
        return ComponentErrorType.TIMEOUT;
      case ComponentErrorType.NETWORK_ERROR:
        return ComponentErrorType.NETWORK_ERROR;
      default:
        return ComponentErrorType.UNKNOWN;
    }
  }

  private escapeHtml(input: string): string {
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}
