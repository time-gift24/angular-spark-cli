/**
 * Markdown List Component
 *
 * Renders ordered/unordered lists and nested markdown blocks.
 */

import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MarkdownBlock, ListBlock } from '../../core/models';
import { MarkdownBlockRouterComponent } from '../block-router/block-router.component';

@Component({
  selector: 'app-markdown-list',
  standalone: true,
  imports: [CommonModule, MarkdownBlockRouterComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (ordered) {
      <ol [class]="listClasses">
        @for (item of block.items; track trackItem($index, item)) {
          <li [class]="itemClasses">
            @if (isTextItem(item)) {
              {{ item }}
            } @else if (canNest) {
              <app-markdown-block-router
                [block]="item"
                [isComplete]="isComplete"
                [blockIndex]="resolveNestedIndex($index, item)"
                [enableLazyHighlight]="enableLazyHighlight"
                [allowHighlight]="allowHighlight"
                [depth]="depth + 1" />
            } @else {
              <span class="nested-fallback">[Nested content]</span>
            }
          </li>
        }
      </ol>
    } @else {
      <ul [class]="listClasses">
        @for (item of block.items; track trackItem($index, item)) {
          <li [class]="itemClasses">
            @if (isTextItem(item)) {
              {{ item }}
            } @else if (canNest) {
              <app-markdown-block-router
                [block]="item"
                [isComplete]="isComplete"
                [blockIndex]="resolveNestedIndex($index, item)"
                [enableLazyHighlight]="enableLazyHighlight"
                [allowHighlight]="allowHighlight"
                [depth]="depth + 1" />
            } @else {
              <span class="nested-fallback">[Nested content]</span>
            }
          </li>
        }
      </ul>
    }
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

  isTextItem(item: string | MarkdownBlock): item is string {
    return typeof item === 'string';
  }

  trackItem(index: number, item: string | MarkdownBlock): string {
    if (typeof item === 'string') {
      return `text-${index}-${item}`;
    }

    return item.id;
  }

  resolveNestedIndex(index: number, block: MarkdownBlock): number {
    if (typeof block.position === 'number' && block.position >= 0) {
      return block.position;
    }

    return index;
  }
}
