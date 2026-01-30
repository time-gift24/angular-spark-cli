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
  },
  template: '<ng-content />',
})
export class CardHeaderComponent {
  readonly class = input<string>('');

  protected computedClass = computed(() => {
    return cn(
      'flex flex-col space-y-1.5 p-6',
      this.class()
    );
  });
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
  },
  template: '<ng-content />',
})
export class CardContentComponent {
  readonly class = input<string>('');

  protected computedClass = computed(() => {
    return cn(
      'p-6 pt-0',
      this.class()
    );
  });
}

@Component({
  selector: 'div[spark-card-footer]',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'computedClass()',
  },
  template: '<ng-content />',
})
export class CardFooterComponent {
  readonly class = input<string>('');

  protected computedClass = computed(() => {
    return cn(
      'flex items-center p-6 pt-0',
      this.class()
    );
  });
}

export const CardComponents = [
  CardComponent,
  CardHeaderComponent,
  CardTitleComponent,
  CardDescriptionComponent,
  CardContentComponent,
  CardFooterComponent,
];
