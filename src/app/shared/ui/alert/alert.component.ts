import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  contentChildren,
  input,
  ViewEncapsulation,
} from '@angular/core';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/cn';

const alertVariants = cva(
  'relative w-full rounded-lg border px-4 py-3 text-sm grid has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] grid-cols-[0_1fr] has-[>svg]:gap-x-3 gap-y-0.5 items-start [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current',
  {
    variants: {
      variant: {
        default: 'bg-card text-card-foreground',
        destructive:
          'text-destructive bg-card [&>svg]:text-current *:data-[slot=alert-description]:text-destructive/90',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export type AlertVariant = VariantProps<typeof alertVariants>['variant'];

@Component({
  selector: 'ui-alert',
  standalone: true,
  template: `
    <div [class]="computedClass()" [attr.role]="role()">
      <ng-content />
    </div>
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AlertComponent {
  readonly class = input<string>('');
  readonly variant = input<AlertVariant>('default');
  readonly role = input<'alert' | 'status' | 'none'>('alert');

  protected computedClass = computed(() => {
    const variants = alertVariants({ variant: this.variant() });
    return cn(variants, this.class());
  });
}

@Component({
  selector: 'ui-alert-title',
  standalone: true,
  template: `
    <div [class]="computedClass()">
      <ng-content />
    </div>
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AlertTitleComponent {
  readonly class = input('');

  protected computedClass = computed(() => {
    return cn(
      'col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight',
      this.class()
    );
  });
}

@Component({
  selector: 'ui-alert-description',
  standalone: true,
  template: `
    <div [class]="computedClass()">
      <ng-content />
    </div>
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AlertDescriptionComponent {
  readonly class = input('');

  protected computedClass = computed(() => {
    return cn(
      'text-muted-foreground col-start-2 grid justify-items-start gap-1 text-sm [&_p]:leading-relaxed',
      this.class()
    );
  });
}
