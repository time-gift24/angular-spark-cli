/**
 * Streaming Markdown - Formatter Service
 *
 * This module provides markdown-to-HTML conversion with sanitization.
 * It wraps marked for parsing and DOMPurify for security, providing a
 * clean interface for the rendering pipeline.
 */

import { Injectable, inject } from '@angular/core';
import { marked } from 'marked';
import DOMPurify, { Config } from 'dompurify';
import { MarkdownBlock } from '../core/models';
import { ShiniHighlighter } from '../core/shini-highlighter';
import { ThemeService } from '../core/theme.service';

/**
 * Configuration options for the markdown formatter.
 */
export interface FormatterConfig {
  /** Enable GitHub Flavored Markdown (GFM) extensions */
  enableGfm: boolean;

  /** Enable line breaks in markdown without trailing spaces */
  enableBreaks: boolean;

  /** Enable HTML sanitization */
  sanitize: boolean;
}

/**
 * Default formatter configuration with GFM and sanitization enabled.
 */
const DEFAULT_CONFIG: FormatterConfig = {
  enableGfm: true,
  enableBreaks: false,
  sanitize: true
};

/**
 * Interface for HTML sanitization operations.
 * Provides methods to clean potentially malicious HTML content.
 */
export interface IHTMLSanitizer {
  /**
   * Sanitize HTML string using default configuration.
   * @param html - Raw HTML string to sanitize
   * @returns Sanitized HTML string safe for rendering
   */
  sanitize(html: string): string;

  /**
   * Sanitize HTML string with custom DOMPurify configuration.
   * @param html - Raw HTML string to sanitize
   * @param config - DOMPurify configuration object
   * @returns Sanitized HTML string safe for rendering
   */
  sanitizeWithConfig(html: string, config: Config): string;
}

/**
 * Concrete implementation of HTML sanitizer using DOMPurify.
 * Provides protection against XSS attacks by removing dangerous elements.
 */
class HTMLSanitizer implements IHTMLSanitizer {
  /**
   * Sanitize HTML using default DOMPurify settings.
   * Removes script tags, event handlers, and other dangerous content.
   */
  sanitize(html: string): string {
    return DOMPurify.sanitize(html) as string;
  }

  /**
   * Sanitize HTML with custom configuration.
   * Allows fine-tuned control over which elements and attributes are allowed.
   */
  sanitizeWithConfig(html: string, config: Config): string {
    return DOMPurify.sanitize(html, config) as string;
  }

  /**
   * Sanitize code block HTML while preserving inline styles.
   * Shiki returns HTML with inline styles for syntax highlighting.
   * This method allows style attributes for code blocks while maintaining security.
   *
   * @param html - HTML from Shiki with inline styles
   * @returns Sanitized HTML with styles preserved
   */
  sanitizeCodeBlock(html: string): string {
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['pre', 'code', 'span', 'div'],
      ALLOWED_ATTR: ['class', 'style', 'data-line'],
      ALLOW_DATA_ATTR: false
    }) as string;
  }
}

/**
 * Interface for markdown formatting operations.
 * Converts markdown content to sanitized HTML.
 */
export interface IMarkdownFormatter {
  /**
   * Format a markdown block into HTML.
   * @param block - MarkdownBlock containing raw markdown content
   * @returns Sanitized HTML string ready for rendering
   */
  format(block: MarkdownBlock): string;

  /**
   * Format inline markdown text into HTML.
   * Useful for partial content or inline-only markdown.
   * @param text - Raw markdown text string
   * @returns Sanitized HTML string ready for rendering
   */
  formatInline(text: string): string;
}

/**
 * Service for converting markdown to HTML with security sanitization.
 *
 * This service wraps the `marked` library for markdown parsing and `dompurify`
 * for HTML sanitization. It provides two main formatting methods:
 *
 * - `format()`: Converts a MarkdownBlock to sanitized HTML
 * - `formatInline()`: Converts raw markdown text to sanitized HTML
 *
 * The service is provided at root level and can be injected throughout
 * the application. It uses GitHub Flavored Markdown (GFM) by default.
 *
 * @example
 * ```typescript
 * constructor(private formatter: MarkdownFormatterService) {}
 *
 * renderBlock(block: MarkdownBlock): SafeHtml {
 *   const html = this.formatter.format(block);
 *   return this.domSanitizer.bypassSecurityTrustHtml(html);
 * }
 * ```
 */
@Injectable({ providedIn: 'root' })
export class MarkdownFormatterService implements IMarkdownFormatter {
  private readonly sanitizer: IHTMLSanitizer;
  private readonly config: FormatterConfig;

  /**
   * Initialize the formatter with sanitizer and configuration.
   */
  constructor() {
    this.sanitizer = new HTMLSanitizer();
    this.config = DEFAULT_CONFIG;

    // Configure marked options
    marked.setOptions({
      gfm: this.config.enableGfm,
      breaks: this.config.enableBreaks
    });
  }

