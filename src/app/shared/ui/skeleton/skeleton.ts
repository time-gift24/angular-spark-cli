import { Component, input, computed, ChangeDetectionStrategy } from '@angular/core';

/**
 * Skeleton size variants
 */
export type SkeletonSize = 'sm' | 'md' | 'lg' | 'full';

/**
 * Skeleton Component - Loading placeholder
 *
 * Displays a pulsing placeholder while content is loading.
 * Supports custom sizing with CSS variables.
 *
 * @selector ui-skeleton
 * @standalone true
 *
 * @example
 * ```html
 * <ui-skeleton size="md" [width]="'100%'" [height]="'20px'" />
 * ```
 */
@Component({
  selector: 'ui-skeleton',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'computedClass()',
    '[style]': 'skeletonStyle()',
  },
  templateUrl: './skeleton.html',
  styleUrl: './skeleton.css',
})
export class SkeletonComponent {
  readonly class = input<string>('');
  readonly size = input<SkeletonSize>('md');
  readonly width = input<string>('');
  readonly height = input<string>('');

  /**
   * Size presets using CSS variables
   */
  private readonly sizeMap: Record<SkeletonSize, { height: string; width: string }> = {
    sm: { height: '1.5rem', width: '4rem' },
    md: { height: '2rem', width: '8rem' },
    lg: { height: '2.5rem', width: '12rem' },
    full: { height: '100%', width: '100%' },
  };

  /**
   * Computed class string
   */
  protected computedClass = computed(() => {
    const baseClasses = 'animate-pulse rounded-md bg-muted';
    return `${baseClasses} ${this.class()}`.trim();
  });

  /**
   * Dynamic sizing using size presets or custom values
   */
  protected skeletonStyle = computed(() => {
    const customWidth = this.width();
    const customHeight = this.height();
    const size = this.size();

    // Custom values take precedence
    if (customWidth || customHeight) {
      return {
        width: customWidth || this.sizeMap[size].width,
        height: customHeight || this.sizeMap[size].height,
      };
    }

    // Use size preset
    return this.sizeMap[size];
  });
}
