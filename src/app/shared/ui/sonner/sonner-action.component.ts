import { Component, input, computed, ChangeDetectionStrategy } from '@angular/core';
import { cva, type VariantProps } from 'class-variance-authority';

const actionVariants = cva(
  'inline-flex items-center justify-center rounded-md text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        warning: 'bg-warning text-warning-foreground hover:bg-warning/90',
        success: 'bg-success text-success-foreground hover:bg-success/90',
        info: 'bg-info text-info-foreground hover:bg-info/90',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export type SonnerActionVariant = VariantProps<typeof actionVariants>['variant'];

@Component({
  selector: 'button[sonner-action]',
  template: `<ng-content />`,
  host: {
    '[class]': 'computedClass()',
    '[attr.disabled]': 'disabled() ? "" : null',
  },
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SonnerActionComponent {
  readonly variant = input<SonnerActionVariant>('default');
  readonly class = input<string>('');
  readonly disabled = input<boolean>(false);

  protected computedClass = computed(() => {
    const base = actionVariants({ variant: this.variant() });
    return `${base} ${this.class()}`.trim();
  });
}
