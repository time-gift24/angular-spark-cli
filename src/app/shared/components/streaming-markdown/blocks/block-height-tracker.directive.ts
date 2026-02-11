/**
 * Block Height Tracker Directive
 *
 * Attribute directive that measures actual block heights in the DOM.
 * Uses ResizeObserver to detect height changes and reports them back
 * to the VirtualScrollService for accurate window calculations.
 */

import {
  Directive,
  Input,
  Output,
  EventEmitter,
  inject,
  OnInit,
  OnDestroy,
  ElementRef,
  DestroyRef,
  signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Subject } from 'rxjs';

/**
 * Height measurement data emitted by the directive
 */
export interface HeightMeasurement {
  /** Block index in the blocks array */
  index: number;
  /** Unique block identifier */
  id: string;
  /** Measured height in pixels */
  height: number;
}

/**
 * Configuration for height tracking behavior
 */
interface HeightTrackerConfig {
  /** Debounce time in milliseconds (default: 32ms ~ 2 frames at 60fps) */
  debounceMs: number;
  /** Minimum height change to report (default: 1px) */
  changeThreshold: number;
}

@Directive({
  selector: '[appBlockHeightTracker]',
  standalone: true
})
export class BlockHeightTrackerDirective implements OnInit, OnDestroy {
  /** The block to measure (for template readability, not used directly) */
  @Input({ required: true, alias: 'appBlockHeightTracker' }) set block(_value: unknown) {}

  /** Index of the block in the blocks array */
  @Input({ required: true, alias: 'appBlockHeightTrackerIndex' }) set index(value: number) {
    this.blockIndex.set(value);
  }
  readonly blockIndex = signal<number>(0);

  /** Unique block identifier */
  @Input({ required: true, alias: 'appBlockHeightTrackerId' }) set id(value: string) {
    this.blockId.set(value);
  }
  readonly blockId = signal<string>('');

  /** Emitted when a new height is measured */
  @Output() readonly heightMeasured = new EventEmitter<HeightMeasurement>();

  private config: HeightTrackerConfig = {
    debounceMs: 32,
    changeThreshold: 1
  };

  private resizeObserver: ResizeObserver | null = null;
  private heightChanges$ = new Subject<number>();
  private elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.heightChanges$.pipe(
      debounceTime(this.config.debounceMs),
      distinctUntilChanged((a, b) => Math.abs(a - b) < this.config.changeThreshold),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((height) => {
      this.heightMeasured.emit({
        index: this.blockIndex(),
        id: this.blockId(),
        height
      });
    });

    queueMicrotask(() => this.setupResizeObserver());
  }

  ngOnDestroy(): void {
    this.cleanup();
  }

  private setupResizeObserver(): void {
    if (typeof ResizeObserver === 'undefined') {
      return;
    }

    const element = this.elementRef.nativeElement;
    if (!element) {
      return;
    }

    this.resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const height = entry.contentRect.height;
        if (height > 0) {
          this.heightChanges$.next(height);
        }
      }
    });

    this.resizeObserver.observe(element);

    const initialHeight = element.offsetHeight;
    if (initialHeight > 0) {
      this.heightChanges$.next(initialHeight);
    }
  }

  private cleanup(): void {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    this.heightChanges$.complete();
  }

  /** Manually trigger a height measurement */
  measure(): void {
    const element = this.elementRef.nativeElement;
    if (!element) {
      return;
    }

    const height = element.offsetHeight;
    if (height > 0) {
      this.heightChanges$.next(height);
    }
  }

  /** Get the current measured height */
  getCurrentHeight(): number {
    const element = this.elementRef.nativeElement;
    return element ? element.offsetHeight : 0;
  }
}