  /**
   * Format a markdown block into sanitized HTML.
   *
   * This method:
   * 1. For CODE_BLOCK: Returns escaped HTML (formatCodeBlock handles highlighting)
   * 2. For other blocks: Parses markdown content using marked
   * 3. Sanitizes the resulting HTML (if enabled in config)
   * 4. Returns safe HTML ready for rendering
   *
   * @param block - MarkdownBlock containing raw markdown content
   * @returns Sanitized HTML string ready for rendering
   */
  format(block: MarkdownBlock): string {
    // CODE_BLOCK: content is pure code (no ``` fences), don't parse with marked
    // formatCodeBlock() will handle syntax highlighting
    if (block.type === 'code') {
      return this.escapeHtml(block.content);
    }

    // Other block types: parse markdown content
    const html = marked.parse(block.content) as string;

    if (this.config.sanitize) {
      return this.sanitizer.sanitize(html);
    }

    return html;
  }

  /**
   * Escape HTML for fallback rendering
   *
   * Escapes HTML special characters to prevent XSS and ensure safe rendering.
   * Protected method so subclasses can reuse it.
   *
   * @param code - Raw code string to escape
   * @returns HTML-escaped string safe for rendering
   */
  protected escapeHtml(code: string): string {
    return code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /**
   * Format inline markdown text into sanitized HTML.
   *
   * Similar to format(), but operates on raw text strings instead of blocks.
   * Useful for partial content or inline-only markdown rendering.
   *
   * @param text - Raw markdown text string
   * @returns Sanitized HTML string ready for rendering
   */
  formatInline(text: string): string {
    // Stub: Parse inline markdown and return sanitized HTML
    const html = marked.parseInline(text) as string;

    if (this.config.sanitize) {
      return this.sanitizer.sanitize(html);
    }

    return html;
  }
}

/**
 * Extended MarkdownFormatterService with code highlighting
 *
 * Adds Shini integration to existing service for syntax highlighting.
 * This service extends the base MarkdownFormatterService to add
 * code block highlighting capabilities.
 *
 * Phase 9.1, Step 2: Extend MarkdownFormatterService
 */
@Injectable({ providedIn: 'root' })
export class MarkdownFormatterServiceExtended extends MarkdownFormatterService {
  private shini = inject(ShiniHighlighter);
  private themeService = inject(ThemeService);

  /**
   * Format code block with syntax highlighting
   *
   * Integration point for Shini highlighter. This method:
   * 1. Extracts code and language from the block
   * 2. Gets current theme from ThemeService
   * 3. Calls Shini to highlight the code (async)
   * 4. Returns formatted HTML with token classes
   *
   * Phase 9.2: Implement actual highlighting logic
   *
   * @param block - MarkdownBlock containing code block content
   * @returns Promise resolving to HTML string with syntax highlighting
   */
  async formatCodeBlock(block: MarkdownBlock): Promise<string> {
    // Extract code info
    const language = block.language || 'text';
    const code = block.content;
    const theme = this.themeService.getCurrentTheme();

    console.log('[MarkdownFormatterService] formatCodeBlock called:', {
      language,
      codeLength: code.length,
      theme,
      shiniReady: this.shini.isReady(),
      shiniState: this.shini.state()
    });

    // Check if Shini is ready
    if (!this.shini.isReady()) {
      // Fallback: return escaped plain text (uses inherited method)
      console.warn('[MarkdownFormatterService] Shini not ready, using fallback');
      return this.escapeHtml(code);
    }

    try {
      // Highlight code (async)
      const highlightedHtml = await this.shini.highlight(code, language, theme);

      console.log('[MarkdownFormatterService] Shini returned HTML:', {
        htmlLength: highlightedHtml.length,
        preview: highlightedHtml.substring(0, 500),
        hasStyleTag: highlightedHtml.includes('style='),
        hasPreTag: highlightedHtml.includes('<pre'),
        hasCodeTag: highlightedHtml.includes('<code')
      });

      // Return HTML directly (no sanitization needed - Shiki is safe)
      return highlightedHtml;

    } catch (error) {
      // Error handling: fallback to plain text (uses inherited method)
      console.error('[MarkdownFormatterService] Highlight error:', error);
      return this.escapeHtml(code);
    }
  }

  /**
   * Wrap highlighted HTML with IDE features
   *
   * Stub implementation for now. Will be enhanced in later phases
   * to add features like line numbers, copy button, etc.
   *
   * @param html - Highlighted HTML string from Shini
   * @param language - Programming language identifier
   * @returns HTML string (currently unchanged)
   */
  private wrapWithIdeFeatures(html: string, language: string): string {
    // Stub: Return HTML as-is for now
    // Future phases will add IDE features like line numbers, copy button, etc.
    return html;
  }
}
