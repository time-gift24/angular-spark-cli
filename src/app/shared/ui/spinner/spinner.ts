import {
  Component,
  computed,
  input,
  ChangeDetectionStrategy,
} from '@angular/core';
import { cn } from '@app/shared/utils';

/**
 * Spinner size variants
 * Maps to CSS variables in styles.css
 */
export type SpinnerSize = 'sm' | 'md' | 'lg' | 'xl';

/**
 * Spinner Component - Loading spinner with different sizes
 *
 * Displays a spinning loader indicator.
 * All sizes use CSS variables (--avatar-size-*) for consistency.
 *
 * @selector div[spark-spinner]
 * @standalone true
 *
 * @example
 * ```html
 * <div spark-spinner size="md"></div>
 * ```
 */
@Component({
  selector: 'div[spark-spinner]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'computedClass()',
    '[style]': 'spinnerStyle()',
    '[attr.role]': '"status"',
    '[attr.aria-label]': '"Loading..."',
  },
  template: `<ng-content />`,
})
export class SpinnerComponent {
  readonly size = input<SpinnerSize>('md');
  readonly class = input<string>('');

  /**
   * Size map using CSS variables from styles.css
   * Reuses avatar size tokens for consistency
   */
  private readonly sizeMap: Record<SpinnerSize, { width: string; height: string; borderWidth: string }> = {
    sm: {
      width: 'var(--avatar-size-sm)',
      height: 'var(--avatar-size-sm)',
      borderWidth: 'var(--spinner-border-width-sm)',
    },
    md: {
      width: 'var(--avatar-size-md)',
      height: 'var(--avatar-size-md)',
      borderWidth: 'var(--spinner-border-width-md)',
    },
    lg: {
      width: 'var(--avatar-size-lg)',
      height: 'var(--avatar-size-lg)',
      borderWidth: 'var(--spinner-border-width-md)',
    },
    xl: {
      width: 'var(--avatar-size-xl)',
      height: 'var(--avatar-size-xl)',
      borderWidth: 'var(--spinner-border-width-md)',
    },
  };

  /**
   * Base spinner styles
   */
  private readonly baseClass = 'animate-spin rounded-full border-transparent';

  /**
   * Computed class string (base + custom classes)
   */
  protected computedClass = computed(() => {
    return cn(
      this.baseClass,
      'border-t-current',
      'border-r-current',
      this.class()
    );
  });

  /**
   * Dynamic sizing using CSS variables from styles.css
   */
  protected spinnerStyle = computed(() => {
    const size = this.size();
    return {
      width: this.sizeMap[size].width,
      height: this.sizeMap[size].height,
      borderWidth: this.sizeMap[size].borderWidth,
      borderStyle: 'solid',
    };
  });
}
