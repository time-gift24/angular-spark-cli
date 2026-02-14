/**
 * Dropdown Menu Trigger Component
 *
 * The button that opens/closes the dropdown menu.
 *
 * Usage:
 * <button spark-navmenu-trigger>
 *   <ng-content />
 * </button>
 */

import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  input,
} from '@angular/core';
import type { Signal } from '@angular/core';
import { cn } from '@app/shared';
import {
  NAV_MENU_ROOT,
  type NavMenuRootToken,
} from './navmenu-root.component';

@Component({
  selector: 'button[spark-navmenu-trigger]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'type': 'button',
    '[class]': 'hostClass()',
    '[attr.disabled]': 'root.disabled() ? "" : null',
    '[attr.aria-haspopup]': '"true"',
    '[attr.aria-expanded]': 'root.isOpen()',
    '[attr.data-state]': 'root.isOpen() ? "open" : "closed"',
    '(click)': 'root.toggle()',
    '(keydown)': 'handleKeydown($event)',
  },
  template: `
    <ng-content />
  `,
})
export class NavMenuTriggerComponent {
  private readonly root: NavMenuRootToken = inject(NAV_MENU_ROOT);
  private readonly elementRef = inject(ElementRef<HTMLElement>);

  readonly class = input<string>('');
  readonly asChild = input<boolean>(false);

  protected readonly hostClass = computed(() => {
    return cn(
      'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-xs font-medium transition-colors',
      'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
      'disabled:pointer-events-none disabled:opacity-50',
      '[&_svg]:pointer-events-none [&_svg]:size-3.5 [&_svg]:shrink-0',
      this.class()
    );
  });

  constructor() {
    this.root.registerTrigger(this.elementRef);
  }

  handleKeydown(event: KeyboardEvent): void {
    if (this.root.disabled()) {
      return;
    }

    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowUp':
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (!this.root.isOpen()) {
          this.root.openMenu();
        }
        break;
      case 'Escape':
        event.preventDefault();
        this.root.close();
        break;
    }
  }

  focus(): void {
    this.elementRef.nativeElement?.focus();
  }

  blur(): void {
    this.elementRef.nativeElement?.blur();
  }
}
