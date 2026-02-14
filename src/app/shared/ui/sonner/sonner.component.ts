import {
  Component,
  input,
  computed,
  inject,
  ChangeDetectionStrategy,
} from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@app/shared';
import {
  type SonnerData,
  type SonnerPosition,
  type SonnerVariant,
} from './sonner.types';
import { SonnerService } from './sonner.service';

const toastVariants = cva(
  'group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-4 pr-8 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full',
  {
    variants: {
      variant: {
        default: 'bg-card border-border text-foreground',
        destructive: 'group destructive border-destructive bg-destructive text-destructive-foreground',
        warning: 'border-warning bg-warning text-warning-foreground',
        success: 'border-success bg-success text-success-foreground',
        info: 'border-info bg-info text-info-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export type SonnerToastVariant = VariantProps<typeof toastVariants>['variant'];

const positionClasses: Record<SonnerPosition, string> = {
  'top-left': 'top-0 left-0 flex-col-reverse',
  'top-right': 'top-0 right-0 flex-col-reverse',
  'bottom-left': 'bottom-0 left-0 flex-col',
  'bottom-right': 'bottom-0 right-0 flex-col',
  'top-center': 'top-0 left-1/2 -translate-x-1/2 flex-col-reverse',
  'bottom-center': 'bottom-0 left-1/2 -translate-x-1/2 flex-col',
};

/**
 * Icon components for different toast variants
 */
const SuccessIcon = `
  <svg class="size-4" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M12.207 4.793a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0l-2-2a1 1 0 011.414-1.414L6.5 9.086l4.293-4.293a1 1 0 011.414 0z"/>
  </svg>
`;

const ErrorIcon = `
  <svg class="size-4" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 2a.75.75 0 01.75.75v4.5h4.5a.75.75 0 010 1.5h-4.5v4.5a.75.75 0 01-1.5 0v-4.5h-4.5a.75.75 0 010-1.5h4.5v-4.5A.75.75 0 018 2z" fill-rule="evenodd" clip-rule="evenodd"/>
    <path d="M4.53 3.47a.75.75 0 00-1.06 1.06l8 8a.75.75 0 101.06-1.06l-8-8z"/>
  </svg>
`;

const WarningIcon = `
  <svg class="size-4" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 1.5c-3.09 0-5.6 2.265-5.95 5.125l-1.975 3.3A.75.75 0 00.77 11.5h14.46a.75.75 0 00.695-1.575l-1.975-3.3C13.6 3.765 11.09 1.5 8 1.5zm0 2a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 018 3.5zm0 6a1 1 0 100-2 1 1 0 000 2z"/>
  </svg>
`;

const InfoIcon = `
  <svg class="size-4" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 2a6 6 0 100 12A6 6 0 008 2zM7 5a1 1 0 112 0 1 1 0 01-2 0zm1 2.5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 018 7.5z"/>
  </svg>
`;

const getIconForVariant = (variant: SonnerToastVariant): string => {
  switch (variant) {
    case 'success':
      return SuccessIcon;
    case 'destructive':
      return ErrorIcon;
    case 'warning':
      return WarningIcon;
    case 'info':
      return InfoIcon;
    default:
      return '';
  }
};

@Component({
  selector: 'sonner-toaster',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  template: `
    @if (toasts().length > 0) {
      <div
        [class]="toasterClass()"
        [style]="toasterStyle()"
        role="region"
        [attr.aria-label]="'Notifications (' + toasts().length + ')'"
        [attr.aria-live]="'polite'"
      >
        @for (toast of toasts(); track toast.id) {
          <div
            [class]="toastClass(toast)"
            [attr.data-variant]="toast.variant"
            [attr.data-state]="'open'"
            role="status"
            [attr.aria-label]="toast.title"
          >
            <!-- Icon -->
            @if (showIcon()) {
              <div class="mr-2 shrink-0" [innerHTML]="getIcon(toast.variant)"></div>
            }

            <!-- Content -->
            <div class="grid gap-1">
              @if (toast.title) {
                <div class="text-sm font-semibold">{{ toast.title }}</div>
              }
              @if (toast.description) {
                <div class="text-sm opacity-90">{{ toast.description }}</div>
              }
            </div>

            <!-- Action -->
            @if (toast.action) {
              <button
                (click)="toast.action.onClick()"
                class="inline-flex h-7 items-center justify-center rounded-md px-2 text-xs font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                {{ toast.action.label }}
              </button>
            }

            <!-- Close Button -->
            @if (closeButton() && toast.dismissible) {
              <button
                (click)="dismiss(toast.id)"
                class="absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100"
                aria-label="Close notification"
              >
                <svg class="size-4" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4.646 4.646a.5.5 0 01.708 0L8 7.293l2.647-2.647a.5.5 0 01-.708.708L8 8.707l-2.647 2.646a.5.5 0 01-.708-.708L7.293 8 4.646-4.293-4.293a.5.5 0 010-.708z"/>
                </svg>
              </button>
            }
          </div>
        }
      </div>
    }
  `,
  styles: [
    `
      :host {
        display: contents;
      }

      [data-swipe='cancel'] {
        transform: translateX(0);
      }

      [data-swipe='end'] {
        transform: translateX(var(--radix-toast-swipe-end-x));
      }

      [data-swipe='move'] {
        transform: translateX(var(--radix-toast-swipe-move-x));
        transition: none;
      }

      [data-state='open'] {
        animation: slideIn var(--duration-spring-normal) var(--ease-spring-smooth);
      }

      [data-state='closed'] {
        animation: slideOut var(--duration-fast) var(--ease-out);
      }

      @keyframes slideIn {
        from {
          opacity: 0;
          transform: translateY(var(--slide-in-from));
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes slideOut {
        from {
          opacity: 1;
          transform: translateX(0);
        }
        to {
          opacity: 0;
          transform: translateX(100%);
        }
      }
    `,
  ],
})
export class SonnerComponent {
  private readonly sanitizer = inject(DomSanitizer);
  private readonly service = inject(SonnerService);

  readonly position = input<SonnerPosition>('bottom-right');
  readonly expand = input<boolean>(false);
  readonly duration = input<number>(4000);
  readonly richColors = input<boolean>(false);
  readonly closeButton = input<boolean>(true);
  readonly toastClasses = input<string>('');
  readonly showIcon = input<boolean>(true);

  protected readonly toasts = this.service.toasts;

  protected toasterClass = computed(() => {
    const position = this.position();
    return `fixed z-50 flex max-h-screen w-full flex-col-reverse p-4 sm:max-w-[420px] m-4 gap-2 ${positionClasses[position] || ''}`;
  });

  protected toasterStyle = computed(() => {
    const expand = this.expand();
    return {
      '--slide-in-from': this.getSlideInFrom(),
      'max-height': expand ? '100vh' : 'var(--sonner-toast-max-height)',
    };
  });

  protected toastClass = (toast: SonnerData) => {
    return cn(toastVariants({ variant: toast.variant }), this.toastClasses());
  };

  protected getIcon(variant: SonnerToastVariant) {
    return this.sanitizer.bypassSecurityTrustHtml(getIconForVariant(variant));
  }

  protected dismiss(id: string) {
    this.service.dismiss(id);
  }

  private getSlideInFrom(): string {
    const position = this.position();
    if (position.includes('top')) {
      return '-100%';
    }
    return '100%';
  }
}
