/**
 * Virtual Scroll Service
 *
 * Manages virtual scrolling state for streaming markdown rendering.
 * Uses Angular Signals for reactive state management of the visible window,
 * height caching, and scroll position tracking.
 */

import { Injectable, signal, computed } from '@angular/core';
import {
  VirtualScrollConfig,
  VirtualWindow,
  DEFAULT_VIRTUAL_SCROLL_CONFIG,
  MarkdownBlock
} from './models';

/**
 * Cached block height information
 */
interface BlockHeightCache {
  /** Map of block index to actual measured height */
  heights: Map<number, number>;
  /** Estimated height for blocks without measurements */
  estimatedHeight: number;
}

/**
 * Service for managing virtual scrolling state and calculations.
 * Provided in the streaming markdown component scope.
 */
@Injectable({ providedIn: 'root' })
export class VirtualScrollService {
  /** Current configuration for virtual scrolling */
  private config: VirtualScrollConfig;

  /** Cache of measured block heights */
  private heightCache: BlockHeightCache = {
    heights: new Map(),
    estimatedHeight: DEFAULT_VIRTUAL_SCROLL_CONFIG.estimatedBlockHeight!
  };

  /** Current scroll position (pixels from top) */
  readonly scrollTop = signal(0);

  /** Viewport height in pixels */
  readonly viewportHeight = signal(0);

  /** Total number of blocks in the document */
  readonly totalBlocks = signal(0);

  /** Current visible window - computed from scroll position and viewport */
  readonly window = computed<VirtualWindow>(() => {
    const top = this.scrollTop();
    const height = this.viewportHeight();
    const count = this.totalBlocks();
    return this.calculateWindow(top, height, count);
  });

  /** Total scrollable height based on cached and estimated heights */
  readonly totalHeight = computed(() => {
    return this.calculateTotalHeight(this.totalBlocks());
  });

  constructor() {
    this.config = { ...DEFAULT_VIRTUAL_SCROLL_CONFIG };
  }

