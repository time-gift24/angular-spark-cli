/**
 * Dropdown Menu Shortcut Component
 *
 * Displays keyboard shortcut text within a menu item.
 *
 * Usage:
 * <div spark-dropdown-menu-item>
 *   Item
 *   <span spark-dropdown-menu-shortcut>⌘K</span>
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

@Component({
  selector: 'span[spark-dropdown-menu-shortcut]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'hostClass()',
  },
  template: `
    <ng-content />
  `,
})
export class DropdownMenuShortcutComponent {
  readonly class = input<string>('');

  protected readonly hostClass = computed(() => {
    return cn(
      'text-muted-foreground',
      'ml-auto',
      'text-[0.625rem]',
      'tracking-widest',
      'group-focus/dropdown-menu-item:text-accent-foreground',
      this.class()
    );
  });
}
