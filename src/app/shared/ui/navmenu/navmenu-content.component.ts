/**
 * Dropdown Menu Content Component
 *
 * The dropdown panel that contains menu items.
 * Positioned absolutely below trigger.
 *
 * Usage:
 * <div spark-navmenu-content>
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
  NAV_MENU_ROOT,
  type NavMenuRootToken,
  type NavMenuItemDef,
} from './navmenu-root.component';

export type NavMenuContentAlign = 'start' | 'center' | 'end';
export type NavMenuContentSide = 'top' | 'right' | 'bottom' | 'left';

@Component({
  selector: 'div[spark-navmenu-content]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'role': 'menu',
    '[class]': 'hostClass()',
    '[attr.aria-orientation]': '"vertical"',
    '[attr.data-side]': 'side()',
  },
  template: `
    @if (root.isOpen()) {
      <div
        [class]="contentClass()"
        [attr.data-state]="'open'"
        (keydown.escape)="root.close()"
        (keydown.arrowdown)="onArrowDown($event)"
        (keydown.arrowup)="onArrowUp($event)"
        (keydown.home)="onHome($event)"
        (keydown.end)="onEnd($event)"
        (keydown.enter)="onEnter($event)"
      >
        <ng-content />
      </div>
    }
  `,
  styles: `
    :host {
      position: absolute;
      z-index: 50;
      min-width: var(--navmenu-content-min-width, 8rem);
      max-width: var(--radix-navmenu-content-available-width, var(--radix-popper-anchor-width));
      max-height: var(--radix-navmenu-content-available-height, var(--radix-popper-anchor-height));
      overflow: auto;
    }
  `,
})
export class NavMenuContentComponent {
  readonly root: NavMenuRootToken = inject(NAV_MENU_ROOT);
  private readonly elementRef = inject(ElementRef<HTMLElement>);

  readonly align = input<NavMenuContentAlign>('start');
  readonly sideOffset = input<number>(4);
  readonly class = input<string>('');
  readonly side = input<NavMenuContentSide>('bottom');
  readonly animate = input<boolean>(true);

  protected readonly hostClass = computed(() => {
    return cn(
      'absolute z-50',
      'min-w-32',
      this.root.isOpen() && 'block',
      !this.root.isOpen() && 'hidden',
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

  // Get all enabled items for navigation
  private getEnabledItems(): NavMenuItemDef[] {
    return this.root.items().filter((item: NavMenuItemDef) => !item.disabled);
  }

  handleNavigate(direction: number, event: KeyboardEvent): void {
    const enabledItems = this.getEnabledItems();
    if (enabledItems.length === 0) {
      return;
    }

    const currentIndex = this.root.focusedIndex();
    const newIndex = this.wrapIndex(currentIndex + direction, enabledItems.length);
    this.root.setFocusedIndex(newIndex);

    // Focus new item
    const item = enabledItems[newIndex];
    if (item?.elementRef) {
      (item.elementRef.nativeElement as HTMLElement).focus();
    }
  }

  onArrowDown(event: Event): void {
    this.handleNavigate(1, event as KeyboardEvent);
  }

  onArrowUp(event: Event): void {
    this.handleNavigate(-1, event as KeyboardEvent);
  }

  onHome(event: Event): void {
    this.handleHome(event as KeyboardEvent);
  }

  onEnd(event: Event): void {
    this.handleEnd(event as KeyboardEvent);
  }

  onEnter(event: Event): void {
    this.handleEnter(event as KeyboardEvent);
  }

  handleHome(event: KeyboardEvent): void {
    const enabledItems = this.getEnabledItems();
    if (enabledItems.length > 0) {
      this.root.setFocusedIndex(0);
      enabledItems[0]?.elementRef?.nativeElement?.focus();
    }
  }

  handleEnd(event: KeyboardEvent): void {
    const enabledItems = this.getEnabledItems();
    if (enabledItems.length > 0) {
      const lastIndex = enabledItems.length - 1;
      this.root.setFocusedIndex(lastIndex);
      enabledItems[lastIndex]?.elementRef?.nativeElement?.focus();
    }
  }

  handleEnter(event: KeyboardEvent): void {
    // Enter key handling is done by individual items
    // This is just a placeholder for future use
  }

  private wrapIndex(index: number, max: number): number {
    if (index < 0) {
      return max - 1;
    }
    if (index >= max) {
      return 0;
    }
    return index;
  }

  constructor() {
    this.root.registerContent(this.elementRef);
  }
}
