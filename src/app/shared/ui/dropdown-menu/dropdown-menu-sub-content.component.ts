/**
 * Dropdown Menu Sub Content Component
 *
 * Content panel for a submenu.
 *
 * Usage:
 * <div spark-dropdown-menu-sub-content>
 *   <ng-content />
 * </div>
 */

import {
  Component,
  computed,
  inject,
  input,
  ChangeDetectionStrategy,
  ElementRef,
} from '@angular/core';
import { cn } from '@app/shared';
import { DROPDOWN_MENU_SUB, type DropdownMenuSubToken } from './dropdown-menu-sub.component';

export type DropdownMenuSubContentSide = 'top' | 'right' | 'bottom' | 'left';

@Component({
  selector: 'div[spark-dropdown-menu-sub-content]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'role': 'menu',
    '[class]': 'hostClass()',
    '[attr.aria-orientation]': '"vertical"',
    '[attr.data-side]': 'side()',
  },
  template: `
    @if (sub.isOpen()) {
      <div
        [class]="contentClass()"
        [attr.data-state]="'open'"
        (keydown.escape)="sub.close()"
      >
        <ng-content />
      </div>
    }
  `,
  styles: `
    :host {
      position: absolute;
      z-index: 50;
      min-width: 8rem;
    }
  `,
})
export class DropdownMenuSubContentComponent {
  readonly sub: DropdownMenuSubToken = inject(DROPDOWN_MENU_SUB);
  private readonly elementRef = inject(ElementRef<HTMLElement>);

  readonly class = input<string>('');
  readonly side = input<DropdownMenuSubContentSide>('right');
  readonly animate = input<boolean>(true);

  protected readonly hostClass = computed(() => {
    return cn(
      'absolute z-50',
      'min-w-32',
      this.sub.isOpen() && 'block',
      !this.sub.isOpen() && 'hidden',
      this.class()
    );
  });

  protected readonly contentClass = computed(() => {
    return cn(
      // Base styles
      'overflow-hidden',
      'rounded-lg',
      'bg-popover',
      'text-popover-foreground',
      'shadow-md',
      'ring-1',
      'ring-foreground/10',
      // Animation
      this.animate() && 'data-[state=open]:animate-in',
      this.animate() && 'data-[state=closed]:animate-out',
      this.animate() && 'data-[state=closed]:fade-out-0',
      this.animate() && 'data-[state=open]:fade-in-0',
      this.animate() && 'data-[state=closed]:zoom-out-95',
      this.animate() && 'data-[state=open]:zoom-in-95',
      // Side animations
      this.side() === 'bottom' && 'data-[side=bottom]:slide-in-from-top-2',
      this.side() === 'left' && 'data-[side=left]:slide-in-from-right-2',
      this.side() === 'right' && 'data-[side=right]:slide-in-from-left-2',
      this.side() === 'top' && 'data-[side=top]:slide-in-from-bottom-2',
      // Inner padding
      'p-1'
    );
  });

  constructor() {
    // Position submenu to the right by default
    // In a full implementation, this would use Popper.js or similar
  }
}
