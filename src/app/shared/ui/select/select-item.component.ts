/**
 * Select Item Component
 *
 * Individual selectable item in the select dropdown.
 * Displays a check indicator when selected.
 *
 * Usage:
 * <div spark-select-item value="option1">Option 1</div>
 */

import {
  Component,
  input,
  output,
  signal,
  computed,
  inject,
  ChangeDetectionStrategy,
  ElementRef,
  DestroyRef,
  afterNextRender,
} from '@angular/core';
import { cn } from '@app/shared';
import { SELECT_ROOT, type SelectRootToken, type SelectItemDef } from './select-root.component';

@Component({
  selector: 'div[spark-select-item]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'hostClass()',
    '[attr.role]': '"option"',
    '[attr.tabindex]': 'tabindex()',
    '[attr.aria-selected]': 'isSelected()',
    '[attr.data-selected]': 'isSelected() ? "" : null',
    '[attr.id]': 'itemId()',
    '[attr.disabled]': 'disabled() ? "" : null',
    '(click)': 'select()',
    '(mouseenter)': 'onMouseEnter()',
    '(keydown)': 'handleKeydown($event)',
  },
  template: `
    <ng-content />
    @if (showIndicator()) {
      <span class="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        <svg
          class="h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      </span>
    }
  `,
})
export class SelectItemComponent {
  private readonly root = inject(SELECT_ROOT);
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly destroyRef = inject(DestroyRef);

  readonly value = input.required<string>();
  readonly disabled = input<boolean>(false);
  readonly class = input<string>('');
  readonly showIndicator = input<boolean>(true);

  readonly triggered = output<string>();

  protected readonly isSelected = computed(() => this.root.value() === this.value());
  protected readonly itemId = computed(() => 'select-item-${this.value()}');

  protected readonly tabindex = computed(() => {
    if (this.disabled()) {
      return -1;
    }
    const items = this.root.items();
    const enabledItems = items.filter((item: SelectItemDef) => !item.disabled);
    const index = enabledItems.findIndex((item: SelectItemDef) => item.value === this.value());
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
      'px-[var(--select-item-padding-x)]',
      'py-[var(--select-item-padding-y)]',
      'text-sm',
      'outline-none',
      'transition-colors',
      // Focus styles
      'focus:bg-accent',
      'focus:text-accent-foreground',
      // Selected styles
      this.isSelected() && 'bg-accent',
      this.isSelected() && 'text-accent-foreground',
      // Disabled styles
      this.disabled() && 'opacity-[var(--opacity-disabled)]',
      this.disabled() && 'pointer-events-none',
      // Padding for indicator
      this.showIndicator() && 'pl-8',
      // Custom class
      this.class()
    );
  });

  constructor() {
    // Create a signal for disabled state to match SelectItemDef interface
    const disabledSignal = signal(this.disabled());

    // Register this item with root - value will be resolved when accessed via getter
    const itemDef: SelectItemDef = {
      value: '',
      disabled: disabledSignal,
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
    this.root.setSelectedValue(this.value());
    this.triggered.emit(this.value());
  }

  onMouseEnter(): void {
    if (this.disabled()) {
      return;
    }
    // Update focused index when hovering
    const items = this.root.items();
    const enabledItems = items.filter((item: SelectItemDef) => {
      const itemDisabled = item.disabled();
      return !itemDisabled;
    });
    const index = enabledItems.findIndex((item: SelectItemDef) => item.value === this.value());
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
