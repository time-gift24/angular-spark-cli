import {
  Component,
  input,
  computed,
  output,
  ChangeDetectionStrategy,
  ElementRef,
  inject,
} from '@angular/core';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@app/shared/utils';

/**
 * Button variants using class-variance-authority
 * Aligned with mira target from .vendor/aim/components/ui/button.tsx
 */
const buttonVariants = cva(
  // Base styles - mira style with proper focus/invalid semantics
  'focus-visible:border-ring focus-visible:ring-ring/30 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:aria-invalid:border-destructive/50 rounded-md border border-transparent bg-clip-padding text-xs/relaxed font-medium focus-visible:ring-2 aria-invalid:ring-2 [&_svg:not([class*="size-"])]:size-4 inline-flex items-center justify-center whitespace-nowrap transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none shrink-0 [&_svg]:shrink-0 outline-none group/button select-none',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/80',
        destructive: 'bg-destructive/10 hover:bg-destructive/20 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/20 text-destructive focus-visible:border-destructive/40 dark:hover:bg-destructive/30',
        outline: 'border-border dark:bg-input/30 hover:bg-input/50 hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 aria-expanded:bg-secondary aria-expanded:text-secondary-foreground',
        ghost: 'hover:bg-muted hover:text-foreground dark:hover:bg-muted/50 aria-expanded:bg-muted aria-expanded:text-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-7 gap-1 px-2 text-xs/relaxed has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*="size-"])]:size-3.5',
        xs: 'h-5 gap-1 rounded-sm px-2 text-[0.625rem] has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*="size-"])]:size-2.5',
        sm: 'h-6 gap-1 px-2 text-xs/relaxed has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*="size-"])]:size-3',
        lg: 'h-8 gap-1 px-2.5 text-xs/relaxed has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*="size-"])]:size-4',
        icon: 'size-7 [&_svg:not([class*="size-"])]:size-3.5',
        'icon-xs': 'size-5 rounded-sm [&_svg:not([class*="size-"])]:size-2.5',
        'icon-sm': 'size-6 [&_svg:not([class*="size-"])]:size-3',
        'icon-lg': 'size-8 [&_svg:not([class*="size-"])]:size-4',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

/**
 * Extract variant types from CVA definition
 */
export type ButtonVariant = VariantProps<typeof buttonVariants>['variant'];
export type ButtonSize = VariantProps<typeof buttonVariants>['size'];

@Component({
  selector: 'button[spark-button], a[spark-button]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'computedClass()',
    '[attr.data-variant]': 'variant()',
    '[attr.data-size]': 'size()',
    '[attr.data-slot]': '"button"',
    '[attr.disabled]': 'disabled() ? "" : null',
    '[attr.aria-disabled]': 'disabled()',
    '[attr.aria-invalid]': 'invalid()',
  },
  template: ` <ng-content /> `,
})
export class ButtonComponent {
  private readonly elementRef = inject(ElementRef);

  readonly variant = input<ButtonVariant>('default');
  readonly size = input<ButtonSize>('default');
  readonly class = input<string>('');
  readonly disabled = input<boolean, string | boolean>(false, {
    transform: (value: string | boolean) => {
      if (typeof value === 'string') {
        return value !== 'false';
      }
      return value;
    },
  });

  // Invalid state for form semantics
  readonly invalid = input<boolean, string | boolean>(false, {
    transform: (value: string | boolean) => {
      if (typeof value === 'string') {
        return value !== 'false';
      }
      return value;
    },
  });

  readonly clicked = output<MouseEvent>();

  /**
   * Computed class using CVA pattern
   * Centralizes variant and size logic in buttonVariants definition
   */
  protected computedClass = computed(() => {
    return cn(buttonVariants({ variant: this.variant(), size: this.size() }), this.class());
  });
}
