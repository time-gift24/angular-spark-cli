import {
  Component,
  input,
  computed,
  ChangeDetectionStrategy,
} from '@angular/core';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@app/shared';

/**
 * Input variants for InputGroupInput
 * Removes border, background, and ring for seamless integration
 */
const inputGroupInputVariants = cva(
  // Base styles - exact match with aim reference
  'rounded-none border-0 bg-transparent shadow-none ring-0 focus-visible:ring-0 aria-invalid:ring-0 dark:bg-transparent flex-1',
  {
    variants: {},
    defaultVariants: {},
  }
);

export type InputGroupInputVariant = VariantProps<typeof inputGroupInputVariants>;

/**
 * InputGroupInput Component
 * Input element for input group (removes borders and rings for seamless integration)
 *
 * Features:
 * - data-slot="input-group-control" for group focus ring propagation
 * - No border, background, or individual ring styles
 * - Flex-1 to fill available space
 * - Transparent to blend with group background
 *
 * Reference: .vendor/aim/components/ui/input-group.tsx
 */
@Component({
  selector: 'input[spark-input-group-input]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'computedClass()',
    '[attr.data-slot]': '"input-group-control"',
    '[attr.type]': 'type()',
    '[attr.disabled]': 'disabled() ? "" : null',
    '[attr.placeholder]': 'placeholder()',
    '[attr.aria-invalid]': 'invalid()',
    '[attr.value]': 'value()',
  },
  template: '',
})
export class InputGroupInputComponent {
  readonly type = input<'text' | 'email' | 'number' | 'password' | 'search' | 'tel' | 'url'>('text');
  readonly disabled = input<boolean, string | boolean>(false, {
    transform: (value: string | boolean) => {
      if (typeof value === 'string') {
        return value !== 'false';
      }
      return value;
    },
  });
  readonly placeholder = input<string>('');
  readonly invalid = input<boolean, string | boolean>(false, {
    transform: (value: string | boolean) => {
      if (typeof value === 'string') {
        return value !== 'false';
      }
      return value;
    },
  });
  readonly value = input<string>('');
  readonly class = input<string>('');

  /**
   * Computed class using CVA pattern
   * 1:1 aligned with aim reference implementation
   */
  protected computedClass = computed(() => {
    return cn(inputGroupInputVariants(), this.class());
  });
}
