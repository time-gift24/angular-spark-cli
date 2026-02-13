/**
 * Combobox Separator Component
 *
 * Visual separator between combobox sections or groups.
 *
 * Usage:
 * <div spark-combobox-separator></div>
 */

import { Component, input, computed, ChangeDetectionStrategy } from '@angular/core';
import { cn } from '@app/shared';

@Component({
  selector: 'div[spark-combobox-separator]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'hostClass()',
    '[attr.data-slot]': '"combobox-separator"',
    '[attr.role]': '"separator"',
    '[attr.aria-orientation]': '"horizontal"',
  },
  template: '',
})
export class ComboboxSeparatorComponent {
  readonly class = input<string>('');

  protected readonly hostClass = computed(() => {
    return cn(
      '-mx-1',
      'my-1',
      'h-px',
      'bg-border/50',
      this.class()
    );
  });
}
