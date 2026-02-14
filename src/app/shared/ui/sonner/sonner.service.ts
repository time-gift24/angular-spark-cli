import { Injectable, signal, inject, InjectionToken } from '@angular/core';
import {
  type SonnerData,
  type SonnerOptions,
  type SonnerPosition,
  type SonnerVariant,
} from './sonner.types';

export const SONNER_DEFAULT_OPTIONS = new InjectionToken<Partial<SonnerData>>('SONNER_DEFAULT_OPTIONS', {
  providedIn: 'root',
  factory: () => ({
    position: 'bottom-right',
    duration: 4000,
    variant: 'default',
    dismissible: true,
    action: undefined,
    description: undefined,
    title: undefined,
  }),
});

/**
 * SonnerService - Toast notification service
 *
 * Provides methods to create and manage toast notifications.
 * Uses Angular signals for reactive state management.
 */
@Injectable({ providedIn: 'root' })
export class SonnerService {
  private readonly defaults = inject(SONNER_DEFAULT_OPTIONS);

  /** Active toasts */
  readonly toasts = signal<SonnerData[]>([]);

  /** Current position */
  readonly position = signal<SonnerPosition>(this.defaults.position as SonnerPosition);

  /** Open a new toast notification */
  open(options: SonnerOptions): string {
    const id = options.id || this.generateId();
    const toast: SonnerData = {
      id,
      title: options.title || '',
      description: options.description || '',
      variant: options.variant || this.defaults.variant || 'default',
      position: options.position || this.defaults.position || 'bottom-right',
      duration: options.duration ?? (this.defaults.duration || 4000),
      action: options.action ?? undefined,
      dismissible: options.dismissible ?? (this.defaults.dismissible ?? true),
      timestamp: Date.now(),
    };

    // Update position if different
    if (options.position && options.position !== this.position()) {
      this.position.set(options.position);
    }

    // Add toast
    this.toasts.update((toasts) => [...toasts, toast]);

    // Auto-dismiss after duration
    if (toast.duration > 0) {
      setTimeout(() => this.dismiss(id), toast.duration);
    }

    return id;
  }

  /** Dismiss a toast by id */
  dismiss(id: string): void {
    this.toasts.update((toasts) => toasts.filter((t) => t.id !== id));
  }

  /** Dismiss all toasts */
  dismissAll(): void {
    this.toasts.set([]);
  }

  /** Create a success toast */
  success(title: string, description?: string, options?: Partial<SonnerOptions>): string {
    return this.open({ ...options, title, description, variant: 'success' });
  }

  /** Create an error toast */
  error(title: string, description?: string, options?: Partial<SonnerOptions>): string {
    return this.open({ ...options, title, description, variant: 'destructive' });
  }

  /** Create a warning toast */
  warning(title: string, description?: string, options?: Partial<SonnerOptions>): string {
    return this.open({ ...options, title, description, variant: 'warning' });
  }

  /** Create an info toast */
  info(title: string, description?: string, options?: Partial<SonnerOptions>): string {
    return this.open({ ...options, title, description, variant: 'info' });
  }

  /** Create a promise toast that shows loading state */
  promise<T>(
    promise: Promise<T>,
    options: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: unknown) => string);
    }
  ): Promise<T> {
    const loadingId = this.open({
      title: options.loading,
      variant: 'default',
      duration: 0, // Don't auto-dismiss
    });

    return promise
      .then((data) => {
        this.dismiss(loadingId);
        const successMessage = typeof options.success === 'function' ? options.success(data) : options.success;
        this.success(successMessage);
        return data;
      })
      .catch((error) => {
        this.dismiss(loadingId);
        const errorMessage = typeof options.error === 'function' ? options.error(error) : options.error;
        this.error(errorMessage);
        throw error;
      });
  }

  /** Generate unique ID for toast */
  private generateId(): string {
    return `sonner-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }
}
