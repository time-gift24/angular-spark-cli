import { Component, computed, input, model, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Slider value type - array of numbers (for range slider support)
 */
export type SliderValue = number[];

/**
 * Slider orientation type
 */
export type SliderOrientation = 'horizontal' | 'vertical';

/**
 * Slider Component - Range slider input
 *
 * A customizable range slider using CSS variables for consistent sizing.
 * Supports two-way binding via Angular's model() signal.
 *
 * @selector ui-slider
 * @standalone true
 *
 * @example
 * ```html
 * <ui-slider [(value)]="sliderValue" [min]="0" [max]="100" />
 * ```
 */
@Component({
  selector: 'ui-slider',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  host: {
    '[class]': 'computedClass()',
  },
  templateUrl: './slider.html',
  styleUrl: './slider.css',
})
export class SliderComponent {
  readonly value = model<SliderValue>([50]);
  readonly min = input<number>(0);
  readonly max = input<number>(100);
  readonly step = input<number>(1);
  readonly disabled = input<boolean>(false);
  readonly class = input<string>('');

  /**
   * Base slider styles
   */
  private readonly baseClass = 'relative flex w-full touch-none select-none items-center';

  /**
   * Computed class string (base + custom classes)
   */
  protected computedClass = computed(() => {
    return `${this.baseClass} ${this.class()}`;
  });

  /**
   * Handle input change from native range input
   */
  protected onInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const newValue = parseFloat(input.value);
    this.value.set([newValue]);
    // valueChange is automatically emitted by model()
  }

  /**
   * Calculate track width percentage
   */
  protected getTrackWidth(): string {
    const [currentValue] = this.value();
    const minValue = this.min();
    const maxValue = this.max();
    const range = maxValue - minValue;
    const safeRange = Math.max(range, 1); // Prevent division by zero
    const percentage = ((currentValue - minValue) / safeRange) * 100;
    return `${percentage}%`;
  }

  /**
   * Calculate thumb position percentage
   */
  protected getThumbPosition(): string {
    const [currentValue] = this.value();
    const minValue = this.min();
    const maxValue = this.max();
    const range = maxValue - minValue;
    const safeRange = Math.max(range, 1); // Prevent division by zero
    const percentage = ((currentValue - minValue) / safeRange) * 100;
    return `${percentage}%`;
  }
}
