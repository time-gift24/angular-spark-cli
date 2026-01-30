import { Component, input, computed, output, ChangeDetectionStrategy, ElementRef, inject } from '@angular/core';
import { cn } from '../../utils';

export type ButtonVariant = 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
export type ButtonSize = 'default' | 'sm' | 'lg' | 'icon';

@Component({
  selector: 'button[spark-button], a[spark-button]',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'computedClass()',
    '[style]': 'buttonStyle()',
    '[attr.disabled]': 'disabled() ? "" : null',
    '[attr.aria-disabled]': 'disabled()',
    '(click)': 'handleClick($event)',
  },
  template: `
    <ng-content />
  `,
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

  // eslint-disable-next-line @angular-eslint/no-output-native
  readonly click = output<MouseEvent>();

  /**
   * Base button styles - Ultra compact style with lighter weight
   */
  private getBaseClasses(): string {
    return 'inline-flex items-center justify-center gap-1 whitespace-nowrap rounded-md text-xs font-normal transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-3 [&_svg]:shrink-0';
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
   * Size styles - Ultra compact sizing using CSS variables
   */
  private getSizeClasses(): string {
    const size = this.size();

    const sizeMap: Record<ButtonSize, string> = {
      default: 'px-2.5 py-1.5',
      sm: 'px-2 py-1',
      lg: 'px-3 py-2',
      icon: 'w-7',
    };

    return sizeMap[size] || sizeMap.default;
  }

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

    // Don't emit click events on anchor tags - let the router handle navigation
    const nativeElement = this.elementRef.nativeElement as HTMLElement;
    if (nativeElement.tagName === 'A') {
      return;
    }

    this.click.emit(event);
  }
}
