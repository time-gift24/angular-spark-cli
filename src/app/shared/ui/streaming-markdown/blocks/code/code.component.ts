import {
  Component,
  Injector,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  effect,
  inject,
  input,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { CodeBlock, CodeLine, isCodeBlock } from '../../core/models';
import { LANGUAGE_DISPLAY_NAMES } from '../../core/shini-types';
import { HighlightSchedulerService } from '../../core/highlight-scheduler.service';

@Component({
  selector: 'app-markdown-code',
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="code-block-wrapper">
      @if (isComplete) {
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

      <pre [class]="codeWrapperClasses()" class="markdown-code">@if (!isComplete) {<code class="code-streaming">{{ code }}</code>} @else if (highlightedLines().length > 0) {<code>@for (line of highlightedLines(); track line.lineNumber) {<span class="code-line"><span class="line-number">{{ line.lineNumber }}</span><span class="line-content">@for (token of line.tokens; track $index) {<span [style.color]="token.color" [class.italic]="token.fontStyle === 1" [class.bold]="token.fontStyle === 2" [class.underline]="token.fontStyle === 4">{{ token.content }}</span>}</span></span>}</code>} @else {<code>{{ code }}</code>}</pre>
    </div>
  `,
  styleUrls: ['./code.component.css']
})
export class MarkdownCodeComponent implements OnInit, OnDestroy {
  readonly blockInput = input.required<CodeBlock>({ alias: 'block' });
  readonly isCompleteInput = input(true, { alias: 'isComplete' });
  readonly blockIndexInput = input(-1, { alias: 'blockIndex' });
  readonly enableLazyHighlightInput = input(false, { alias: 'enableLazyHighlight' });
  readonly allowHighlightInput = input(true, { alias: 'allowHighlight' });

  get block(): CodeBlock {
    return this.blockInput();
  }

  get isComplete(): boolean {
    return this.isCompleteInput();
  }

  get blockIndex(): number {
    return this.blockIndexInput();
  }

  get enableLazyHighlight(): boolean {
    return this.enableLazyHighlightInput();
  }

  get allowHighlight(): boolean {
    return this.allowHighlightInput();
  }

  highlightedLines = signal<CodeLine[]>([]);
  codeWrapperClasses = signal('markdown-code block-code');
  copied = signal(false);

  private readonly injector = inject(Injector);
  private readonly highlightScheduler = inject(HighlightSchedulerService);
  private unsubscribeHighlightResult: (() => void) | null = null;
  private subscribedBlockId: string | null = null;
  private syncRequestId = 0;
  private copiedResetTimer: ReturnType<typeof setTimeout> | null = null;

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

  ngOnInit(): void {
    effect(
      () => {
        this.blockInput();
        this.isCompleteInput();
        this.enableLazyHighlightInput();
        this.allowHighlightInput();
        this.blockIndexInput();
        this.ensureHighlightSubscription();
        void this.syncHighlightState();
      },
      { injector: this.injector },
    );
  }

  ngOnDestroy(): void {
    if (this.unsubscribeHighlightResult) {
      this.unsubscribeHighlightResult();
      this.unsubscribeHighlightResult = null;
    }

    if (this.copiedResetTimer) {
      clearTimeout(this.copiedResetTimer);
      this.copiedResetTimer = null;
    }
  }

  private ensureHighlightSubscription(): void {
    const nextBlockId = this.block?.id || null;
    if (nextBlockId === this.subscribedBlockId) {
      return;
    }

    if (this.unsubscribeHighlightResult) {
      this.unsubscribeHighlightResult();
      this.unsubscribeHighlightResult = null;
    }

    this.subscribedBlockId = nextBlockId;
    if (!nextBlockId) {
      return;
    }

    this.unsubscribeHighlightResult = this.highlightScheduler.onHighlightResult((result) => {
      if (this.block?.id !== result.blockId) {
        return;
      }
      this.highlightedLines.set(result.lines);
      this.block.isHighlighted = true;
    }, nextBlockId);
  }

  private async syncHighlightState(): Promise<void> {
    const requestId = ++this.syncRequestId;
    const blockIdAtStart = this.block?.id;

    if (!this.isComplete || !this.allowHighlight) {
      this.highlightedLines.set([]);
      return;
    }

    const externalHighlight = this.block.highlightResult?.();
    if (externalHighlight?.lines?.length) {
      this.highlightedLines.set(externalHighlight.lines);
      this.block.isHighlighted = true;
      return;
    }

    const code = this.block.rawContent || this.block.content;
    const head = code.slice(0, 120);
    const tail = code.length > 120 ? code.slice(-120) : '';
    const signature = `${code.length}:${head}:${tail}`;

    const cached = this.highlightScheduler.getHighlightedLinesBySignature(this.block.id, signature);
    if (cached?.length) {
      this.highlightedLines.set(cached);
      this.block.isHighlighted = true;
      return;
    }

    const index = this.resolveBlockIndex();

    if (this.enableLazyHighlight) {
      this.highlightScheduler.queueBlock(this.block, index);
      return;
    }

    const lines = await this.highlightScheduler.highlightNow(this.block, index);
    if (requestId !== this.syncRequestId || !blockIdAtStart || this.block?.id !== blockIdAtStart) {
      return;
    }
    this.highlightedLines.set(lines);
    this.block.isHighlighted = true;
  }

  private resolveBlockIndex(): number {
    if (this.blockIndex >= 0) {
      return this.blockIndex;
    }

    if (typeof this.block.position === 'number' && this.block.position >= 0) {
      return this.block.position;
    }

    return 0;
  }

  async copyToClipboard(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.code);
      this.copied.set(true);

      if (this.copiedResetTimer) {
        clearTimeout(this.copiedResetTimer);
      }

      this.copiedResetTimer = setTimeout(() => {
        this.copied.set(false);
        this.copiedResetTimer = null;
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

    // Create a temporary anchor element for download without appending to DOM
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.style.display = 'none';

    // Trigger download and cleanup in the same microtask
    anchor.click();

    // Revoke the object URL after a short delay to ensure download starts
    setTimeout(() => URL.revokeObjectURL(url), 100);
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
