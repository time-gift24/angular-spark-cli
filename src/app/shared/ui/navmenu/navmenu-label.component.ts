/**
 * Dropdown Menu Label Component
 *
 * Non-interactive label for grouping menu items.
 *
 * Usage:
 * <div spark-navmenu-label>Label</div>
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
  selector: 'div[spark-navmenu-label]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'hostClass()',
    '[attr.data-inset]': 'inset() ? "" : null',
  },
  template: `
    <ng-content />
  `,
})
export class NavMenuLabelComponent {
  readonly class = input<string>('');
  readonly inset = input<boolean>(false);

  protected readonly hostClass = computed(() => {
    return cn(
      'text-muted-foreground',
      'px-2',
      'py-1.5',
      'text-xs',
      'font-medium',
      this.inset() && 'pl-7.5',
      this.class()
    );
  });
}
