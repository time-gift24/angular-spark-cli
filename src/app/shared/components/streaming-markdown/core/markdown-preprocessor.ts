/**
 * Markdown Preprocessor Service
 *
 * Phase 3: Self-Healing Syntax Correction
 *
 * This service provides markdown preprocessing capabilities including:
 * - Automatic detection of unclosed markers
 * - Self-healing syntax correction
 * - Priority-based marker handling
 *
 * @module StreamingMarkdown.Core
 */

import { Injectable } from '@angular/core';

/**
 * Represents a detected markdown marker with its position and closure state
 */
export interface MarkerMatch {
  /** The marker string (e.g., '```', '**', '$$') */
  marker: string;
  /** Start index of the marker in the text */
  startIndex: number;
  /** End index of the marker in the text */
  endIndex: number;
  /** Whether the marker has been properly closed */
  isClosed: boolean;
}

/**
 * Type of markdown marker
 */
export type MarkerType =
  | 'code_block'
  | 'math_block'
  | 'link'
  | 'bold'
  | 'italic'
  | 'strikethrough';

/**
 * Configuration rule for a markdown marker
 */
export interface MarkerRule {
  /** Type identifier for the marker */
  type: MarkerType;
  /** Opening marker string */
  opening: string;
  /** Closing marker string */
  closing: string;
  /** Priority for handling (lower = higher priority) */
  priority: number;
}

/**
 * Priority configuration for markdown markers
 *
 * Lower priority numbers indicate higher precedence.
 * Code blocks and math blocks must be handled first to prevent
 * their content from being interpreted as inline formatting.
 */
export const MARKER_RULES: readonly MarkerRule[] = [
  { type: 'code_block', opening: '```', closing: '```', priority: 0 },
  { type: 'math_block', opening: '$$', closing: '$$', priority: 10 },
  { type: 'link', opening: '[', closing: ']', priority: 100 },
  { type: 'bold', opening: '**', closing: '**', priority: 200 },
  { type: 'italic', opening: '*', closing: '*', priority: 300 },
  { type: 'strikethrough', opening: '~~', closing: '~~', priority: 400 },
] as const;

/**
 * Interface for detecting and fixing unclosed markdown markers
 */
export interface IMarkerDetector {
  /**
   * Detects all unclosed markdown markers in the given text
   * @param text - The markdown text to analyze
   * @returns Array of detected markers with their closure status
   */
  detectUnclosedMarkers(text: string): MarkerMatch[];

  /**
   * Automatically closes unclosed markers in the text
   * @param text - The markdown text to fix
   * @param matches - Array of detected marker matches
   * @returns The text with unclosed markers closed
   */
  closeMarkers(text: string, matches: MarkerMatch[]): string;
}

/**
 * Interface for markdown preprocessing service
 */
export interface IMarkdownPreprocessor {
  /**
   * Processes markdown text with self-healing syntax correction
   * @param text - The raw markdown text to process
   * @returns Preprocessed markdown text with corrected syntax
   */
  process(text: string): string;
}

/**
 * Implementation of the marker detector
 * Handles detection and closing of unclosed markdown markers
 */
class MarkerDetector implements IMarkerDetector {
  /**
   * Detects all unclosed markdown markers in the given text
   * Uses priority-based processing to avoid conflicts
   *
   * @param text - The markdown text to analyze
   * @returns Array of detected markers with their closure status
   */
  detectUnclosedMarkers(text: string): MarkerMatch[] {
    const matches: MarkerMatch[] = [];

    // Process markers in priority order (low to high)
    const sortedRules = [...MARKER_RULES].sort((a, b) => a.priority - b.priority);

    for (const rule of sortedRules) {
      let searchStart = 0;
      let openIndex = -1;

      while (searchStart < text.length) {
        // Find opening marker
        openIndex = text.indexOf(rule.opening, searchStart);

        if (openIndex === -1) {
          // No more opening markers found
          break;
        }

        // Find closing marker after the opening
        const closeIndex = text.indexOf(rule.closing, openIndex + rule.opening.length);

        if (closeIndex === -1) {
          // Unclosed marker found
          matches.push({
            marker: rule.opening,
            startIndex: openIndex,
            endIndex: openIndex + rule.opening.length,
            isClosed: false
          });
          break; // Only care about the last unclosed marker
        }

        // Marker is closed, move past this pair
        searchStart = closeIndex + rule.closing.length;
      }
    }

    return matches;
  }

  /**
   * Automatically closes unclosed markers in the text
   * Appends closing markers for all unclosed markers
   *
   * @param text - The markdown text to fix
   * @param matches - Array of detected marker matches
   * @returns The text with unclosed markers closed
   */
  closeMarkers(text: string, matches: MarkerMatch[]): string {
    if (matches.length === 0) {
      return text;
    }

    // Group unclosed markers by type and add closings in reverse order
    // to maintain proper nesting
    const unclosedByType = new Map<string, number>();

    // Process matches to find which markers need closing
    for (const match of matches) {
      if (!match.isClosed) {
        // Find the rule for this marker
        const rule = MARKER_RULES.find(r => r.opening === match.marker);
        if (rule) {
          unclosedByType.set(rule.type, match.startIndex);
        }
      }
    }

    // Sort by position (latest first) to maintain proper nesting when closing
    const sortedUnclosed = Array.from(unclosedByType.entries())
      .sort(([, posA], [, posB]) => posB - posA);

    // Build the closing string with proper formatting
    let closingString = '';
    const textEndsWithNewline = text.endsWith('\n');

    // Add newline before closing block-level markers if text doesn't end with one
    const needsLeadingNewline = !textEndsWithNewline &&
      Array.from(unclosedByType.keys()).some(type =>
        type === 'code_block' || type === 'math_block'
      );

    if (needsLeadingNewline) {
      closingString += '\n';
    }

    // Add closing markers
    for (const [type] of sortedUnclosed) {
      const rule = MARKER_RULES.find(r => r.type === type);
      if (rule) {
        closingString += rule.closing;
      }
    }

    // Append closing markers to the text
    return text + closingString;
  }
}

/**
 * Implementation of the Markdown Preprocessor Service
 *
 * Provides full self-healing syntax correction for streaming markdown.
 * Detects and fixes unclosed markers to prevent rendering issues.
 */
@Injectable({ providedIn: 'root' })
export class MarkdownPreprocessor implements IMarkdownPreprocessor {
  /**
   * Detector instance for finding unclosed markers
   */
  private detector = new MarkerDetector();

  /**
   * Processes markdown text with self-healing syntax correction
   *
   * Algorithm:
   * 1. Detect all unclosed markers in priority order
   * 2. Automatically close unclosed markers
   * 3. Return corrected text
   *
   * @param text - The raw markdown text to process
   * @returns Preprocessed markdown text with corrected syntax
   *
   * @example
   * ```typescript
   * const preprocessor = new MarkdownPreprocessor();
   *
   * // Fixes unclosed bold
   * preprocessor.process('This is **bold text');
   * // Returns: 'This is **bold text**'
   *
   * // Fixes nested unclosed markers
   * preprocessor.process('```javascript\nconsole.log("hello")');
   * // Returns: '```javascript\nconsole.log("hello")\n```'
   * ```
   */
  process(text: string): string {
    // Handle empty input
    if (!text || text.length === 0) {
      return text;
    }

    // Detect unclosed markers
    const matches = this.detector.detectUnclosedMarkers(text);

    // If no unclosed markers, return original text
    if (matches.length === 0) {
      return text;
    }

    // Close unclosed markers
    const corrected = this.detector.closeMarkers(text, matches);

    return corrected;
  }
}
