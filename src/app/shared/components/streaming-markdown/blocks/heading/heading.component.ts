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
      @case (1) { <h1 [class]="headingClasses()">@if (block.children?.length) { @for (inline of block.children; track $index) { @switch (inline.type) { @case ('link') { <a [href]="inline.href" class="inline-link" target="_blank" rel="noopener">{{ inline.content }}</a> } @case ('code') { <code class="inline-code">{{ inline.content }}</code> } @default { <span [class]="getInlineClass(inline.type)">{{ inline.content }}</span> } } } } @else { {{ block.content }} }@if (!isComplete) { <span class="streaming-cursor"></span> }</h1> }
      @case (2) { <h2 [class]="headingClasses()">@if (block.children?.length) { @for (inline of block.children; track $index) { @switch (inline.type) { @case ('link') { <a [href]="inline.href" class="inline-link" target="_blank" rel="noopener">{{ inline.content }}</a> } @case ('code') { <code class="inline-code">{{ inline.content }}</code> } @default { <span [class]="getInlineClass(inline.type)">{{ inline.content }}</span> } } } } @else { {{ block.content }} }@if (!isComplete) { <span class="streaming-cursor"></span> }</h2> }
      @case (3) { <h3 [class]="headingClasses()">@if (block.children?.length) { @for (inline of block.children; track $index) { @switch (inline.type) { @case ('link') { <a [href]="inline.href" class="inline-link" target="_blank" rel="noopener">{{ inline.content }}</a> } @case ('code') { <code class="inline-code">{{ inline.content }}</code> } @default { <span [class]="getInlineClass(inline.type)">{{ inline.content }}</span> } } } } @else { {{ block.content }} }@if (!isComplete) { <span class="streaming-cursor"></span> }</h3> }
      @case (4) { <h4 [class]="headingClasses()">@if (block.children?.length) { @for (inline of block.children; track $index) { @switch (inline.type) { @case ('link') { <a [href]="inline.href" class="inline-link" target="_blank" rel="noopener">{{ inline.content }}</a> } @case ('code') { <code class="inline-code">{{ inline.content }}</code> } @default { <span [class]="getInlineClass(inline.type)">{{ inline.content }}</span> } } } } @else { {{ block.content }} }@if (!isComplete) { <span class="streaming-cursor"></span> }</h4> }
      @case (5) { <h5 [class]="headingClasses()">@if (block.children?.length) { @for (inline of block.children; track $index) { @switch (inline.type) { @case ('link') { <a [href]="inline.href" class="inline-link" target="_blank" rel="noopener">{{ inline.content }}</a> } @case ('code') { <code class="inline-code">{{ inline.content }}</code> } @default { <span [class]="getInlineClass(inline.type)">{{ inline.content }}</span> } } } } @else { {{ block.content }} }@if (!isComplete) { <span class="streaming-cursor"></span> }</h5> }
      @case (6) { <h6 [class]="headingClasses()">@if (block.children?.length) { @for (inline of block.children; track $index) { @switch (inline.type) { @case ('link') { <a [href]="inline.href" class="inline-link" target="_blank" rel="noopener">{{ inline.content }}</a> } @case ('code') { <code class="inline-code">{{ inline.content }}</code> } @default { <span [class]="getInlineClass(inline.type)">{{ inline.content }}</span> } } } } @else { {{ block.content }} }@if (!isComplete) { <span class="streaming-cursor"></span> }</h6> }
      @default { <h6 class="markdown-heading fallback">{{ block.content }}@if (!isComplete) { <span class="streaming-cursor"></span> }</h6> }
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

  getInlineClass(type: string): string {
    return `inline-${type}`;
  }
}
