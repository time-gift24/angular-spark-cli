import {
  Component,
  input,
  output,
  computed,
  model,
  signal,
  effect,
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
          [attr.inputmode]="inputMode()"
          maxlength="1"
          [attr.pattern]="inputPattern()"
          [class]="inputClass()"
          [attr.disabled]="disabled() ? '' : null"
          [value]="getValue(index)"
          [attr.aria-label]="'OTP digit ' + (index + 1)"
          [attr.aria-required]="true"
          (input)="handleInput($event, index)"
          (keydown)="handleKeydown($event, index)"
          (paste)="handlePaste($event, index)"
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

  /**
   * Internal state
   */
  readonly focusedIndex = signal<number>(-1);
  private readonly slots = signal<string[]>([]);

  constructor() {
    effect(() => {
      const length = this.length();
      const externalValue = this.value();
      const nextSlots = this.toSlots(externalValue, length);
      const normalizedValue = this.serializeSlots(nextSlots);
      if (!this.areSlotsEqual(this.slots(), nextSlots)) {
        this.slots.set(nextSlots);
      }
      if (externalValue !== normalizedValue) {
        this.value.set(normalizedValue);
      }
    });
  }

  /**
   * Create an array for iteration in template
   */
  protected readonly indices = computed(() => Array.from({ length: this.length() }, (_, i) => i));

  protected readonly inputMode = computed(() => {
    return this.type() === 'numeric' ? 'numeric' : 'text';
  });

  protected readonly inputPattern = computed(() => {
    return this.type() === 'numeric' ? '[0-9]*' : '[A-Za-z0-9]*';
  });

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
    return this.slots()[index] ?? '';
  }

  /**
   * Handle input change
   */
  protected handleInput(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    const inputValue = this.filterInput(input.value);

    // Only take first character
    const char = inputValue[0] || '';
    this.updateSlot(index, char, true);

    // Auto-focus next input
    if (char && index < this.length() - 1) {
      this.focusInput(index + 1);
    }
  }

  /**
   * Handle keyboard navigation
   */
  protected handleKeydown(event: KeyboardEvent, index: number): void {
    switch (event.key) {
      case 'Backspace':
        if (this.getValue(index)) {
          event.preventDefault();
          this.updateSlot(index, '');
        } else if (index > 0) {
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
  protected handlePaste(event: ClipboardEvent, index: number): void {
    event.preventDefault();
    const pastedData = event.clipboardData?.getData('text/plain');
    if (!pastedData) {
      return;
    }

    const filteredData = this.filterInput(pastedData);
    if (!filteredData) {
      return;
    }

    const nextSlots = [...this.slots()];
    let cursor = index;
    for (const char of filteredData) {
      if (cursor >= nextSlots.length) {
        break;
      }
      nextSlots[cursor] = char;
      cursor += 1;
    }
    this.updateSlots(nextSlots, true);

    const nextIndex = Math.min(cursor, this.length() - 1);
    this.focusInput(nextIndex);
  }

  /**
   * Handle blur event
   */
  protected handleBlur(index: number): void {
    const char = this.getValue(index);
    if (char && !this.isValidChar(char)) {
      this.updateSlot(index, '');
    }
  }

  private filterInput(value: string): string {
    if (this.type() === 'numeric') {
      return value.replace(/[^0-9]/g, '');
    }
    return value.replace(/[^a-zA-Z0-9]/g, '');
  }

  private isValidChar(char: string): boolean {
    if (this.type() === 'numeric') {
      return /^[0-9]$/.test(char);
    }
    return /^[a-zA-Z0-9]$/.test(char);
  }

  private toSlots(value: string, length: number): string[] {
    const sanitized = this.filterInput(value).slice(0, length);
    return Array.from({ length }, (_, index) => sanitized[index] ?? '');
  }

  private serializeSlots(slots: string[]): string {
    return slots.join('');
  }

  private areSlotsEqual(left: string[], right: string[]): boolean {
    if (left.length !== right.length) {
      return false;
    }
    for (let index = 0; index < left.length; index++) {
      if (left[index] !== right[index]) {
        return false;
      }
    }
    return true;
  }

  private updateSlot(index: number, char: string, emitComplete = false): void {
    const nextSlots = [...this.slots()];
    nextSlots[index] = char;
    this.updateSlots(nextSlots, emitComplete);
  }

  private updateSlots(slots: string[], emitComplete = false): void {
    this.slots.set(slots);
    const serialized = this.serializeSlots(slots);
    if (serialized !== this.value()) {
      this.value.set(serialized);
    }
    if (emitComplete && slots.length > 0 && slots.every((slot) => slot.length === 1)) {
      this.complete.emit(serialized);
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
