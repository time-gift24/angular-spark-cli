/**
 * Navigation Menu Link Component
 *
 * Link-style menu item that maintains active state styling.
 * Used for navigation items that represent links rather than actions.
 *
 * Usage:
 * <a spark-navmenu-link href="/path">Link</a>
 */

import {
  Component,
  input,
  computed,
  inject,
  ChangeDetectionStrategy,
} from '@angular/core';
import { cn } from '@app/shared';
import {
  NAV_MENU_ROOT,
  type NavMenuRootToken,
} from './navmenu-root.component';

export type NavMenuLinkActive = boolean;

@Component({
  selector: 'a[spark-navmenu-link]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'hostClass()',
    '[attr.data-active]': 'active()',
    '[attr.data-slot]': '"navmenu-link"',
  },
  template: `
    <ng-content />
  `,
})
export class NavMenuLinkComponent {
  readonly root: NavMenuRootToken = inject(NAV_MENU_ROOT);

  readonly active = input<boolean>(false);
  readonly class = input<string>('');

  protected readonly hostClass = computed(() => {
    return cn(
      // Base link styles
      'flex',
      'flex-col',
      'gap-1',
      'rounded-sm',
      'p-2',
      'text-sm',
      'transition-all',
      'outline-none',
      'focus-visible:ring-[3px]',
      'focus-visible:outline-1',
      'focus-visible:ring-ring/50',
      '[&_svg:not([class*=size-])]:size-4',
      '[&_svg:not([class*=text-])]:text-muted-foreground',
      // Hover styles
      'hover:bg-accent',
      'hover:text-accent-foreground',
      'focus:bg-accent',
      'focus:text-accent-foreground',
      // Active state styles
      this.active() && 'data-[active=true]:focus:bg-accent',
      this.active() && 'data-[active=true]:hover:bg-accent',
      this.active() && 'data-[active=true]:bg-accent/50',
      this.active() && 'data-[active=true]:text-accent-foreground',
      // Custom class
      this.class()
    );
  });
}
