/**
 * Markdown Paragraph Component
 *
 * Renders markdown paragraphs with support for inline elements.
 * Supports plain text or formatted inline spans (bold, italic, code, strikethrough,
 * images, sup/sub, footnote refs). Inline elements can be nested recursively.
 *
 * Implements BlockRenderer interface for plugin architecture.
 */

import { Component, ChangeDetectionStrategy, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ParagraphBlock } from '../../core/models';
import { RenderMathPipe } from '../../core/math-render.pipe';

@Component({
  selector: 'app-markdown-paragraph',
  imports: [CommonModule, RenderMathPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p [class]="paragraphClasses()">
      @if (block().children?.length) {
        <ng-container *ngTemplateOutlet="inlineRef; context: { $implicit: block().children }" />
      } @else {
        {{ block().content }}
      }
      @if (!isComplete()) { <span class="streaming-cursor"></span> }
    </p>

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
          @case ('hard-break') { <br /> }
          @case ('image') { <img [src]="inline.src" [alt]="inline.alt || inline.content" class="inline-image" /> }
          @case ('bold') {
            <strong class="inline-bold">@if (inline.children?.length) {<ng-container *ngTemplateOutlet="inlineRef; context: { $implicit: inline.children }" />} @else {{{ inline.content }}}</strong>
          }
          @case ('italic') {
            <em class="inline-italic">@if (inline.children?.length) {<ng-container *ngTemplateOutlet="inlineRef; context: { $implicit: inline.children }" />} @else {{{ inline.content }}}</em>
          }
          @case ('strikethrough') {
            <del class="inline-strikethrough">@if (inline.children?.length) {<ng-container *ngTemplateOutlet="inlineRef; context: { $implicit: inline.children }" />} @else {{{ inline.content }}}</del>
          }
          @case ('sup') { <sup>{{ inline.content }}</sup> }
          @case ('sub') { <sub>{{ inline.content }}</sub> }
          @case ('footnote-ref') { <sup class="footnote-ref"><a [href]="'#fn-' + inline.content">[{{ inline.content }}]</a></sup> }
          @default { <span>{{ inline.content }}</span> }
        }
      }
    </ng-template>
  `,
  styleUrls: ['./paragraph.component.css']
})
export class MarkdownParagraphComponent {
  readonly block = input.required<ParagraphBlock>();
  readonly isComplete = input(true);

  protected readonly paragraphClasses = computed(() => {
    const baseClass = 'markdown-paragraph block-paragraph';
    const streamingClass = !this.isComplete() ? ' streaming' : '';
    return `${baseClass}${streamingClass}`;
  });
}
