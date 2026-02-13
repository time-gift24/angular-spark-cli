/**
 * Combobox List Component
 *
 * Container for combobox items.
 * Handles scrolling and empty state visibility.
 *
 * Usage:
 * <div spark-combobox-list>
 *   <div spark-combobox-item value="option1">Option 1</div>
 *   <div spark-combobox-empty>No results found</div>
 * </div>
 */

import {
  Component,
  input,
  computed,
  inject,
  ChangeDetectionStrategy,
} from '@angular/core';
import { cn } from '@app/shared';
import { COMBOBOX_ROOT, type ComboboxRootToken } from './combobox-root.component';

@Component({
  selector: 'div[spark-combobox-list]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'hostClass()',
    '[attr.role]': '"listbox"',
    '[attr.data-empty]': '!hasItems()',
  },
  template: '<ng-content />',
})
export class ComboboxListComponent {
  readonly root: ComboboxRootToken = inject(COMBOBOX_ROOT);

  readonly class = input<string>('');

  protected readonly hasItems = this.root.hasItems;

  protected readonly hostClass = computed(() => {
    return cn(
      // Base styles
      'max-h-[var(--combobox-list-max-height)]',
      'scroll-py-1',
      'p-1',
      // Overflow handling
      'overflow-y-auto',
      'overscroll-contain',
      // Empty state padding
      !this.hasItems() && 'p-0',
      !this.hasItems() && 'hidden',
      // Custom class
      this.class()
    );
  });
}
