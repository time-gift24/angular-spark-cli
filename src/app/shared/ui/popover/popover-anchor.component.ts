/**
 * Popover Anchor Component
 *
 * Optional anchor element for positioning the popover.
 * Use when you want the popover positioned relative to a specific element
 * other than the trigger.
 *
 * Usage:
 * <div spark-popover-anchor>
 *   <ng-content />
 * </div>
 */

import {
  Component,
  inject,
  ElementRef,
  ChangeDetectionStrategy,
} from '@angular/core';
import { POPOVER_ROOT, type PopoverRootToken } from './popover.component';

@Component({
  selector: 'div[spark-popover-anchor]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'class': 'block',
  },
  template: '<ng-content />',
})
export class PopoverAnchorComponent {
  readonly root: PopoverRootToken = inject(POPOVER_ROOT);
  private readonly elementRef = inject(ElementRef<HTMLElement>);

  constructor() {
    // Anchor can be used to position content relative to this element
    // rather than the trigger
  }
}
