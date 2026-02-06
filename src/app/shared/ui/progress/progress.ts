import { Component, computed, input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Progress Component - Progress bar indicator
 *
 * Displays a horizontal progress bar with percentage calculation.
 * Height uses CSS variables for consistent theming.
 *
 * @selector ui-progress
 * @standalone true
 *
 * @example
 * ```html
 * <ui-progress [value]="50" [max]="100" />
 * ```
 */
@Component({
  selector: 'ui-progress',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  host: {
    '[class]': 'computedClass()',
    '[style]': 'progressStyle()',
    '[attr.aria-valuenow]': 'value()',
    '[attr.aria-valuemin]': '0',
    '[attr.aria-valuemax]': 'max()',
    role: 'progressbar',
  },
  templateUrl: './progress.html',
  styleUrl: './progress.css',
})
export class ProgressComponent {
  readonly value = input<number>(0);
  readonly max = input<number>(100);
  readonly class = input<string>('');

  /**
   * Calculate percentage (0-100)
   */
  protected percentage = computed(() => {
    const val = this.value();
    const maximum = this.max();
    const safeMax = Math.max(maximum, 1); // Prevent division by zero
    return Math.min(Math.max((val / safeMax) * 100, 0), 100);
  });

  /**
   * Base progress bar styles
   */
  private readonly baseClass = 'relative w-full overflow-hidden rounded-full bg-secondary';

  /**
   * Computed class string (base + custom classes)
   */
  protected computedClass = computed(() => {
    return `${this.baseClass} ${this.class()}`;
  });

  /**
   * Dynamic height using CSS variable from styles.css
   */
  protected progressStyle = computed(() => {
    return {
      height: 'var(--progress-height)',
    };
  });
}
