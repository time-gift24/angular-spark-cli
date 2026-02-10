/**
 * Markdown Table Component
 *
 * Renders markdown tables with header, body rows, column alignment.
 * Includes toolbar with Copy CSV and Download CSV buttons.
 *
 * Implements BlockRenderer interface for plugin architecture.
 */

import { Component, Input, signal, ChangeDetectionStrategy } from '@angular/core';
import { MarkdownBlock, TableBlock } from '../../core/models';

@Component({
  selector: 'app-markdown-table',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="table-wrapper">
      @if (isComplete) {
        <div class="table-toolbar">
          <button
            class="table-action-button"
            (click)="copyAsCSV()"
            [title]="csvCopied() ? 'Copied!' : 'Copy as CSV'"
            [class.copied]="csvCopied()">
            @if (!csvCopied()) {
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
            } @else {
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            }
            <span>CSV</span>
          </button>
          <button
            class="table-action-button"
            (click)="downloadAsCSV()"
            title="Download as CSV">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            <span>CSV</span>
          </button>
        </div>
      }
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
  @Input({ required: true }) block!: TableBlock;
  @Input() isComplete: boolean = true;

  csvCopied = signal<boolean>(false);

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

  async copyAsCSV(): Promise<void> {
    try {
      const csv = this.toCSV();
      await navigator.clipboard.writeText(csv);
      this.csvCopied.set(true);
      setTimeout(() => this.csvCopied.set(false), 2000);
    } catch (error) {
      console.error('[MarkdownTableComponent] Failed to copy CSV:', error);
    }
  }

  downloadAsCSV(): void {
    const csv = this.toCSV();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'table.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  private toCSV(): string {
    const escape = (cell: string) => {
      if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
        return `"${cell.replace(/"/g, '""')}"`;
      }
      return cell;
    };
    const headerLine = this.headers.map(escape).join(',');
    const bodyLines = this.rows.map(row => row.map(escape).join(','));
    return [headerLine, ...bodyLines].join('\n');
  }
}
