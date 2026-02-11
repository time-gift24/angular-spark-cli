/**
 * Markdown List Component
 *
 * Renders ordered/unordered lists and nested markdown blocks.
 */

import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MarkdownBlock, ListBlock, MarkdownInline } from '../../core/models';
import { MarkdownBlockRouterComponent } from '../block-router/block-router.component';
import { RenderMathPipe } from '../../core/math-render.pipe';

@Component({
  selector: 'app-markdown-list',
  standalone: true,
  imports: [CommonModule, MarkdownBlockRouterComponent, RenderMathPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (ordered) {
      <ol [class]="listClasses">
        <ng-container *ngTemplateOutlet="itemRef; context: { $implicit: block.items }" />
      </ol>
    } @else {
      <ul [class]="listClasses">
        <ng-container *ngTemplateOutlet="itemRef; context: { $implicit: block.items }" />
      </ul>
    }

    <ng-template #itemRef let-items>
      @for (item of items; track item.id; let itemIndex = $index) {
        <li [class]="itemClasses">
          <div class="list-item-body">
            @if (item.task) {
              <input
                type="checkbox"
                class="task-checkbox"
                [checked]="item.checked"
                [attr.aria-label]="item.checked ? 'Completed task item' : 'Incomplete task item'"
                disabled />
            }

            <span class="list-item-content">
              @if (hasInlineContent(item.children)) {
                <ng-container *ngTemplateOutlet="inlineRef; context: { $implicit: item.children }" />
              } @else {
                {{ item.content }}
              }
            </span>
          </div>

          @if (item.blocks && item.blocks.length > 0) {
            <div class="list-item-nested">
              @for (nestedBlock of item.blocks; track trackNestedBlock($index, nestedBlock)) {
                @if (canNest) {
                  <app-markdown-block-router
                    [block]="nestedBlock"
                    [isComplete]="isComplete"
                    [blockIndex]="resolveNestedIndex(itemIndex, $index, nestedBlock)"
                    [enableLazyHighlight]="enableLazyHighlight"
                    [allowHighlight]="allowHighlight"
                    [depth]="depth + 1" />
                } @else {
                  <span class="nested-fallback">[Nested content]</span>
                }
              }
            </div>
          }
        </li>
      }
    </ng-template>

    <ng-template #inlineRef let-inlines>
      @for (inline of inlines; track $index) {
        @switch (inline.type) {
          @case ('link') {
            <a [href]="inline.href" class="inline-link" target="_blank" rel="noopener">
              @if (inline.children?.length) {
                <ng-container *ngTemplateOutlet="inlineRef; context: { $implicit: inline.children }" />
              } @else {
                {{ inline.content }}
              }
            </a>
          }
          @case ('code') { <code class="inline-code">{{ inline.content }}</code> }
          @case ('math') {
            <span class="inline-math" [class.block-math]="inline.displayMode" [innerHTML]="inline.content | renderMath : inline.displayMode"></span>
          }
          @case ('hard-break') { <br /> }
          @case ('image') { <img [src]="inline.src" [alt]="inline.alt || inline.content" class="inline-image" /> }
          @case ('bold') {
            <strong class="inline-bold">
              @if (inline.children?.length) {
                <ng-container *ngTemplateOutlet="inlineRef; context: { $implicit: inline.children }" />
              } @else {
                {{ inline.content }}
              }
            </strong>
          }
          @case ('italic') {
            <em class="inline-italic">
              @if (inline.children?.length) {
                <ng-container *ngTemplateOutlet="inlineRef; context: { $implicit: inline.children }" />
              } @else {
                {{ inline.content }}
              }
            </em>
          }
          @case ('strikethrough') {
            <del class="inline-strikethrough">
              @if (inline.children?.length) {
                <ng-container *ngTemplateOutlet="inlineRef; context: { $implicit: inline.children }" />
              } @else {
                {{ inline.content }}
              }
            </del>
          }
          @case ('sup') { <sup>{{ inline.content }}</sup> }
          @case ('sub') { <sub>{{ inline.content }}</sub> }
          @case ('footnote-ref') { <sup class="footnote-ref"><a [href]="'#fn-' + inline.content">[{{ inline.content }}]</a></sup> }
          @default { <span>{{ inline.content }}</span> }
        }
      }
    </ng-template>
  `,
  styleUrls: ['./list.component.css']
})
export class MarkdownListComponent {
  @Input({ required: true }) block!: ListBlock;
  @Input() isComplete = true;
  @Input() blockIndex = -1;
  @Input() enableLazyHighlight = false;
  @Input() allowHighlight = true;
  @Input() depth = 0;
  @Input() canNest = false;

  get ordered(): boolean {
    return this.block.subtype === 'ordered';
  }

  get listClasses(): string {
    return `markdown-list block-list depth-${this.depth}`;
  }

  get itemClasses(): string {
    return `list-item depth-${this.depth}`;
  }

  hasInlineContent(children: MarkdownInline[] | undefined): children is MarkdownInline[] {
    return !!children && children.length > 0;
  }

  trackNestedBlock(index: number, block: MarkdownBlock): string {
    return block.id || `nested-${index}`;
  }

  resolveNestedIndex(itemIndex: number, nestedIndex: number, block: MarkdownBlock): number {
    if (typeof block.position === 'number' && block.position >= 0) {
      return block.position;
    }

    return itemIndex + nestedIndex;
  }
}
