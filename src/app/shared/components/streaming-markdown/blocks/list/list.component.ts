/**
 * Markdown List Component
 *
 * Renders ordered and unordered lists with nested list support.
 *
 * Implements BlockRenderer interface for plugin architecture.
 * Retains an additional `depth` input for recursive indentation.
 */

import { Component, Input, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MarkdownBlock } from '../../core/models';

@Component({
  selector: 'app-markdown-list',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ul [class]="listClasses()" *ngIf="!ordered; else orderedList">
      @for (item of items; track item.id) {
        <li [class]="getItemClass()">
          {{ item.content }}
          @if (item.items && item.items.length > 0) {
            <app-markdown-list
              [block]="item"
              [isComplete]="isComplete"
              [depth]="depth + 1" />
          }
        </li>
      }
    </ul>

    <ng-template #orderedList>
      <ol [class]="listClasses()">
        @for (item of items; track item.id) {
          <li [class]="getItemClass()">
            {{ item.content }}
            @if (item.items && item.items.length > 0) {
              <app-markdown-list
                [block]="item"
                [isComplete]="isComplete"
                [depth]="depth + 1" />
            }
          </li>
        }
      </ol>
    </ng-template>
  `,
  styleUrls: ['./list.component.css']
})
export class MarkdownListComponent {
  @Input({ required: true }) block!: MarkdownBlock;
  @Input() isComplete: boolean = true;
  @Input() depth: number = 0;

  listClasses = signal<string>('markdown-list block-list');
  itemClass = 'list-item';

  get items(): MarkdownBlock[] {
    return this.block.items || [];
  }

  get ordered(): boolean {
    return this.block.subtype === 'ordered';
  }

  protected getItemClass(): string {
    return `${this.itemClass} depth-${this.depth}`;
  }
}
