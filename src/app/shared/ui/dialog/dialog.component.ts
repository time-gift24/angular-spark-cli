import {
  Component,
  Directive,
  input,
  output,
  model,
  signal,
  computed,
  effect,
  ElementRef,
  inject,
  OnDestroy,
  ChangeDetectionStrategy,
} from '@angular/core';
import { cn } from '@app/shared/utils';

/**
 * Dialog Component - Modal dialog component family
 *
 * A set of components for creating accessible modal dialogs.
 * Features:
 * - Open/close state management with Signals
 * - Backdrop click to close
 * - Escape key to close
 * - Focus trap
 * - Focus restoration on close
 * - ARIA attributes for accessibility
 *
 * Based on Radix UI Dialog and shadcn/ui patterns
 *
 * @example
 * ```html
 * <div spark-dialog [(open)]="isOpen">
 *   <div spark-dialog-content>
 *     <div spark-dialog-header>
 *       <h3 spark-dialog-title>Title</h3>
 *       <p spark-dialog-description>Description</p>
 *     </div>
 *     <div spark-dialog-footer>
 *       <button>Cancel</button>
 *       <button>Confirm</button>
 *     </div>
 *   </div>
 * </div>
 * ```
 */

/**
 * Dialog Trigger Directive
 * Marks an element that triggers the dialog to open
 */
@Directive({
  selector: '[spark-dialog-trigger]',
  host: {
    '(click)': 'openDialog.emit()',
  },
})
export class DialogTriggerComponent {
  readonly openDialog = output<void>();
}

/**
 * Dialog Portal Component
 * Renders the dialog in a portal at the end of the document body
 */
