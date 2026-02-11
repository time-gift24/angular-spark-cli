/**
 * Markdown Blockquote Component
 *
 * Renders blockquote content and nested markdown blocks.
 */

import { Component, Input, signal, OnChanges, SimpleChanges, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MarkdownBlock, BlockquoteBlock } from '../../core/models';
import { MarkdownBlockRouterComponent } from '../block-router/block-router.component';

@Component({
  selector: 'app-markdown-blockquote',
  standalone: true,
  imports: [CommonModule, MarkdownBlockRouterComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <blockquote [class]="blockquoteClasses()">
      @if (canNest && block.blocks.length > 0) {
        @for (nestedBlock of block.blocks; track nestedBlock.id) {
          <app-markdown-block-router
            [block]="nestedBlock"
            [isComplete]="isComplete"
            [blockIndex]="resolveNestedIndex($index, nestedBlock)"
            [enableLazyHighlight]="enableLazyHighlight"
            [allowHighlight]="allowHighlight"
            [depth]="depth + 1" />
        }
      } @else {
        <p class="blockquote-text">{{ block.content }}</p>
      }

      @if (!isComplete) {
        <span class="streaming-cursor"></span>
      }
    </blockquote>
  `,
  styleUrls: ['./blockquote.component.css']
})
export class MarkdownBlockquoteComponent implements OnChanges {
  @Input({ required: true }) block!: BlockquoteBlock;
  @Input() isComplete = true;
  @Input() blockIndex = -1;
  @Input() enableLazyHighlight = false;
  @Input() allowHighlight = true;
  @Input() depth = 0;
  @Input() canNest = true;

  blockquoteClasses = signal<string>('markdown-blockquote block-blockquote');

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isComplete']) {
      this.updateClasses();
    }
  }

  resolveNestedIndex(index: number, block: MarkdownBlock): number {
    if (typeof block.position === 'number' && block.position >= 0) {
      return block.position;
    }
    return index;
  }

  private updateClasses(): void {
    const baseClass = 'markdown-blockquote block-blockquote';
    const streamingClass = !this.isComplete ? ' streaming' : '';
    this.blockquoteClasses.set(`${baseClass}${streamingClass}`);
  }
}
