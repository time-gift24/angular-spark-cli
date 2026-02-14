/**
 * Popover Header Component
 *
 * Header section for popover content.
 *
 * Usage:
 * <div spark-popover-header>
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
  selector: 'div[spark-popover-header]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'computedClass()',
  },
  template: '<ng-content />',
})
export class PopoverHeaderComponent {
  protected readonly computedClass = computed(() => {
    return cn(
      'flex',
      'flex-col',
      'space-y-1',
      'text-center',
      'sm:text-left',
      'mb-4'
    );
  });
}
