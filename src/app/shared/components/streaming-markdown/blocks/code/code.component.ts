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
import { Observable, of, timeout, catchError, from, switchMap } from 'rxjs';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ShiniHighlighter } from '../../core/shini-highlighter';
import { IErrorHandler, ComponentErrorType } from '../../core/error-handling';

@Component({
  selector: 'app-markdown-code',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <pre [class]="codeWrapperClasses()" class="markdown-code">
      @if (streaming) {
        <code class="code-streaming">{{ code }}</code>
      } @else if (highlightResult(); as safeHtml) {
        <code [innerHTML]="safeHtml"></code>
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

  highlightResult = signal<SafeHtml | null>(null);
  codeWrapperClasses = signal<string>('markdown-code block-code');

  private shiniHighlighter = inject(ShiniHighlighter);
  private domSanitizer = inject(DomSanitizer);
  private errorHandler?: IErrorHandler;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['code'] || changes['language'] || changes['streaming']) {
      this.highlightCode();
    }
  }

  private highlightCode(): void {
    if (this.streaming) {
      return; // 流式状态下不高亮
    }

    // Wait for Shini to be ready, then highlight
    from(this.shiniHighlighter.whenReady())
      .pipe(
        switchMap(() => {
          // Shini is ready, now highlight the code
          return from(this.shiniHighlighter.highlight(this.code, this.language, 'light'));
        }),
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

          // Return fallback HTML (escaped)
          return of(this.escapeHtml(this.code));
        })
      )
      .subscribe((html: string) => {
        // Bypass Angular's HTML sanitization to allow inline styles from Shiki
        const safeHtml = this.domSanitizer.bypassSecurityTrustHtml(html);
        this.highlightResult.set(safeHtml);
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
