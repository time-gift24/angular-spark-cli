/**
 * Queue List Component
 *
 * Left sidebar panel showing all review queue items.
 * Highlights the currently selected item.
 * Displays decision status with colored indicators.
 *
 * @selector spk-queue-list
 * @standalone true
 */

import { Component, computed, input, output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { ReviewItemVM, SystemConclusion } from '@app/features/review-queue/models';

/**
 * Queue List Component
 *
 * Shows a scrollable list of review items with:
 * - Item query/response preview
 * - Decision status indicator
 * - System conclusion badge
 * - Selection highlighting
 */
@Component({
  selector: 'spk-queue-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <aside class="queue-list">
      <div class="queue-header">
        <h2 class="queue-header-title">队列项目</h2>
        <span class="queue-header-count">{{ currentIndex() }} / {{ totalItems() }}</span>
      </div>

      <div class="queue-list-container">
        @for (item of items(); track item.itemId) {
          <button
            class="queue-item"
            [class.selected]="item.itemId === selectedItemId()"
            [class.has-decision]="item.decision !== undefined"
            (click)="selectItem(item.itemId)"
            [attr.data-decision]="item.decision"
            [attr.data-conclusion]="item.systemConclusion"
          >
            <!-- Decision Status Indicator -->
            <div class="queue-item-status">
              @switch (item.decision) {
                @case ('accept') {
                  <div class="status-dot status-accept"></div>
                }
                @case ('reject') {
                  <div class="status-dot status-reject"></div>
                }
                @case ('hold') {
                  <div class="status-dot status-hold"></div>
                }
                @case ('skipped') {
                  <div class="status-dot status-skipped"></div>
                }
              }
              @if (!item.decision) {
                <div class="status-dot status-pending"></div>
              }
            </div>

            <!-- Content Preview -->
            <div class="queue-item-content">
              <p class="queue-item-title">{{ item.originalDoc.title }}</p>
              @if (item.currentSegment) {
                <p class="queue-item-segment">段落 {{ item.currentSegment.segmentIndex }}</p>
              }
            </div>

            <!-- System Conclusion Badge -->
            @if (item.systemConclusion) {
              <span class="queue-item-badge" [class]="getConclusionBadgeClass(item.systemConclusion)">
                {{ item.systemConclusion }}
              </span>
            }
          </button>
        }
      </div>
    </aside>

    <!-- Empty State -->
    @if (items().length === 0) {
      <div class="queue-list-empty">
        <p class="text-muted-foreground text-sm">No items in queue</p>
      </div>
    }
  `,
  styles: `
    .queue-list {
      display: flex;
      flex-direction: column;
      height: 100%;
      overflow: hidden;
    }

    .queue-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--spacing-lg) var(--spacing-md);
      border-bottom: 1px solid var(--border);
      background-color: var(--card);
      min-height: 3rem;
    }

    .queue-header-title {
      font-size: var(--font-size-sm);
      font-weight: 600;
      color: var(--foreground);
    }

    .queue-header-count {
      font-size: var(--font-size-xs);
      color: var(--muted-foreground);
    }

    .queue-list-container {
      flex: 1;
      overflow-y: auto;
    }

    .queue-list-empty {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      padding: var(--spacing-xl);
    }

    .queue-item {
      display: flex;
      align-items: flex-start;
      gap: var(--spacing-md);
      padding: var(--spacing-md);
      border-radius: var(--radius-md);
      border: 1px solid var(--border);
      background-color: var(--background);
      cursor: pointer;
      transition: all 150ms var(--ease-spring-smooth);
      margin-bottom: var(--spacing-sm);
    }

    .queue-item:hover {
      background-color: var(--muted);
    }

    .queue-item.selected {
      background-color: var(--accent);
      border-color: var(--accent);
    }

    .queue-item.has-decision {
      border-left: 3px solid transparent;
    }

    /* Decision Status Styles */
    .queue-item-status {
      flex-shrink: 0;
    }

    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 999px;
    }

    .status-accept {
      background-color: oklch(0.7 0.15 145);
    }

    .status-reject {
      background-color: oklch(0.6 0.2 290);
    }

    .status-hold {
      background-color: oklch(0.85 0.15 180);
    }

    .status-skipped {
      background-color: oklch(0.6 0.05 90);
      opacity: 0.5;
    }

    .status-pending {
      background-color: oklch(0.6 0.05 90);
      opacity: 0.3;
    }

    /* Content Preview Styles */
    .queue-item-content {
      flex: 1;
      min-width: 0;
    }

    .queue-item-title {
      font-size: var(--font-size-sm);
      font-weight: 500;
      color: var(--foreground);
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-line-clamp: 1;
      -webkit-box-orient: vertical;
      margin-bottom: var(--spacing-xs);
    }

    .queue-item-segment {
      font-size: var(--font-size-xs);
      color: var(--muted-foreground);
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-line-clamp: 1;
      -webkit-box-orient: vertical;
    }

    /* Badge Styles */
    .queue-item-badge {
      font-size: var(--font-size-xs);
      padding: 2px 6px;
      border-radius: 999px;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .queue-item-badge.pass {
      background-color: oklch(0.9 0.05 145);
      color: oklch(0.2 0.1 145);
    }

    .queue-item-badge.fail {
      background-color: oklch(0.55 0.2 10);
      color: oklch(0.15 0.05 10);
    }

    .queue-item-badge.risk {
      background-color: oklch(0.75 0.15 60);
      color: oklch(0.25 0.1 30);
    }

    /* Responsive */
    @media (max-width: 768px) {
      .queue-list-container {
        padding: var(--spacing-md);
      }

      .queue-item {
        padding: var(--spacing-sm);
      }

      .queue-item-query {
        font-size: var(--font-size-xs);
      }

      .queue-item-response {
        display: none;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block',
  },
})
export class QueueListComponent {
  /** List of review items to display */
  readonly items = input<ReviewItemVM[]>([]);

  /** Currently selected item ID */
  readonly selectedItemId = input<string | null>(null);

  /** Current index (1-based) for display */
  readonly currentIndex = input<number>(1);

  /** Total items count */
  readonly totalItems = input<number>(0);

  /** Event emitted when an item is selected */
  readonly itemSelected = output<string>();

  /**
   * Handle item selection
   */
  selectItem(itemId: string): void {
    this.itemSelected.emit(itemId);
  }

  /**
   * Get CSS class for system conclusion badge
   */
  protected getConclusionBadgeClass(conclusion: SystemConclusion): string {
    switch (conclusion) {
      case 'pass':
        return 'queue-item-badge pass';
      case 'fail':
        return 'queue-item-badge fail';
      case 'risk':
        return 'queue-item-badge risk';
      default:
        return '';
    }
  }
}
