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
 * Radio option interface
 */
export interface RadioOption {
  value: string;
  label: string;
  disabled?: boolean;
}

/**
 * Radio variants using class-variance-authority
 */
const radioVariants = cva(
  'aspect-square size-4 rounded-full border shadow-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      checked: {
        true: 'border-primary bg-primary text-primary-foreground',
        false: 'border-input bg-card hover:border-accent',
      },
    },
    defaultVariants: {
      checked: false,
    },
  },
);

export type RadioOrientation = 'horizontal' | 'vertical';

@Component({
  selector: 'div[spark-radio-group]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'hostClass()',
    '[attr.role]': "'group'",
    '[attr.aria-disabled]': 'disabled()',
    '[attr.aria-orientation]': 'orientation()',
    '(keydown)': 'handleKeydown($event)',
  },
  template: `
    @for (option of options(); track option.value; let i = $index) {
      <label
        [class]="'flex gap-3 cursor-pointer items-center ' + containerClass()"
        [attr.aria-disabled]="option.disabled || disabled()"
        [class.opacity-50]="option.disabled || disabled()"
        [class.pointer-events-none]="option.disabled || disabled()"
      >
        <div class="relative">
          <input
            type="radio"
            [name]="name()"
            [value]="option.value"
            [checked]="isSelected(option.value)"
            [disabled]="option.disabled || disabled()"
            [attr.aria-checked]="isSelected(option.value)"
            class="peer sr-only"
            (change)="selectOption(option.value)"
          />
          <div
            [class]="radioClass(option.value)"
            [attr.aria-hidden]="true"
          >
            @if (isSelected(option.value)) {
              <div class="absolute inset-0 flex items-center justify-center">
                <div class="size-2 rounded-full bg-primary-foreground"></div>
              </div>
            }
          </div>
        </div>
        <span class="text-sm font-medium">
          {{ option.label }}
        </span>
      </label>
    }
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border-width: 0;
      }
    `,
  ],
})
export class RadioGroupComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly elementRef = inject(ElementRef);

  readonly options = input.required<RadioOption[]>();
  readonly name = input(`radio-${Math.random().toString(36).substring(2, 9)}`);
  readonly orientation = input<RadioOrientation>('vertical');
  readonly disabled = input<boolean, string | boolean>(false, {
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
   * Internal state for keyboard navigation
   */
  readonly focusedIndex = signal(0);

  /**
   * Outputs
   */
  readonly valueChange = output<string | null>();

  /**
   * Get container class based on orientation
   */
  protected containerClass = computed(() => {
    return this.orientation() === 'vertical' ? 'flex-col gap-3' : 'flex-row gap-6';
  });

  /**
   * Get host class
   */
  protected hostClass = computed(() => {
    return cn(this.class());
  });

  /**
   * Get radio class for an option
   */
  protected radioClass(value: string): string {
    return cn(
      radioVariants({ checked: this.isSelected(value) }),
      'peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2',
    );
  }

  /**
   * Check if an option is selected
   */
  isSelected(value: string): boolean {
    return this.value() === value;
  }

  /**
   * Select an option
   */
  selectOption(value: string): void {
    if (this.disabled()) {
      return;
    }
    this.value.set(value);
    this.valueChange.emit(value);
  }

  /**
   * Handle keyboard navigation
   */
  handleKeydown(event: KeyboardEvent): void {
    if (this.disabled()) {
      return;
    }

    const enabledOptions = this.options().filter((opt) => !opt.disabled);
    if (enabledOptions.length === 0) {
      return;
    }

    const isVertical = this.orientation() === 'vertical';
    const currentIndex = this.focusedIndex();

    switch (event.key) {
      case 'ArrowDown':
        if (isVertical) {
          event.preventDefault();
          this.focusOption(currentIndex + 1, enabledOptions);
        }
        break;
      case 'ArrowUp':
        if (isVertical) {
          event.preventDefault();
          this.focusOption(currentIndex - 1, enabledOptions);
        }
        break;
      case 'ArrowRight':
        if (!isVertical) {
          event.preventDefault();
          this.focusOption(currentIndex + 1, enabledOptions);
        }
        break;
      case 'ArrowLeft':
        if (!isVertical) {
          event.preventDefault();
          this.focusOption(currentIndex - 1, enabledOptions);
        }
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        const focusedOption = enabledOptions[currentIndex];
        if (focusedOption) {
          this.selectOption(focusedOption.value);
        }
        break;
    }
  }

  /**
   * Focus an option by index
   */
  private focusOption(index: number, enabledOptions: RadioOption[]): void {
    const length = enabledOptions.length;
    if (length === 0) {
      return;
    }

    // Wrap around
    if (index < 0) {
      index = length - 1;
    } else if (index >= length) {
      index = 0;
    }

    this.focusedIndex.set(index);

    // Focus the actual element
    const nativeElement = this.elementRef.nativeElement;
    const inputs = nativeElement?.querySelectorAll(
      `input[name="${this.name()}"]`,
    ) as NodeListOf<HTMLInputElement> | null;
    if (!inputs) {
      return;
    }

    const enabledInputs: HTMLInputElement[] = [];
    inputs.forEach((item: HTMLInputElement) => {
      if (
        !item.disabled &&
        enabledOptions.some((opt) => opt.value === item.value)
      ) {
        enabledInputs.push(item);
      }
    });
    const targetInput = enabledInputs[index];
    targetInput?.focus();
  }
}
