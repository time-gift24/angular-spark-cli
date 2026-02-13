import {
  Component,
  input,
  computed,
  ChangeDetectionStrategy,
  ElementRef,
  inject,
} from '@angular/core';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@app/shared';

/**
 * InputGroupAddon variants using class-variance-authority
 * Supports inline-start, inline-end, block-start, block-end alignments
 */
const inputGroupAddonVariants = cva(
  // Base styles - exact match with aim reference
  'text-muted-foreground h-auto gap-1 py-2 text-xs/relaxed font-medium flex cursor-text items-center justify-center select-none',
  {
    variants: {
      align: {
        'inline-start': 'pl-2 has-[>button]:ml-[-0.275rem] has-[>kbd]:ml-[-0.275rem] order-first',
        'inline-end': 'pr-2 has-[>button]:mr-[-0.275rem] has-[>kbd]:mr-[-0.275rem] order-last',
        'block-start': 'px-2 pt-2 group-has-[>input]/input-group:pt-2 [.border-b]:pb-2 order-first w-full justify-start',
        'block-end': 'px-2 pb-2 group-has-[>input]/input-group:pb-2 [.border-t]:pt-2 order-last w-full justify-start',
      },
    },
    defaultVariants: {
      align: 'inline-start',
    },
  }
);

export type InputGroupAddonAlign = VariantProps<typeof inputGroupAddonVariants>['align'];

/**
 * InputGroupAddon Component
 * Container for addons within input group (prefix/suffix text, icons, etc.)
 *
 * Features:
 * - role="group" for proper ARIA semantics
 * - Support for inline and block alignment modes
 * - Click to focus behavior: clicks on addon focus the input
 * - Disabled state propagation from parent group
 *
 * Reference: .vendor/aim/components/ui/input-group.tsx
 */
@Component({
  selector: 'div[spark-input-group-addon]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'computedClass()',
    '[attr.data-slot]': '"input-group-addon"',
    '[attr.data-align]': 'align()',
    '[attr.role]': '"group"',
    '[class.group-data-[disabled=true]/input-group:opacity-50]': 'true',
    '(click)': 'onClick($event)',
  },
  template: '<ng-content />',
})
export class InputGroupAddonComponent {
  private readonly elementRef = inject(ElementRef<HTMLElement>);

  readonly align = input<InputGroupAddonAlign>('inline-start');
  readonly class = input<string>('');

  /**
   * Computed class using CVA pattern
   * 1:1 aligned with aim reference implementation
   */
  protected computedClass = computed(() => {
    return cn(inputGroupAddonVariants({ align: this.align() }), this.class());
  });

  /**
   * Focus input when addon is clicked (unless clicking a button)
   * Matches aim reference behavior
   */
  onClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (target.closest('button')) {
      return;
    }
    // Find and focus the input in the parent group
    const parentGroup = this.elementRef.nativeElement.parentElement;
    const input = parentGroup?.querySelector('input') as HTMLInputElement | null;
    input?.focus();
  }
}
