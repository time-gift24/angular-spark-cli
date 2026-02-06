/**
 * Markdown Paragraph Component
 *
 * Renders markdown paragraphs with support for inline elements.
 * Supports plain text or formatted inline spans (bold, italic, code).
 *
 * Implements BlockRenderer interface for plugin architecture.
 */

import { Component, Input, signal, OnChanges, SimpleChanges, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MarkdownBlock } from '../../core/models';

@Component({
  selector: 'app-markdown-paragraph',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p [class]="paragraphClasses()">
      @if (block.children && block.children.length > 0) {
        @for (inline of block.children; track inline.type; let last = $last) {
          <span [class]="getInlineClass(inline.type)">{{ inline.content }}</span>{{ last ? '' : ' ' }}
        }
      } @else {
        {{ block.content }}
      }
    </p>
  `,
  styleUrls: ['./paragraph.component.css']
})
export class MarkdownParagraphComponent implements OnChanges {
  @Input({ required: true }) block!: MarkdownBlock;
  @Input() isComplete: boolean = true;

  paragraphClasses = signal<string>('markdown-paragraph block-paragraph');

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isComplete']) {
      this.updateClasses();
    }
  }

  private updateClasses(): void {
    const baseClass = 'markdown-paragraph block-paragraph';
    const streamingClass = !this.isComplete ? ' streaming' : '';
    this.paragraphClasses.set(`${baseClass}${streamingClass}`);
  }

  getInlineClass(type: string): string {
    return `inline-${type}`;
  }
}
