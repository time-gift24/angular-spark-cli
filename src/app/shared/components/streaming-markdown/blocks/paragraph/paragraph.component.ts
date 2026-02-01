/**
 * Markdown Paragraph Component
 *
 * Renders markdown paragraphs with support for inline elements.
 * Supports plain text or formatted inline spans (bold, italic, code).
 *
 * Phase 3 - Task 3.2 Implementation
 */

import { Component, Input, signal, OnChanges, SimpleChanges, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Represents inline formatting within a paragraph.
 */
export interface MarkdownInline {
  type: 'bold' | 'italic' | 'code';
  content: string;
}

@Component({
  selector: 'app-markdown-paragraph',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p [class]="paragraphClasses()">
      @if (inlines && inlines.length > 0) {
        @for (inline of inlines; track inline.type; let last = $last) {
          <span [class]="getInlineClass(inline.type)">{{ inline.content }}</span>{{ last ? '' : ' ' }}
        }
      } @else {
        {{ content }}
      }
    </p>
  `,
  styleUrls: ['./paragraph.component.css']
})
export class MarkdownParagraphComponent implements OnChanges {
  @Input({ required: true }) content!: string;
  @Input() inlines?: MarkdownInline[];
  @Input() streaming: boolean = false;

  paragraphClasses = signal<string>('markdown-paragraph block-paragraph');

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['streaming']) {
      this.updateClasses();
    }
  }

  private updateClasses(): void {
    const baseClass = 'markdown-paragraph block-paragraph';
    const streamingClass = this.streaming ? ' streaming' : '';
    this.paragraphClasses.set(`${baseClass}${streamingClass}`);
  }

  getInlineClass(type: string): string {
    return `inline-${type}`;
  }
}
