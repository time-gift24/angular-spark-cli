/**
 * Combobox Group Component
 *
 * Groups related combobox items together with optional label.
 *
 * Usage:
 * <div spark-combobox-group>
 *   <div spark-combobox-label>Fruits</div>
 *   <div spark-combobox-item value="apple">Apple</div>
 *   <div spark-combobox-item value="banana">Banana</div>
 * </div>
 */

import { Component, input, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { cn } from '@app/shared';
import { COMBOBOX_ROOT, type ComboboxRootToken } from './combobox-root.component';

@Component({
  selector: 'div[spark-combobox-group]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'hostClass()',
    '[attr.role]': '"group"',
    '[attr.aria-labelledby]': 'labelId()',
  },
  template: '<ng-content />',
})
export class ComboboxGroupComponent {
  readonly root: ComboboxRootToken = inject(COMBOBOX_ROOT);

  readonly class = input<string>('');

  // Generate unique ID for accessibility
  readonly labelId = computed(() => {
    return `combobox-group-${Math.random().toString(36).substring(2, 9)}`;
  });

  protected readonly hostClass = computed(() => {
    return cn('p-1', this.class());
  });
}
