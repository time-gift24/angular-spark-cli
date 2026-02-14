/**
 * Popover Trigger Component
 *
 * Button that toggles the popover open/closed.
 *
 * Usage:
 * <button spark-popover-trigger>Toggle Popover</button>
 */

import {
  Component,
  inject,
  input,
  computed,
  ElementRef,
  ChangeDetectionStrategy,
} from '@angular/core';
import { cn } from '@app/shared';
import { POPOVER_ROOT, type PopoverRootToken } from './popover.component';

@Component({
  selector: 'button[spark-popover-trigger], [spark-popover-trigger]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'computedClass()',
    '[attr.data-state]': 'root.isOpen() ? "open" : "closed"',
    '[attr.aria-expanded]': 'root.isOpen()',
    '[attr.aria-haspopup]': '"true"',
    '[disabled]': 'disabled() ? "" : null',
    '(click)': 'root.toggle()',
  },
  template: '<ng-content />',
})
export class PopoverTriggerComponent {
  readonly root: PopoverRootToken = inject(POPOVER_ROOT);
  private readonly elementRef = inject(ElementRef<HTMLElement>);

  readonly disabled = input<boolean>(false);
  readonly class = input<string>('');

  protected readonly computedClass = computed(() => {
    return cn('inline-flex', this.class());
  });

  constructor() {
    this.root.registerTrigger(this.elementRef);
  }
}
