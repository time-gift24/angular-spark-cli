import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  Directive,
  ElementRef,
  OnDestroy,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';

export type ContextMenuIconName =
  | 'chevron-left'
  | 'chevron-right'
  | 'refresh-cw'
  | 'copy'
  | 'clipboard'
  | 'x'
  | 'bookmark'
  | 'user'
  | 'edit'
  | 'check'
  | 'plus'
  | 'dot';

export type ContextMenuIcon =
  | { type: 'icon'; name: ContextMenuIconName }
  | { type: 'swatch'; color: string; borderColor?: string };

/**
 * ContextMenuItem - Interface for menu items
 */
export interface ContextMenuItem {
  label: string;
  icon?: ContextMenuIcon | ContextMenuIconName | string;
  shortcut?: string;
  disabled?: boolean;
  destructive?: boolean;
  inset?: boolean;
  action?: () => void;
  children?: ContextMenuItem[];
}

/**
 * ContextMenuComponent - Right-click context menu wrapper
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
 * Kept for API compatibility. Rendering is handled by ContextMenuTriggerDirective.
 */
@Component({
  selector: 'div[uiContextMenuContent]',
  imports: [CommonModule],
  host: {
    '[class]': "'contents'",
    '[attr.role]': '"menu"',
    '[attr.aria-label]': 'ariaLabel()',
    '(keydown.escape)': 'onEscape($event)',
  },
  template: ` <ng-content /> `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContextMenuContentComponent {
  items = input<ContextMenuItem[]>([]);
  isSubmenu = input<boolean>(false);
  ariaLabel = input<string>('Context menu');
  readonly close = output<void>();

  onEscape(event: KeyboardEvent): void {
    event.preventDefault();
    this.close.emit();
  }
}

/**
 * Context Menu Trigger Directive
 * Attaches to an element to show context menu on right-click.
 */
@Directive({
  selector: '[uiContextMenuTrigger]',
})
export class ContextMenuTriggerDirective implements AfterViewInit, OnDestroy {
  readonly uiContextMenuTrigger = input<ContextMenuItem[]>([]);

  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private menuContainer: HTMLDivElement | null = null;
  private activeMenu = signal<HTMLDivElement | null>(null);
  private activeSubmenu = signal<HTMLDivElement | null>(null);

  private readonly menuWrapperClasses = [
    'context-menu-wrapper',
    'min-w-40',
    'max-w-64',
    'overflow-hidden',
    'rounded-xl',
    'border',
    'border-border/70',
    'bg-popover/95',
    'p-1',
    'text-popover-foreground',
    'shadow-[var(--shadow-popover)]',
    'backdrop-blur-sm',
  ].join(' ');

  private readonly menuItemBaseClasses = [
    'menu-item',
    'group',
    'flex',
    'h-8',
    'items-center',
    'gap-2',
    'rounded-md',
    'px-3',
    'text-sm',
    'outline-none',
    'transition-colors',
    'duration-150',
    'ease-out',
    'cursor-pointer',
    'select-none',
  ].join(' ');

  ngAfterViewInit(): void {
    const element = this.elementRef.nativeElement;
    element.addEventListener('contextmenu', this.onContextMenu);
  }

  ngOnDestroy(): void {
    const element = this.elementRef.nativeElement;
    element.removeEventListener('contextmenu', this.onContextMenu);
    this.closeMenu();
  }

  private onContextMenu = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    this.closeMenu();
    this.showMenu(event.clientX, event.clientY);
  };

  private showMenu(x: number, y: number): void {
    this.menuContainer = document.createElement('div');
    this.menuContainer.className = 'fixed z-50';
    this.menuContainer.style.left = `${x}px`;
    this.menuContainer.style.top = `${y}px`;
    document.body.appendChild(this.menuContainer);

    const menuEl = document.createElement('div');
    menuEl.className = this.menuWrapperClasses;
    menuEl.setAttribute('role', 'menu');
    menuEl.setAttribute('aria-label', 'Context menu');
    this.activeMenu.set(menuEl);
    this.menuContainer.appendChild(menuEl);

    this.renderMenu(menuEl, this.uiContextMenuTrigger());
    this.positionMenu();

    setTimeout(() => {
      document.addEventListener('click', this.closeMenuOnClick);
      document.addEventListener('keydown', this.handleGlobalKeydown, true);
      this.focusFirstMenuItem();
    }, 0);
  }

  private renderMenu(container: HTMLDivElement, items: ContextMenuItem[]): void {
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }

    container.className = this.menuWrapperClasses;
    container.setAttribute('role', 'menu');

    items.forEach((item) => {
      const itemEl = this.createMenuItem(item);
      container.appendChild(itemEl);
    });
  }

  private createMenuItem(item: ContextMenuItem): HTMLDivElement {
    const div = document.createElement('div');
    div.className = this.menuItemBaseClasses;
    div.setAttribute('role', 'menuitem');
    div.tabIndex = item.disabled ? -1 : 0;

    if (item.disabled) {
      div.classList.add('disabled', 'pointer-events-none', 'cursor-not-allowed', 'opacity-45');
      div.setAttribute('aria-disabled', 'true');
    }

    if (item.inset) {
      div.classList.add('pl-6');
    }

    if (item.destructive) {
      div.classList.add(
        'text-destructive',
        'hover:bg-destructive/10',
        'hover:text-destructive',
        'focus-visible:bg-destructive/10',
        'focus-visible:text-destructive',
      );
    } else {
      div.classList.add(
        'hover:bg-accent',
        'hover:text-accent-foreground',
        'focus-visible:bg-accent',
        'focus-visible:text-accent-foreground',
      );
    }

    const iconEl = this.createIconElement(item.icon);
    if (iconEl) {
      div.appendChild(iconEl);
    }

    const label = document.createElement('span');
    label.className = 'menu-label flex-1 truncate';
    label.textContent = item.label;
    div.appendChild(label);

    if (item.shortcut) {
      const shortcut = document.createElement('span');
      shortcut.className =
        'menu-shortcut ml-auto text-[11px] text-muted-foreground transition-colors duration-150 group-hover:text-current';
      shortcut.textContent = item.shortcut;
      div.appendChild(shortcut);
    }

    if (item.children && item.children.length > 0) {
      const arrow = document.createElement('span');
      arrow.className = 'ml-auto inline-flex h-4 w-4 items-center justify-center text-muted-foreground';
      arrow.appendChild(this.createGlyphIcon('chevron-right'));
      div.appendChild(arrow);
    }

    if (!item.disabled) {
      div.addEventListener('click', (e) => {
        e.stopPropagation();
        item.action?.();
        this.closeMenu();
      });

      div.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          item.action?.();
          this.closeMenu();
        }
      });
    }

    return div;
  }

  private createIconElement(
    icon: ContextMenuItem['icon'],
  ): HTMLSpanElement | null {
    const normalized = this.normalizeIcon(icon);
    if (!normalized) {
      return null;
    }

    const wrapper = document.createElement('span');
    wrapper.className = 'menu-icon inline-flex h-4 w-4 shrink-0 items-center justify-center';

    if (normalized.type === 'swatch') {
      const dot = document.createElement('span');
      dot.className = 'block h-2.5 w-2.5 rounded-full border';
      dot.style.background = normalized.color;
      dot.style.borderColor =
        normalized.borderColor ?? 'color-mix(in oklch, var(--border) 70%, transparent)';
      wrapper.appendChild(dot);
      return wrapper;
    }

    wrapper.appendChild(this.createGlyphIcon(normalized.name));
    return wrapper;
  }

  private normalizeIcon(icon: ContextMenuItem['icon']): ContextMenuIcon | null {
    if (!icon) {
      return null;
    }

    if (typeof icon === 'string') {
      if (icon.includes('<svg')) {
        return { type: 'icon', name: 'dot' };
      }

      return { type: 'icon', name: this.mapLegacyIconName(icon) };
    }

    if (icon.type === 'swatch') {
      return icon;
    }

    return { type: 'icon', name: this.mapLegacyIconName(icon.name) };
  }

  private mapLegacyIconName(token: string): ContextMenuIconName {
    const normalized = token.trim().toLowerCase();

    switch (normalized) {
      case 'back':
      case 'arrow-left':
      case 'chevron-left':
        return 'chevron-left';
      case 'forward':
      case 'arrow-right':
      case 'chevron-right':
        return 'chevron-right';
      case 'reload':
      case 'refresh':
      case 'refresh-cw':
        return 'refresh-cw';
      case 'copy':
        return 'copy';
      case 'paste':
      case 'clipboard':
        return 'clipboard';
      case 'delete':
      case 'close':
      case 'x':
        return 'x';
      case 'bookmark':
        return 'bookmark';
      case 'user':
      case 'profile':
        return 'user';
      case 'edit':
      case 'rename':
      case 'pencil':
        return 'edit';
      case 'check':
      case 'tick':
        return 'check';
      case 'plus':
      case 'add':
        return 'plus';
      default:
        return 'dot';
    }
  }

  private createGlyphIcon(name: ContextMenuIconName): SVGSVGElement {
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('width', '14');
    svg.setAttribute('height', '14');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '2');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');

    const appendPath = (d: string) => {
      const path = document.createElementNS(ns, 'path');
      path.setAttribute('d', d);
      svg.appendChild(path);
    };

    const appendLine = (x1: string, y1: string, x2: string, y2: string) => {
      const line = document.createElementNS(ns, 'line');
      line.setAttribute('x1', x1);
      line.setAttribute('y1', y1);
      line.setAttribute('x2', x2);
      line.setAttribute('y2', y2);
      svg.appendChild(line);
    };

    const appendRect = (x: string, y: string, width: string, height: string, rx: string) => {
      const rect = document.createElementNS(ns, 'rect');
      rect.setAttribute('x', x);
      rect.setAttribute('y', y);
      rect.setAttribute('width', width);
      rect.setAttribute('height', height);
      rect.setAttribute('rx', rx);
      rect.setAttribute('ry', rx);
      svg.appendChild(rect);
    };

    const appendCircle = (cx: string, cy: string, r: string) => {
      const circle = document.createElementNS(ns, 'circle');
      circle.setAttribute('cx', cx);
      circle.setAttribute('cy', cy);
      circle.setAttribute('r', r);
      svg.appendChild(circle);
    };

    switch (name) {
      case 'chevron-left':
        appendPath('m15 18-6-6 6-6');
        break;
      case 'chevron-right':
        appendPath('m9 18 6-6-6-6');
        break;
      case 'refresh-cw':
        appendPath('M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8');
        appendPath('M3 3v5h5');
        appendPath('M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16');
        appendPath('M16 16h5v5');
        break;
      case 'copy':
        appendRect('8', '8', '14', '14', '2');
        appendPath('M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2');
        break;
      case 'clipboard':
        appendRect('8', '2', '8', '4', '1');
        appendPath('M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2');
        break;
      case 'x':
        appendLine('18', '6', '6', '18');
        appendLine('6', '6', '18', '18');
        break;
      case 'bookmark':
        appendPath('m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z');
        break;
      case 'user':
        appendPath('M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2');
        appendCircle('12', '7', '4');
        break;
      case 'edit':
        appendPath('M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7');
        appendPath('M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z');
        break;
      case 'check': {
        const polyline = document.createElementNS(ns, 'polyline');
        polyline.setAttribute('points', '20 6 9 17 4 12');
        svg.appendChild(polyline);
        break;
      }
      case 'plus':
        appendLine('12', '5', '12', '19');
        appendLine('5', '12', '19', '12');
        break;
      case 'dot': {
        svg.setAttribute('stroke', 'none');
        svg.setAttribute('fill', 'currentColor');
        appendCircle('12', '12', '3.5');
        break;
      }
    }

    return svg;
  }

  private positionMenu(): void {
    if (!this.menuContainer) {
      return;
    }

    const rect = this.menuContainer.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let x = parseFloat(this.menuContainer.style.left);
    let y = parseFloat(this.menuContainer.style.top);

    if (x + rect.width > viewportWidth) {
      x = viewportWidth - rect.width - 8;
      this.menuContainer.style.left = `${x}px`;
    }

    if (y + rect.height > viewportHeight) {
      y = viewportHeight - rect.height - 8;
      this.menuContainer.style.top = `${y}px`;
    }
  }

  private closeMenuOnClick = (event: MouseEvent) => {
    const target = event.target as Node | null;
    if (target && this.menuContainer?.contains(target)) {
      return;
    }
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

  private closeMenu(): void {
    document.removeEventListener('click', this.closeMenuOnClick);
    document.removeEventListener('keydown', this.handleGlobalKeydown, true);

    if (this.menuContainer) {
      this.menuContainer.remove();
      this.menuContainer = null;
    }

    this.activeMenu.set(null);
    this.activeSubmenu.set(null);
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

  private getMenuItems(): HTMLDivElement[] {
    return Array.from(
      this.menuContainer?.querySelectorAll<HTMLDivElement>('.menu-item:not(.disabled)') ?? [],
    );
  }
}
