import {
  Component,
  input,
  output,
  computed,
  model,
  signal,
  ChangeDetectionStrategy,
  inject,
  ElementRef,
} from '@angular/core';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@app/shared';

/**
 * Input OTP type definition
 */
export type InputOtpType = 'numeric' | 'alphanumeric';

/**
 * Input variants using class-variance-authority
 */
const inputVariants = cva(
  'flex h-10 w-10 items-center justify-center rounded-md border bg-card text-center text-sm shadow-sm transition-all duration-200 outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      error: {
        true: 'border-destructive focus-visible:ring-destructive/50 focus-visible:border-destructive',
        false: 'border-input',
      },
    },
    defaultVariants: {
      error: false,
    },
  },
);

export type InputOtpError = VariantProps<typeof inputVariants>['error'];

@Component({
  selector: 'div[spark-input-otp]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'hostClass()',
    '[attr.aria-disabled]': 'disabled()',
    '[attr.aria-invalid]': 'error()',
  },
  template: `
    <div [class]="'flex gap-2 ' + containerClass()">
      @for (i of indices(); track i; let index = $index) {
        <input
          type="text"
          inputmode="numeric"
          maxlength="1"
          pattern="[0-9]*"
          [class]="inputClass()"
          [attr.disabled]="disabled() ? '' : null"
          [value]="getValue(index)"
          [attr.aria-label]="'OTP digit ' + (index + 1)"
          [attr.aria-required]="true"
          (input)="handleInput($event, index)"
          (keydown)="handleKeydown($event, index)"
          (paste)="handlePaste($event)"
          (focus)="focusedIndex.set(index)"
          (blur)="handleBlur(index)"
        />
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      /* Remove spin buttons from number inputs */
      input::-webkit-outer-spin-button,
      input::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
      }
      input[type='number'] {
        -moz-appearance: textfield;
      }
    `,
  ],
})
export class InputOtpComponent {
  private readonly elementRef = inject(ElementRef);

  readonly length = input<number>(6);
  readonly type = input<InputOtpType>('numeric');
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
  readonly class = input<string>('');

  /**
   * Two-way binding using model() with alias
   * Note: Using alias to enable [(value)] syntax on attribute selector
   */
  readonly value = model<string>('', { alias: 'value' });

  /**
   * Outputs
   */
  readonly complete = output<string>();
  readonly valueChange = output<string>();

  /**
   * Internal state
   */
  readonly focusedIndex = signal<number>(-1);

  /**
   * Create an array for iteration in template
   */
  protected readonly indices = computed(() => Array.from({ length: this.length() }, (_, i) => i));

  /**
   * Host class
   */
  protected hostClass = computed(() => {
    return cn(this.class());
  });

  /**
   * Container class
   */
  protected containerClass = computed(() => {
    return 'justify-center';
  });

  /**
   * Input class
   */
  protected inputClass = computed(() => {
    return cn(inputVariants({ error: this.error() }));
  });

  /**
   * Get value at specific index
   */
  protected getValue(index: number): string {
    const currentValue = this.value();
    return currentValue[index] ?? '';
  }

  /**
   * Handle input change
   */
  protected handleInput(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    let inputValue = input.value;

    // Filter based on type
    if (this.type() === 'numeric') {
      inputValue = inputValue.replace(/[^0-9]/g, '');
    } else {
      // Alphanumeric: letters and numbers only
      inputValue = inputValue.replace(/[^a-zA-Z0-9]/g, '');
    }

    // Only take first character
    const char = inputValue[0] || '';

    // Update value model
    const currentValue = this.value();
    const newValue =
      currentValue.slice(0, index) + char + currentValue.slice(index + 1);

    this.value.set(newValue);
    this.valueChange.emit(newValue);

    // Auto-focus next input
    if (char && index < this.length() - 1) {
      this.focusInput(index + 1);
    }

    // Emit complete event if all filled
    if (newValue.length === this.length()) {
      this.complete.emit(newValue);
    }
  }

  /**
   * Handle keyboard navigation
   */
  protected handleKeydown(event: KeyboardEvent, index: number): void {
    switch (event.key) {
      case 'Backspace':
        if (!this.getValue(index) && index > 0) {
          event.preventDefault();
          this.focusInput(index - 1);
        }
        break;
      case 'ArrowLeft':
        event.preventDefault();
        if (index > 0) {
          this.focusInput(index - 1);
        }
        break;
      case 'ArrowRight':
        event.preventDefault();
        if (index < this.length() - 1) {
          this.focusInput(index + 1);
        }
        break;
    }
  }

  /**
   * Handle paste event
   */
  protected handlePaste(event: ClipboardEvent): void {
    event.preventDefault();
    const pastedData = event.clipboardData?.getData('text/plain');
    if (!pastedData) {
      return;
    }

    // Filter based on type
    let filteredData: string;
    if (this.type() === 'numeric') {
      filteredData = pastedData.replace(/[^0-9]/g, '');
    } else {
      filteredData = pastedData.replace(/[^a-zA-Z0-9]/g, '');
    }

    // Truncate to length
    const maxLength = this.length();
    const newValue = filteredData.slice(0, maxLength);

    // Update value model
    this.value.set(newValue);
    this.valueChange.emit(newValue);

    // Focus the next empty input or last one
    const nextIndex = Math.min(newValue.length, maxLength - 1);
    this.focusInput(nextIndex);

    // Emit complete event if all filled
    if (newValue.length === maxLength) {
      this.complete.emit(newValue);
    }
  }

  /**
   * Handle blur event
   */
  protected handleBlur(index: number): void {
    // Remove value if invalid on blur
    const currentValue = this.value();
    const char = currentValue[index];

    if (char && this.type() === 'numeric' && !/^[0-9]$/.test(char)) {
      const newValue = currentValue.slice(0, index) + currentValue.slice(index + 1);
      this.value.set(newValue);
      this.valueChange.emit(newValue);
    } else if (
      char &&
      this.type() === 'alphanumeric' &&
      !/^[a-zA-Z0-9]$/.test(char)
    ) {
      const newValue = currentValue.slice(0, index) + currentValue.slice(index + 1);
      this.value.set(newValue);
      this.valueChange.emit(newValue);
    }
  }

  /**
   * Focus a specific input by index
   */
  private focusInput(index: number): void {
    const nativeElement = this.elementRef.nativeElement;
    const inputs = nativeElement?.querySelectorAll(
      'input[aria-label^="OTP digit"]',
    ) as NodeListOf<HTMLInputElement>;
    const input = inputs?.[index];
    input?.focus();
  }
}
