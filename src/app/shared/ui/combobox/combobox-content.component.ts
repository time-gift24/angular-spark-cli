/**
 * Combobox Content Component
 *
 * The dropdown panel that contains combobox items.
 * Positioned absolutely below the input.
 *
 * Usage:
 * <div spark-combobox-content class="...">
 *   <ng-content />
 * </div>
 */

import {
  Component,
  input,
  computed,
  inject,
  ChangeDetectionStrategy,
  ElementRef,
} from '@angular/core';
import { cn } from '@app/shared';
import { COMBOBOX_ROOT, type ComboboxRootToken, type ComboboxItemDef } from './combobox-root.component';

@Component({
  selector: 'div[spark-combobox-content]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'hostClass()',
    '[class.animate-in]': 'animateIn()',
    '[class.fade-in-0]': 'animateIn()',
    '[class.zoom-in-95]': 'animateIn()',
    '[attr.data-state]': 'isOpen() ? "open" : "closed"',
    '[attr.id]': 'contentId()',
  },
  template: `
    @if (isOpen()) {
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
})
export class ComboboxContentComponent {
  readonly root: ComboboxRootToken = inject(COMBOBOX_ROOT);
  private readonly elementRef = inject(ElementRef<HTMLElement>);

  readonly class = input<string>('');
  readonly align = input<'start' | 'center' | 'end'>('start');
  readonly side = input<'top' | 'right' | 'bottom' | 'left'>('bottom');
  readonly animate = input<boolean>(true);
  readonly inputId = input<string>('');

  readonly contentId = computed(() => {
    const baseId = this.inputId() || 'combobox';
    return `${baseId}-content`;
  });

  protected readonly isOpen = this.root.isOpen;

  protected readonly hostClass = computed(() => {
    return cn(
      'absolute z-50',
      'w-full',
      'min-w-[var(--combobox-content-min-width)]',
      this.isOpen() && 'block',
      !this.isOpen() && 'hidden',
      this.class()
    );
  });

  protected readonly animateIn = computed(() => this.animate() && this.isOpen());
  protected readonly contentClass = computed(() => {
    return cn(
      // Base styles
      'overflow-hidden',
      'rounded-lg',
      'border',
      'border-border',
      'bg-popover',
      'text-popover-foreground',
      'shadow-md',
      'shadow-popover',
      'ring-1',
      'ring-foreground/10',
      // Animation
      this.animate() && 'animate-in',
      this.animate() && 'fade-in-0',
      this.animate() && 'zoom-in-95',
      // Positioning
      'mt-1',
      // Max height for scrolling
      'max-h-[var(--combobox-content-max-height)]',
      'overflow-y-auto',
      // Inner padding
      'p-1'
    );
  });

  // Get all enabled items for navigation
  private getEnabledItems(): ComboboxItemDef[] {
    const search = this.root.searchValue();
    if (!search || !this.root.filterable()) {
      return this.root.items().filter((item: ComboboxItemDef) => !item.disabled());
    }
    const searchLower = search.toLowerCase();
    return this.root.items().filter((item: ComboboxItemDef) => {
      if (item.disabled()) {
        return false;
      }
      return item.label.toLowerCase().includes(searchLower);
    });
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

  handleNavigate(direction: number, event: KeyboardEvent): void {
    const enabledItems = this.getEnabledItems();
    if (enabledItems.length === 0) {
      return;
    }

    event.preventDefault();

    const currentIndex = this.root.focusedIndex();
    const newIndex = this.wrapIndex(currentIndex + direction, enabledItems.length);
    this.root.setFocusedIndex(newIndex);

    // Focus new item
    const item = enabledItems[newIndex];
    if (item?.elementRef) {
      (item.elementRef.nativeElement as HTMLElement).focus();
    }
  }

  handleHome(event: KeyboardEvent): void {
    const enabledItems = this.getEnabledItems();
    if (enabledItems.length > 0) {
      event.preventDefault();
      this.root.setFocusedIndex(0);
      enabledItems[0]?.elementRef?.nativeElement?.focus();
    }
  }

  handleEnd(event: KeyboardEvent): void {
    const enabledItems = this.getEnabledItems();
    if (enabledItems.length > 0) {
      event.preventDefault();
      const lastIndex = enabledItems.length - 1;
      this.root.setFocusedIndex(lastIndex);
      enabledItems[lastIndex]?.elementRef?.nativeElement?.focus();
    }
  }

  handleEnter(event: KeyboardEvent): void {
    const enabledItems = this.getEnabledItems();
    const currentIndex = this.root.focusedIndex();
    const item = enabledItems[currentIndex];
    if (item) {
      event.preventDefault();
      this.root.setSelectedValue(item.value);
    }
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
