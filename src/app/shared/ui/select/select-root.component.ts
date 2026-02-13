/**
 * Select Root Component
 *
 * Provides context for all select children using Angular signals.
 * Manages open state, selected value, and keyboard navigation.
 *
 * Usage:
 * <div spark-select-root [(value)]="selectedValue">
 *   <button spark-select-trigger>
 *     <span spark-select-value placeholder="Select..." />
 *   </button>
 *   <div spark-select-content>
 *     <div spark-select-item value="option1">Option 1</div>
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
  afterNextRender,
  signal,
  Signal,
  WritableSignal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { fromEvent } from 'rxjs';
import { cn } from '@app/shared';

/** Injection token for select root context */
export const SELECT_ROOT = new InjectionToken<SelectRootToken>('SELECT_ROOT');

export interface SelectRootToken {
  readonly value: WritableSignal<string | null>;
  readonly isOpen: WritableSignal<boolean>;
  readonly disabled: Signal<boolean>;
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
  readonly items: WritableSignal<SelectItemDef[]>;
  readonly registerItem: (item: SelectItemDef) => void;
  readonly unregisterItem: (value: string) => void;
}

export interface SelectItemDef {
  value: string;
  disabled: Signal<boolean>;
  elementRef: ElementRef<HTMLElement>;
}

@Component({
  selector: 'div[spark-select-root]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'hostClass()',
    '[attr.data-state]': 'isOpen() ? "open" : "closed"',
  },
  template: '<ng-content />',
  providers: [
    {
      provide: SELECT_ROOT,
      useExisting: SelectRootComponent,
    },
  ],
})
export class SelectRootComponent implements SelectRootToken {
  private readonly destroyRef = inject(DestroyRef);
  private readonly elementRef = inject(ElementRef<HTMLElement>);

  // Public API
  readonly disabled = input<boolean>(false);
  readonly placeholder = input<string>('');
  readonly ariaLabel = input<string>('');
  readonly class = input<string>('');

  // Model for two-way binding - creates 'value' input and 'valueChange' output
  readonly value = model<string | null>(null);

  // Events
  readonly openedChange = output<boolean>();
  readonly valueChange = output<string | null>();

  // Internal state
  readonly isOpen = signal(false);
  readonly focusedIndex = signal(0);
  readonly items = signal<SelectItemDef[]>([]);
  readonly triggerElementRef = signal<ElementRef<HTMLElement> | null>(null);
  readonly contentElementRef = signal<ElementRef<HTMLElement> | null>(null);

  // Computed
  protected readonly hostClass = computed(() => {
    return cn('relative', this.isOpen() && 'z-50', this.class());
  });

  // API for child components
  readonly setSelectedValue = (value: string): void => {
    this.value.set(value);
    this.valueChange.emit(value);
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
    const enabledItems = this.items().filter((item) => {
      const itemDisabled = item.disabled();
      return !itemDisabled;
    });
    if (enabledItems.length > 0) {
      this.focusedIndex.set(0);
    }
  };

  readonly close = (): void => {
    this.isOpen.set(false);
    this.openedChange.emit(false);
    // Return focus to trigger
    afterNextRender(() => {
      this.triggerElementRef()?.nativeElement?.focus();
    });
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

  readonly registerItem = (item: SelectItemDef): void => {
    this.items.update((items) => [...items, item]);
  };

  readonly unregisterItem = (value: string): void => {
    this.items.update((items) => items.filter((item) => item.value !== value));
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

/**
 * Select Trigger Component
 *
 * The button that opens/closes the select dropdown.
 */
@Component({
  selector: 'button[spark-select-trigger]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'type': 'button',
    '[class]': 'computedClass()',
    '[attr.disabled]': 'isRootDisabled() ? "" : null',
    '[attr.aria-expanded]': 'isOpen()',
    '[attr.aria-haspopup]': '"listbox"',
    '[attr.data-size]': 'size()',
    '[attr.aria-label]': 'ariaLabel() || "Select menu"',
    '(click)': 'toggle()',
    '(keydown)': 'handleKeydown($event)',
  },
  template: `
    <ng-content />
    <svg
      class="text-muted-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0"
      [class.size-3.5]="!iconSize()"
      [style.fontSize]="iconSize()"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      [class.transition-transform]="isOpen()"
      [class.rotate-180]="isOpen()"
    >
      <polyline points="6 9 12 15 18 9"></polyline>
    </svg>
  `,
})
export class SelectTriggerComponent {
  private readonly root = inject(SELECT_ROOT);
  private readonly elementRef = inject(ElementRef<HTMLElement>);

  readonly size = input<'sm' | 'md' | 'lg'>('md');
  readonly invalid = input<boolean>(false);
  readonly disabled = input<boolean>(false);
  readonly ariaLabel = input<string>('');
  readonly class = input<string>('');
  readonly iconSize = input<string | null>(null);

  protected readonly isOpen = computed(() => this.root.isOpen());
  protected readonly isRootDisabled = computed(() => this.root.disabled());

  protected readonly computedClass = computed(() => {
    const sizeClasses: Record<string, string> = {
      sm: 'h-[var(--select-height-sm)]',
      md: 'h-[var(--select-height-md)]',
      lg: 'h-[var(--select-height-lg)]',
    };

    return cn(
      // Base styles
      'inline-flex',
      'items-center',
      'justify-between',
      'gap-[var(--select-gap)]',
      'rounded-md',
      'border',
      'border-input',
      'bg-background',
      'px-[var(--select-padding-x)]',
      'py-[var(--select-padding-y)]',
      'text-sm',
      'whitespace-nowrap',
      'transition-colors',
      'outline-none',
      'disabled:cursor-not-allowed',
      'disabled:opacity-[var(--opacity-disabled)]',
      // Focus styles
      'focus-visible:ring-2',
      'focus-visible:ring-ring/20',
      'focus-visible:ring-offset-2',
      'focus-visible:ring-offset-1',
      // Invalid state
      this.invalid() && 'ring-2',
      this.invalid() && 'ring-destructive/20',
      this.invalid() && 'border-destructive',
      // Size
      sizeClasses[this.size()],
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

  toggle(): void {
    this.root.toggle();
  }

  handleKeydown(event: KeyboardEvent): void {
    if (this.isRootDisabled()) {
      return;
    }

    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowUp':
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (!this.root.isOpen()) {
          this.root.open();
        }
        break;
      case 'Escape':
        event.preventDefault();
        this.root.close();
        break;
    }
  }

  focus(): void {
    this.elementRef.nativeElement?.focus();
  }
}

/**
 * Select Value Component
 *
 * Displays the currently selected value or placeholder.
 */
@Component({
  selector: 'span[spark-select-value]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'computedClass()',
    '[attr.data-slot]': '"select-value"',
  },
  template: `
    <ng-content />
    @if (!hasValue()) {
      <span class="text-muted-foreground">{{ placeholder() }}</span>
    }
  `,
})
export class SelectValueComponent {
  private readonly root = inject(SELECT_ROOT);

  readonly placeholder = input<string>('');
  readonly class = input<string>('');

  protected readonly hasValue = computed(() => !!this.root.value());
  protected readonly computedClass = computed(() => {
    return cn(
      'flex-1',
      'line-clamp-1',
      'truncate',
      this.class()
    );
  });
}
