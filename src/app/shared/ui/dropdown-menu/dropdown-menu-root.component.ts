/**
 * Dropdown Menu Root Component
 *
 * Provides context for all dropdown menu children using Angular signals.
 * Manages open state, keyboard navigation, and item registration.
 *
 * Usage:
 * <div spark-dropdown-menu-root [(open)]="isOpen">
 *   <button spark-dropdown-menu-trigger>
 *     Open Menu
 *   </button>
 *   <div spark-dropdown-menu-content>
 *     <div spark-dropdown-menu-item>Item 1</div>
 *   </div>
 * </div>
 */

import {
  Component,
  input,
  model,
  signal,
  computed,
  inject,
  InjectionToken,
  ChangeDetectionStrategy,
  DestroyRef,
  ElementRef,
  afterNextRender,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { fromEvent } from 'rxjs';
import type { Signal } from '@angular/core';
import { cn } from '@app/shared';

/** Injection token for dropdown menu root context */
export const DROPDOWN_MENU_ROOT = new InjectionToken<DropdownMenuRootToken>('DROPDOWN_MENU_ROOT');

export interface DropdownMenuRootToken {
  readonly isOpen: Signal<boolean>;
  readonly disabled: Signal<boolean>;
  readonly openMenu: () => void;
  readonly close: () => void;
  readonly toggle: () => void;
  readonly triggerElementRef: Signal<ElementRef<HTMLElement> | null>;
  readonly contentElementRef: Signal<ElementRef<HTMLElement> | null>;
  readonly registerTrigger: (ref: ElementRef<HTMLElement>) => void;
  readonly registerContent: (ref: ElementRef<HTMLElement>) => void;
  readonly focusedIndex: Signal<number>;
  readonly setFocusedIndex: (index: number) => void;
  readonly items: Signal<DropdownMenuItemDef[]>;
  readonly registerItem: (item: DropdownMenuItemDef) => void;
  readonly unregisterItem: (value: string) => void;
  readonly registerCheckboxItem: (item: DropdownMenuCheckboxItemDef) => void;
  readonly unregisterCheckboxItem: (value: string) => void;
  readonly radioGroups: Signal<Map<string, DropdownMenuRadioGroupDef>>;
  readonly registerRadioGroup: (value: string, group: DropdownMenuRadioGroupDef) => void;
  readonly unregisterRadioGroup: (value: string) => void;
}

export interface DropdownMenuItemDef {
  value: string;
  disabled: boolean;
  elementRef: ElementRef<HTMLElement>;
  // Note: disabled is a boolean value, not a getter
}

export interface DropdownMenuCheckboxItemDef {
  value: string;
  checked: Signal<boolean>;
  disabled: boolean;
  elementRef: ElementRef<HTMLElement>;
}

export interface DropdownMenuRadioGroupDef {
  value: Signal<string | null>;
  items: Signal<DropdownMenuItemDef[]>;
  registerItem: (item: DropdownMenuItemDef) => void;
  unregisterItem: (value: string) => void;
}

@Component({
  selector: 'div[spark-dropdown-menu-root]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'hostClass()',
    '[attr.data-state]': 'isOpen() ? "open" : "closed"',
  },
  template: '<ng-content />',
  providers: [
    {
      provide: DROPDOWN_MENU_ROOT,
      useExisting: DropdownMenuRootComponent,
    },
  ],
})
export class DropdownMenuRootComponent implements DropdownMenuRootToken {
  private readonly destroyRef = inject(DestroyRef);
  private readonly elementRef = inject(ElementRef<HTMLElement>);

  // Public API
  readonly disabled = input<boolean>(false);
  readonly modal = input<boolean>(true);
  readonly class = input<string>('');

  // Model for two-way binding
  readonly open = model<boolean>(false);

  // Internal state
  readonly isOpen: Signal<boolean> = this.open;
  readonly focusedIndex = signal(0);
  readonly items = signal<DropdownMenuItemDef[]>([]);
  readonly checkboxItems = signal<Map<string, DropdownMenuCheckboxItemDef>>(new Map());
  readonly radioGroups = signal<Map<string, DropdownMenuRadioGroupDef>>(new Map());
  readonly triggerElementRef = signal<ElementRef<HTMLElement> | null>(null);
  readonly contentElementRef = signal<ElementRef<HTMLElement> | null>(null);

  // Computed
  protected readonly hostClass = computed(() => {
    return cn('relative', this.isOpen() && 'z-50', this.class());
  });

  // API for child components
  readonly openMenu = (): void => {
    if (this.disabled()) {
      return;
    }
    this.open.set(true);
    // Reset focused index to first enabled item
    const enabledItems = this.items().filter((item) => !item.disabled);
    if (enabledItems.length > 0) {
      this.focusedIndex.set(0);
    }
  };

  readonly close = (): void => {
    this.open.set(false);
    // Return focus to trigger
    afterNextRender(() => {
      this.triggerElementRef()?.nativeElement?.focus();
    });
  };

  readonly toggle = (): void => {
    if (this.disabled()) {
      return;
    }
    if (this.isOpen()) {
      this.close();
    } else {
      this.openMenu();
    }
  };

  readonly registerTrigger = (ref: ElementRef<HTMLElement>): void => {
    this.triggerElementRef.set(ref);
  };

  readonly registerContent = (ref: ElementRef<HTMLElement>): void => {
    this.contentElementRef.set(ref);
  };

  readonly setFocusedIndex = (index: number): void => {
    this.focusedIndex.set(index);
  };

  readonly registerItem = (item: DropdownMenuItemDef): void => {
    this.items.update((items) => [...items, item]);
  };

  readonly unregisterItem = (value: string): void => {
    this.items.update((items) => items.filter((item) => item.value !== value));
  };

  readonly registerCheckboxItem = (item: DropdownMenuCheckboxItemDef): void => {
    const map = new Map(this.checkboxItems());
    map.set(item.value, item);
    this.checkboxItems.set(map);
  };

  readonly unregisterCheckboxItem = (value: string): void => {
    const map = new Map(this.checkboxItems());
    map.delete(value);
    this.checkboxItems.set(map);
  };

  readonly registerRadioGroup = (value: string, group: DropdownMenuRadioGroupDef): void => {
    const map = new Map(this.radioGroups());
    map.set(value, group);
    this.radioGroups.set(map);
  };

  readonly unregisterRadioGroup = (value: string): void => {
    const map = new Map(this.radioGroups());
    map.delete(value);
    this.radioGroups.set(map);
  };

  constructor() {
    this.setupClickOutsideListener();
  }

  private setupClickOutsideListener(): void {
    fromEvent<MouseEvent>(document, 'click')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((evt: MouseEvent) => {
        if (!this.isOpen()) {
          return;
        }
        const target = evt.target as HTMLElement;
        const nativeElement = this.elementRef.nativeElement;
        if (nativeElement && !nativeElement.contains(target)) {
          this.close();
        }
      });
  }
}
