/**
 * Hover Card Content Component
 *
 * The content panel that appears on hover/focus.
 * Positioned absolutely near the trigger.
 *
 * Usage:
 * <div spark-hover-card-content>
 *   <ng-content />
 * </div>
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

export type HoverCardContentAlign = 'start' | 'center' | 'end';
export type HoverCardContentSide = 'top' | 'right' | 'bottom' | 'left';

@Component({
  selector: 'div[spark-hover-card-content]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'hostClass()',
    '[attr.data-state]': 'root.isOpen() ? "open" : "closed"',
    '[attr.data-side]': 'side()',
    '[attr.data-align]': 'align()',
    '[attr.data-slot]': '"hover-card-content"',
  },
  template: `
    @if (root.isOpen()) {
      <div [class]="innerClass()">
        <ng-content />
      </div>
    }
  `,
  styles: `
    :host {
      position: absolute;
      z-index: 50;
      width: 16rem;
    }
  `,
})
export class HoverCardContentComponent {
  readonly root: HoverCardRootToken = inject(HOVER_CARD_ROOT);
  private readonly elementRef = inject(ElementRef<HTMLElement>);

  readonly align = input<HoverCardContentAlign>('center');
  readonly sideOffset = input<number>(4);
  readonly class = input<string>('');
  readonly side = input<HoverCardContentSide>('bottom');

  protected readonly hostClass = computed(() => {
    return cn(
      'absolute',
      'z-50',
      'w-64',
      'origin-(--radix-hover-card-content-transform-origin)',
      'rounded-md',
      'border',
      'p-4',
      'shadow-md',
      'outline-hidden',
      this.class()
    );
  });

  protected readonly innerClass = computed(() => {
    return cn(
      // Base styles
      'bg-popover',
      'text-popover-foreground',
      // Animation
      'data-[state=open]:animate-in',
      'data-[state=closed]:animate-out',
      'data-[state=closed]:fade-out-0',
      'data-[state=open]:fade-in-0',
      'data-[state=closed]:zoom-out-95',
      'data-[state=open]:zoom-in-95',
      // Side animations
      this.side() === 'bottom' && 'data-[side=bottom]:slide-in-from-top-2',
      this.side() === 'left' && 'data-[side=left]:slide-in-from-right-2',
      this.side() === 'right' && 'data-[side=right]:slide-in-from-left-2',
      this.side() === 'top' && 'data-[side=top]:slide-in-from-bottom-2'
    );
  });

  constructor() {
    this.root.registerContent(this.elementRef);
  }
}
