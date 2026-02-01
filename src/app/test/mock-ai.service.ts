/**
 * Mock AI API Service for Streaming Markdown Testing
 *
 * This service provides simulated markdown streaming for testing purposes.
 * It implements different streaming patterns to test various scenarios.
 *
 * Phase 8.1 Implementation:
 * - Define IMockAIApi interface
 * - Define StreamPattern union type
 * - Implement MockAIApi service with Observable streams
 */

import { Injectable } from '@angular/core';
import { Observable, of, delay, concat } from 'rxjs';

/**
 * Stream pattern configuration for different test scenarios.
 *
 * @example
 * ```typescript
 * // Simple pattern - streams entire content at once
 * const simple: StreamPattern = {
 *   type: 'simple',
 *   content: '# Hello World\n\nThis is a test.'
 * };
 *
 * // Chunks pattern - streams content in pieces with delays
 * const chunks: StreamPattern = {
 *   type: 'chunks',
 *   chunks: ['# ', 'Hello', ' World', '\n\n', 'Test'],
 *   delay: 100
 * };
 * ```
 */
export type StreamPattern =
  | { type: 'simple'; content: string }
  | { type: 'chunks'; chunks: string[]; delay: number };

/**
 * Interface for Mock AI API service.
 * Defines the contract for streaming markdown content.
 *
 * Implementations can provide different streaming behaviors:
 * - Simple single-chunk streaming
 * - Multi-chunk streaming with delays
 * - Custom patterns for edge case testing
 */
export interface IMockAIApi {
  /**
   * Streams markdown content using default pattern.
   *
   * @returns Observable that emits markdown text chunks
   *
   * @example
   * ```typescript
   * this.mockApi.streamMarkdown().subscribe(chunk => {
   *   console.log('Received:', chunk);
   * });
   * ```
   */
  streamMarkdown(): Observable<string>;

  /**
   * Streams markdown content using a specific pattern.
   *
   * @param pattern - StreamPattern configuration
   * @returns Observable that emits markdown text chunks
   *
   * @example
   * ```typescript
   * const pattern: StreamPattern = {
   *   type: 'chunks',
   *   chunks: ['# ', 'Title', '\n', 'Content'],
   *   delay: 50
   * };
   * this.mockApi.streamMarkdownWithPattern(pattern).subscribe(...);
   * ```
   */
  streamMarkdownWithPattern(pattern: StreamPattern): Observable<string>;
}

