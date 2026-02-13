/**
 * Dropdown Menu Separator Component
 *
 * Visual separator between menu items.
 *
 * Usage:
 * <div spark-dropdown-menu-separator></div>
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
  selector: 'div[spark-dropdown-menu-separator]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'hostClass()',
    '[attr.role]': '"separator"',
    '[attr.aria-orientation]': '"horizontal"',
  },
  template: ``
})
export class DropdownMenuSeparatorComponent {
  readonly class = input<string>('');

  protected readonly hostClass = computed(() => {
    return cn(
      'bg-border/50',
      '-mx-1',
      'my-1',
      'h-px',
      this.class()
    );
  });
}
