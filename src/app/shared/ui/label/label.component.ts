import { Component, input, computed, ChangeDetectionStrategy } from '@angular/core';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@app/shared';

/**
 * Label variants using class-variance-authority
 */
const labelVariants = cva(
  'flex items-center gap-2 text-sm font-medium leading-none select-none peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
  {
    variants: {},
    defaultVariants: {},
  },
);

/**
 * Label type definition
 */
export type LabelVariant = VariantProps<typeof labelVariants>;

/**
 * Label Component - Form field label
 *
 * Accessible label component for form inputs.
 *
 * @selector label[spark-label]
 * @example
 * ```html
 * <label spark-label for="email">Email</label>
 * ```
 */
@Component({
  selector: 'label[spark-label]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'computedClass()',
  },
  template: '<ng-content />',
})
export class LabelComponent {
  readonly class = input<string>('');

  /**
   * Computed class using CVA pattern
   */
  protected computedClass = computed(() => {
    return cn(labelVariants(), this.class());
  });
}
