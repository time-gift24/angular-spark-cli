import {
  Component,
  input,
  computed,
  ChangeDetectionStrategy,
} from '@angular/core';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@app/shared';

/**
 * Textarea variants for InputGroupTextarea
 * Removes border, background, and ring for seamless integration
 */
const inputGroupTextareaVariants = cva(
  // Base styles - exact match with aim reference
  'rounded-none border-0 bg-transparent py-2 shadow-none ring-0 focus-visible:ring-0 aria-invalid:ring-0 dark:bg-transparent flex-1 resize-none',
  {
    variants: {},
    defaultVariants: {},
  }
);

export type InputGroupTextareaVariant = VariantProps<typeof inputGroupTextareaVariants>;

/**
 * InputGroupTextarea Component
 * Textarea element for input group (removes borders and rings for seamless integration)
 *
 * Features:
 * - data-slot="input-group-control" for group focus ring propagation
 * - No border, background, or individual ring styles
 * - Flex-1 to fill available space
 * - Transparent to blend with group background
 * - resize-none to prevent breaking layout
 *
 * Reference: .vendor/aim/components/ui/input-group.tsx
 */
@Component({
  selector: 'textarea[spark-input-group-textarea]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'computedClass()',
    '[attr.data-slot]': '"input-group-control"',
    '[attr.disabled]': 'disabled() ? "" : null',
    '[attr.placeholder]': 'placeholder()',
    '[attr.aria-invalid]': 'invalid()',
  },
  template: '',
})
export class InputGroupTextareaComponent {
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
  readonly class = input<string>('');

  /**
   * Computed class using CVA pattern
   * 1:1 aligned with aim reference implementation
   */
  protected computedClass = computed(() => {
    return cn(inputGroupTextareaVariants(), this.class());
  });
}
