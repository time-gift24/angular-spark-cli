/**
 * Combobox Empty Component
 *
 * Displays a message when no items match the search filter.
 *
 * Usage:
 * <div spark-combobox-empty>No results found</div>
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
  selector: 'div[spark-combobox-empty]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'hostClass()',
    '[attr.role]': '"status"',
    '[attr.aria-live]': '"polite"',
  },
  template: '<ng-content />',
})
export class ComboboxEmptyComponent {
  readonly root: ComboboxRootToken = inject(COMBOBOX_ROOT);

  readonly class = input<string>('');

  // Only show when there are no items (after filtering)
  protected readonly shouldShow = computed(() => !this.root.hasItems());

  protected readonly hostClass = computed(() => {
    return cn(
      // Layout
      'flex',
      'w-full',
      'justify-center',
      'py-2',
      // Typography
      'text-center',
      'text-xs',
      'leading-relaxed',
      'text-muted-foreground',
      // Visibility - show when empty, hide otherwise
      !this.shouldShow() && 'hidden',
      this.shouldShow() && 'flex',
      // Custom class
      this.class()
    );
  });
}
