import { Component, input, computed, ChangeDetectionStrategy } from '@angular/core';
import { cn } from '@app/shared';

export type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline' | 'ghost' | 'link';

@Component({
  selector: 'span[spark-badge], div[spark-badge]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'computedClass()',
    '[style]': 'badgeStyle()',
  },
  template: '<ng-content />',
})
export class BadgeComponent {
  readonly variant = input<BadgeVariant>('default');
  readonly class = input<string>('');

  /**
   * Computed style for badge padding using CSS tokens
   */
  protected badgeStyle = computed(() => `padding: var(--badge-padding-y) var(--badge-padding-x);`);

  /**
   * Base badge styles - Ultra compact with smooth transitions
   */
  private getBaseClasses(): string {
    return 'inline-flex items-center justify-center rounded-full border border-transparent text-xs font-medium w-fit whitespace-nowrap shrink-0 gap-1 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden';
  }

  /**
   * Variant styles using Tailwind v4 tokens
   */
  private getVariantClasses(): string {
    const variant = this.variant();

    const variantMap: Record<BadgeVariant, string> = {
      default: 'bg-primary text-primary-foreground [a&]:hover:bg-primary/90',
      secondary: 'bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90',
      destructive:
        'bg-destructive text-white [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60',
      outline:
        'border-border text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground',
      ghost: '[a&]:hover:bg-accent [a&]:hover:text-accent-foreground',
      link: 'text-primary underline-offset-4 [a&]:hover:underline',
    };

    return variantMap[variant] || variantMap.default;
  }

  /**
   * Computed class for the badge element
   */
  protected computedClass = computed(() => {
    return cn(this.getBaseClasses(), this.getVariantClasses(), this.class());
  });
}
