/**
 * Dropdown Menu Item Component
 *
 * Individual selectable item in dropdown menu.
 *
 * Usage:
 * <div spark-dropdown-menu-item>Item 1</div>
 */

import {
  Component,
  input,
  output,
  computed,
  inject,
  ChangeDetectionStrategy,
  ElementRef,
  DestroyRef,
  afterNextRender,
} from '@angular/core';
import type { Signal } from '@angular/core';
import { cn } from '@app/shared';
import {
  DROPDOWN_MENU_ROOT,
  type DropdownMenuRootToken,
  type DropdownMenuItemDef,
} from './dropdown-menu-root.component';

export type DropdownMenuItemVariant = 'default' | 'destructive';

@Component({
  selector: 'div[spark-dropdown-menu-item]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'hostClass()',
    '[attr.role]': '"menuitem"',
    '[attr.tabindex]': 'tabindex()',
    '[attr.data-inset]': 'inset() ? "" : null',
    '[attr.data-variant]': 'variant()',
    '[attr.disabled]': 'disabled() ? "" : null',
    '(click)': 'select()',
    '(mouseenter)': 'onMouseEnter()',
    '(keydown)': 'handleKeydown($event)',
  },
  template: `
    <ng-content />
  `,
})
export class DropdownMenuItemComponent {
  private readonly root: DropdownMenuRootToken = inject(DROPDOWN_MENU_ROOT);
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly destroyRef = inject(DestroyRef);

  readonly value = input.required<string>();
  readonly disabled = input<boolean>(false);
  readonly class = input<string>('');
  readonly inset = input<boolean>(false);
  readonly variant = input<DropdownMenuItemVariant>('default');

  readonly triggered = output<string>();

  protected readonly tabindex = computed(() => {
    if (this.disabled()) {
      return -1;
    }
    const items = this.root.items();
    const enabledItems = items.filter((item: DropdownMenuItemDef) => !item.disabled);
    const index = enabledItems.findIndex((item: DropdownMenuItemDef) => item.value === this.value());
    return index === this.root.focusedIndex() ? 0 : -1;
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
      'text-xs/relaxed',
      'outline-none',
      'transition-colors',
      // Focus styles
      'focus:bg-accent',
      'focus:text-accent-foreground',
      // Icon styles
      '[&_svg:not([class*=size-])]:size-3.5',
      '[&_svg]:pointer-events-none',
      '[&_svg]:shrink-0',
      // Variant styles
      this.variant() === 'destructive' && 'text-destructive',
      this.variant() === 'destructive' && 'focus:bg-destructive/10',
      this.variant() === 'destructive' && 'dark:focus:bg-destructive/20',
      this.variant() === 'destructive' && 'focus:text-destructive',
      this.variant() === 'destructive' && '[&_svg]:text-destructive',
      // Disabled styles
      this.disabled() && 'pointer-events-none',
      this.disabled() && 'opacity-50',
      // Inset padding
      this.inset() && 'pl-7.5',
      // Custom class
      this.class()
    );
  });

  constructor() {
    // Get the initial disabled value from input
    const disabledValue = this.disabled();

    // Register this item with root - value will be resolved when accessed via getter
    const itemDef: DropdownMenuItemDef = {
      value: '',
      disabled: disabledValue,
      elementRef: this.elementRef,
    };

    // Update value after component initialization
    afterNextRender(() => {
      itemDef.value = this.value();
    });

    this.root.registerItem(itemDef);
  }

  select(): void {
    if (this.disabled()) {
      return;
    }
    this.root.close();
    this.triggered.emit(this.value());
  }

  onMouseEnter(): void {
    if (this.disabled()) {
      return;
    }
    // Update focused index when hovering
    const items = this.root.items();
    const enabledItems = items.filter((item: DropdownMenuItemDef) => !item.disabled);
    const index = enabledItems.findIndex((item: DropdownMenuItemDef) => item.value === this.value());
    if (index >= 0) {
      this.root.setFocusedIndex(index);
    }
  }

  handleKeydown(event: KeyboardEvent): void {
    if (this.disabled()) {
      return;
    }

    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        this.select();
        break;
      case 'ArrowDown':
      case 'ArrowUp':
        // Let parent handle navigation
        break;
      case 'Escape':
        this.root.close();
        break;
    }
  }
}
