import { Component, input, computed, ChangeDetectionStrategy } from '@angular/core';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@app/shared';

/**
 * Card variants using class-variance-authority
 * Aligned with aim reference implementation
 * Reference: .vendor/aim/components/ui/card.tsx
 */
const cardVariants = cva(
  'ring-foreground/10 bg-card text-card-foreground gap-4 overflow-hidden rounded-lg py-4 text-xs/relaxed ring-1 has-[>img:first-child]:pt-0 data-[size=sm]:gap-3 data-[size=sm]:py-3 *:[img:first-child]:rounded-t-lg *:[img:last-child]:rounded-b-lg group/card flex flex-col',
  {
    variants: {
      size: {
        default: '',
        sm: '',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  },
);

export type CardSize = VariantProps<typeof cardVariants>['size'];

@Component({
  selector: 'div[spark-card]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'computedClass()',
    '[attr.data-slot]': '"card"',
    '[attr.data-size]': 'size()',
  },
  template: '<ng-content />',
})
export class CardComponent {
  readonly size = input<CardSize>('default');
  readonly class = input<string>('');

  protected computedClass = computed(() => {
    return cn(cardVariants({ size: this.size() }), this.class());
  });
}

@Component({
  selector: 'div[spark-card-header]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'computedClass()',
    '[attr.data-slot]': '"card-header"',
  },
  template: '<ng-content />',
})
export class CardHeaderComponent {
  readonly class = input<string>('');

  protected computedClass = computed(() => {
    return cn(
      'group/card-header gap-1 rounded-t-lg px-4 group-data-[size=sm]/card:px-3 [.border-b]:pb-4 group-data-[size=sm]/card:[.border-b]:pb-3 @container/card-header grid auto-rows-min items-start has-data-[slot=card-action]:grid-cols-[1fr_auto] has-data-[slot=card-description]:grid-rows-[auto_auto]',
      this.class(),
    );
  });
}

@Component({
  selector: 'div[spark-card-title]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'computedClass()',
    '[attr.data-slot]': '"card-title"',
  },
  template: '<ng-content />',
})
export class CardTitleComponent {
  readonly class = input<string>('');

  protected computedClass = computed(() => {
    return cn('text-sm font-medium', this.class());
  });
}

@Component({
  selector: 'div[spark-card-description]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'computedClass()',
    '[attr.data-slot]': '"card-description"',
  },
  template: '<ng-content />',
})
export class CardDescriptionComponent {
  readonly class = input<string>('');

  protected computedClass = computed(() => {
    return cn('text-muted-foreground text-xs/relaxed', this.class());
  });
}

@Component({
  selector: 'div[spark-card-action]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'computedClass()',
    '[attr.data-slot]': '"card-action"',
  },
  template: '<ng-content />',
})
export class CardActionComponent {
  readonly class = input<string>('');

  protected computedClass = computed(() => {
    return cn('col-start-2 row-span-2 row-start-1 self-start justify-self-end', this.class());
  });
}

@Component({
  selector: 'div[spark-card-content]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'computedClass()',
    '[attr.data-slot]': '"card-content"',
  },
  template: '<ng-content />',
})
export class CardContentComponent {
  readonly class = input<string>('');

  protected computedClass = computed(() => {
    return cn('px-4 group-data-[size=sm]/card:px-3', this.class());
  });
}

@Component({
  selector: 'div[spark-card-footer]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'computedClass()',
    '[attr.data-slot]': '"card-footer"',
  },
  template: '<ng-content />',
})
export class CardFooterComponent {
  readonly class = input<string>('');

  protected computedClass = computed(() => {
    return cn('rounded-b-lg px-4 group-data-[size=sm]/card:px-3 [.border-t]:pt-4 group-data-[size=sm]/card:[.border-t]:pt-3 flex items-center', this.class());
  });
}

export const CardComponents = [
  CardComponent,
  CardHeaderComponent,
  CardTitleComponent,
  CardDescriptionComponent,
  CardActionComponent,
  CardContentComponent,
  CardFooterComponent,
];
