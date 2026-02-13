/**
 * Combobox Label Component
 *
 * Label for a combobox group.
 *
 * Usage:
 * <div spark-combobox-label>Fruits</div>
 */

import { Component, input, computed, ChangeDetectionStrategy } from '@angular/core';
import { cn } from '@app/shared';

@Component({
  selector: 'div[spark-combobox-label]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'hostClass()',
    '[attr.data-slot]': '"combobox-label"',
  },
  template: '<ng-content />',
})
export class ComboboxLabelComponent {
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
