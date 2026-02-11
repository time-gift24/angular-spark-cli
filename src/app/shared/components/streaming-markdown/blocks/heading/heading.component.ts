/**
 * Markdown Heading Component
 *
 * Renders markdown headings (h1-h6) with dynamic level support.
 * Invalid levels (outside 1-6) fall back to h6 with warning styling.
 * Supports recursive inline rendering (bold, italic, strikethrough, nested).
 *
 * Implements BlockRenderer interface for plugin architecture.
 */

import { Component, Input, signal, OnChanges, SimpleChanges, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MarkdownBlock, HeadingBlock, MarkdownInline } from '../../core/models';
import { RenderMathPipe } from '../../core/math-render.pipe';

@Component({
  selector: 'app-markdown-heading',
  standalone: true,
  imports: [CommonModule, RenderMathPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ng-template #inlineRef let-inlines>
      @for (inline of inlines; track $index) {
        @switch (inline.type) {
          @case ('link') {
            <a [href]="inline.href" class="inline-link" target="_blank" rel="noopener">@if (inline.children?.length) {<ng-container *ngTemplateOutlet="inlineRef; context: { $implicit: inline.children }" />} @else {{{ inline.content }}}</a>
          }
          @case ('code') { <code class="inline-code">{{ inline.content }}</code> }
          @case ('math') {
            <span class="inline-math" [class.block-math]="inline.displayMode" [innerHTML]="inline.content | renderMath : inline.displayMode"></span>
          }
          @case ('bold') {
            <strong class="inline-bold">@if (inline.children?.length) {<ng-container *ngTemplateOutlet="inlineRef; context: { $implicit: inline.children }" />} @else {{{ inline.content }}}</strong>
          }
          @case ('italic') {
            <em class="inline-italic">@if (inline.children?.length) {<ng-container *ngTemplateOutlet="inlineRef; context: { $implicit: inline.children }" />} @else {{{ inline.content }}}</em>
          }
          @case ('strikethrough') {
            <del class="inline-strikethrough">@if (inline.children?.length) {<ng-container *ngTemplateOutlet="inlineRef; context: { $implicit: inline.children }" />} @else {{{ inline.content }}}</del>
          }
          @case ('image') { <img [src]="inline.src" [alt]="inline.alt || inline.content" class="inline-image" /> }
          @case ('sup') { <sup>{{ inline.content }}</sup> }
          @case ('sub') { <sub>{{ inline.content }}</sub> }
          @case ('footnote-ref') { <sup class="footnote-ref"><a [href]="'#fn-' + inline.content">[{{ inline.content }}]</a></sup> }
          @default { <span>{{ inline.content }}</span> }
        }
      }
    </ng-template>

    @switch (block.level || 1) {
      @case (1) { <h1 [class]="headingClasses()">@if (block.children?.length) { <ng-container *ngTemplateOutlet="inlineRef; context: { $implicit: block.children }" /> } @else { {{ block.content }} }@if (!isComplete) { <span class="streaming-cursor"></span> }</h1> }
      @case (2) { <h2 [class]="headingClasses()">@if (block.children?.length) { <ng-container *ngTemplateOutlet="inlineRef; context: { $implicit: block.children }" /> } @else { {{ block.content }} }@if (!isComplete) { <span class="streaming-cursor"></span> }</h2> }
      @case (3) { <h3 [class]="headingClasses()">@if (block.children?.length) { <ng-container *ngTemplateOutlet="inlineRef; context: { $implicit: block.children }" /> } @else { {{ block.content }} }@if (!isComplete) { <span class="streaming-cursor"></span> }</h3> }
      @case (4) { <h4 [class]="headingClasses()">@if (block.children?.length) { <ng-container *ngTemplateOutlet="inlineRef; context: { $implicit: block.children }" /> } @else { {{ block.content }} }@if (!isComplete) { <span class="streaming-cursor"></span> }</h4> }
      @case (5) { <h5 [class]="headingClasses()">@if (block.children?.length) { <ng-container *ngTemplateOutlet="inlineRef; context: { $implicit: block.children }" /> } @else { {{ block.content }} }@if (!isComplete) { <span class="streaming-cursor"></span> }</h5> }
      @case (6) { <h6 [class]="headingClasses()">@if (block.children?.length) { <ng-container *ngTemplateOutlet="inlineRef; context: { $implicit: block.children }" /> } @else { {{ block.content }} }@if (!isComplete) { <span class="streaming-cursor"></span> }</h6> }
      @default { <h6 class="markdown-heading fallback">{{ block.content }}@if (!isComplete) { <span class="streaming-cursor"></span> }</h6> }
    }
  `,
  styleUrls: ['./heading.component.css']
})
export class MarkdownHeadingComponent implements OnChanges {
  @Input({ required: true }) block!: HeadingBlock;
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
