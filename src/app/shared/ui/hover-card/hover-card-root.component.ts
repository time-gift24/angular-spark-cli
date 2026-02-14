/**
 * Hover Card Root Component
 *
 * Provides context for hover card interactions using Angular signals.
 * Manages open state, delays, and trigger registration.
 *
 * Usage:
 * <div spark-hover-card>
 *   <button spark-hover-card-trigger>Hover me</button>
 *   <div spark-hover-card-content>Content</div>
 * </div>
 */

import {
  Component,
  input,
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

/** Injection token for hover card root context */
export const HOVER_CARD_ROOT = new InjectionToken<HoverCardRootToken>('HOVER_CARD_ROOT');

export interface HoverCardRootToken {
  readonly isOpen: Signal<boolean>;
  readonly disabled: Signal<boolean>;
  readonly open: () => void;
  readonly close: () => void;
  readonly triggerElementRef: Signal<ElementRef<HTMLElement> | null>;
  readonly contentElementRef: Signal<ElementRef<HTMLElement> | null>;
  readonly registerTrigger: (ref: ElementRef<HTMLElement>) => void;
  readonly registerContent: (ref: ElementRef<HTMLElement>) => void;
}

@Component({
  selector: 'div[spark-hover-card]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'hostClass()',
  },
  template: '<ng-content />',
  providers: [
    {
      provide: HOVER_CARD_ROOT,
      useExisting: HoverCardRootComponent,
    },
  ],
})
export class HoverCardRootComponent implements HoverCardRootToken {
  private readonly destroyRef = inject(DestroyRef);
  private readonly elementRef = inject(ElementRef<HTMLElement>);

  // Public API
  readonly disabled = input<boolean>(false);
  readonly openDelay = input<number>(0);
  readonly closeDelay = input<number>(0);
  readonly class = input<string>('');

  // Internal state
  readonly isOpen = signal(false);
  readonly triggerElementRef = signal<ElementRef<HTMLElement> | null>(null);
  readonly contentElementRef = signal<ElementRef<HTMLElement> | null>(null);

  // Computed
  protected readonly hostClass = computed(() => {
    return cn('relative', this.class());
  });

  // API for child components
  readonly open = (): void => {
    if (this.disabled()) {
      return;
    }
    if (this.openDelay() > 0) {
      setTimeout(() => {
        this.isOpen.set(true);
      }, this.openDelay());
    } else {
      this.isOpen.set(true);
    }
  };

  readonly close = (): void => {
    if (this.closeDelay() > 0) {
      setTimeout(() => {
        this.isOpen.set(false);
      }, this.closeDelay());
    } else {
      this.isOpen.set(false);
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
