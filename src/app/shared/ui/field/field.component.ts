import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { cn } from '@app/shared';

/**
 * Field Component - Form field wrapper with label, description, and error
 *
 * Provides accessible form field structure with ARIA-compliant attributes
 * @selector div[spark-field]
 * @standalone true
 */
@Component({
  selector: 'div[spark-field]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'hostClass()',
    '[attr.aria-invalid]': 'error() ? true : null',
    '[attr.aria-required]': 'required() ? true : null',
  },
  template: `
    @if (label()) {
      <label
        [class]="labelClass()"
        [attr.for]="labelFor()"
      >
        {{ label() }}
        @if (required()) {
          <span
            class="text-destructive ml-0.5"
            aria-hidden="true"
          >
            *
          </span>
        }
      </label>
    }

    <ng-content />

    @if (description()) {
      <p
        [class]="descriptionClass()"
        [attr.id]="descriptionId()"
      >
        {{ description() }}
      </p>
    }

    @if (error()) {
      <p
        [class]="errorClass()"
        role="alert"
        aria-live="polite"
        [attr.id]="errorId()"
      >
        {{ error() }}
      </p>
    }
  `,
  styles: [],
})
export class FieldComponent {
  readonly class = input<string>('');
  readonly label = input<string>('');
  readonly labelFor = input<string>('');
  readonly description = input<string>('');
  readonly error = input<string>('');
  readonly required = input<boolean, string | boolean>(false, {
    transform: (value: string | boolean) => {
      if (typeof value === 'string') {
        return value !== 'false';
      }
      return value;
    },
  });

  /**
   * Computed IDs for ARIA attributes
   */
  protected descriptionId = computed(() => {
    const id = this.labelFor();
    return id ? `${id}-description` : null;
  });

  protected errorId = computed(() => {
    const id = this.labelFor();
    return id ? `${id}-error` : null;
  });

  /**
   * Label class
   */
  protected labelClass = computed(() => {
    return cn(
      'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
      this.error() ? 'text-destructive' : 'text-foreground',
    );
  });

  /**
   * Description class
   */
  protected descriptionClass = computed(() => {
    return cn('text-sm text-muted-foreground');
  });

  /**
   * Error class
   */
  protected errorClass = computed(() => {
    return cn('text-sm text-destructive font-medium');
  });

  /**
   * Host class
   */
  protected hostClass = computed(() => {
    return cn('flex flex-col gap-1.5', this.class());
  });
}
