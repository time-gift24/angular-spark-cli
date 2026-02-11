/**
 * Markdown Blockquote Component
 *
 * Renders blockquote content and nested markdown blocks.
 */

import { Component, ChangeDetectionStrategy, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MarkdownBlock, BlockquoteBlock } from '../../core/models';
import { MarkdownBlockRouterComponent } from '../block-router/block-router.component';

@Component({
  selector: 'app-markdown-blockquote',
  imports: [CommonModule, MarkdownBlockRouterComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <blockquote [class]="blockquoteClasses()">
      @if (canNest() && block().blocks.length > 0) {
        @for (nestedBlock of block().blocks; track nestedBlock.id) {
          <app-markdown-block-router
            [block]="nestedBlock"
            [isComplete]="isComplete()"
            [blockIndex]="resolveNestedIndex($index, nestedBlock)"
            [enableLazyHighlight]="enableLazyHighlight()"
            [allowHighlight]="allowHighlight()"
            [depth]="depth() + 1" />
        }
      } @else {
        <p class="blockquote-text">{{ block().content }}</p>
      }

      @if (!isComplete()) {
        <span class="streaming-cursor"></span>
      }
    </blockquote>
  `,
  styleUrls: ['./blockquote.component.css']
})
export class MarkdownBlockquoteComponent {
  readonly block = input.required<BlockquoteBlock>();
  readonly isComplete = input(true);
  readonly blockIndex = input(-1);
  readonly enableLazyHighlight = input(false);
  readonly allowHighlight = input(true);
  readonly depth = input(0);
  readonly canNest = input(true);

  protected readonly blockquoteClasses = computed(() => {
    const baseClass = 'markdown-blockquote block-blockquote';
    const streamingClass = !this.isComplete() ? ' streaming' : '';
    return `${baseClass}${streamingClass}`;
  });

  resolveNestedIndex(index: number, block: MarkdownBlock): number {
    if (typeof block.position === 'number' && block.position >= 0) {
      return block.position;
    }
    return index;
  }

}
