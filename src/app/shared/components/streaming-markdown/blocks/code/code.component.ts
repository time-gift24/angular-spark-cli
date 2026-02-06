/**
 * Markdown Code Component
 *
 * Renders code blocks with syntax highlighting using Shiki token-based rendering.
 * Includes language label, copy button, and line numbers.
 * Falls back to plain text if highlighting fails.
 * Skips highlighting during streaming for performance.
 *
 * Implements BlockRenderer interface for plugin architecture.
 * Uses token-based rendering (no innerHTML / DomSanitizer).
 */

import { Component, Input, signal, OnChanges, SimpleChanges, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { from, switchMap, timeout, catchError, of } from 'rxjs';
import { MarkdownBlock, CodeLine } from '../../core/models';
import { ShiniHighlighter } from '../../core/shini-highlighter';
import { IErrorHandler, ComponentErrorType } from '../../core/error-handling';
import { LANGUAGE_DISPLAY_NAMES } from '../../core/shini-types';

@Component({
  selector: 'app-markdown-code',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="code-block-wrapper">
      @if (isComplete) {
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
      <pre [class]="codeWrapperClasses()" class="markdown-code">@if (!isComplete) {<code class="code-streaming">{{ code }}</code>} @else if (highlightedLines().length > 0) {<code>@for (line of highlightedLines(); track line.lineNumber) {<span class="code-line"><span class="line-number">{{ line.lineNumber }}</span><span class="line-content">@for (token of line.tokens; track $index) {<span [style.color]="token.color" [class.italic]="token.fontStyle === 1" [class.bold]="token.fontStyle === 2" [class.underline]="token.fontStyle === 4">{{ token.content }}</span>}</span></span>}</code>} @else {<code>{{ code }}</code>}</pre>
    </div>
  `,
  styleUrls: ['./code.component.css']
})
export class MarkdownCodeComponent implements OnChanges {
  @Input({ required: true }) block!: MarkdownBlock;
  @Input() isComplete: boolean = true;

  highlightedLines = signal<CodeLine[]>([]);
  codeWrapperClasses = signal<string>('markdown-code block-code');
  copied = signal<boolean>(false);

  private shiniHighlighter = inject(ShiniHighlighter);
  private errorHandler?: IErrorHandler;

  get code(): string {
    return this.block.rawContent || this.block.content;
  }

  get language(): string {
    return this.block.language || 'text';
  }

  get displayLanguage(): string {
    const lang = this.language;
    const displayName = (LANGUAGE_DISPLAY_NAMES as Record<string, string>)[lang];
    return displayName || lang.charAt(0).toUpperCase() + lang.slice(1);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['block'] || changes['isComplete']) {
      this.highlightCode();
    }
  }

  private highlightCode(): void {
    if (!this.isComplete) {
      this.highlightedLines.set([]);
      return;
    }

    from(this.shiniHighlighter.whenReady())
      .pipe(
        switchMap(() =>
          from(this.shiniHighlighter.highlightToTokens(this.code, this.language, 'light'))
        ),
        timeout(5000),
        catchError((error) => {
          if (this.errorHandler) {
            this.errorHandler.handle({
              type: ComponentErrorType.HIGHLIGHT_FAILED,
              message: `Failed to highlight ${this.language} code`,
              originalError: error
            });
          } else {
            console.error('[MarkdownCodeComponent] Highlight failed:', error);
          }
          return of(this.shiniHighlighter.plainTextFallback(this.code));
        })
      )
      .subscribe((lines: CodeLine[]) => {
        this.highlightedLines.set(lines);
      });
  }

  async copyToClipboard(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.code);
      this.copied.set(true);
      setTimeout(() => {
        this.copied.set(false);
      }, 2000);
    } catch (error) {
      console.error('[MarkdownCodeComponent] Failed to copy:', error);
    }
  }
}
