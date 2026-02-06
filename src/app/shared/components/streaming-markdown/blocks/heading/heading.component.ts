/**
 * Markdown Heading Component
 *
 * Renders markdown headings (h1-h6) with dynamic level support.
 * Invalid levels (outside 1-6) fall back to h6 with warning styling.
 *
 * Implements BlockRenderer interface for plugin architecture.
 */

import { Component, Input, signal, OnChanges, SimpleChanges, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MarkdownBlock } from '../../core/models';

@Component({
  selector: 'app-markdown-heading',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @switch (block.level || 1) {
      @case (1) { <h1 [class]="headingClasses()">{{ block.content }}</h1> }
      @case (2) { <h2 [class]="headingClasses()">{{ block.content }}</h2> }
      @case (3) { <h3 [class]="headingClasses()">{{ block.content }}</h3> }
      @case (4) { <h4 [class]="headingClasses()">{{ block.content }}</h4> }
      @case (5) { <h5 [class]="headingClasses()">{{ block.content }}</h5> }
      @case (6) { <h6 [class]="headingClasses()">{{ block.content }}</h6> }
      @default { <h6 class="markdown-heading fallback">{{ block.content }}</h6> }
    }
  `,
  styleUrls: ['./heading.component.css']
})
export class MarkdownHeadingComponent implements OnChanges {
  @Input({ required: true }) block!: MarkdownBlock;
  @Input() isComplete: boolean = true;

  headingClasses = signal<string>('markdown-heading');

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isComplete']) {
      this.updateClasses();
    }
  }

  private updateClasses(): void {
    const baseClass = 'markdown-heading';
    const streamingClass = !this.isComplete ? ' streaming' : '';
    this.headingClasses.set(`${baseClass}${streamingClass}`);
  }
}
