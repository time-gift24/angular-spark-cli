/**
 * Markdown List Component
 *
 * Renders ordered and unordered lists with nested list support.
 * Phase 3 - Component Implementation
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
              [items]="item.items"
              [ordered]="false"
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
                [items]="item.items"
                [ordered]="true"
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
  @Input({ required: true }) items!: MarkdownBlock[];
  @Input() ordered: boolean = false;
  @Input() depth: number = 0;

  listClasses = signal<string>('markdown-list block-list');
  itemClass = 'list-item';

  protected getItemClass(): string {
    return `${this.itemClass} depth-${this.depth}`;
  }
}
