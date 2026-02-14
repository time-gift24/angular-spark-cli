/**
 * Popover Root Component
 *
 * Provides context for popover children using Angular signals.
 * Manages open state with optional modal overlay.
 *
 * Usage:
 * <div spark-popover-root [(open)]="isOpen">
 *   <button spark-popover-trigger>Toggle</button>
 *   <div spark-popover-content>Content</div>
 * </div>
 */

import {
  Component,
  input,
  model,
  signal,
  computed,
  inject,
  InjectionToken,
  ChangeDetectionStrategy,
  DestroyRef,
  ElementRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { fromEvent } from 'rxjs';
import type { Signal } from '@angular/core';
import { cn } from '@app/shared';

/** Injection token for popover root context */
export const POPOVER_ROOT = new InjectionToken<PopoverRootToken>('POPOVER_ROOT');

export interface PopoverRootToken {
  readonly isOpen: Signal<boolean>;
  readonly disabled: Signal<boolean>;
  readonly modal: Signal<boolean>;
  readonly openPopover: () => void;
  readonly close: () => void;
  readonly toggle: () => void;
  readonly triggerElementRef: Signal<ElementRef<HTMLElement> | null>;
  readonly contentElementRef: Signal<ElementRef<HTMLElement> | null>;
  readonly registerTrigger: (ref: ElementRef<HTMLElement>) => void;
  readonly registerContent: (ref: ElementRef<HTMLElement>) => void;
}

@Component({
  selector: 'div[spark-popover-root]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'hostClass()',
    '[attr.data-state]': 'isOpen() ? "open" : "closed"',
  },
  template: '<ng-content />',
  providers: [
    {
      provide: POPOVER_ROOT,
      useExisting: PopoverRootComponent,
    },
  ],
})
export class PopoverRootComponent implements PopoverRootToken {
  private readonly destroyRef = inject(DestroyRef);
  private readonly elementRef = inject(ElementRef<HTMLElement>);

  // Public API
  readonly disabled = input<boolean>(false);
  readonly modal = input<boolean>(false);
  readonly class = input<string>('');

  // Model for two-way binding
  readonly open = model<boolean>(false);

  // Internal state
  readonly isOpen: Signal<boolean> = this.open;
  readonly triggerElementRef = signal<ElementRef<HTMLElement> | null>(null);
  readonly contentElementRef = signal<ElementRef<HTMLElement> | null>(null);

  // Computed
  protected readonly hostClass = computed(() => {
    return cn('relative', this.isOpen() && 'z-50', this.class());
  });

  // API for child components
  readonly openPopover = (): void => {
    if (this.disabled()) {
      return;
    }
    this.open.set(true);
  };

  readonly close = (): void => {
    this.open.set(false);
    // Return focus to trigger
    const trigger = this.triggerElementRef();
    if (trigger) {
      queueMicrotask(() => {
        trigger.nativeElement?.focus();
      });
    }
  };

  readonly toggle = (): void => {
    if (this.disabled()) {
      return;
    }
    if (this.isOpen()) {
      this.close();
    } else {
      this.openPopover();
    }
  };

  readonly registerTrigger = (ref: ElementRef<HTMLElement>): void => {
    this.triggerElementRef.set(ref);
  };

  readonly registerContent = (ref: ElementRef<HTMLElement>): void => {
    this.contentElementRef.set(ref);
  };

  constructor() {
    this.setupClickOutsideListener();
  }

  private setupClickOutsideListener(): void {
    fromEvent<MouseEvent>(document, 'click')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((evt: MouseEvent) => {
        if (!this.isOpen()) {
          return;
        }
        const target = evt.target as HTMLElement;
        const nativeElement = this.elementRef.nativeElement;
        if (nativeElement && !nativeElement.contains(target)) {
          this.close();
        }
      });
  }
}
