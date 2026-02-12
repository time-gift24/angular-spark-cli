/**
 * Progress Header Component
 *
 * Top navigation bar for Review Queue page.
 * Displays cycle name, current index/total, progress bar, and pass rate.
 *
 * @selector spk-progress-header
 * @standalone true
 */

import { Component, input, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Progress Header Component
 *
 * Shows review progress with cycle info and statistics.
 */
@Component({
  selector: 'spk-progress-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="progress-header">
      <!-- Left Section: Cycle Name + Position -->
      <div class="progress-header-left">
        <h1 class="progress-header-title">{{ cycleName() }}</h1>
        <span class="progress-header-position">{{ currentIndex() }} / {{ totalItems() }}</span>
      </div>

      <!-- Right Section: Statistics -->
      <div class="progress-header-stats">
        <!-- 已审核 Count -->
        <div class="progress-stat">
          <span class="progress-stat-label">已审核</span>
          <span class="progress-stat-value">{{ reviewedItems() }}</span>
        </div>

        <!-- 已接受 Count -->
        <div class="progress-stat">
          <span class="progress-stat-label">已接受</span>
          <span class="progress-stat-value">{{ acceptedItems() }}</span>
        </div>

        <!-- 通过率 -->
        <div class="progress-stat">
          <span class="progress-stat-label">通过率</span>
          <span class="progress-stat-value">{{ passRateDisplay() }}</span>
        </div>

        <!-- Progress Bar -->
        <div class="progress-bar-wrapper">
          <div class="progress-bar-bg">
            <div class="progress-bar-fill" [style.width.%]="progressBarValue()"></div>
          </div>
        </div>
      </div>
    </header>
  `,
  styles: `
    .progress-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--spacing-lg) var(--spacing-xl);
      border-bottom: 1px solid var(--border);
      background-color: var(--card);
      min-height: 3rem;
    }

    /* Left Section: Title + Position */
    .progress-header-left {
      display: flex;
      align-items: baseline;
      gap: var(--spacing-md);
      flex: 0 0 auto;
    }

    .progress-header-title {
      font-size: var(--font-size-base);
      font-weight: 600;
      color: var(--foreground);
    }

    .progress-header-position {
      font-size: var(--font-size-sm);
      color: var(--muted-foreground);
    }

    /* Right Section: Statistics */
    .progress-header-stats {
      display: flex;
      align-items: center;
      gap: var(--spacing-lg);
    }

    .progress-stat {
      display: flex;
      align-items: baseline;
      gap: var(--spacing-xs);
    }

    .progress-stat-label {
      font-size: var(--font-size-xs);
      color: var(--muted-foreground);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .progress-stat-value {
      font-size: var(--font-size-sm);
      font-weight: 500;
      color: var(--foreground);
    }

    .progress-bar-wrapper {
      display: flex;
      align-items: center;
    }

    .progress-bar-bg {
      width: 120px;
      height: 6px;
      background-color: var(--muted);
      border-radius: 999px;
      overflow: hidden;
    }

    .progress-bar-fill {
      height: 100%;
      background-color: var(--primary);
      border-radius: 999px;
      transition: width 150ms var(--ease-spring-smooth);
    }

    /* Responsive adjustments */
    @media (max-width: 768px) {
      .progress-header {
        flex-direction: column;
        align-items: flex-start;
        gap: var(--spacing-md);
      }

      .progress-header-stats {
        width: 100%;
        justify-content: space-between;
        flex-wrap: wrap;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block',
  },
})
export class ProgressHeaderComponent {
  /** Cycle/experiment name to display */
  readonly cycleName = input<string>('Review Queue');

  /** Current item index (1-based) */
  readonly currentIndex = input<number>(1);

  /** Total number of items */
  readonly totalItems = input<number>(0);

  /** Number of items reviewed */
  readonly reviewedItems = input<number>(0);

  /** Number of items accepted */
  readonly acceptedItems = input<number>(0);

  /** Pass rate from parent (0-100) */
  readonly passRate = input<number | null>(null);

  /** Internal progress bar value */
  readonly progressBarValue = computed(() => {
    const current = this.currentIndex();
    const total = this.totalItems();
    if (total === 0) return 0;
    return Math.round((current / total) * 100);
  });

  /**
   * Calculate pass rate display
   * Shows '--' when no items reviewed yet
   */
  readonly passRateDisplay = computed(() => {
    const rate = this.passRate();
    return rate === null ? '--' : `${rate}%`;
  });
}