  /**
   * Update the virtual scroll configuration
   */
  setConfig(config: Partial<VirtualScrollConfig>): void {
    this.config = { ...this.config, ...config };
    // Update estimated height in cache
    if (config.estimatedBlockHeight !== undefined) {
      this.heightCache.estimatedHeight = config.estimatedBlockHeight;
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): VirtualScrollConfig {
    return { ...this.config };
  }

  /**
   * Update scroll position
   */
  setScrollTop(scrollTop: number): void {
    this.scrollTop.set(Math.max(0, scrollTop));
  }

  /**
   * Update viewport height
   */
  setViewportHeight(height: number): void {
    this.viewportHeight.set(Math.max(0, height));
  }

  /**
   * Update total block count
   */
  setTotalBlocks(count: number): void {
    this.totalBlocks.set(Math.max(0, count));
  }

  /**
   * Calculate the visible window based on scroll position and viewport size.
   * Returns the start/end indices of blocks to render plus positioning info.
   *
   * @param scrollTop - Current scroll position in pixels
   * @param viewportHeight - Height of the visible viewport in pixels
   * @param totalBlocks - Total number of blocks in the document
   * @returns The visible window with start, end, totalHeight, and offsetTop
   */
  calculateWindow(scrollTop: number, viewportHeight: number, totalBlocks: number): VirtualWindow {
    if (totalBlocks <= 0) {
      return {
        start: 0,
        end: 0,
        totalHeight: 0,
        offsetTop: 0
      };
    }

    const overscan = this.config.overscan ?? DEFAULT_VIRTUAL_SCROLL_CONFIG.overscan!;
    const estimatedHeight = this.heightCache.estimatedHeight;
    const normalizedViewportHeight = Math.max(viewportHeight, estimatedHeight);
    const totalHeight = this.calculateTotalHeight(totalBlocks);
    const maxScrollTop = Math.max(0, totalHeight - normalizedViewportHeight);
    const normalizedScrollTop = Math.min(Math.max(0, scrollTop), maxScrollTop);

    // Find start index by accumulating heights from top
    let accumulatedHeight = 0;
    let firstVisibleIndex = 0;

    for (let i = 0; i < totalBlocks; i++) {
      const blockHeight = this.heightCache.heights.get(i) ?? estimatedHeight;
      if (accumulatedHeight + blockHeight > normalizedScrollTop) {
        firstVisibleIndex = i;
        break;
      }
      accumulatedHeight += blockHeight;

      if (i === totalBlocks - 1) {
        firstVisibleIndex = i;
      }
    }

    const startIndex = Math.max(0, firstVisibleIndex - overscan);

    // Find end index by accumulating from start
    let visibleHeight = 0;
    let endIndex = firstVisibleIndex;

    for (let i = firstVisibleIndex; i < totalBlocks; i++) {
      const blockHeight = this.heightCache.heights.get(i) ?? estimatedHeight;
      visibleHeight += blockHeight;
      endIndex = i;

      if (visibleHeight >= normalizedViewportHeight) {
        endIndex = Math.min(totalBlocks - 1, i + overscan);
        break;
      }
    }

    if (endIndex < startIndex) {
      endIndex = startIndex;
    }

    // Calculate offset for positioning the first visible block
    let offsetTop = 0;
    for (let i = 0; i < startIndex; i++) {
      offsetTop += this.heightCache.heights.get(i) ?? estimatedHeight;
    }

    return {
      start: startIndex,
      end: endIndex,
      totalHeight,
      offsetTop
    };
  }

  /**
   * Update the cached height for a specific block.
   * Triggers recalculation of total height and window.
   *
   * @param index - Block index
   * @param height - Measured height in pixels
   */
  updateBlockHeight(index: number, height: number): void {
    if (index >= 0 && height > 0) {
      this.heightCache.heights.set(index, height);
    }
  }

  /**
   * Get the cached height for a block (actual or estimated)
   *
   * @param index - Block index
   * @returns Height in pixels
   */
  getBlockHeight(index: number): number {
    return this.heightCache.heights.get(index) ?? this.heightCache.estimatedHeight;
  }

  /**
   * Clear the height cache (useful when content changes significantly)
   */
  clearHeightCache(): void {
    this.heightCache.heights.clear();
  }

  /**
   * Calculate total scrollable height based on cached and estimated heights
   *
   * @param blocks - Array of all markdown blocks
   * @returns Total height in pixels
   */
  getTotalHeight(blocks: MarkdownBlock[]): number {
    return this.calculateTotalHeight(blocks.length);
  }

  /**
   * Internal method to calculate total height from block count
   */
  private calculateTotalHeight(totalBlocks: number): number {
    const estimatedHeight = this.heightCache.estimatedHeight;
    let total = 0;

    for (let i = 0; i < totalBlocks; i++) {
      total += this.heightCache.heights.get(i) ?? estimatedHeight;
    }

    return total;
  }

  /**
   * Determine whether virtual scrolling should be enabled based on block count
   *
   * @param blockCount - Number of blocks in the document
   * @returns True if virtual scrolling should be used
   */
  shouldUseVirtualScroll(blockCount: number): boolean {
    const minBlocks = this.config.minBlocksForVirtual ?? DEFAULT_VIRTUAL_SCROLL_CONFIG.minBlocksForVirtual!;
    return this.config.enabled && blockCount >= minBlocks;
  }

  /**
   * Get the estimated height for a block based on its type
   * This provides better initial estimates before actual measurement
   *
   * @param block - The markdown block
   * @returns Estimated height in pixels
   */
  estimateBlockHeight(block: MarkdownBlock): number {
    const base = this.heightCache.estimatedHeight;

    // Code blocks are typically taller
    if (block.type === 'code') {
      const lineCount = block.content.split('\n').length;
      return Math.max(base, lineCount * 24 + 40); // ~24px per line + padding
    }

    // Lists may be taller depending on content
    if (block.type === 'list') {
      const lineCount = block.content.split('\n').length;
      return Math.max(base, lineCount * 22 + 20);
    }

    // Blockquotes with nested content
    if (block.type === 'blockquote') {
      return base * 1.3;
    }

    // Headings vary by level
    if (block.type === 'heading') {
      return base * 0.8;
    }

    // Default for paragraphs and other blocks
    return base;
  }

  /**
   * Pre-warm the height cache with estimates for all blocks
   * Useful for initial render to avoid layout thrashing
   *
   * @param blocks - Array of markdown blocks
   */
  preWarmHeightCache(blocks: MarkdownBlock[]): void {
    blocks.forEach((block, index) => {
      if (!this.heightCache.heights.has(index)) {
        this.heightCache.heights.set(index, this.estimateBlockHeight(block));
      }
    });
  }
}
