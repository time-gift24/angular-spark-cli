import { Component, input, computed, ChangeDetectionStrategy } from '@angular/core';
import { cn } from '@app/shared';

@Component({
  selector: 'div[spark-select-label]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'hostClass()',
    '[attr.data-slot]': '"select-label"',
  },
  template: '<ng-content />',
})
export class SelectLabelComponent {
  readonly class = input<string>('');

  protected readonly hostClass = computed(() => {
    return cn(
      'px-2',
      'py-1.5',
      'text-xs',
      'font-medium',
      'text-muted-foreground',
      this.class()
    );
  });
}
