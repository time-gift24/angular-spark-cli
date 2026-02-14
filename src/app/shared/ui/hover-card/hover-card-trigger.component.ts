/**
 * Hover Card Trigger Component
 *
 * The element that triggers the hover card on hover or focus.
 *
 * Usage:
 * <button spark-hover-card-trigger>
 *   <ng-content />
 * </button>
 */

import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  ElementRef,
} from '@angular/core';
import { cn } from '@app/shared';
import {
  HOVER_CARD_ROOT,
  type HoverCardRootToken,
} from './hover-card-root.component';

@Component({
  selector: 'button[spark-hover-card-trigger]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'type': 'button',
    '[class]': 'hostClass()',
    '[attr.disabled]': 'root.disabled() ? "" : null',
    '[attr.data-state]': 'root.isOpen() ? "open" : "closed"',
    '[attr.data-slot]': '"hover-card-trigger"',
    '(mouseenter)': 'onMouseEnter()',
    '(mouseleave)': 'onMouseLeave()',
    '(focus)': 'onFocus()',
    '(blur)': 'onBlur()',
  },
  template: `
    <ng-content />
  `,
})
export class HoverCardTriggerComponent {
  private readonly root: HoverCardRootToken = inject(HOVER_CARD_ROOT);
  private readonly elementRef = inject(ElementRef<HTMLElement>);

  readonly class = input<string>('');
  readonly asChild = input<boolean>(false);

  protected readonly hostClass = computed(() => {
    return cn(
      'inline-flex',
      'items-center',
      'justify-center',
      'rounded-md',
      'text-sm',
      'font-medium',
      'transition-colors',
      'focus-visible:outline-none',
      'focus-visible:ring-1',
      'focus-visible:ring-ring',
      'disabled:pointer-events-none',
      'disabled:opacity-50',
      'cursor-pointer',
      this.class()
    );
  });

  constructor() {
    this.root.registerTrigger(this.elementRef);
  }

  onMouseEnter(): void {
    if (this.root.disabled()) {
      return;
    }
    this.root.open();
  }

  onMouseLeave(): void {
    this.root.close();
  }

  onFocus(): void {
    if (this.root.disabled()) {
      return;
    }
    this.root.open();
  }

  onBlur(): void {
    this.root.close();
  }
}