@Component({
  selector: 'div[spark-dialog-portal]',
  host: {
    '[class]': 'computedClass()',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content />',
})
export class DialogPortalComponent {
  protected computedClass = computed(() => {
    return 'fixed inset-0 z-50 flex items-center justify-center';
  });
}

/**
 * Dialog Overlay Component
 * The backdrop overlay behind the dialog
 */
@Component({
  selector: 'div[spark-dialog-overlay]',
  host: {
    '[class]': 'computedClass()',
    '[style]': 'overlayStyle()',
    '(click)': 'close.emit()',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '',
})
export class DialogOverlayComponent {
  readonly open = input<boolean>(false);
  readonly close = output<void>();

  protected computedClass = computed(() => {
    return cn(
      'fixed inset-0 z-50',
      'bg-black/80',
      'data-[state=open]:animate-in data-[state=closed]:animate-out',
      'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
    );
  });

  protected overlayStyle = computed(() => {
    const open = this.open();
    const opacity = open ? '1' : '0';
    const pointerEvents = open ? 'auto' : 'none';
    return `opacity: ${opacity}; pointer-events: ${pointerEvents}; transition: opacity var(--duration-spring-normal) var(--ease-spring-smooth);`;
  });
}

/**
 * Dialog Close Button Directive
 * Closes the dialog when clicked
 */
@Directive({
  selector: '[spark-dialog-close]',
  host: {
    '(click)': 'onClick()',
  },
})
export class DialogCloseDirective {
  private readonly dialog = inject(DialogComponent, { optional: true });
  private readonly dialogContent = inject(DialogContentComponent, { optional: true });

  readonly close = output<void>();

  protected onClick(): void {
    this.close.emit();
    this.dialogContent?.close.emit();
    if (this.dialog) {
      this.dialog.open.set(false);
      this.dialog.close.emit();
    }
  }
}

/**
 * Dialog Content Component
 * The main dialog content wrapper
 */
@Component({
  selector: 'div[spark-dialog-content]',
  host: {
    '[class]': 'computedClass()',
    '[style]': 'contentStyle()',
    'role': 'dialog',
    '[attr.aria-modal]': 'open() ? "true" : null',
    '[attr.aria-hidden]': 'open() ? null : "true"',
    '[attr.aria-labelledby]': 'ariaLabelledby()',
    '[attr.aria-describedby]': 'ariaDescribedby()',
    '[attr.tabindex]': '-1',
    '(keydown.escape)': 'onEscape($event)',
    '(keydown)': 'onKeydown($event)',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ng-content />
    @if (shouldShowCloseButton()) {
      <button
        type="button"
        spark-dialog-close
        class="dialog-close-button"
        [attr.aria-label]="'Close dialog'"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18-6M6 6l12 12" />
        </svg>
        <span class="sr-only">Close</span>
      </button>
    }
  `,
  styleUrl: './dialog.css',
})
export class DialogContentComponent implements OnDestroy {
  readonly open = input<boolean>(false);
  readonly showCloseButton = input<boolean>(true);
  readonly ariaLabelledby = input<string | null>(null);
  readonly ariaDescribedby = input<string | null>(null);
  readonly close = output<void>();

  private readonly host = inject(ElementRef<HTMLElement>);
  private wasOpen = false;
  private previousActiveElement: HTMLElement | null = null;

  constructor() {
    effect(() => {
      const open = this.open();
      if (open && !this.wasOpen) {
        this.wasOpen = true;
        this.previousActiveElement =
          document.activeElement instanceof HTMLElement ? document.activeElement : null;
        queueMicrotask(() => this.focusInitialElement());
      } else if (!open && this.wasOpen) {
        this.wasOpen = false;
        this.restoreFocus();
      }
    });
  }

  protected computedClass = computed(() => {
    return cn(
      'dialog-content',
      'fixed left-[50%] top-[50%] z-50',
      'grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%]',
      'gap-4 border bg-card p-6 shadow-lg',
      'sm:rounded-lg',
      'data-[state=open]:animate-in data-[state=closed]:animate-out',
      'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
      'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
      'data-[state=closed]:slide-out-to-top-[2%] data-[state=open]:slide-in-from-top-[2%]',
      'data-[state=closed]:slide-out-to-left-[2%] data-[state=open]:slide-in-from-left-[2%]',
      'duration-200',
    );
  });

  protected contentStyle = computed(() => {
    const open = this.open();
    const pointerEvents = open ? 'auto' : 'none';
    const opacity = open ? '1' : '0';
    return `pointer-events: ${pointerEvents}; opacity: ${opacity}; transition: all var(--duration-spring-normal) var(--ease-spring-smooth);`;
  });

  protected shouldShowCloseButton = computed(() => {
    return this.showCloseButton();
  });

  protected onEscape(event: KeyboardEvent): void {
    event.stopPropagation();
    this.close.emit();
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Tab') {
      return;
    }

    if (!this.open()) {
      return;
    }

    const focusables = this.getFocusableElements();
    if (focusables.length === 0) {
      event.preventDefault();
      this.host.nativeElement.focus();
      return;
    }

    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = document.activeElement as HTMLElement | null;

    if (event.shiftKey && active === first) {
      event.preventDefault();
      last.focus();
      return;
    }

    if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  }

  ngOnDestroy(): void {
    this.restoreFocus();
  }

  private focusInitialElement(): void {
    const focusables = this.getFocusableElements();
    if (focusables.length > 0) {
      focusables[0].focus();
      return;
    }
    this.host.nativeElement.focus();
  }

  private getFocusableElements(): HTMLElement[] {
    const root = this.host.nativeElement;
    const focusableSelector = [
      'button:not([disabled])',
      '[href]',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(',');

    const elements = Array.from(root.querySelectorAll(focusableSelector));
    return elements.filter(
      (el): el is HTMLElement =>
        el instanceof HTMLElement && !el.hasAttribute('hidden') && !el.getAttribute('aria-hidden'),
    );
  }

  private restoreFocus(): void {
    if (!this.previousActiveElement) {
      return;
    }
    this.previousActiveElement.focus();
    this.previousActiveElement = null;
  }
}

/**
 * Dialog Header Component
 * Header section of the dialog
 */
@Component({
  selector: 'div[spark-dialog-header]',
  host: {
    '[class]': 'computedClass()',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content />',
})
export class DialogHeaderComponent {
  protected computedClass = computed(() => {
    return cn('flex flex-col space-y-2 text-center sm:text-left');
  });
}

/**
 * Dialog Title Component
 * Title heading for the dialog
 */
@Component({
  selector: 'h3[spark-dialog-title]',
  host: {
    '[class]': 'computedClass()',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content />',
})
export class DialogTitleComponent {
  protected computedClass = computed(() => {
    return cn('text-lg font-semibold leading-none tracking-tight');
  });
}

/**
 * Dialog Description Component
 * Description text for the dialog
 */
@Component({
  selector: 'p[spark-dialog-description]',
  host: {
    '[class]': 'computedClass()',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content />',
})
export class DialogDescriptionComponent {
  protected computedClass = computed(() => {
    return cn('text-sm text-muted-foreground');
  });
}

/**
 * Dialog Footer Component
 * Footer section for action buttons
 */
@Component({
  selector: 'div[spark-dialog-footer]',
  host: {
    '[class]': 'computedClass()',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content />',
})
export class DialogFooterComponent {
  protected computedClass = computed(() => {
    return cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2');
  });
}

/**
 * Dialog Root Component
 * Main dialog container that manages open state
 */
@Component({
  selector: 'div[spark-dialog]',
  host: {
    '[class]': 'computedClass()',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (open()) {
      <div spark-dialog-portal>
        <div
          class="fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
          [style]="overlayStyle()"
          (click)="onClose()"
        ></div>
        <div
          class="dialog-content"
          role="dialog"
          [attr.aria-modal]="open() ? 'true' : null"
          [attr.aria-hidden]="open() ? null : 'true'"
          [attr.aria-labelledby]="titleId()"
          [attr.aria-describedby]="descriptionId()"
          [attr.tabindex]="'-1'"
          (keydown.escape)="onKeydownEscape($event)"
          (keydown)="onKeydown($event)"
        >
          <ng-content></ng-content>
        </div>
      </div>
    }
  `,
})
export class DialogComponent {
  private static nextId = 0;
  private readonly dialogId = `spark-dialog-${DialogComponent.nextId++}`;

  readonly open = model<boolean>(false);
  readonly showCloseButton = input<boolean>(true);

  readonly close = output<void>();

  protected readonly titleId = signal<string>(`${this.dialogId}-title`);
  protected readonly descriptionId = signal<string>(`${this.dialogId}-description`);

  protected computedClass = computed(() => {
    return cn('dialog-root', this.open() ? 'flex' : 'hidden');
  });

  protected overlayStyle = computed(() => {
    const open = this.open();
    const opacity = open ? '1' : '0';
    return `opacity: ${opacity}; pointer-events: ${open ? 'auto' : 'none'}; transition: opacity var(--duration-spring-normal) var(--ease-spring-smooth);`;
  });

  protected onKeydownEscape(event: Event): void {
    if (event instanceof KeyboardEvent && event.key === 'Escape') {
      this.onClose();
    }
  }

  protected onKeydown(event: Event): void {
    // Handle keyboard navigation
    if (event instanceof KeyboardEvent && event.key === 'Tab') {
      event.preventDefault();
    }
  }

  protected onClose(): void {
    this.close.emit();
    this.open.set(false);
  }
}
