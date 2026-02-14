/**
 * Popover Arrow Component
 *
 * Visual arrow pointing from popover content to trigger.
 *
 * Usage:
 * <div spark-popover-arrow></div>
 */

import {
  Component,
  inject,
  computed,
  input,
  ChangeDetectionStrategy,
} from '@angular/core';
import { cn } from '@app/shared';
import { POPOVER_ROOT, type PopoverRootToken } from './popover.component';

export type PopoverArrowSide = 'top' | 'right' | 'bottom' | 'left';

@Component({
  selector: 'div[spark-popover-arrow]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'computedClass()',
    '[attr.data-side]': 'side()',
  },
  template: '',
  styles: `
    :host {
      position: absolute;
      width: 0.5rem;
      height: 0.5rem;
      background-color: var(--popover);
      border-style: solid;
      border-width: 1px;
      border-color: transparent;
      border-left-color: var(--border);
      border-top-color: var(--border);
      transform: rotate(45deg);
      z-index: -1;
    }

    :host([data-side='top']) {
      bottom: calc(var(--spacing-md) * -1);
      left: 50%;
      transform: translateX(-50%) rotate(45deg);
    }

    :host([data-side='bottom']) {
      top: calc(var(--spacing-md) * -1);
      left: 50%;
      transform: translateX(-50%) rotate(45deg);
    }

    :host([data-side='left']) {
      right: calc(var(--spacing-md) * -1);
      top: 50%;
      transform: translateY(-50%) rotate(45deg);
    }

    :host([data-side='right']) {
      left: calc(var(--spacing-md) * -1);
      top: 50%;
      transform: translateY(-50%) rotate(45deg);
    }
  `,
})
export class PopoverArrowComponent {
  readonly root: PopoverRootToken = inject(POPOVER_ROOT);

  readonly side = input<PopoverArrowSide>('bottom');
  readonly class = input<string>('');

  protected readonly computedClass = computed(() => {
    return cn('popover-arrow', this.class());
  });
}
