/**
 * Markdown Blockquote Component
 *
 * Renders quoted text with left border styling.
 * Phase 3 - Component Implementation
 */

import { Component, Input, signal, OnChanges, SimpleChanges, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-markdown-blockquote',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <blockquote [class]="blockquoteClasses()">
      {{ content }}
      @if (streaming) {
        <span class="streaming-indicator"></span>
      }
    </blockquote>
  `,
  styleUrls: ['./blockquote.component.css']
})
export class MarkdownBlockquoteComponent implements OnChanges {
  @Input({ required: true }) content!: string;
  @Input() streaming: boolean = false;

  blockquoteClasses = signal<string>('markdown-blockquote block-blockquote');

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['streaming']) {
      this.updateClasses();
    }
  }

  private updateClasses(): void {
    const baseClass = 'markdown-blockquote block-blockquote';
    const streamingClass = this.streaming ? ' streaming' : '';
    this.blockquoteClasses.set(`${baseClass}${streamingClass}`);
  }
}
