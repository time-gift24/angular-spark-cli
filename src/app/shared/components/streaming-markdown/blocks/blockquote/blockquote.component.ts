/**
 * Markdown Blockquote Component
 *
 * Renders quoted text with left border styling.
 * Supports nested block content (paragraphs, lists, code, etc.)
 * via the block router component.
 *
 * Implements BlockRenderer interface for plugin architecture.
 */

import { Component, Input, signal, OnChanges, SimpleChanges, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MarkdownBlock } from '../../core/models';
import { MarkdownBlockRouterComponent } from '../block-router/block-router.component';

@Component({
  selector: 'app-markdown-blockquote',
  standalone: true,
  imports: [CommonModule, MarkdownBlockRouterComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <blockquote [class]="blockquoteClasses()">
      @if (block.blocks?.length) {
        @for (child of block.blocks; track child.id; let childIndex = $index) {
          <app-markdown-block-router
            [block]="child"
            [isComplete]="isComplete"
            [blockIndex]="resolveChildBlockIndex(child, childIndex)"
            [enableLazyHighlight]="enableLazyHighlight"
            [allowHighlight]="allowHighlight" />
        }
      } @else {
        {{ block.content }}
      }
      @if (!isComplete) {
        <span class="streaming-cursor"></span>
      }
    </blockquote>
  `,
  styleUrls: ['./blockquote.component.css']
})
export class MarkdownBlockquoteComponent implements OnChanges {
  @Input({ required: true }) block!: MarkdownBlock;
  @Input() isComplete: boolean = true;
  @Input() blockIndex: number = -1;
  @Input() enableLazyHighlight: boolean = false;
  @Input() allowHighlight: boolean = true;

  blockquoteClasses = signal<string>('markdown-blockquote block-blockquote');

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isComplete']) {
      this.updateClasses();
    }
  }

  private updateClasses(): void {
    const baseClass = 'markdown-blockquote block-blockquote';
    const streamingClass = !this.isComplete ? ' streaming' : '';
    this.blockquoteClasses.set(`${baseClass}${streamingClass}`);
  }

  resolveChildBlockIndex(child: MarkdownBlock, childIndex: number): number {
    if (typeof child.position === 'number' && child.position >= 0) {
      return child.position;
    }

    if (this.blockIndex < 0) {
      return childIndex;
    }

    return this.blockIndex + childIndex + 1;
  }
}
