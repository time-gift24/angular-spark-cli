/**
 * Markdown Code Component
 *
 * Renders code blocks with syntax highlighting using Shiki.
 * Includes language label, copy button, and line numbers.
 * Falls back to plain text if highlighting fails.
 * Skips highlighting during streaming for performance.
 *
 * Phase 3 - Task 3.3 Implementation
 */

import { Component, Input, signal, OnChanges, SimpleChanges, ChangeDetectionStrategy, inject, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, of, timeout, catchError, from, switchMap } from 'rxjs';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ShiniHighlighter } from '../../core/shini-highlighter';
import { IErrorHandler, ComponentErrorType } from '../../core/error-handling';
import { LANGUAGE_DISPLAY_NAMES } from '../../core/shini-types';

@Component({
  selector: 'app-markdown-code',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None, // Use None for innerHTML content (Shiki highlighting)
  template: `
    <div class="code-block-wrapper">
      @if (!streaming) {
        <!-- Header bar with language label and copy button -->
        <div class="code-header">
          <span class="code-language">{{ displayLanguage }}</span>
          <button
            class="copy-button"
            (click)="copyToClipboard()"
            [title]="copied() ? 'Copied!' : 'Copy code'"
            [class.copied]="copied()">
            @if (!copied()) {
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
            } @else {
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            }
          </button>
        </div>
      }

      <!-- Code block with line numbers -->
      <pre [class]="codeWrapperClasses()" class="markdown-code">
        @if (streaming) {
          <code class="code-streaming">{{ code }}</code>
        } @else if (highlightResult(); as safeHtml) {
          <code [innerHTML]="safeHtml"></code>
        } @else {
          <code>{{ code }}</code>
        }
      </pre>
    </div>
  `,
  styleUrls: ['./code.component.css']
})
export class MarkdownCodeComponent implements OnChanges {
  @Input({ required: true }) code!: string;
  @Input() language: string = 'text';
  @Input() streaming: boolean = false;

  highlightResult = signal<SafeHtml | null>(null);
  codeWrapperClasses = signal<string>('markdown-code block-code');
  copied = signal<boolean>(false);

  get displayLanguage(): string {
    // Capitalize first letter of language
    const lang = this.language || 'text';
    const displayName = (LANGUAGE_DISPLAY_NAMES as Record<string, string>)[lang];
    return displayName || lang.charAt(0).toUpperCase() + lang.slice(1);
  }

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
   * Copy code to clipboard
   */
  async copyToClipboard(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.code);
      this.copied.set(true);

      // Reset copied state after 2 seconds
      setTimeout(() => {
        this.copied.set(false);
      }, 2000);
    } catch (error) {
      console.error('[MarkdownCodeComponent] Failed to copy:', error);
    }
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
