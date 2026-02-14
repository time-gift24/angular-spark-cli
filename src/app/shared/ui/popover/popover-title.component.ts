/**
 * Popover Title Component
 *
 * Title element for popover header.
 *
 * Usage:
 * <h3 spark-popover-title>Title</h3>
 */

import {
  Component,
  computed,
  ChangeDetectionStrategy,
} from '@angular/core';
import { cn } from '@app/shared';

@Component({
  selector: 'h3[spark-popover-title]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'computedClass()',
  },
  template: '<ng-content />',
})
export class PopoverTitleComponent {
  protected readonly computedClass = computed(() => {
    return cn(
      'text-base',
      'font-semibold',
      'leading-none',
      'tracking-tight'
    );
  });
}
