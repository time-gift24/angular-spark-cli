/**
 * Markdown Code Component
 *
 * Renders code blocks with syntax highlighting using Shiki.
 * Falls back to plain text if highlighting fails.
 * Skips highlighting during streaming for performance.
 *
 * Phase 3 - Task 3.3 Implementation
 */

import { Component, Input, signal, OnChanges, SimpleChanges, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, of, timeout, catchError, from } from 'rxjs';
import { ShiniHighlighter } from '../../core/shini-highlighter';
import { IErrorHandler, ComponentErrorType } from '../../core/error-handling';

/**
 * Result of syntax highlighting operation
 */
export interface HighlightResult {
  /** Highlighted HTML or escaped plain text */
  html: string;

  /** Whether this is a fallback (no highlighting) */
  fallback: boolean;
}

@Component({
  selector: 'app-markdown-code',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <pre [class]="codeWrapperClasses()" class="markdown-code">
      @if (highlightResult(); as result) {
        @if (result.fallback) {
          <code class="code-fallback">{{ code }}</code>
        } @else {
          <code [innerHTML]="result.html"></code>
        }
      } @else if (streaming) {
        <code class="code-streaming">{{ code }}</code>
      } @else {
        <code>{{ code }}</code>
      }
    </pre>
  `,
  styleUrls: ['./code.component.css']
})
export class MarkdownCodeComponent implements OnChanges {
  @Input({ required: true }) code!: string;
  @Input() language: string = 'text';
  @Input() streaming: boolean = false;

  highlightResult = signal<HighlightResult | null>(null);
  codeWrapperClasses = signal<string>('markdown-code block-code');

  private shiniHighlighter = inject(ShiniHighlighter);
  private errorHandler?: IErrorHandler;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['code'] || changes['language']) {
      this.highlightCode();
    }
  }

  private highlightCode(): void {
    if (this.streaming) {
      return; // 流式状态下不高亮
    }

    // Convert Promise to Observable for RxJS operators
    from(this.shiniHighlighter.highlight(this.code, this.language, 'light'))
      .pipe(
        timeout(5000),
        catchError((error) => {
          // Log error if error handler is available
          if (this.errorHandler) {
            this.errorHandler.handle({
              type: ComponentErrorType.HIGHLIGHT_FAILED,
              message: `Failed to highlight ${this.language} code`,
              originalError: error
            });
          } else {
            console.error('[MarkdownCodeComponent] Highlight failed:', error);
          }

          // Return fallback result
          const fallback: HighlightResult = { html: this.escapeHtml(this.code), fallback: true };
          return of(fallback);
        })
      )
      .subscribe((html: string | { html: string; fallback: boolean }) => {
        // Handle both string (from Shini) and HighlightResult (from fallback)
        if (typeof html === 'string') {
          this.highlightResult.set({ html, fallback: false });
        } else {
          this.highlightResult.set(html as HighlightResult);
        }
      });
  }

  /**
   * Escape HTML special characters
   */
  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}
