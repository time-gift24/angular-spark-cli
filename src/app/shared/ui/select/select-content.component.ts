/**
 * Select Content Component
 *
 * The dropdown panel that contains select items.
 * Positioned absolutely below trigger.
 *
 * Usage:
 * <div spark-select-content class="...">
 *   <ng-content />
 * </div>
 */

import {
  Component,
  input,
  signal,
  computed,
  inject,
  ChangeDetectionStrategy,
  ElementRef,
} from '@angular/core';
import { cn } from '@app/shared';
import { SELECT_ROOT, type SelectRootToken, type SelectItemDef } from './select-root.component';

@Component({
  selector: 'div[spark-select-content]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'hostClass()',
    '[class.animate-in]': 'animateIn()',
    '[class.fade-in-0]': 'animateIn()',
    '[class.zoom-in-95]': 'animateIn()',
    '[attr.data-state]': 'isOpen() ? "open" : "closed"',
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
export class SelectContentComponent {
  readonly root: SelectRootToken = inject(SELECT_ROOT);
  private readonly elementRef = inject(ElementRef<HTMLElement>);

  readonly class = input<string>('');
  readonly align = input<'start' | 'center' | 'end'>('start');
  readonly side = input<'top' | 'right' | 'bottom' | 'left'>('bottom');
  readonly animate = input<boolean>(true);

  protected readonly isOpen = this.root.isOpen;

  protected readonly hostClass = computed(() => {
    return cn(
      'absolute z-50',
      'min-w-[var(--select-content-min-width)]',
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
      'max-h-[var(--select-content-max-height)]',
      'overflow-y-auto',
      // Inner padding
      'p-1'
    );
  });

  // Get all enabled items for navigation
  private getEnabledItems(): SelectItemDef[] {
    return this.root.items().filter((item: SelectItemDef) => !item.disabled);
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
    const enabledItems = this.getEnabledItems();
    const currentIndex = this.root.focusedIndex();
    const item = enabledItems[currentIndex];
    if (item) {
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
