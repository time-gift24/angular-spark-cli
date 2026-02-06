/**
 * Markdown Table Component
 *
 * Renders markdown tables with header, body rows, and column alignment.
 *
 * Implements BlockRenderer interface for plugin architecture.
 */

import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { MarkdownBlock } from '../../core/models';

@Component({
  selector: 'app-markdown-table',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="table-wrapper">
      <table class="markdown-table">
        <thead>
          <tr>
            @for (header of headers; track $index) {
              <th [style.text-align]="getAlign($index)">{{ header }}</th>
            }
          </tr>
        </thead>
        <tbody>
          @for (row of rows; track $index) {
            <tr>
              @for (cell of row; track $index) {
                <td [style.text-align]="getAlign($index)">{{ cell }}</td>
              }
            </tr>
          }
        </tbody>
      </table>
      @if (!isComplete) { <span class="streaming-cursor"></span> }
    </div>
  `,
  styleUrls: ['./table.component.css']
})
export class MarkdownTableComponent {
  @Input({ required: true }) block!: MarkdownBlock;
  @Input() isComplete: boolean = true;

  get headers(): string[] {
    return this.block.tableData?.headers || [];
  }

  get rows(): string[][] {
    return this.block.tableData?.rows || [];
  }

  get align(): (string | null)[] {
    return this.block.tableData?.align || [];
  }

  getAlign(index: number): string {
    const a = this.align[index];
    return a || 'left';
  }
}
