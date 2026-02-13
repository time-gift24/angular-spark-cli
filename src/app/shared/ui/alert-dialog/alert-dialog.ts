import {
  Component,
  computed,
  input,
  output,
  model,
  signal,
  effect,
  ElementRef,
  inject,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { cn } from '@app/shared/utils';
import { ButtonComponent } from '@app/shared/ui/button';

/**
 * Alert Dialog State
 */
export enum AlertDialogState {
  Closed = 'closed',
  Open = 'open',
  Closing = 'closing',
}

/**
 * Alert Dialog Variant
 */
export type AlertDialogVariant = 'default' | 'destructive';

/**
 * Alert Dialog Component - Confirmation dialog
 *
 * Displays a modal dialog with confirm/cancel actions.
 * Features focus trap and ESC key handling.
 *
 * @selector div[spark-alert-dialog]
 * @standalone true
 *
 * @example
 * ```html
 * <div spark-alert-dialog [(open)]="isOpen" [title]="'Confirm'" [description]="'Are you sure?'" />
 * ```
 */
@Component({
  selector: 'div[spark-alert-dialog]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ButtonComponent],
  host: {
    '[class]': 'computedClass()',
    '[attr.data-state]': 'state()',
    '[attr.role]': '"dialog"',
    '[attr.aria-modal]': 'true',
    '[attr.aria-labelledby]': 'titleId',
    '[attr.aria-describedby]': 'description() ? descriptionId : null',
  },
  template: `
    <div class="alert-dialog-overlay" (click)="onBackdropClick()">
      <div class="alert-dialog-content" (click)="$event.stopPropagation()">
        <div class="alert-dialog-header">
          <h3 [attr.id]="titleId" class="alert-dialog-title">{{ title() }}</h3>
          @if (description()) {
            <p [attr.id]="descriptionId" class="alert-dialog-description">
              {{ description() }}
            </p>
          }
        </div>
        <div class="alert-dialog-footer">
          <button
            type="button"
            spark-button
            variant="outline"
            (click)="onCancel()"
            class="alert-dialog-cancel"
          >
            {{ cancelLabel() }}
          </button>
          <button
            type="button"
            spark-button
            [variant]="variant() === 'destructive' ? 'destructive' : 'default'"
            (click)="onConfirm()"
            class="alert-dialog-confirm"
          >
            {{ confirmLabel() }}
          </button>
        </div>
      </div>
    </div>
  `,
  styleUrl: './alert-dialog.css',
})
export class AlertDialogComponent {
  private static nextId = 0;
  private readonly elementRef = inject(ElementRef);
  private readonly hasDocument = typeof document !== 'undefined';
  private readonly dialogId = `spark-alert-dialog-${AlertDialogComponent.nextId++}`;

  readonly open = model<boolean>(false);
  readonly title = input.required<string>();
  readonly description = input<string>('');
  readonly confirmLabel = input<string>('Confirm');
  readonly cancelLabel = input<string>('Cancel');
  readonly variant = input<AlertDialogVariant>('default');

  readonly confirm = output<void>();
  readonly cancel = output<void>();

  /**
   * Current dialog state
   */
  readonly state = signal<AlertDialogState>(AlertDialogState.Closed);
  protected readonly titleId = `${this.dialogId}-title`;
  protected readonly descriptionId = `${this.dialogId}-description`;

  /**
   * Base dialog styles
   */
  private readonly baseClass = 'fixed inset-0 z-50';

  /**
   * Computed class string (base + custom classes)
   */
  protected computedClass = computed(() => {
    const isOpen = this.open();
    return cn(this.baseClass, isOpen ? 'flex' : 'hidden');
  });

  /**
   * Update state when open changes
   */
  constructor() {
    effect((onCleanup) => {
      const isOpen = this.open();
      if (isOpen) {
        this.state.set(AlertDialogState.Open);
        if (this.hasDocument) {
          // Let the open state render before focusing.
          queueMicrotask(() => this.setupFocusTrap());

          const escapeHandler = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && this.open()) {
              event.preventDefault();
              this.onCancel();
            }
          };
          document.addEventListener('keydown', escapeHandler);
          onCleanup(() => {
            document.removeEventListener('keydown', escapeHandler);
          });
        }
      } else {
        this.state.set(AlertDialogState.Closed);
      }
    });
  }

  /**
   * Handle backdrop click
   */
  protected onBackdropClick(): void {
    this.onCancel();
  }

  /**
   * Handle confirm click
   */
  protected onConfirm(): void {
    this.confirm.emit();
    this.open.set(false);
  }

  /**
   * Handle cancel click
   */
  protected onCancel(): void {
    this.cancel.emit();
    this.open.set(false);
  }

  /**
   * Set up focus trap
   */
  private setupFocusTrap(): void {
    if (!this.open()) {
      return;
    }

    // Find all focusable elements
    const focusableElements = this.elementRef.nativeElement.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );

    if (focusableElements.length > 0) {
      // Focus first element
      (focusableElements[0] as HTMLElement).focus();
    }
  }
}
