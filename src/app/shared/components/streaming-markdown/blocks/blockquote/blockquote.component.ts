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
        @for (child of block.blocks; track child.id) {
          <app-markdown-block-router [block]="child" [isComplete]="isComplete" />
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
}