/**
 * Mock AI API service implementation.
 *
 * Provides simulated markdown streaming for testing the streaming markdown component.
 * This service is registered as a root singleton, making it available throughout
 * the application for dependency injection.
 *
 * @example
 * ```typescript
 * @Component({
 *   // ...
 * })
 * export class TestComponent {
 *   constructor(private mockApi: IMockAIApi) {}
 *
 *   startStreaming() {
 *     this.stream$ = this.mockApi.streamMarkdown();
 *   }
 * }
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class MockAIApi implements IMockAIApi {
  /**
   * Default markdown content for testing.
   * Contains various markdown elements to verify rendering:
   * - Headings (h1, h2, h3)
   * - Paragraphs
   * - Lists (ordered and unordered)
   * - Code blocks
   * - Blockquotes
   */
  private readonly defaultContent = `# Streaming Markdown Demo

This is a demonstration of the streaming markdown component with syntax highlighting.

## Features

- Real-time markdown rendering
- Streaming text support
- Optimized change detection
- **Syntax highlighting** for code blocks

## TypeScript Example

\`\`\`typescript
// Define a greeting message
const greeting = "Hello, World!";

// Log the greeting to console
console.log(greeting);

// Function to demonstrate syntax highlighting
function add(a: number, b: number): number {
  return a + b;
}

// Call the function
const result = add(5, 3);
console.log(\`Result: \${result}\`);
\`\`\`

## Python Example

\`\`\`python
# Python syntax highlighting example
def greet(name: str) -> str:
    return f"Hello, {name}!"

# Call the function
message = greet("World")
print(message)
\`\`\`

## Blockquote

> The best way to predict the future is to create it.
> *— Peter Drucker*

### Conclusion

This component provides efficient markdown streaming with Angular Signals and RxJS.
Professional syntax highlighting is powered by Shiki.
`;

  /**
   * Streams markdown content using the default pattern.
   * Implements a simple streaming approach with moderate chunks.
   *
   * @returns Observable emitting markdown text chunks
   */
  streamMarkdown(): Observable<string> {
    // Use chunks pattern for realistic streaming simulation
    const pattern: StreamPattern = {
      type: 'chunks',
      chunks: this.splitIntoChunks(this.defaultContent, 20),
      delay: 50
    };

    return this.streamMarkdownWithPattern(pattern);
  }

  /**
   * Streams markdown content using a specific pattern.
   *
   * Behavior based on pattern type:
   * - `simple`: Emits entire content as a single chunk
   * - `chunks`: Emits content in chunks with specified delays
   *
   * @param pattern - StreamPattern configuration
   * @returns Observable emitting markdown text chunks
   */
  streamMarkdownWithPattern(pattern: StreamPattern): Observable<string> {
    if (pattern.type === 'simple') {
      // Simple pattern: emit entire content at once
      return of(pattern.content).pipe(delay(100));
    }

    if (pattern.type === 'chunks') {
      // Chunks pattern: emit each chunk with delay
      const observables = pattern.chunks.map((chunk, index) => {
        // First chunk emits immediately, others with delay
        const delayTime = index === 0 ? 0 : pattern.delay;
        return of(chunk).pipe(delay(delayTime));
      });

      // Concatenate all chunk observables into a single stream
      return concat(...observables);
    }

    // Fallback: empty observable (should never reach here with proper TypeScript)
    return of('');
  }

  /**
   * Splits text into chunks of approximately specified size.
   * Attempts to break at word boundaries when possible.
   * Avoids breaking in the middle of markdown syntax markers.
   *
   * @param text - Text to split
   * @param chunkSize - Approximate target chunk size in characters
   * @returns Array of text chunks
   *
   * @private
   */
  private splitIntoChunks(text: string, chunkSize: number): string[] {
    const chunks: string[] = [];
    let remaining = text;

    while (remaining.length > 0) {
      if (remaining.length <= chunkSize) {
        chunks.push(remaining);
        break;
      }

      // Find a good break point (newline or space) near chunkSize
      let breakPoint = chunkSize;

      // Prefer breaking at newline
      const lastNewline = remaining.lastIndexOf('\n', chunkSize);
      if (lastNewline > chunkSize * 0.5) {
        breakPoint = lastNewline + 1;
      } else {
        // Otherwise break at space
        const lastSpace = remaining.lastIndexOf(' ', chunkSize);
        if (lastSpace > chunkSize * 0.5) {
          breakPoint = lastSpace + 1;
        }
      }

      const candidate = remaining.substring(0, breakPoint);

      // Check for unclosed markdown markers and extend break point
      breakPoint = this.adjustBreakPointForMarkers(remaining, breakPoint);

      chunks.push(remaining.substring(0, breakPoint));
      remaining = remaining.substring(breakPoint);
    }

    return chunks;
  }

  /**
   * Adjusts break point to avoid splitting markdown markers.
   * Checks for unclosed code blocks, bold, italic, etc.
   *
   * @param text - Full text being split
   * @param breakPoint - Proposed break point
   * @returns Adjusted break point
   *
   * @private
   */
  private adjustBreakPointForMarkers(text: string, breakPoint: number): number {
    const candidate = text.substring(0, breakPoint);
    let adjusted = breakPoint;

    // Check for unclosed code blocks (odd number of ```)
    const backtickCount = (candidate.match(/```/g) || []).length;
    if (backtickCount % 2 !== 0) {
      const fenceEnd = text.indexOf('```', breakPoint);
      if (fenceEnd !== -1 && fenceEnd < breakPoint + 500) {
        adjusted = fenceEnd + 3;
      }
    }

    // Check for unclosed bold (**)
    const boldCount = (candidate.match(/\*\*/g) || []).length;
    if (boldCount % 2 !== 0) {
      const boldEnd = text.indexOf('**', breakPoint);
      if (boldEnd !== -1 && boldEnd < breakPoint + 50) {
        adjusted = Math.max(adjusted, boldEnd + 2);
      }
    }

    // Check for unclosed links [text](url)
    const openBrackets = (candidate.match(/\[/g) || []).length;
    const closeBrackets = (candidate.match(/\]/g) || []).length;
    if (openBrackets > closeBrackets) {
      const linkEnd = text.indexOf(']', breakPoint);
      if (linkEnd !== -1 && linkEnd < breakPoint + 100) {
        // Also check for closing parenthesis
        const parenEnd = text.indexOf(')', linkEnd);
        if (parenEnd !== -1 && parenEnd < breakPoint + 150) {
          adjusted = Math.max(adjusted, parenEnd + 1);
        }
      }
    }

    return adjusted;
  }
}
