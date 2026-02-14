/**
 * Navigation Menu Viewport Component
 *
 * Container for the navigation menu content when using viewport mode.
 * Provides the absolute positioning container for the menu content.
 *
 * Usage:
 * <div spark-navmenu-viewport>
 *   <ng-content />
 * </div>
 */

import {
  Component,
  computed,
  inject,
  input,
  ChangeDetectionStrategy,
} from '@angular/core';
import { cn } from '@app/shared';
import {
  NAV_MENU_ROOT,
  type NavMenuRootToken,
} from './navmenu-root.component';

@Component({
  selector: 'div[spark-navmenu-viewport]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'hostClass()',
    '[attr.data-state]': 'root.isOpen() ? "open" : "closed"',
    '[attr.data-slot]': '"navmenu-viewport"',
  },
  template: `
    <ng-content />
  `,
})
export class NavMenuViewportComponent {
  readonly root: NavMenuRootToken = inject(NAV_MENU_ROOT);

  readonly class = input<string>('');

  protected readonly hostClass = computed(() => {
    return cn(
      'origin-top-center',
      'bg-popover',
      'text-popover-foreground',
      'data-[state=open]:animate-in',
      'data-[state=closed]:animate-out',
      'data-[state=closed]:zoom-out-95',
      'data-[state=open]:zoom-in-90',
      'relative',
      'mt-1.5',
      'h-[var(--radix-navigation-menu-viewport-height)]',
      'w-full',
      'overflow-hidden',
      'rounded-md',
      'border',
      'shadow',
      'md:w-[var(--radix-navigation-menu-viewport-width)]',
      this.class()
    );
  });
}
