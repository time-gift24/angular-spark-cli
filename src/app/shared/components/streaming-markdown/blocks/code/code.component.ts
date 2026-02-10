import {
  Component,
  Input,
  signal,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ChangeDetectionStrategy,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MarkdownBlock, CodeBlock, CodeLine, isCodeBlock } from '../../core/models';
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
export class MarkdownCodeComponent implements OnChanges, OnDestroy {
  @Input({ required: true }) block!: CodeBlock;
  @Input() isComplete: boolean = true;
  @Input() blockIndex: number = -1;
  @Input() enableLazyHighlight: boolean = false;
  @Input() allowHighlight: boolean = true;

  highlightedLines = signal<CodeLine[]>([]);
  codeWrapperClasses = signal<string>('markdown-code block-code');
  copied = signal<boolean>(false);

  private highlightScheduler = inject(HighlightSchedulerService);
  private unsubscribeHighlightResult: (() => void) | null = null;

  constructor() {
    this.unsubscribeHighlightResult = this.highlightScheduler.onHighlightResult((result) => {
      if (!this.block || result.blockId !== this.block.id) {
        return;
      }

      this.highlightedLines.set(result.lines);
      this.block.isHighlighted = true;
    });
  }

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
    if (changes['block'] || changes['isComplete'] || changes['enableLazyHighlight'] || changes['allowHighlight'] || changes['blockIndex']) {
      void this.syncHighlightState();
    }
  }

  ngOnDestroy(): void {
    if (this.unsubscribeHighlightResult) {
      this.unsubscribeHighlightResult();
      this.unsubscribeHighlightResult = null;
    }
  }

  private async syncHighlightState(): Promise<void> {
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

    const cached = this.highlightScheduler.getHighlightedLines(this.block.id);
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
