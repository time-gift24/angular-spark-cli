import { Component, input, computed, output, ChangeDetectionStrategy } from '@angular/core';
import { cn } from '../../utils';

export type ButtonVariant = 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
export type ButtonSize = 'default' | 'sm' | 'lg' | 'icon';

@Component({
  selector: 'button[spark-button], a[spark-button]',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'computedClass()',
    '[attr.disabled]': 'disabled() ? "" : null',
    '[attr.aria-disabled]': 'disabled()',
    '(click)': 'handleClick($event)',
  },
  template: `
    <ng-content />
  `,
})
export class ButtonComponent {
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

  // eslint-disable-next-line @angular-eslint/no-output-native
  readonly click = output<MouseEvent>();

  /**
   * Base button styles - Mira compact style
   */
  private getBaseClasses(): string {
    return 'inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-3.5 [&_svg]:shrink-0';
  }

  /**
   * Variant styles using Tailwind v4 tokens
   */
  private getVariantClasses(): string {
    const variant = this.variant();

    const variantMap: Record<ButtonVariant, string> = {
      default: 'bg-primary text-primary-foreground hover:bg-primary/90',
      destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
      outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
      secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
      ghost: 'hover:bg-accent hover:text-accent-foreground',
      link: 'text-primary underline-offset-4 hover:underline',
    };

    return variantMap[variant] || variantMap.default;
  }

  /**
   * Size styles - Mira compact sizing
   */
  private getSizeClasses(): string {
    const size = this.size();

    const sizeMap: Record<ButtonSize, string> = {
      default: 'h-8 px-3 py-1.5',
      sm: 'h-7 rounded-md px-2.5',
      lg: 'h-9 rounded-md px-4',
      icon: 'h-8 w-8',
    };

    return sizeMap[size] || sizeMap.default;
  }

  /**
   * Computed class for the button element
   * Combines the base button styles with variant and size classes
   * Uses Angular computed() instead of class-variance-authority
   */
  protected computedClass = computed(() => {
    return cn(
      this.getBaseClasses(),
      this.getVariantClasses(),
      this.getSizeClasses(),
      this.class()
    );
  });

  protected handleClick(event: MouseEvent): void {
    if (this.disabled()) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    this.click.emit(event);
  }
}
