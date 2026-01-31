import { Component, input, computed, ChangeDetectionStrategy } from '@angular/core';
import { cn } from '../../utils';

@Component({
  selector: 'div[spark-card]',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'computedClass()',
  },
  template: '<ng-content />',
})
export class CardComponent {
  readonly class = input<string>('');

  protected computedClass = computed(() => {
    return cn(
      'rounded-xl border bg-card text-card-foreground shadow',
      this.class()
    );
  });
}

@Component({
  selector: 'div[spark-card-header]',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'computedClass()',
    '[style]': 'headerPadding()',
  },
  template: '<ng-content />',
})
export class CardHeaderComponent {
  readonly class = input<string>('');

  protected computedClass = computed(() => {
    return cn(
      'flex flex-col space-y-1.5',
      this.class()
    );
  });

  protected headerPadding = computed(() => `padding: var(--card-padding);`);
}

@Component({
  selector: 'div[spark-card-title]',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'computedClass()',
  },
  template: '<ng-content />',
})
export class CardTitleComponent {
  readonly class = input<string>('');

  protected computedClass = computed(() => {
    return cn(
      'font-semibold leading-none tracking-tight',
      this.class()
    );
  });
}

@Component({
  selector: 'p[spark-card-description]',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'computedClass()',
  },
  template: '<ng-content />',
})
export class CardDescriptionComponent {
  readonly class = input<string>('');

  protected computedClass = computed(() => {
    return cn(
      'text-sm text-muted-foreground',
      this.class()
    );
  });
}

@Component({
  selector: 'div[spark-card-content]',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'computedClass()',
    '[style]': 'cardPadding()',
  },
  template: '<ng-content />',
})
export class CardContentComponent {
  readonly class = input<string>('');

  protected computedClass = computed(() => {
    return cn(
      this.class()
    );
  });

  protected cardPadding = computed(() => `padding: 0 var(--card-padding) var(--card-padding) var(--card-padding);`);
}

@Component({
  selector: 'div[spark-card-footer]',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'computedClass()',
    '[style]': 'cardFooterPadding()',
  },
  template: '<ng-content />',
})
export class CardFooterComponent {
  readonly class = input<string>('');

  protected computedClass = computed(() => {
    return cn(
      'flex items-center',
      this.class()
    );
  });

  protected cardFooterPadding = computed(() => `padding: 0 var(--card-padding) var(--card-padding) var(--card-padding);`);
}

export const CardComponents = [
  CardComponent,
  CardHeaderComponent,
  CardTitleComponent,
  CardDescriptionComponent,
  CardContentComponent,
  CardFooterComponent,
];
