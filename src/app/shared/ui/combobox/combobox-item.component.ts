/**
 * Combobox Item Component
 *
 * Individual selectable item in combobox dropdown.
 * Displays a check indicator when selected.
 * Supports keyboard navigation and filtering.
 *
 * Usage:
 * <div spark-combobox-item value="option1">Option 1</div>
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
  signal,
} from '@angular/core';
import { cn } from '@app/shared';
import { COMBOBOX_ROOT, type ComboboxItemDef } from './combobox-root.component';

@Component({
  selector: 'div[spark-combobox-item]',
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
      <span class="pointer-events-none absolute right-2 flex items-center justify-center">
        <svg
          class="h-3.5 w-3.5"
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
export class ComboboxItemComponent {
  private readonly root = inject(COMBOBOX_ROOT);
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly destroyRef = inject(DestroyRef);

  readonly value = input.required<string>();
  readonly disabled = input<boolean>(false);
  readonly class = input<string>('');
  readonly showIndicator = input<boolean>(true);

  readonly triggered = output<string>();

  protected readonly isSelected = computed(() => this.root.value() === this.value());
  protected readonly itemId = computed(() => `combobox-item-${this.value()}`);

  // Get the label for filtering (from content or use value)
  protected readonly label = signal('');

  protected readonly tabindex = computed(() => {
    if (this.disabled()) {
      return -1;
    }
    // Only tabbable if it matches the search filter
    const search = this.root.searchValue();
    if (search && this.root.filterable()) {
      const searchLower = search.toLowerCase();
      const labelLower = this.label().toLowerCase();
      if (!labelLower.includes(searchLower)) {
        return -1;
      }
    }
    return 0;
  });

  // Check if item is visible (matches search filter)
  protected readonly isVisible = computed(() => {
    const search = this.root.searchValue();
    if (!search || !this.root.filterable()) {
      return true;
    }
    const searchLower = search.toLowerCase();
    const labelLower = this.label().toLowerCase();
    return labelLower.includes(searchLower);
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
      'px-[var(--combobox-item-padding-x)]',
      'py-[var(--combobox-item-padding-y)]',
      'text-sm',
      'outline-none',
      'transition-colors',
      // Focus/hover styles
      'focus:bg-accent',
      'focus:text-accent-foreground',
      'data-[highlighted]:bg-accent',
      'data-[highlighted]:text-accent-foreground',
      // Selected styles
      this.isSelected() && 'bg-accent',
      this.isSelected() && 'text-accent-foreground',
      // Disabled styles
      this.disabled() && 'opacity-[var(--opacity-disabled)]',
      this.disabled() && 'pointer-events-none',
      // Hide if not matching filter
      !this.isVisible() && 'hidden',
      // Padding for indicator
      this.showIndicator() && 'pr-8',
      // Custom class
      this.class()
    );
  });

  constructor() {
    // Register this item with root
    const itemDef: ComboboxItemDef = {
      value: '',
      label: '',
      disabled: computed(() => this.disabled()),
      elementRef: this.elementRef,
    };

    // Update value and label after component initialization
    afterNextRender(() => {
      itemDef.value = this.value();
      // Get label from element content
      const textContent = this.elementRef.nativeElement.textContent?.trim() || '';
      this.label.set(textContent);
      itemDef.label = textContent;
    });

    this.root.registerItem(itemDef);
    this.destroyRef.onDestroy(() => {
      this.root.unregisterItem(itemDef.value);
    });
  }

  select(): void {
    if (this.disabled() || !this.isVisible()) {
      return;
    }
    this.root.setSelectedValue(this.value());
    this.triggered.emit(this.value());
  }

  onMouseEnter(): void {
    if (this.disabled() || !this.isVisible()) {
      return;
    }
    // Update focused index when hovering
    const search = this.root.searchValue();
    let visibleIndex = 0;
    const items = this.root.items();
    for (const item of items) {
      const itemDisabled = item.disabled();
      if (itemDisabled) {
        continue;
      }
      const itemLabel = item.label.toLowerCase();
      const searchLower = (search || '').toLowerCase();
      if (searchLower && !itemLabel.includes(searchLower)) {
        continue;
      }
      if (item.value === this.value()) {
        this.root.setFocusedIndex(visibleIndex);
        return;
      }
      visibleIndex++;
    }
  }

  handleKeydown(event: KeyboardEvent): void {
    if (this.disabled() || !this.isVisible()) {
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
