import {
  Component,
  input,
  output,
  computed,
  model,
  signal,
  ChangeDetectionStrategy,
  inject,
  DestroyRef,
  ElementRef,
} from '@angular/core';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@app/shared';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { fromEvent } from 'rxjs';

/**
 * Select option interface
 */
export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

/**
 * Select variants using class-variance-authority
 */
const selectVariants = cva(
  'relative flex w-full items-center justify-between rounded-md border bg-card px-3 py-2 text-sm shadow-sm transition-all duration-200 outline-none placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      state: {
        default: 'border-input hover:border-accent',
        focus: 'border-ring ring-[3px] ring-ring/50',
        error: 'border-destructive ring-[3px] ring-destructive/50',
      },
    },
    defaultVariants: {
      state: 'default',
    },
  },
);

export type SelectState = VariantProps<typeof selectVariants>['state'];

@Component({
  selector: 'div[spark-select]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'hostClass()',
    '[attr.disabled]': 'disabled() ? "" : null',
  },
  template: `
    @if (isOpen()) {
      <div
        class="absolute z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95"
        [style.top.px]="buttonHeight() + 4"
        [style.left]="0"
        (click)="stopPropagation($event)"
      >
        <div
          role="listbox"
          [attr.aria-label]="ariaLabel() || 'Select options'"
          class="max-h-[200px] overflow-auto py-1"
        >
          @for (option of options(); track option.value; let i = $index) {
            @if (!option.disabled) {
              <div
                role="option"
                [attr.aria-selected]="isSelected(option.value)"
                class="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                [class.bg-accent]="isSelected(option.value)"
                [class.text-accent-foreground]="isSelected(option.value)"
                (click)="selectOption(option.value); $event.preventDefault()"
                (mouseenter)="focusedIndex.set(i)"
              >
                <span class="truncate">{{ option.label }}</span>
                @if (isSelected(option.value)) {
                  <svg
                    class="ml-auto size-4"
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
                }
              </div>
            }
          }
        </div>
      </div>
    }

    <button
      type="button"
      [class]="triggerClass()"
      [attr.disabled]="disabled() ? '' : null"
      [attr.aria-expanded]="isOpen()"
      [attr.aria-haspopup]="true"
      [attr.aria-label]="ariaLabel() || selectedLabel()"
      (click)="toggle()"
      (keydown)="handleKeydown($event)"
      class="flex w-full items-center justify-between gap-2"
    >
      <span class="truncate">
        {{ selectedLabel() }}
      </span>
      <svg
        class="size-4 opacity-50 transition-transform duration-200"
        [class.rotate-180]="isOpen()"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <polyline points="6 9 12 15 18 9"></polyline>
      </svg>
    </button>
  `,
  styles: [
    `
      :host {
        display: block;
        position: relative;
      }
    `,
  ],
})
export class SelectComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly elementRef = inject(ElementRef);

  readonly options = input.required<SelectOption[]>();
  readonly placeholder = input<string>('Select...');
  readonly disabled = input<boolean, string | boolean>(false, {
    transform: (value: string | boolean) => {
      if (typeof value === 'string') {
        return value !== 'false';
      }
      return value;
    },
  });
  readonly error = input<boolean, string | boolean>(false, {
    transform: (value: string | boolean) => {
      if (typeof value === 'string') {
        return value !== 'false';
      }
      return value;
    },
  });
  readonly ariaLabel = input<string>('');
  readonly class = input<string>('');

  /**
   * Two-way binding using model()
   */
  readonly value = model<string | null>(null);

  /**
   * Outputs
   */
  readonly openedChange = output<boolean>();
  readonly valueChange = output<string | null>();

  /**
   * Internal state
   */
  readonly isOpen = signal(false);
  readonly focusedIndex = signal(0);
  readonly buttonHeight = signal(40);

  /**
   * Computed states
   */
  protected selectedLabel = computed(() => {
    const currentValue = this.value();
    if (!currentValue) {
      return this.placeholder();
    }
    const option = this.options().find((opt) => opt.value === currentValue);
    return option?.label ?? this.placeholder();
  });

  protected triggerClass = computed(() => {
    let state: SelectState = 'default';
    if (this.error()) {
      state = 'error';
    } else if (this.isOpen()) {
      state = 'focus';
    }
    return cn(selectVariants({ state }), this.class());
  });

  protected hostClass = computed(() => {
    return cn('relative', this.isOpen() && 'z-50');
  });

  constructor() {
    this.setupClickOutsideListener();
  }

  /**
   * Check if an option is selected
   */
  isSelected(value: string): boolean {
    return this.value() === value;
  }

  /**
   * Toggle dropdown open/closed
   */
  toggle(): void {
    if (this.disabled()) {
      return;
    }
    this.isOpen.update((open) => {
      const newState = !open;
      this.openedChange.emit(newState);
      return newState;
    });
  }

  /**
   * Select an option and close dropdown
   */
  selectOption(value: string): void {
    if (this.disabled()) {
      return;
    }
    this.value.set(value);
    this.valueChange.emit(value);
    this.isOpen.set(false);
    this.openedChange.emit(false);
  }

  /**
   * Handle keyboard navigation
   */
  handleKeydown(event: KeyboardEvent): void {
    if (this.disabled()) {
      return;
    }

    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowUp':
        event.preventDefault();
        if (!this.isOpen()) {
          this.isOpen.set(true);
          this.openedChange.emit(true);
        } else {
          this.navigateOptions(event.key === 'ArrowDown' ? 1 : -1);
        }
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (this.isOpen()) {
          const enabledOptions = this.options().filter((opt) => !opt.disabled);
          const focusedOption = enabledOptions[this.focusedIndex()];
          if (focusedOption) {
            this.selectOption(focusedOption.value);
          }
        } else {
          this.isOpen.set(true);
          this.openedChange.emit(true);
        }
        break;
      case 'Escape':
        event.preventDefault();
        this.isOpen.set(false);
        this.openedChange.emit(false);
        break;
      case 'Tab':
        if (this.isOpen()) {
          this.isOpen.set(false);
          this.openedChange.emit(false);
        }
        break;
    }
  }

  /**
   * Navigate options with arrow keys
   */
  private navigateOptions(direction: number): void {
    const enabledOptions = this.options().filter((opt) => !opt.disabled);
    if (enabledOptions.length === 0) {
      return;
    }

    this.focusedIndex.update((index) => {
      const newIndex = index + direction;
      if (newIndex < 0) {
        return enabledOptions.length - 1;
      }
      if (newIndex >= enabledOptions.length) {
        return 0;
      }
      return newIndex;
    });
  }

  /**
   * Setup click outside listener
   */
  private setupClickOutsideListener(): void {
    fromEvent<MouseEvent>(document, 'click')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((evt: MouseEvent) => {
        const target = evt.target as HTMLElement;
        const nativeElement = this.elementRef.nativeElement;
        const hostElement = nativeElement as HTMLElement;
        if (hostElement && !hostElement.contains(target)) {
          this.isOpen.set(false);
          this.openedChange.emit(false);
        }
      });
  }

  /**
   * Stop event propagation
   */
  protected stopPropagation(event: Event): void {
    event.stopPropagation();
  }
}
