/**
 * Combobox Input Component
 *
 * The input field that allows users to search/filter options.
 * Works as the trigger for opening the dropdown.
 *
 * Usage:
 * <input spark-combobox-input placeholder="Search..." />
 */

import {
  Component,
  input,
  computed,
  inject,
  ChangeDetectionStrategy,
  ElementRef,
  signal,
} from '@angular/core';
import { cn } from '@app/shared';
import { COMBOBOX_ROOT, type ComboboxRootToken } from './combobox-root.component';

@Component({
  selector: 'input[spark-combobox-input]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'type': '"text"',
    '[class]': 'computedClass()',
    '[attr.disabled]': 'isRootDisabled() ? "" : null',
    '[attr.aria-expanded]': 'isOpen()',
    '[attr.aria-controls]': 'isOpen() ? comboboxContentId() : null',
    '[attr.aria-autocomplete]': '"list"',
    '[attr.role]': '"combobox"',
    '[attr.aria-label]': 'ariaLabel() || "Search options"',
    '[value]': 'searchValue()',
    '(input)': 'handleInput($event)',
    '(focus)': 'onFocus()',
    '(keydown)': 'handleKeydown($event)',
    '(click)': 'toggle()',
  },
  template: '',
})
export class ComboboxInputComponent {
  private readonly root = inject(COMBOBOX_ROOT);
  private readonly elementRef = inject(ElementRef<HTMLInputElement>);

  readonly placeholder = input<string>('');
  readonly ariaLabel = input<string>('');
  readonly class = input<string>('');

  // Unique ID for aria-controls
  readonly comboboxContentId = signal(`combobox-content-${Math.random().toString(36).substring(2, 9)}`);

  protected readonly isOpen = computed(() => this.root.isOpen());
  protected readonly isRootDisabled = computed(() => this.root.disabled());
  protected readonly searchValue = computed(() => this.root.searchValue());

  protected readonly computedClass = computed(() => {
    return cn(
      // Base styles
      'flex',
      'h-[var(--input-height)]',
      'w-full',
      'rounded-md',
      'border',
      'border-input',
      'bg-background',
      'px-[var(--input-padding-x)]',
      'py-[var(--input-padding-y)]',
      'text-sm',
      'ring-offset-background',
      // Placeholder
      'placeholder:text-muted-foreground',
      // Transitions
      'transition-colors',
      'outline-none',
      // Focus styles
      'focus-visible:ring-2',
      'focus-visible:ring-ring/20',
      'focus-visible:ring-offset-2',
      'focus-visible:ring-offset-1',
      // Disabled styles
      'disabled:cursor-not-allowed',
      'disabled:opacity-[var(--opacity-disabled)]',
      // Open state
      this.isOpen() && 'ring-2',
      this.isOpen() && 'ring-ring/20',
      this.isOpen() && 'border-ring',
      // Custom class
      this.class()
    );
  });

  constructor() {
    this.root.registerTrigger(this.elementRef);
  }

  handleInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.root.searchValue.set(target.value);
    // Open dropdown when typing
    if (!this.root.isOpen()) {
      this.root.open();
    }
  }

  onFocus(): void {
    // Auto-open on focus if not disabled
    if (!this.isRootDisabled() && !this.root.isOpen()) {
      this.root.open();
    }
  }

  toggle(): void {
    if (!this.isRootDisabled()) {
      this.root.toggle();
    }
  }

  handleKeydown(event: KeyboardEvent): void {
    if (this.isRootDisabled()) {
      return;
    }

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (!this.root.isOpen()) {
          this.root.open();
        } else {
          // Move focus to first item
          this.navigateToItem(1);
        }
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (this.root.isOpen()) {
          // Move focus to last item
          this.navigateToItem(-1);
        }
        break;
      case 'Enter':
        event.preventDefault();
        if (this.root.isOpen()) {
          // Select the focused item
          this.selectFocusedItem();
        }
        break;
      case 'Escape':
        event.preventDefault();
        this.root.close();
        break;
      case 'Tab':
        // Let tab navigation work naturally
        this.root.close();
        break;
    }
  }

  private navigateToItem(direction: number): void {
    const items = this.getEnabledItems();
    if (items.length === 0) {
      return;
    }

    const currentIndex = this.root.focusedIndex();
    const newIndex = direction > 0 ? 0 : items.length - 1;
    this.root.setFocusedIndex(newIndex);

    // Focus the item
    const item = items[newIndex];
    if (item?.elementRef) {
      (item.elementRef.nativeElement as HTMLElement).focus();
    }
  }

  private selectFocusedItem(): void {
    const items = this.getEnabledItems();
    const currentIndex = this.root.focusedIndex();
    const item = items[currentIndex];
    if (item) {
      this.root.setSelectedValue(item.value);
    }
  }

  private getEnabledItems() {
    const search = this.root.searchValue();
    if (!search || !this.root.filterable()) {
      return this.root.items().filter((item) => !item.disabled());
    }
    const searchLower = search.toLowerCase();
    return this.root.items().filter((item) => {
      if (item.disabled()) {
        return false;
      }
      return item.label.toLowerCase().includes(searchLower);
    });
  }

  focus(): void {
    this.elementRef.nativeElement?.focus();
  }
}
