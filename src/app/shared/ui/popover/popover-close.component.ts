/**
 * Popover Close Component
 *
 * Button/element that closes the popover when clicked.
 *
 * Usage:
 * <button spark-popover-close>Close</button>
 */

import {
  Component,
  inject,
  ChangeDetectionStrategy,
} from '@angular/core';
import { POPOVER_ROOT, type PopoverRootToken } from './popover.component';

@Component({
  selector: 'button[spark-popover-close], [spark-popover-close]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(click)': 'root.close()',
  },
  template: '<ng-content />',
})
export class PopoverCloseComponent {
  readonly root: PopoverRootToken = inject(POPOVER_ROOT);
}
