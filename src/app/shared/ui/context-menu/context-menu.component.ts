import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  SecurityContext,
  input,
  output,
  signal,
  computed,
  inject,
  AfterViewInit,
  OnDestroy,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer } from '@angular/platform-browser';

/**
 * ContextMenuItem - Interface for menu items
 */
export interface ContextMenuItem {
  label: string;
  icon?: string;
  shortcut?: string;
  disabled?: boolean;
  destructive?: boolean;
  inset?: boolean;
  action?: () => void;
  children?: ContextMenuItem[];
}

/**
 * ContextMenuComponent - Right-click context menu
 *
 * A customizable context menu that appears on right-click.
 * Supports nested submenus, keyboard navigation, and various item types.
 *
 * @selector ui-context-menu
 * @standalone true
 *
 * @example
 * ```html
 * <div [uiContextMenuTrigger]="menuItems">
 *   Right-click me
 * </div>
 * ```
 */
@Component({
  selector: 'ui-context-menu',
  imports: [CommonModule],
  template: ` <ng-content /> `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host {
      display: contents;
    }
  `,
})
export class ContextMenuComponent {
  items = input<ContextMenuItem[]>([]);
}

/**
 * Context Menu Content - The actual dropdown menu
 */
@Component({
  selector: 'div[uiContextMenuContent]',
  imports: [CommonModule],
  host: {
    '[class]': 'classes()',
    '[style.display]': '"block"',
    '[style.position]': '"fixed"',
    '[style.minWidth]': 'minWidth()',
    '[style.maxWidth]': 'maxWidth()',
    '[attr.role]': '"menu"',
    '[attr.aria-label]': 'ariaLabel()',
    '(keydown.escape)': 'onEscape($event)',
  },
  template: `
    <div class="context-menu-content" [class.submenu]="isSubmenu()">
      @for (item of items(); track item.label) {
        @if (item.children && item.children.length > 0) {
          <div
            class="menu-item submenu-trigger"
            [class.inset]="item.inset"
            [class.disabled]="item.disabled"
            role="menuitem"
            [attr.aria-disabled]="item.disabled ? 'true' : null"
            [attr.tabindex]="item.disabled ? -1 : 0"
            (mouseenter)="onSubmenuEnter($event, item)"
            (click)="onItemClick(item, $event)"
            (keydown.enter)="onItemKeyboardSelect(item, $event)"
            (keydown.space)="onItemKeyboardSelect(item, $event)"
          >
            @if (item.icon) {
              <span class="menu-icon" [innerHTML]="sanitizeIcon(item.icon)"></span>
            }
            <span class="menu-label">{{ item.label }}</span>
            <svg
              class="submenu-arrow"
              xmlns="http://www.w3.org/2000/svg"
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
            >
              <path
                d="M4.5 3L7.5 6L4.5 9"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </div>
        } @else {
          <div
            class="menu-item"
            [class.inset]="item.inset"
            [class.disabled]="item.disabled"
            [class.destructive]="item.destructive"
            role="menuitem"
            [attr.aria-disabled]="item.disabled ? 'true' : null"
            [attr.tabindex]="item.disabled ? -1 : 0"
            (click)="onItemClick(item, $event)"
            (keydown.enter)="onItemKeyboardSelect(item, $event)"
            (keydown.space)="onItemKeyboardSelect(item, $event)"
          >
            @if (item.icon) {
              <span class="menu-icon" [innerHTML]="sanitizeIcon(item.icon)"></span>
            }
            <span class="menu-label">{{ item.label }}</span>
            @if (item.shortcut) {
              <span class="menu-shortcut">{{ item.shortcut }}</span>
            }
          </div>
        }
      }
    </div>
  `,
  styles: [
    `
      :host {
        z-index: 9999;
        background: var(--popover);
        border: 1px solid var(--border);
        border-radius: var(--radius-md);
        box-shadow: var(--shadow-popover);
        padding: var(--spacing-xs) 0;
        min-width: var(--context-menu-min-width);
        max-width: var(--context-menu-max-width);
      }

      :host.submenu {
        margin-left: 4px;
      }

      .context-menu-content {
        display: flex;
        flex-direction: column;
      }

      .menu-item {
        display: flex;
        align-items: center;
        gap: var(--spacing-sm);
        height: var(--context-menu-item-height);
        padding: 0 var(--context-menu-item-padding-x);
        font-size: var(--font-size-sm, 0.875rem);
        color: var(--popover-foreground);
        cursor: pointer;
        user-select: none;
        transition: background-color var(--duration-fast, 150ms) var(--ease-out);
        position: relative;
        outline: none;
      }

      .menu-item:hover:not(.disabled) {
        background: var(--accent);
        color: var(--accent-foreground);
      }

      .menu-item.inset {
        padding-left: calc(var(--context-menu-item-padding-x) + var(--context-menu-item-inset));
      }

      .menu-item.disabled {
        color: color-mix(in oklch, var(--popover-foreground) 85%, var(--popover) 15%);
        cursor: not-allowed;
        pointer-events: none;
      }

      .menu-item.destructive {
        color: var(--destructive);
      }

      .menu-item.destructive:hover:not(.disabled) {
        background: var(--destructive);
        color: var(--destructive-foreground);
      }

      .menu-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: var(--icon-size-md, 1rem);
        height: var(--icon-size-md, 1rem);
        flex-shrink: 0;
      }

      .menu-icon svg {
        width: 100%;
        height: 100%;
      }

      .menu-label {
        flex: 1;
        white-space: nowrap;
      }

      .menu-shortcut {
        margin-left: auto;
        font-size: var(--font-size-xs, 0.75rem);
        color: color-mix(in oklch, var(--popover-foreground) 88%, var(--popover) 12%);
      }

      .menu-item:hover .menu-shortcut {
        color: inherit;
      }

      .submenu-trigger {
        cursor: default;
      }

      .submenu-arrow {
        margin-left: auto;
        width: 12px;
        height: 12px;
        color: var(--muted-foreground);
      }

      .menu-item:hover .submenu-arrow {
        color: inherit;
      }

      .menu-item:focus-visible {
        background: var(--accent);
        color: var(--accent-foreground);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContextMenuContentComponent {
  items = input<ContextMenuItem[]>([]);
  isSubmenu = input<boolean>(false);
  ariaLabel = input<string>('Context menu');
  minWidth = computed(() => 'var(--context-menu-min-width)');
  maxWidth = computed(() => 'var(--context-menu-max-width)');
  readonly close = output<void>();
  private readonly sanitizer = inject(DomSanitizer);

  sanitizeIcon(icon?: string): string {
    if (!icon) {
      return '';
    }
    return this.sanitizer.sanitize(SecurityContext.HTML, icon) ?? '';
  }

  onItemClick(item: ContextMenuItem, event: Event): void {
    event.stopPropagation();
    if (item.disabled) {
      return;
    }
    if (item.action) {
      item.action();
    }
    this.close.emit();
  }

  onItemKeyboardSelect(item: ContextMenuItem, event: Event): void {
    event.preventDefault();
    this.onItemClick(item, event);
  }

  onSubmenuEnter(event: MouseEvent, item: ContextMenuItem): void {
    // Submenu hover handling - could be expanded for full submenu support
    event.stopPropagation();
  }

  onEscape(event: KeyboardEvent): void {
    event.preventDefault();
    this.close.emit();
  }

  classes = computed(() => '');
}

/**
 * Context Menu Trigger Directive
 * Attaches to an element to show context menu on right-click
 */
@Directive({
  selector: '[uiContextMenuTrigger]',
})
export class ContextMenuTriggerDirective implements AfterViewInit, OnDestroy {
  readonly uiContextMenuTrigger = input<ContextMenuItem[]>([]);
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly sanitizer = inject(DomSanitizer);
  private menuContainer: HTMLElement | null = null;
  private activeMenu = signal<HTMLElement | null>(null);
  private activeSubmenu = signal<HTMLElement | null>(null);

  ngAfterViewInit() {
    const element = this.elementRef.nativeElement as HTMLElement;
    element.addEventListener('contextmenu', this.onContextMenu);
  }

  ngOnDestroy() {
    const element = this.elementRef.nativeElement as HTMLElement;
    element.removeEventListener('contextmenu', this.onContextMenu);
    this.closeMenu();
  }

  private onContextMenu = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    this.closeMenu();
    this.showMenu(event.clientX, event.clientY);
  };

  private showMenu(x: number, y: number) {
    // Create container
    this.menuContainer = document.createElement('div');
    this.menuContainer.style.cssText = `
      position: fixed;
      left: ${x}px;
      top: ${y}px;
      z-index: 9999;
    `;
    document.body.appendChild(this.menuContainer);

    // Create menu element
    const menuEl = document.createElement('div');
    menuEl.className = 'context-menu-wrapper';
    menuEl.setAttribute('role', 'menu');
    menuEl.setAttribute('aria-label', 'Context menu');
    this.activeMenu.set(menuEl);
    this.menuContainer.appendChild(menuEl);

    // Render menu items
    this.renderMenu(menuEl, this.uiContextMenuTrigger());

    // Position menu to stay within viewport
    this.positionMenu();

    // Close on click outside
    setTimeout(() => {
      document.addEventListener('click', this.closeMenuOnClick, true);
      document.addEventListener('keydown', this.handleGlobalKeydown, true);
      this.focusFirstMenuItem();
    }, 0);
  }

  private renderMenu(container: HTMLElement, items: ContextMenuItem[]) {
    container.innerHTML = '';
    container.className = 'context-menu-wrapper';

    // Apply inline styles using CSS variables from styles.css
    container.style.cssText = `
      background: var(--popover);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-popover);
      padding: var(--spacing-xs) 0;
      min-width: var(--context-menu-min-width);
      max-width: var(--context-menu-max-width);
    `;
    container.setAttribute('role', 'menu');

    items.forEach((item) => {
      const itemEl = this.createMenuItem(item);
      container.appendChild(itemEl);
    });
  }

  private createMenuItem(item: ContextMenuItem): HTMLElement {
    const div = document.createElement('div');
    div.className = 'menu-item';
    div.setAttribute('role', 'menuitem');
    div.tabIndex = item.disabled ? -1 : 0;
    if (item.disabled) {
      div.setAttribute('aria-disabled', 'true');
    }

    // Apply base item styles
    div.style.cssText = `
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      height: var(--context-menu-item-height);
      padding: 0 var(--context-menu-item-padding-x);
      font-size: var(--font-size-sm, 0.875rem);
      color: var(--popover-foreground);
      cursor: pointer;
      user-select: none;
      transition: background-color var(--duration-fast, 150ms) var(--ease-out);
      position: relative;
    `;

    if (item.inset) {
      div.style.paddingLeft = `calc(var(--context-menu-item-padding-x) + var(--context-menu-item-inset))`;
    }
    if (item.disabled) {
      div.classList.add('disabled');
      div.style.color = 'color-mix(in oklch, var(--popover-foreground) 85%, var(--popover) 15%)';
      div.style.cursor = 'not-allowed';
      div.style.pointerEvents = 'none';
    }
    if (item.destructive) {
      div.style.color = 'var(--destructive)';
    }

    if (item.icon) {
      const icon = document.createElement('span');
      icon.className = 'menu-icon';
      icon.innerHTML = this.sanitizeIcon(item.icon);
      icon.style.cssText = `
        display: flex;
        align-items: center;
        justify-content: center;
        width: var(--icon-size-md, 1rem);
        height: var(--icon-size-md, 1rem);
        flex-shrink: 0;
      `;
      div.appendChild(icon);
    }

    const label = document.createElement('span');
    label.className = 'menu-label';
    label.textContent = item.label;
    label.style.cssText = `
      flex: 1;
      white-space: nowrap;
    `;
    div.appendChild(label);

    if (item.shortcut) {
      const shortcut = document.createElement('span');
      shortcut.className = 'menu-shortcut';
      shortcut.textContent = item.shortcut;
      shortcut.style.cssText = `
        margin-left: auto;
        font-size: var(--font-size-xs, 0.75rem);
        color: color-mix(in oklch, var(--popover-foreground) 88%, var(--popover) 12%);
      `;
      div.appendChild(shortcut);
    }

    if (!item.disabled) {
      // Add hover effect
      div.addEventListener('mouseenter', () => {
        div.style.backgroundColor = 'var(--accent)';
        div.style.color = 'var(--accent-foreground)';
      });
      div.addEventListener('mouseleave', () => {
        div.style.backgroundColor = '';
        if (item.destructive) {
          div.style.color = 'var(--destructive)';
        } else {
          div.style.color = 'var(--popover-foreground)';
        }
      });

      div.addEventListener('click', (e) => {
        e.stopPropagation();
        if (item.action) item.action();
        this.closeMenu();
      });

      div.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (item.action) {
            item.action();
          }
          this.closeMenu();
        }
      });
    }

    return div;
  }

  private positionMenu() {
    if (!this.menuContainer) return;

    const rect = this.menuContainer.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let x = parseFloat(this.menuContainer.style.left);
    let y = parseFloat(this.menuContainer.style.top);

    // Adjust horizontal position if menu goes off screen
    if (x + rect.width > viewportWidth) {
      x = viewportWidth - rect.width - 8;
      this.menuContainer.style.left = `${x}px`;
    }

    // Adjust vertical position if menu goes off screen
    if (y + rect.height > viewportHeight) {
      y = viewportHeight - rect.height - 8;
      this.menuContainer.style.top = `${y}px`;
    }
  }

  private closeMenuOnClick = () => {
    this.closeMenu();
  };

  private handleGlobalKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.closeMenu();
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.focusByOffset(1);
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.focusByOffset(-1);
      return;
    }

    if (event.key === 'Home') {
      event.preventDefault();
      const items = this.getMenuItems();
      items[0]?.focus();
      return;
    }

    if (event.key === 'End') {
      event.preventDefault();
      const items = this.getMenuItems();
      items[items.length - 1]?.focus();
    }
  };

  private closeMenu() {
    document.removeEventListener('click', this.closeMenuOnClick, true);
    document.removeEventListener('keydown', this.handleGlobalKeydown, true);
    if (this.menuContainer) {
      this.menuContainer.remove();
      this.menuContainer = null;
    }
    this.activeMenu.set(null);
    this.activeSubmenu.set(null);
  }

  private sanitizeIcon(icon?: string): string {
    if (!icon) {
      return '';
    }
    return this.sanitizer.sanitize(SecurityContext.HTML, icon) ?? '';
  }

  private focusFirstMenuItem(): void {
    const items = this.getMenuItems();
    items[0]?.focus();
  }

  private focusByOffset(offset: number): void {
    const items = this.getMenuItems();
    if (items.length === 0) {
      return;
    }

    const activeElement = document.activeElement as HTMLElement | null;
    const activeIndex = items.findIndex((item) => item === activeElement);
    const currentIndex = activeIndex < 0 ? 0 : activeIndex;
    const nextIndex = (currentIndex + offset + items.length) % items.length;
    items[nextIndex]?.focus();
  }

  private getMenuItems(): HTMLElement[] {
    return Array.from(
      this.menuContainer?.querySelectorAll<HTMLElement>('.menu-item:not(.disabled)') ?? [],
    );
  }
}
