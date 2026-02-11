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
 * Centralizes all button style variants in one definition
 */
const buttonVariants = cva(
  // Base styles - Ultra compact style with lighter weight
  'inline-flex items-center justify-center gap-1 whitespace-nowrap rounded-md text-xs font-normal transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-3 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'px-2.5 py-1.5',
        sm: 'px-2 py-1',
        lg: 'px-3 py-2',
        icon: 'w-7',
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
    '[style]': 'buttonStyle()',
    '[attr.disabled]': 'disabled() ? "" : null',
    '[attr.aria-disabled]': 'disabled()',
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

  readonly clicked = output<MouseEvent>();

  /**
   * Dynamic sizing styles using CSS variables from styles.css
   */
  protected buttonStyle = computed(() => {
    const size = this.size();
    const style: Record<string, string> = {};

    // Use CSS variables for consistent sizing
    switch (size) {
      case 'sm':
        style['height'] = 'var(--button-height-sm)';
        break;
      case 'lg':
        style['height'] = 'var(--button-height-lg)';
        break;
      case 'icon':
        style['height'] = 'var(--button-height-md)';
        style['width'] = 'var(--button-height-md)';
        break;
      default:
        style['height'] = 'var(--button-height-md)';
    }

    return style;
  });

  /**
   * Computed class using CVA pattern
   * Centralizes variant and size logic in buttonVariants definition
   */
  protected computedClass = computed(() => {
    return cn(buttonVariants({ variant: this.variant(), size: this.size() }), this.class());
  });
}
