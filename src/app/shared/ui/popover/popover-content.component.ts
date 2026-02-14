/**
 * Popover Content Component
 *
 * The popover panel containing content.
 * Positioned relative to trigger with optional offset and alignment.
 *
 * Usage:
 * <div spark-popover-content>
 *   <ng-content />
 * </div>
 */

import {
  Component,
  computed,
  inject,
  input,
  ElementRef,
  ChangeDetectionStrategy,
} from '@angular/core';
import { cn } from '@app/shared';
import { POPOVER_ROOT, type PopoverRootToken } from './popover.component';

export type PopoverContentAlign = 'start' | 'center' | 'end';
export type PopoverContentSide = 'top' | 'right' | 'bottom' | 'left';

@Component({
  selector: 'div[spark-popover-content]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'role': 'dialog',
    '[class]': 'hostClass()',
    '[style]': 'computedStyle()',
    '[attr.aria-modal]': 'root.modal() && root.isOpen() ? "true" : null',
    '[attr.data-side]': 'side()',
    '(keydown.escape)': 'root.close()',
  },
  template: `
    @if (root.isOpen()) {
      <div
        [class]="contentClass()"
        [attr.data-state]="'open'"
        [attr.data-side]="side()"
      >
        <ng-content />
      </div>
    }
  `,
  styles: `
    :host {
      position: absolute;
      z-index: 50;
    }
  `,
})
export class PopoverContentComponent {
  readonly root: PopoverRootToken = inject(POPOVER_ROOT);
  private readonly elementRef = inject(ElementRef<HTMLElement>);

  readonly align = input<PopoverContentAlign>('center');
  readonly side = input<PopoverContentSide>('bottom');
  readonly sideOffset = input<number>(4);
  readonly animate = input<boolean>(true);
  readonly class = input<string>('');

  protected readonly hostClass = computed(() => {
    return cn(
      'absolute z-50',
      this.root.isOpen() && 'block',
      !this.root.isOpen() && 'hidden',
      this.class()
    );
  });

  protected readonly contentClass = computed(() => {
    const side = this.side();

    return cn(
      // Base styles
      'overflow-hidden',
      'rounded-md',
      'bg-popover',
      'text-popover-foreground',
      'shadow-popover',
      'border',
      'border-border',
      // Padding
      'p-4',
      // Animation
      this.animate() && 'data-[state=open]:animate-in',
      this.animate() && 'data-[state=closed]:animate-out',
      this.animate() && 'data-[state=closed]:fade-out-0',
      this.animate() && 'data-[state=open]:fade-in-0',
      this.animate() && 'data-[state=closed]:zoom-out-95',
      this.animate() && 'data-[state=open]:zoom-in-95',
      // Side animations
      side === 'bottom' && 'data-[side=bottom]:slide-in-from-top-2',
      side === 'left' && 'data-[side=left]:slide-in-from-right-2',
      side === 'right' && 'data-[side=right]:slide-in-from-left-2',
      side === 'top' && 'data-[side=top]:slide-in-from-bottom-2'
    );
  });

  protected readonly computedStyle = computed(() => {
    const side = this.side();
    const align = this.align();
    const sideOffset = this.sideOffset();
    const offset = `${Math.max(0, sideOffset)}px`;

    if (align === 'center') {
      const centerStyles: Record<PopoverContentSide, string> = {
        bottom: `top: calc(100% + ${offset}); left: 50%; transform: translateX(-50%);`,
        top: `bottom: calc(100% + ${offset}); left: 50%; transform: translateX(-50%);`,
        left: `right: calc(100% + ${offset}); top: 50%; transform: translateY(-50%);`,
        right: `left: calc(100% + ${offset}); top: 50%; transform: translateY(-50%);`,
      };
      return centerStyles[side];
    }

    const crossAxisStyles: Record<PopoverContentSide, Record<Exclude<PopoverContentAlign, 'center'>, string>> = {
      bottom: {
        start: 'left: 0;',
        end: 'right: 0;',
      },
      top: {
        start: 'left: 0;',
        end: 'right: 0;',
      },
      left: {
        start: 'top: 0;',
        end: 'bottom: 0;',
      },
      right: {
        start: 'top: 0;',
        end: 'bottom: 0;',
      },
    };

    const mainAxisStyles: Record<PopoverContentSide, string> = {
      bottom: `top: calc(100% + ${offset});`,
      top: `bottom: calc(100% + ${offset});`,
      left: `right: calc(100% + ${offset});`,
      right: `left: calc(100% + ${offset});`,
    };

    return `${mainAxisStyles[side]} ${crossAxisStyles[side][align]}`;
  });

  constructor() {
    this.root.registerContent(this.elementRef);
  }
}
