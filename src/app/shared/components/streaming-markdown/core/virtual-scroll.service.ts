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
  private config = signal<VirtualScrollConfig>({ ...DEFAULT_VIRTUAL_SCROLL_CONFIG });

  /** Cache of measured block heights */
  private heightCache: BlockHeightCache = {
    heights: new Map(),
    estimatedHeight: DEFAULT_VIRTUAL_SCROLL_CONFIG.estimatedBlockHeight!
  };

  /** Internal cache version so height mutations trigger computed recalculation */
  private readonly heightCacheVersion = signal(0);
  /** Cached prefix sums for fast offset-to-index lookup */
  private prefixSumCache: {
    token: number;
    totalBlocks: number;
    prefix: number[];
  } = {
    token: -1,
    totalBlocks: -1,
    prefix: [0]
  };

  /** Current scroll position (pixels from top) */
  readonly scrollTop = signal(0);

  /** Viewport height in pixels */
  readonly viewportHeight = signal(0);

  /** Total number of blocks in the document */
  readonly totalBlocks = signal(0);

  /** Current visible window - computed from scroll position and viewport */
  readonly window = computed<VirtualWindow>(() => {
    this.heightCacheVersion();
    this.config();
    const top = this.scrollTop();
    const height = this.viewportHeight();
    const count = this.totalBlocks();
    return this.calculateWindow(top, height, count);
  });

  /** Total scrollable height based on cached and estimated heights */
  readonly totalHeight = computed(() => {
    this.heightCacheVersion();
    this.config();
    return this.calculateTotalHeight(this.totalBlocks());
  });

  /**
   * Update the virtual scroll configuration
   */
  setConfig(config: Partial<VirtualScrollConfig>): void {
    this.config.update((current) => ({ ...current, ...config }));
    if (config.estimatedBlockHeight !== undefined && config.estimatedBlockHeight > 0) {
      this.heightCache.estimatedHeight = config.estimatedBlockHeight;
      this.bumpHeightCacheVersion();
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): VirtualScrollConfig {
    return { ...this.config() };
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

    const overscan = this.config().overscan ?? DEFAULT_VIRTUAL_SCROLL_CONFIG.overscan!;
    const estimatedHeight = this.heightCache.estimatedHeight;
    const normalizedViewportHeight = Math.max(viewportHeight, estimatedHeight);
    const prefix = this.getPrefixSums(totalBlocks);
    const totalHeight = prefix[totalBlocks] ?? 0;
    const maxScrollTop = Math.max(0, totalHeight - normalizedViewportHeight);
    const normalizedScrollTop = Math.min(Math.max(0, scrollTop), maxScrollTop);

    const firstVisibleIndex = this.findBlockIndexAtOffset(prefix, normalizedScrollTop, totalBlocks);

    const startIndex = Math.max(0, firstVisibleIndex - overscan);

    const viewportEndOffset = Math.max(normalizedScrollTop, normalizedScrollTop + normalizedViewportHeight - 0.001);
    const lastVisibleIndex = this.findBlockIndexAtOffset(prefix, viewportEndOffset, totalBlocks);
    let endIndex = Math.min(totalBlocks - 1, lastVisibleIndex + overscan);

    if (endIndex < startIndex) {
      endIndex = startIndex;
    }

    const offsetTop = prefix[startIndex] ?? 0;

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
    if (index < 0 || height <= 0) {
      return;
    }

    const previous = this.heightCache.heights.get(index);
    if (previous !== undefined && Math.abs(previous - height) < 1) {
      return;
    }

    this.heightCache.heights.set(index, height);
    this.bumpHeightCacheVersion();
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
    if (this.heightCache.heights.size === 0) {
      return;
    }

    this.heightCache.heights.clear();
    this.bumpHeightCacheVersion();
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
    const prefix = this.getPrefixSums(totalBlocks);
    return prefix[totalBlocks] ?? 0;
  }

  /**
   * Determine whether virtual scrolling should be enabled based on block count
   *
   * @param blockCount - Number of blocks in the document
   * @returns True if virtual scrolling should be used
   */
  shouldUseVirtualScroll(blockCount: number): boolean {
    const config = this.config();
    const minBlocks = config.minBlocksForVirtual ?? DEFAULT_VIRTUAL_SCROLL_CONFIG.minBlocksForVirtual!;
    return config.enabled && blockCount >= minBlocks;
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

    if (block.type === 'code') {
      const lineCount = block.content.split('\n').length;
      return Math.max(base, lineCount * 24 + 40);
    }

    if (block.type === 'list') {
      const lineCount = block.content.split('\n').length;
      return Math.max(base, lineCount * 22 + 20);
    }

    if (block.type === 'blockquote') {
      return base * 1.3;
    }

    if (block.type === 'heading') {
      return base * 0.8;
    }

    return base;
  }

  /**
   * Pre-warm the height cache with estimates for all blocks
   * Useful for initial render to avoid layout thrashing
   *
   * @param blocks - Array of markdown blocks
   */
  preWarmHeightCache(blocks: MarkdownBlock[]): void {
    let changed = false;

    blocks.forEach((block, index) => {
      if (!this.heightCache.heights.has(index)) {
        this.heightCache.heights.set(index, this.estimateBlockHeight(block));
        changed = true;
      }
    });

    if (changed) {
      this.bumpHeightCacheVersion();
    }
  }

  private bumpHeightCacheVersion(): void {
    this.heightCacheVersion.update((version) => version + 1);
  }

  private getPrefixSums(totalBlocks: number): number[] {
    const token = this.heightCacheVersion();
    const cache = this.prefixSumCache;
    if (cache.token === token && cache.totalBlocks === totalBlocks) {
      return cache.prefix;
    }

    const estimatedHeight = this.heightCache.estimatedHeight;
    const prefix = new Array<number>(totalBlocks + 1);
    prefix[0] = 0;

    for (let i = 0; i < totalBlocks; i++) {
      const blockHeight = this.heightCache.heights.get(i) ?? estimatedHeight;
      prefix[i + 1] = prefix[i] + blockHeight;
    }

    this.prefixSumCache = {
      token,
      totalBlocks,
      prefix
    };
    return prefix;
  }

  private findBlockIndexAtOffset(prefix: number[], offset: number, totalBlocks: number): number {
    if (totalBlocks <= 0) {
      return 0;
    }

    const totalHeight = prefix[totalBlocks] ?? 0;
    const clampedOffset = Math.min(Math.max(0, offset), totalHeight);
    const index = this.upperBound(prefix, clampedOffset) - 1;
    return Math.min(totalBlocks - 1, Math.max(0, index));
  }

  private upperBound(values: number[], target: number): number {
    let low = 0;
    let high = values.length;

    while (low < high) {
      const mid = (low + high) >> 1;
      if (values[mid] <= target) {
        low = mid + 1;
      } else {
        high = mid;
      }
    }

    return low;
  }
}
