/**
 * Block Height Tracker Directive
 *
 * Structural directive that measures actual block heights in the DOM.
 * Uses ResizeObserver to detect height changes and reports them back
 * to the VirtualScrollService for accurate window calculations.
 *
 * Features:
 * - Debounced measurements (32ms) to reduce thrashing
 * - Significant change threshold (>1px) to avoid noise
 * - Automatic cleanup on destroy
 * - No memory leaks from observers
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
  TemplateRef,
  ViewContainerRef,
  computed,
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

/**
 * Directive to track and report block heights.
 * Wraps content and observes size changes.
 *
 * @example
 * ```html
 * <div *appBlockHeightTracker="block; index: i; id: block.id">
 *   <app-markdown-block-router [block]="block" />
 * </div>
 * ```
 *
 * Or with microsyntax:
 * ```html
 * <ng-container *appBlockHeightTracker="let block; index: i; id: block.id">
 *   <app-markdown-block-router [block]="block" />
 * </ng-container>
 * ```
 */
@Directive({
  selector: '[appBlockHeightTracker]',
  standalone: true
})
export class BlockHeightTrackerDirective implements OnInit, OnDestroy {
  /** The block to measure (passed via * syntax) */
  @Input({ required: true, alias: 'appBlockHeightTracker' }) set block(value: unknown) {
    // Block data is stored but not directly used for measurement
    // The directive measures the container's actual DOM height
  }

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

  /** Configuration for height tracking */
  private config: HeightTrackerConfig = {
    debounceMs: 32,
    changeThreshold: 1
  };

  /** ResizeObserver instance */
  private resizeObserver: ResizeObserver | null = null;

  /** Subject for height change notifications */
  private heightChanges$ = new Subject<number>();

  /** Last reported height (for threshold comparison) */
  private lastReportedHeight = 0;

  /** Template ref for structural directive support */
  private templateRef = inject(TemplateRef<unknown>);

  /** View container for structural directive support */
  private viewContainer = inject(ViewContainerRef);

  /** Element ref for the wrapper */
  private elementRef = inject(ElementRef);

  /** Computed block index and id */
  readonly blockData = computed(() => ({
    index: this.blockIndex(),
    id: this.blockId()
  }));

  ngOnInit(): void {
    // Create the embedded view for the content
    this.viewContainer.createEmbeddedView(this.templateRef);

    // Set up debounced height change notifications
    this.heightChanges$.pipe(
      debounceTime(this.config.debounceMs),
      distinctUntilChanged((a, b) => Math.abs(a - b) < this.config.changeThreshold),
      takeUntilDestroyed()
    ).subscribe((height) => {
      this.lastReportedHeight = height;
      this.heightMeasured.emit({
        index: this.blockData().index,
        id: this.blockData().id,
        height
      });
    });

    // Initialize ResizeObserver after view is created
    // Use setTimeout to ensure DOM is ready
    setTimeout(() => {
      this.setupResizeObserver();
    }, 0);
  }

  ngOnDestroy(): void {
    this.cleanup();
  }

  /**
   * Set up ResizeObserver to track height changes
   */
  private setupResizeObserver(): void {
    if (typeof ResizeObserver === 'undefined') {
      console.warn('[BlockHeightTrackerDirective] ResizeObserver not supported');
      return;
    }

    // Get the wrapper element
    const element = this.elementRef.nativeElement as HTMLElement;
    if (!element) {
      return;
    }

    // Create and attach observer
    this.resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const height = entry.contentRect.height;
        if (height > 0) {
          this.heightChanges$.next(height);
        }
      }
    });

    this.resizeObserver.observe(element);

    // Measure initial height
    const initialHeight = element.offsetHeight;
    if (initialHeight > 0) {
      this.heightChanges$.next(initialHeight);
    }
  }

  /**
   * Clean up observer and subscriptions
   */
  private cleanup(): void {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
    this.heightChanges$.complete();
  }

  /**
   * Manually trigger a height measurement
   * Useful for forcing a re-measure after content changes
   */
  measure(): void {
    const element = this.elementRef.nativeElement as HTMLElement;
    if (!element) {
      return;
    }

    const height = element.offsetHeight;
    if (height > 0) {
      this.heightChanges$.next(height);
    }
  }

  /**
   * Get the current measured height
   */
  getCurrentHeight(): number {
    const element = this.elementRef.nativeElement as HTMLElement;
    return element ? element.offsetHeight : 0;
  }
}
