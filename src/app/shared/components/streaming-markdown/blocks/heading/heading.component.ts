/**
 * Markdown Heading Component
 *
 * Renders markdown headings (h1-h6) with dynamic level support.
 * Invalid levels (outside 1-6) fall back to h6 with warning styling.
 *
 * Phase 3 - Task 3.1 Implementation
 */

import { Component, Input, signal, OnChanges, SimpleChanges, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-markdown-heading',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @switch (level) {
      @case (1) { <h1 [class]="headingClasses()">{{ content }}</h1> }
      @case (2) { <h2 [class]="headingClasses()">{{ content }}</h2> }
      @case (3) { <h3 [class]="headingClasses()">{{ content }}</h3> }
      @case (4) { <h4 [class]="headingClasses()">{{ content }}</h4> }
      @case (5) { <h5 [class]="headingClasses()">{{ content }}</h5> }
      @case (6) { <h6 [class]="headingClasses()">{{ content }}</h6> }
      @default { <h6 class="markdown-heading fallback">{{ content }}</h6> }
    }
  `,
  styleUrls: ['./heading.component.css']
})
export class MarkdownHeadingComponent implements OnChanges {
  @Input({ required: true }) level!: number;
  @Input({ required: true }) content!: string;
  @Input() streaming: boolean = false;

  headingClasses = signal<string>('markdown-heading');

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['streaming']) {
      this.updateClasses();
    }
  }

  private updateClasses(): void {
    const baseClass = 'markdown-heading';
    const streamingClass = this.streaming ? ' streaming' : '';
    this.headingClasses.set(`${baseClass}${streamingClass}`);
  }
}
