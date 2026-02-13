/**
 * Combobox Root Component
 *
 * Provides context for all combobox children using Angular signals.
 * Manages open state, selected value, search/filter functionality, and keyboard navigation.
 *
 * Usage:
 * <div spark-combobox-root [(value)]="selectedValue">
 *   <input spark-combobox-input placeholder="Search..." />
 *   <div spark-combobox-content>
 *     <div spark-combobox-list>
 *       <div spark-combobox-item value="option1">Option 1</div>
 *       <div spark-combobox-empty>No results found</div>
 *     </div>
 *   </div>
 * </div>
 */

import {
  Component,
  input,
  output,
  model,
  computed,
  inject,
  InjectionToken,
  ChangeDetectionStrategy,
  DestroyRef,
  ElementRef,
  signal,
  Signal,
  WritableSignal,
  effect,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { fromEvent } from 'rxjs';
import { cn } from '@app/shared';

/** Injection token for combobox root context */
export const COMBOBOX_ROOT = new InjectionToken<ComboboxRootToken>('COMBOBOX_ROOT');

export interface ComboboxRootToken {
  readonly value: WritableSignal<string | null>;
  readonly isOpen: WritableSignal<boolean>;
  readonly disabled: Signal<boolean>;
  readonly searchValue: WritableSignal<string>;
  readonly filterable: Signal<boolean>;
  readonly setSelectedValue: (value: string) => void;
  readonly open: () => void;
  readonly close: () => void;
  readonly toggle: () => void;
  readonly triggerElementRef: WritableSignal<ElementRef<HTMLElement> | null>;
  readonly contentElementRef: WritableSignal<ElementRef<HTMLElement> | null>;
  readonly registerTrigger: (ref: ElementRef<HTMLElement>) => void;
  readonly registerContent: (ref: ElementRef<HTMLElement>) => void;
  readonly focusedIndex: WritableSignal<number>;
  readonly setFocusedIndex: (index: number) => void;
  readonly items: WritableSignal<ComboboxItemDef[]>;
  readonly registerItem: (item: ComboboxItemDef) => void;
  readonly unregisterItem: (value: string) => void;
  readonly hasItems: Signal<boolean>;
  readonly getEnabledItems: () => ComboboxItemDef[];
}

export interface ComboboxItemDef {
  value: string;
  label: string;
  disabled: Signal<boolean>;
  elementRef: ElementRef<HTMLElement>;
}

@Component({
  selector: 'div[spark-combobox-root]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'hostClass()',
    '[attr.data-state]': 'isOpen() ? "open" : "closed"',
  },
  template: '<ng-content />',
  providers: [
    {
      provide: COMBOBOX_ROOT,
      useExisting: ComboboxRootComponent,
    },
  ],
})
export class ComboboxRootComponent implements ComboboxRootToken {
  private readonly destroyRef = inject(DestroyRef);
  private readonly elementRef = inject(ElementRef<HTMLElement>);

  // Public API
  readonly disabled = input<boolean>(false);
  readonly placeholder = input<string>('');
  readonly ariaLabel = input<string>('');
  readonly class = input<string>('');
  readonly filterable = input<boolean>(true);

  // Model for two-way binding - creates 'value' input and 'valueChange' output
  readonly value = model<string | null>(null);

  // Events
  readonly openedChange = output<boolean>();
  readonly searchChange = output<string>();

  // Internal state
  readonly isOpen = signal(false);
  readonly focusedIndex = signal(0);
  readonly items = signal<ComboboxItemDef[]>([]);
  readonly searchValue = signal('');
  readonly triggerElementRef = signal<ElementRef<HTMLElement> | null>(null);
  readonly contentElementRef = signal<ElementRef<HTMLElement> | null>(null);

  // Computed
  protected readonly hostClass = computed(() => {
    return cn('relative', this.isOpen() && 'z-50', this.class());
  });

  // Signal to track if there are any filtered items
  readonly hasItems = computed(() => {
    const search = this.searchValue();
    if (!search || !this.filterable()) {
      return this.items().length > 0;
    }
    const searchLower = search.toLowerCase();
    return this.items().some((item) =>
      item.label.toLowerCase().includes(searchLower)
    );
  });

  // API for child components
  readonly setSelectedValue = (value: string): void => {
    this.value.set(value);
    this.searchValue.set('');
    this.close();
  };

  readonly open = (): void => {
    const disabled = this.disabled();
    if (disabled) {
      return;
    }
    this.isOpen.set(true);
    this.openedChange.emit(true);
    // Reset focused index to first enabled item
    const enabledItems = this.getEnabledItems();
    if (enabledItems.length > 0) {
      this.focusedIndex.set(0);
    }
  };

  readonly close = (): void => {
    this.isOpen.set(false);
    this.openedChange.emit(false);
    // Return focus to trigger
    this.triggerElementRef()?.nativeElement?.focus();
  };

  readonly toggle = (): void => {
    const disabled = this.disabled();
    if (disabled) {
      return;
    }
    if (this.isOpen()) {
      this.close();
    } else {
      this.open();
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

  readonly registerItem = (item: ComboboxItemDef): void => {
    this.items.update((items) => [...items, item]);
  };

  readonly unregisterItem = (value: string): void => {
    this.items.update((items) => items.filter((item) => item.value !== value));
  };

  constructor() {
    this.setupClickOutsideListener();
    this.setupSearchEffect();
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

  private setupSearchEffect(): void {
    effect(() => {
      const search = this.searchValue();
      this.searchChange.emit(search);
      // Reset focused index when search changes
      const enabledItems = this.getEnabledItems();
      if (enabledItems.length > 0) {
        this.focusedIndex.set(0);
      } else {
        this.focusedIndex.set(-1);
      }
    });
  }

  readonly getEnabledItems = (): ComboboxItemDef[] => {
    const search = this.searchValue();
    if (!search || !this.filterable()) {
      return this.items().filter((item) => !item.disabled());
    }
    const searchLower = search.toLowerCase();
    return this.items().filter((item) => {
      if (item.disabled()) {
        return false;
      }
      return item.label.toLowerCase().includes(searchLower);
    });
  }
}
