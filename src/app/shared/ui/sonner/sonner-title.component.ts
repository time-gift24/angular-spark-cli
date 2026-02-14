import { Component, input, computed, ChangeDetectionStrategy } from '@angular/core';
import { cva, type VariantProps } from 'class-variance-authority';

const titleVariants = cva('text-sm font-semibold', {
  variants: {
    variant: {
      default: 'text-foreground',
      destructive: 'text-destructive',
      warning: 'text-warning',
      success: 'text-success',
      info: 'text-info',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

export type SonnerTitleVariant = VariantProps<typeof titleVariants>['variant'];

@Component({
  selector: 'sonner-title',
  template: `<ng-content />`,
  host: {
    '[class]': 'computedClass()',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SonnerTitleComponent {
  readonly variant = input<SonnerTitleVariant>('default');
  readonly class = input<string>('');

  protected computedClass = computed(() => {
    const base = titleVariants({ variant: this.variant() });
    return `${base} ${this.class()}`.trim();
  });
}
