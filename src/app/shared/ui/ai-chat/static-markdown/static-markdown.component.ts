/**
 * Static Markdown Component
 *
 * Renders static markdown content (non-streaming).
 * Uses the same block rendering logic as StreamingMarkdownComponent
 * but without the streaming overhead.
 */

import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MarkdownBlockRouterComponent } from '@app/shared/components/streaming-markdown/blocks/block-router/block-router.component';
import { MarkdownBlock } from '@app/shared/components/streaming-markdown/core/models';
import { MarkdownPreprocessor } from '@app/shared/components/streaming-markdown/core/markdown-preprocessor';
import { BlockParser } from '@app/shared/components/streaming-markdown/core/block-parser';

@Component({
  selector: 'static-markdown',
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
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StaticMarkdownComponent {
  readonly content = input.required<string>();

  private readonly preprocessor = inject(MarkdownPreprocessor);
  private readonly parser = inject(BlockParser);

  constructor() {
    effect(() => {
      this.parseContent(this.content());
    });
  }

  protected blocks = signal<MarkdownBlock[]>([]);

  private parseContent(content: string): void {
    if (!content) {
      this.blocks.set([]);
      return;
    }

    try {
      // Preprocess the content
      const processed = this.preprocessor.process(content);

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
