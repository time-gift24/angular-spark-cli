/**
 * Navigation Menu Indicator Component
 *
 * Visual indicator showing the active item in the navigation menu.
 * Appears as an arrow/triangle pointing to the active item.
 *
 * Usage:
 * <div spark-navmenu-indicator></div>
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
  selector: 'div[spark-navmenu-indicator]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'hostClass()',
    '[attr.data-state]': 'root.isOpen() ? "visible" : "hidden"',
    '[attr.data-slot]': '"navmenu-indicator"',
  },
  template: `
    <div [class]="arrowClass()"></div>
  `,
})
export class NavMenuIndicatorComponent {
  readonly root: NavMenuRootToken = inject(NAV_MENU_ROOT);

  readonly class = input<string>('');

  protected readonly hostClass = computed(() => {
    return cn(
      'data-[state=visible]:animate-in',
      'data-[state=hidden]:animate-out',
      'data-[state=hidden]:fade-out',
      'data-[state=visible]:fade-in',
      'top-full',
      'z-[1]',
      'flex',
      'h-1.5',
      'items-end',
      'justify-center',
      'overflow-hidden',
      this.class()
    );
  });

  protected readonly arrowClass = computed(() => {
    return cn(
      'bg-border',
      'relative',
      'top-[60%]',
      'h-2',
      'w-2',
      'rotate-45',
      'rounded-tl-sm',
      'shadow-md'
    );
  });
}
