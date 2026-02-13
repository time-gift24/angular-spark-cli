import { Component, input, output, computed, ChangeDetectionStrategy } from '@angular/core';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@app/shared/utils';

/**
 * Alert variants using class-variance-authority
 * Centralizes all alert style variants in one definition
 */
const alertVariants = cva(
  // Base styles - consistent padding, border, and layout
  'relative flex w-full items-start gap-3 rounded-md border p-3 text-sm transition-colors',
  {
    variants: {
      variant: {
        default: 'variant-default',
        destructive: 'variant-destructive',
        warning: 'variant-warning',
        success: 'variant-success',
        info: 'variant-info',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

/**
 * Extract variant types from CVA definition
 */
export type AlertVariant = VariantProps<typeof alertVariants>['variant'];

/**
 * Alert display configuration
 */
export interface AlertExample {
  label: string;
  variant: AlertVariant;
  title?: string;
  description?: string;
  dismissible?: boolean;
}

/**
 * SparkAlertComponent - Alert component for status messages
 *
 * Displays important messages to users with variant-based styling.
 * Supports title, description, and optional dismiss action.
 *
 * @selector spark-alert
 * @standalone
 * @changeDetection OnPush
 */
@Component({
  selector: 'spark-alert',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'computedClass()',
    '[attr.role]': '"alert"',
    '[attr.aria-label]': 'ariaLabel()',
  },
  template: `
    @if (hasIcon()) {
      <div class="alert-icon" aria-hidden="true">
        @switch (variant()) {
          @case ('destructive') {
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <circle cx="8" cy="8" r="6" />
              <line x1="8" y1="5" x2="8" y2="8" />
              <line x1="8" y1="10.5" x2="8" y2="10.5" />
            </svg>
          }
          @case ('warning') {
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M8 2L2 14h12L8 2z" />
              <line x1="8" y1="6" x2="8" y2="10" />
              <circle cx="8" cy="12.5" r="0.5" />
            </svg>
          }
          @case ('success') {
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M13 5l-7 7-3-3" />
            </svg>
          }
          @case ('info') {
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <circle cx="8" cy="8" r="6" />
              <line x1="8" y1="5" x2="8" y2="11" />
              <circle cx="8" cy="13" r="0.5" />
            </svg>
          }
        }
      </div>
    }
    <div class="alert-content">
      @if (title()) {
        <div class="alert-title">{{ title() }}</div>
      }
      @if (description()) {
        <div class="alert-description">{{ description() }}</div>
      }
      <ng-content />
    </div>
    @if (dismissible()) {
      <button
        type="button"
        spark-button
        variant="ghost"
        size="icon"
        class="alert-close"
        (click)="onDismiss()"
        [attr.aria-label]="'Close ' + (title() || variant()) + ' alert'"
      >
        <span class="close-icon" aria-hidden="true">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M9 3L3 9M3 3l6 6" />
          </svg>
        </span>
      </button>
    }
  `,
  styleUrl: './alert.component.css',
})
export class SparkAlertComponent {
  /** Alert variant styling */
  readonly variant = input<AlertVariant>('default');

  /** Optional title text */
  readonly title = input<string>('');

  /** Optional description text */
  readonly description = input<string>('');

  /** Whether alert can be dismissed */
  readonly dismissible = input<boolean>(false);

  /** Event emitted when alert is dismissed */
  readonly dismissed = output<void>();

  /** Computed class using CVA pattern */
  protected computedClass = computed(() => {
    return cn(alertVariants({ variant: this.variant() }));
  });

  /** ARIA label for accessibility */
  protected ariaLabel = computed(() => {
    if (this.title()) {
      return `${this.variant()} alert: ${this.title()}`;
    }
    return `${this.variant()} alert`;
  });

  /** Whether to show icon based on variant */
  protected hasIcon = computed(() => {
    return this.variant() !== 'default';
  });

  /** Handle dismiss action */
  protected onDismiss(): void {
    this.dismissed.emit();
  }
}
