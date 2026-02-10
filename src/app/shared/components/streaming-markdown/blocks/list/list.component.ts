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
import { MarkdownBlock, ListBlock } from '../../core/models';

@Component({
  selector: 'app-markdown-list',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ul [class]="listClasses()" *ngIf="!ordered; else orderedList">
      @for (item of items; track $index) {
        <li [class]="getItemClass()">
          {{ item }}
        </li>
      }
    </ul>

    <ng-template #orderedList>
      <ol [class]="listClasses()">
        @for (item of items; track $index) {
          <li [class]="getItemClass()">
            {{ item }}
          </li>
        }
      </ol>
    </ng-template>
  `,
  styleUrls: ['./list.component.css']
})
export class MarkdownListComponent {
  @Input({ required: true }) block!: ListBlock;
  @Input() isComplete: boolean = true;
  @Input() depth: number = 0;

  listClasses = signal<string>('markdown-list block-list');
  itemClass = 'list-item';

  get items(): string[] {
    return this.block.items || [];
  }

  get ordered(): boolean {
    return this.block.subtype === 'ordered';
  }

  protected getItemClass(): string {
    return `${this.itemClass} depth-${this.depth}`;
  }
}
