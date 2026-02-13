import {
  Component,
  input,
  computed,
  ChangeDetectionStrategy,
} from '@angular/core';
import { cn } from '@app/shared';

/**
 * InputGroup Component
 * Container for input group with addons, buttons, text, and input/textarea controls
 *
 * Features:
 * - role="group" for proper ARIA semantics
 * - Flex layout with proper focus ring propagation
 * - Support for inline and block alignment modes
 * - Border and ring styles aligned with mira tokens
 *
 * Reference: .vendor/aim/components/ui/input-group.tsx
 */
@Component({
  selector: 'div[spark-input-group]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'computedClass()',
    '[attr.data-slot]': '"input-group"',
    '[attr.role]': '"group"',
  },
  template: '<ng-content />',
})
export class InputGroupComponent {
  readonly class = input<string>('');

  /**
   * Computed class using CVA pattern
   * 1:1 aligned with aim reference implementation
   *
   * Key styles from aim:
   * - Flex layout: relative flex w-full min-w-0 items-center
   * - Height: h-7 (aligned with input height)
   * - Border: border-input bg-input/20 dark:bg-input/30
   * - Focus ring: has-[[data-slot=input-group-control]:focus-visible]:border-ring
   * - Invalid state: has-[[data-slot][aria-invalid=true]]:ring-destructive/20
   * - Rounded corners with support for block/inline alignment
   */
  protected computedClass = computed(() => {
    return cn(
      // Base styles - exact match with aim reference
      'border-input bg-input/20 dark:bg-input/30 h-7 rounded-md border transition-colors group/input-group relative flex w-full min-w-0 items-center outline-none',
      // Focus ring propagation to controls
      'has-[[data-slot=input-group-control]:focus-visible]:border-ring has-[[data-slot=input-group-control]:focus-visible]:ring-ring/30 has-[[data-slot=input-group-control]:focus-visible]:ring-2',
      // Invalid state propagation
      'has-[[data-slot][aria-invalid=true]]:ring-destructive/20 has-[[data-slot][aria-invalid=true]]:border-destructive dark:has-[[data-slot][aria-invalid=true]]:ring-destructive/40 has-[[data-slot][aria-invalid=true]]:ring-2',
      // Block alignment (vertical layout)
      'has-[>[data-align=block-end]]:h-auto has-[>[data-align=block-end]]:flex-col has-[>[data-align=block-end]]:rounded-md has-[>[data-align=block-end]]:[&>input]:pt-3 has-[>[data-align=block-end]]:[&>textarea]:pt-3',
      'has-[>[data-align=block-start]]:h-auto has-[>[data-align=block-start]]:flex-col has-[>[data-align=block-start]]:rounded-md has-[>[data-align=block-start]]:[&>input]:pb-3 has-[>[data-align=block-start]]:[&>textarea]:pb-3',
      // Textarea auto height
      'has-[textarea]:rounded-md has-[textarea]:h-auto',
      // Combobox focus handling
      'in-data-[slot=combobox-content]:focus-within:border-inherit in-data-[slot=combobox-content]:focus-within:ring-0',
      this.class()
    );
  });
}
