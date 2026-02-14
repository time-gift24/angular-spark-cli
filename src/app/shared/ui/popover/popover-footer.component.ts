/**
 * Popover Footer Component
 *
 * Footer section for popover content (typically for action buttons).
 *
 * Usage:
 * <div spark-popover-footer>
 *   <ng-content />
 * </div>
 */

import {
  Component,
  computed,
  ChangeDetectionStrategy,
} from '@angular/core';
import { cn } from '@app/shared';

@Component({
  selector: 'div[spark-popover-footer]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'computedClass()',
  },
  template: '<ng-content />',
})
export class PopoverFooterComponent {
  protected readonly computedClass = computed(() => {
    return cn(
      'flex',
      'flex-col',
      'sm:flex-row',
      'sm:justify-end',
      'sm:space-x-2',
      'mt-4'
    );
  });
}
