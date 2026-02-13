/**
 * Dropdown Menu Group Component
 *
 * Groups related menu items together.
 *
 * Usage:
 * <div spark-dropdown-menu-group>
 *   <div spark-dropdown-menu-item>Item 1</div>
 *   <div spark-dropdown-menu-item>Item 2</div>
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
  selector: 'div[spark-dropdown-menu-group]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'hostClass()',
    '[attr.role]': '"group"',
  },
  template: `
    <ng-content />
  `,
})
export class DropdownMenuGroupComponent {
  readonly class = input<string>('');

  protected readonly hostClass = computed(() => {
    return cn(this.class());
  });
}
