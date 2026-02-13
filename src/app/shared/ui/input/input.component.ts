import { Component, input, computed, ChangeDetectionStrategy } from '@angular/core';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@app/shared';

/**
 * Input variants using class-variance-authority
 * Aligned 1:1 with aim reference implementation
 * Reference: .vendor/aim/components/ui/input.tsx
 */
const inputVariants = cva(
  // Base styles - exact match with aim reference
  'bg-input/20 dark:bg-input/30 border-input focus-visible:border-ring focus-visible:ring-ring/30 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:aria-invalid:border-destructive/50 h-7 rounded-md border px-2 py-0.5 text-sm transition-colors file:h-6 file:text-xs/relaxed file:font-medium focus-visible:ring-2 aria-invalid:ring-2 md:text-xs/relaxed file:text-foreground placeholder:text-muted-foreground w-full min-w-0 outline-none file:inline-flex file:border-0 file:bg-transparent disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {},
    defaultVariants: {},
  },
);

/**
 * Input type definition (for future extensibility)
 */
export type InputVariant = VariantProps<typeof inputVariants>;

@Component({
  selector: 'input[spark-input]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'computedClass()',
    '[attr.disabled]': 'disabled() ? "" : null',
    '[attr.data-slot]': '"input"',
  },
  template: '',
})
export class InputComponent {
  readonly type = input<string>('text');
  readonly class = input<string>('');
  readonly disabled = input<boolean, string | boolean>(false, {
    transform: (value: string | boolean) => {
      if (typeof value === 'string') {
        return value !== 'false';
      }
      return value;
    },
  });

  /**
   * Computed class using CVA pattern
   * 1:1 aligned with aim reference implementation
   *
   * Key styles from aim:
   * - h-7: height 1.75rem (28px)
   * - px-2 py-0.5: padding x 0.5rem, y 0.125rem
   * - bg-input/20 dark:bg-input/30: background with opacity
   * - border-input: border color from --input variable
   * - focus-visible:border-ring focus-visible:ring-ring/30 focus-visible:ring-2: focus ring
   * - aria-invalid:* states: destructive ring on invalid
   */
  protected computedClass = computed(() => {
    return cn(inputVariants(), this.class());
  });
}
