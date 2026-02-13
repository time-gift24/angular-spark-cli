import {
  Component,
  input,
  computed,
  ChangeDetectionStrategy,
} from '@angular/core';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@app/shared';
import { ButtonVariant } from '../button';

/**
 * InputGroupButton variants using class-variance-authority
 * Size variants for buttons within input group
 */
const inputGroupButtonVariants = cva(
  // Base styles - exact match with aim reference
  'gap-2 rounded-md text-xs/relaxed shadow-none flex items-center',
  {
    variants: {
      size: {
        xs: 'h-5 gap-1 rounded-[calc(var(--radius-sm)-2px)] px-1 [&>svg:not([class*="size-"])]:size-3',
        sm: '',
        'icon-xs': 'size-6 p-0 has-[>svg]:p-0',
        'icon-sm': 'size-8 p-0 has-[>svg]:p-0',
      },
    },
    defaultVariants: {
      size: 'xs',
    },
  }
);

export type InputGroupButtonSize = VariantProps<typeof inputGroupButtonVariants>['size'];

/**
 * InputGroupButton Component
 * Button component for input group (clear, submit, search, etc.)
 *
 * Features:
 * - Inherits ButtonVariant styles
 * - Smaller size options optimized for input group
 * - Negative margin for seamless integration with addon
 *
 * Reference: .vendor/aim/components/ui/input-group.tsx
 */
@Component({
  selector: 'button[spark-input-group-button]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'computedClass()',
    '[attr.data-slot]': '"input-group-button"',
    '[attr.data-size]': 'size()',
    '[attr.type]': 'type()',
  },
  template: '<ng-content />',
})
export class InputGroupButtonComponent {
  readonly type = input<'button' | 'submit' | 'reset'>('button');
  readonly variant = input<ButtonVariant>('ghost');
  readonly size = input<InputGroupButtonSize>('xs');
  readonly class = input<string>('');

  /**
   * Computed class using CVA pattern
   * 1:1 aligned with aim reference implementation
   */
  protected computedClass = computed(() => {
    return cn(inputGroupButtonVariants({ size: this.size() }), this.class());
  });
}
