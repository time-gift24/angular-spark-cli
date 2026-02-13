/**
 * Dropdown Menu Sub Trigger Component
 *
 * Trigger button for a submenu.
 *
 * Usage:
 * <div spark-dropdown-menu-sub-trigger>
 *   Submenu
 *   <svg class="ml-auto h-4 w-4">...</svg>
 * </div>
 */

import {
  Component,
  input,
  computed,
  inject,
  ChangeDetectionStrategy,
  ElementRef,
} from '@angular/core';
import type { Signal } from '@angular/core';
import { cn } from '@app/shared';
import { DROPDOWN_MENU_SUB, type DropdownMenuSubToken } from './dropdown-menu-sub.component';
import {
  DROPDOWN_MENU_ROOT,
  type DropdownMenuRootToken,
  type DropdownMenuItemDef,
} from './dropdown-menu-root.component';

@Component({
  selector: 'div[spark-dropdown-menu-sub-trigger]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'hostClass()',
    '[attr.role]': '"menuitem"',
    '[attr.tabindex]': 'tabindex()',
    '[attr.aria-haspopup]': '"true"',
    '[attr.aria-expanded]': 'sub.isOpen()',
    '[attr.data-inset]': 'inset() ? "" : null',
    '[attr.data-state]': 'sub.isOpen() ? "open" : "closed"',
    '[attr.disabled]': 'disabled() ? "" : null',
    '(click)': 'openSub()',
    '(mouseenter)': 'onMouseEnter()',
    '(keydown)': 'handleKeydown($event)',
  },
  template: `
    <ng-content />
    <svg
      class="ml-auto h-4 w-4"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <polyline points="9 18 15 12 9 6"></polyline>
    </svg>
  `,
})
export class DropdownMenuSubTriggerComponent {
  private readonly sub: DropdownMenuSubToken = inject(DROPDOWN_MENU_SUB);
  private readonly root: DropdownMenuRootToken = inject(DROPDOWN_MENU_ROOT);
  private readonly elementRef = inject(ElementRef<HTMLElement>);

  readonly value = input.required<string>();
  readonly disabled = input<boolean>(false);
  readonly class = input<string>('');
  readonly inset = input<boolean>(false);

  protected readonly tabindex = computed(() => {
    if (this.disabled()) {
      return -1;
    }
    return 0;
  });

  protected readonly hostClass = computed(() => {
    return cn(
      'relative',
      'flex',
      'w-full',
      'cursor-default',
      'select-none',
      'items-center',
      'rounded-md',
      'gap-2',
      'min-h-7',
      'px-2',
      'py-1',
      'text-xs',
      'outline-none',
      'transition-colors',
      // Focus styles
      'focus:bg-accent',
      'focus:text-accent-foreground',
      // Icon styles
      '[&_svg:not([class*=size-])]:size-3.5',
      '[&_svg]:pointer-events-none',
      '[&_svg]:shrink-0',
      // Open state
      this.sub.isOpen() && 'bg-accent',
      this.sub.isOpen() && 'text-accent-foreground',
      // Disabled styles
      this.disabled() && 'pointer-events-none',
      this.disabled() && 'opacity-50',
      // Inset padding
      this.inset() && 'pl-7.5',
      // Custom class
      this.class()
    );
  });

  openSub(): void {
    if (this.disabled()) {
      return;
    }
    this.sub.open();
  }

  onMouseEnter(): void {
    if (this.disabled()) {
      return;
    }
    // Open submenu on hover
    this.sub.open();
  }

  handleKeydown(event: KeyboardEvent): void {
    if (this.disabled()) {
      return;
    }

    switch (event.key) {
      case 'Enter':
      case ' ':
      case 'ArrowRight':
        event.preventDefault();
        this.sub.open();
        break;
      case 'ArrowLeft':
        event.preventDefault();
        this.sub.close();
        break;
      case 'Escape':
        this.root.close();
        break;
    }
  }
}
