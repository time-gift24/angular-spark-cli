/**
 * Static Markdown Component
 *
 * Renders static markdown content (non-streaming).
 * Uses the same block rendering logic as StreamingMarkdownComponent
 * but without the streaming overhead.
 */

import { Component, Input, OnChanges, SimpleChanges, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MarkdownBlockRouterComponent } from '@app/shared/components/streaming-markdown/blocks/block-router/block-router.component';
import { MarkdownBlock } from '@app/shared/components/streaming-markdown/core/models';
import { MarkdownPreprocessor } from '@app/shared/components/streaming-markdown/core/markdown-preprocessor';
import { BlockParser } from '@app/shared/components/streaming-markdown/core/block-parser';

@Component({
  selector: 'static-markdown',
  standalone: true,
  imports: [CommonModule, MarkdownBlockRouterComponent],
  providers: [
    MarkdownPreprocessor,
    BlockParser,
  ],
  template: `
    <div class="static-markdown">
      @for (block of blocks(); track block.id) {
        <app-markdown-block-router [block]="block" [isComplete]="true" />
      }
    </div>
  `,
  host: {
    class: 'block text-sm'
  }
})
export class StaticMarkdownComponent implements OnChanges {
  @Input({ required: true }) content!: string;

  constructor(
    private preprocessor: MarkdownPreprocessor,
    private parser: BlockParser
  ) {}

  protected blocks = signal<MarkdownBlock[]>([]);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['content']) {
      this.parseContent();
    }
  }

  private parseContent(): void {
    if (!this.content) {
      this.blocks.set([]);
      return;
    }

    try {
      // Preprocess the content
      const processed = this.preprocessor.process(this.content);

      // Parse into blocks
      const result = this.parser.parse(processed);

      // Update blocks signal
      this.blocks.set(result.blocks);
    } catch (error) {
      console.error('[StaticMarkdownComponent] Parse error:', error);
      this.blocks.set([]);
    }
  }
}
