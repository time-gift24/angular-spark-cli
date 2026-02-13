import { Component, input, computed, ChangeDetectionStrategy, model } from '@angular/core';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@app/shared';

/**
 * Textarea variants using class-variance-authority
 * Centralizes all textarea style definitions
 */
const textareaVariants = cva(
  'placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground w-full min-w-0 rounded-md bg-card text-sm shadow-sm transition-all duration-200 outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 resize-y',
  {
    variants: {
      size: {
        sm: 'px-2 py-1.5 text-xs min-h-[60px]',
        md: 'px-3 py-2 text-sm min-h-[80px]',
        lg: 'px-4 py-3 text-base min-h-[120px]',
      },
      error: {
        true: 'border-destructive focus-visible:ring-destructive/50 focus-visible:border-destructive',
        false: 'focus-visible:border-ring focus-visible:ring-ring/50',
      },
    },
    defaultVariants: {
      size: 'md',
      error: false,
    },
  },
);

/**
 * Textarea type definition
 */
export type TextareaSize = VariantProps<typeof textareaVariants>['size'];

@Component({
  selector: 'textarea[spark-textarea]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'computedClass()',
    '[value]': 'value()',
    '[attr.placeholder]': 'placeholder()',
    '[attr.disabled]': 'disabled() ? "" : null',
    '[attr.aria-invalid]': 'error()',
    '(input)': 'onInput($event)',
  },
  template: '',
})
export class TextareaComponent {
  readonly size = input<TextareaSize>('md');
  readonly error = input<boolean, string | boolean>(false, {
    transform: (value: string | boolean) => {
      if (typeof value === 'string') {
        return value !== 'false';
      }
      return value;
    },
  });
  readonly disabled = input<boolean, string | boolean>(false, {
    transform: (value: string | boolean) => {
      if (typeof value === 'string') {
        return value !== 'false';
      }
      return value;
    },
  });
  readonly placeholder = input<string>('');
  readonly class = input<string>('');

  /**
   * Two-way binding using model()
   */
  readonly value = model<string>('');

  /**
   * Computed class using CVA pattern
   * Centralizes base styles and adds focus/validation states
   */
  protected computedClass = computed(() => {
    return cn(
      textareaVariants({
        size: this.size(),
        error: this.error(),
      }),
      'border focus-visible:ring-[3px]',
      this.class(),
    );
  });

  protected onInput(event: Event): void {
    const target = event.target as HTMLTextAreaElement | null;
    this.value.set(target?.value ?? '');
  }
}
