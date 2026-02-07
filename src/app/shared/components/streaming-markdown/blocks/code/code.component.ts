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

import { Component, Input, signal, OnChanges, SimpleChanges, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { from, switchMap, timeout, catchError, of } from 'rxjs';
import { MarkdownBlock, CodeLine } from '../../core/models';
import { ShiniHighlighter } from '../../core/shini-highlighter';
import { IErrorHandler, ComponentErrorType } from '../../core/error-handling';
import { LANGUAGE_DISPLAY_NAMES } from '../../core/shini-types';
import { HighlightSchedulerService } from '../../core/highlight-scheduler.service';

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
          <div class="code-actions">
            <button
              class="code-action-button"
              (click)="downloadCode()"
              title="Download code">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
            </button>
            <button
              class="code-action-button"
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
  @Input() blockIndex: number = -1;
  @Input() enableLazyHighlight: boolean = false;

  highlightedLines = signal<CodeLine[]>([]);
  codeWrapperClasses = signal<string>('markdown-code block-code');
  copied = signal<boolean>(false);

  /** Whether this block is eligible for lazy highlighting */
  readonly canLazyHighlight = computed(() =>
    this.enableLazyHighlight &&
    this.block.type === 'code' &&
    this.isComplete &&
    !this.block.isHighlighted
  );

  private shiniHighlighter = inject(ShiniHighlighter);
  private highlightScheduler = inject(HighlightSchedulerService);
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
      // If lazy highlighting is enabled and block is complete, queue it
      if (this.canLazyHighlight() && this.blockIndex >= 0) {
        this.queueForHighlighting();
      } else {
        // Otherwise highlight immediately
        this.highlightCode();
      }
    }
  }

  private getCurrentTheme(): 'light' | 'dark' {
    return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  }

  /**
   * Queue this block for lazy highlighting via scheduler
   */
  private queueForHighlighting(): void {
    if (!this.isComplete || this.block.isHighlighted) {
      return;
    }

    // Add block to highlight queue
    this.highlightScheduler.queueBlock(this.block, this.blockIndex);

    // Subscribe to highlight results via the scheduler's state
    // The component will receive updated highlighted data through the block reference
  }

  /**
   * Immediate highlighting (non-lazy path)
   */
  private highlightCode(): void {
    if (!this.isComplete) {
      this.highlightedLines.set([]);
      return;
    }

    const theme = this.getCurrentTheme();

    from(this.shiniHighlighter.whenReady())
      .pipe(
        switchMap(() =>
          from(this.shiniHighlighter.highlightToTokens(this.code, this.language, theme))
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

  downloadCode(): void {
    const ext = this.getFileExtension(this.language);
    const filename = `code.${ext}`;
    const blob = new Blob([this.code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  private getFileExtension(lang: string): string {
    const extMap: Record<string, string> = {
      typescript: 'ts', javascript: 'js', python: 'py', java: 'java',
      cpp: 'cpp', 'c++': 'cpp', c: 'c', csharp: 'cs', 'c#': 'cs',
      go: 'go', rust: 'rs', ruby: 'rb', php: 'php', swift: 'swift',
      kotlin: 'kt', scala: 'scala', html: 'html', css: 'css',
      scss: 'scss', less: 'less', json: 'json', yaml: 'yaml',
      yml: 'yml', xml: 'xml', sql: 'sql', bash: 'sh', shell: 'sh',
      sh: 'sh', zsh: 'zsh', powershell: 'ps1', dockerfile: 'Dockerfile',
      markdown: 'md', toml: 'toml', ini: 'ini', lua: 'lua',
      r: 'r', dart: 'dart', elixir: 'ex', erlang: 'erl',
      haskell: 'hs', perl: 'pl', text: 'txt',
    };
    return extMap[lang.toLowerCase()] || lang || 'txt';
  }
}
