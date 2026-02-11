/**
 * Virtual Scroll Viewport Component
 *
 * Provides a scrollable viewport container for virtual scrolling.
 * Wraps the visible block rendering area and forwards scroll events
 * to the VirtualScrollService. Uses requestAnimationFrame for throttled
 * scroll event handling.
 *
 * Features:
 * - OnPush change detection for optimal performance
 * - Throttled scroll events via requestAnimationFrame
 * - Tailwind classes for all styling (no custom CSS)
 * - Content projection for flexible rendering
 */

import {
  Component,
  input,
  output,
  ViewChild,
  ElementRef,
  AfterViewInit,
  OnDestroy,
  ChangeDetectionStrategy,
  computed,
  signal,
  Signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  MarkdownBlock,
  VirtualScrollConfig,
  VirtualWindow,
  DEFAULT_VIRTUAL_SCROLL_CONFIG
} from '../core/models';

/**
 * Scroll event data emitted by the viewport
 */
export interface ScrollEvent {
  scrollTop: number;
  scrollHeight: number;
  clientHeight: number;
}

/**
 * Virtual scroll viewport component.
 * Provides the scroll container and manages scroll position tracking.
 */
@Component({
  selector: 'app-virtual-scroll-viewport',
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      #viewport
      class="overflow-auto overflow-y-auto overflow-x-hidden relative"
      (scroll)="onScroll($event)"
    >
      <div
        class="virtual-scroll-spacer relative"
        [style.height.px]="totalHeight()"
      >
        <div
          class="virtual-scroll-content absolute left-0 right-0"
          [style.transform]="'translateY(' + offsetTop() + 'px)'"
        >
          <ng-content />
        </div>
      </div>
    </div>
  `
})
export class VirtualScrollViewportComponent implements AfterViewInit, OnDestroy {
  /** Reference to the viewport element */
  @ViewChild('viewport', { static: true }) viewport!: ElementRef<HTMLDivElement>;

  /** All blocks (for computing total height) */
  readonly blocks = input.required<Signal<MarkdownBlock[]> | MarkdownBlock[]>({ alias: 'blocks' });

  /** Virtual scroll configuration */
  readonly configInput = input.required<VirtualScrollConfig>({ alias: 'config' });
  get config(): VirtualScrollConfig {
    return this.configSignal();
  }

  /** Current visible window (for positioning content) */
  readonly windowInput = input.required<VirtualWindow>({ alias: 'window' });

  /** Emitted when the visible block range changes */
  readonly visibleRangeChange = output<VirtualWindow>();

  /** Emitted on scroll events (throttled) */
  readonly scroll = output<ScrollEvent>();

  /** Internal signals for reactive state */
  private blocksSignal = computed(() => {
    const value = this.blocks();
    return Array.isArray(value) ? value : value();
  });
  private configSignal = computed(() => ({ ...DEFAULT_VIRTUAL_SCROLL_CONFIG, ...this.configInput() }));
  private windowSignal = computed(() => this.windowInput());

  /** Scroll position signal */
  readonly scrollTop = signal(0);

  /** Viewport height signal */
  readonly viewportHeight = signal(0);

  /** Total scrollable height */
  readonly totalHeight = computed(() => this.windowSignal().totalHeight);

  /** Content offset for positioning */
  readonly offsetTop = computed(() => this.windowSignal().offsetTop);

  /** RAF ID for scroll throttling */
  private rafId: number | null = null;

  /** Last scroll position for diffing */
  private lastScrollTop = 0;

  /** Target scroll position for RAF */
  private targetScrollTop = 0;

  /** Whether viewport has been initialized */
  private isViewReady = false;

  ngAfterViewInit(): void {
    this.isViewReady = true;
    requestAnimationFrame(() => this.emitViewportState());
  }

  ngOnDestroy(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  /**
   * Handle scroll events with requestAnimationFrame throttling
   */
  onScroll(event: Event): void {
    const target = event.target as HTMLElement;
    this.targetScrollTop = target.scrollTop;
    this.scheduleScrollProcessing();
  }

  /**
   * Process scroll update (called via RAF)
   */
  private processScroll(): void {
    this.rafId = null;

    if (!this.viewport?.nativeElement) {
      return;
    }

    const element = this.viewport.nativeElement;
    const maxScrollTop = Math.max(0, element.scrollHeight - element.clientHeight);
    const nextScrollTop = Math.max(0, Math.min(this.targetScrollTop, maxScrollTop));

    if (nextScrollTop !== this.lastScrollTop) {
      this.lastScrollTop = nextScrollTop;
      this.scrollTop.set(nextScrollTop);
    }

    this.viewportHeight.set(element.clientHeight);

    this.scroll.emit({
      scrollTop: this.scrollTop(),
      scrollHeight: element.scrollHeight,
      clientHeight: element.clientHeight
    });

    this.visibleRangeChange.emit(this.windowSignal());
  }

  /**
   * Schedule scroll processing on next animation frame
   */
  private scheduleScrollProcessing(): void {
    if (this.rafId !== null || !this.isViewReady) {
      return;
    }

    this.rafId = requestAnimationFrame(() => this.processScroll());
  }

  /**
   * Emit the latest viewport metrics immediately
   */
  private emitViewportState(): void {
    if (!this.viewport?.nativeElement) {
      return;
    }

    this.targetScrollTop = this.viewport.nativeElement.scrollTop;
    this.processScroll();
  }

  /**
   * Programmatically scroll to a position
   */
  scrollTo(scrollTop: number): void {
    if (this.viewport?.nativeElement) {
      this.viewport.nativeElement.scrollTop = scrollTop;
      this.targetScrollTop = this.viewport.nativeElement.scrollTop;
      this.scheduleScrollProcessing();
    }
  }

  /**
   * Scroll to the bottom of the content
   */
  scrollToBottom(): void {
    if (this.viewport?.nativeElement) {
      const el = this.viewport.nativeElement;
      el.scrollTop = el.scrollHeight;
      this.targetScrollTop = el.scrollTop;
      this.scheduleScrollProcessing();
    }
  }

  /**
   * Get the current viewport element
   */
  getViewportElement(): HTMLDivElement | undefined {
    return this.viewport?.nativeElement;
  }

  /**
   * Measure and return the viewport dimensions
   */
  getViewportDimensions(): { scrollTop: number; scrollHeight: number; clientHeight: number } {
    const el = this.viewport?.nativeElement;
    if (!el) {
      return { scrollTop: 0, scrollHeight: 0, clientHeight: 0 };
    }

    return {
      scrollTop: el.scrollTop,
      scrollHeight: el.scrollHeight,
      clientHeight: el.clientHeight
    };
  }

  /**
   * Reset scroll position to top
   */
  resetScroll(): void {
    this.scrollTo(0);
  }
}
