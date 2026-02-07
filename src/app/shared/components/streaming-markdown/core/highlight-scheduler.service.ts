/**
 * Highlight Scheduler Service
 *
 * Manages progressive code highlighting to prevent blocking the main thread.
 * Queues code blocks and highlights them based on visibility and priority.
 *
 * Features:
 * - Queue-based management for pending blocks
 * - RAF-based throttling (max N blocks per frame)
 * - Priority-based processing (visible blocks first)
 * - Automatic cancellation when blocks go off-screen
 * - Integration with VirtualScrollService for window tracking
 */

import { Injectable, signal, computed, inject, DestroyRef, effect, EffectRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MarkdownBlock, BlockType } from './models';
import { VirtualScrollService } from './virtual-scroll.service';
import { ShiniHighlighter } from './shini-highlighter';
import { CodeLine } from './models';

/**
 * Priority level for highlighting a block
 */
export enum HighlightPriority {
  /** Block is currently visible in viewport */
  VISIBLE = 'visible',
  /** Block is in overscan buffer (near viewport) */
  OVERSCAN = 'overscan',
  /** Block is off-screen (lowest priority) */
  BACKGROUND = 'background'
}

/**
 * Queued block awaiting highlighting
 */
interface QueuedBlock {
  /** Block data */
  block: MarkdownBlock;
  /** Current priority level */
  priority: HighlightPriority;
  /** Block index in document */
  index: number;
  /** Timestamp when queued */
  queuedAt: number;
}

/**
 * Highlight result callback
 */
interface HighlightCallback {
  blockId: string;
  lines: CodeLine[];
  success: boolean;
}

/**
 * Configuration for highlight scheduler behavior
 */
export interface HighlightSchedulerConfig {
  /** Maximum blocks to highlight per RAF frame (default: 4) */
  maxBlocksPerFrame: number;
  /** Maximum time budget per frame in ms (default: 8ms @ 120fps) */
  maxTimePerFrame: number;
  /** Queue size limit (default: 100) */
  maxQueueSize: number;
  /** Whether to enable background highlighting (default: true) */
  enableBackground: boolean;
}

/**
 * Default scheduler configuration
 */
export const DEFAULT_SCHEDULER_CONFIG: HighlightSchedulerConfig = {
  maxBlocksPerFrame: 4,
  maxTimePerFrame: 8,
  maxQueueSize: 100,
  enableBackground: true
};

/**
 * Service for scheduling and managing progressive code highlighting
 */
@Injectable({ providedIn: 'root' })
export class HighlightSchedulerService {
  /** Currently configured settings */
  readonly config = signal<HighlightSchedulerConfig>(DEFAULT_SCHEDULER_CONFIG);

  /** Queue of blocks awaiting highlighting */
  readonly queue = signal<QueuedBlock[]>([]);

  /** Currently highlighted block IDs (for deduplication) */
  readonly highlightedBlockIds = signal<Set<string>>(new Set());

  /** Number of blocks currently in queue */
  readonly queueSize = computed(() => this.queue().length);

  /** Whether scheduler is actively processing */
  readonly isProcessing = signal<boolean>(false);

  /** Statistics tracking */
  readonly stats = signal<{
    totalProcessed: number;
    totalSkipped: number;
    totalErrors: number;
    avgProcessingTime: number;
  }>({
    totalProcessed: 0,
    totalSkipped: 0,
    totalErrors: 0,
    avgProcessingTime: 0
  });

  private virtualScroll = inject(VirtualScrollService);
  private highlighter = inject(ShiniHighlighter);
  private destroyRef = inject(DestroyRef);

  /** Active requestAnimationFrame ID */
  private rafId: number | null = null;

  /** Current processing frame timestamp */
  private frameStartTime = 0;

  /** Blocks processed in current frame */
  private processedThisFrame = 0;

  /** Effect ref for cleanup */
  private queueSizeEffect: EffectRef;

  /** Effect ref for virtual scroll window changes */
  private windowChangeEffect: EffectRef;

  constructor() {
    // Auto-start processing when queue has items
    this.queueSizeEffect = effect(() => {
      const size = this.queueSize();
      if (size > 0 && !this.isProcessing()) {
        this.startProcessing();
      }
    });

    // Watch for virtual scroll window changes to update priorities
    this.windowChangeEffect = effect(() => {
      // Trigger priority update when window changes
      this.virtualScroll.window();
      this.updatePriorities();
    });

    // Cleanup on destroy
    this.destroyRef.onDestroy(() => {
      this.stopProcessing();
      this.queueSizeEffect.destroy();
      this.windowChangeEffect.destroy();
    });
  }

  /**
   * Queue a block for highlighting
   * @param block The block to highlight
   * @param index Block's index in the document
   */
  queueBlock(block: MarkdownBlock, index: number): void {
    // Validate block type
    if (block.type !== BlockType.CODE_BLOCK) {
      return;
    }

    // Skip if already highlighted
    const highlighted = this.highlightedBlockIds();
    if (highlighted.has(block.id) || block.isHighlighted) {
      return;
    }

    // Check queue size limit
    const queue = this.queue();
    const maxSize = this.config().maxQueueSize;
    if (queue.length >= maxSize) {
      // Remove oldest background-priority item
      const bgIndex = queue.findIndex(q => q.priority === HighlightPriority.BACKGROUND);
      if (bgIndex !== -1) {
        const newQueue = [...queue];
        newQueue.splice(bgIndex, 1);
        this.queue.set(newQueue);
      }
    }

    // Calculate initial priority
    const priority = this.calculatePriority(index);

    // Add to queue (avoid duplicates)
    const exists = queue.some(q => q.block.id === block.id);
    if (!exists) {
      this.queue.update(q => [
        ...q,
        {
          block,
          index,
          priority,
          queuedAt: performance.now()
        }
      ]);
    }
  }

  /**
   * Queue multiple blocks at once
   * @param blocks Array of blocks to queue
   */
  queueBlocks(blocks: MarkdownBlock[]): void {
    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      if (block.type === BlockType.CODE_BLOCK && !block.isHighlighted) {
        this.queueBlock(block, i);
      }
    }
  }

  /**
   * Remove a block from the queue
   * @param blockId ID of block to remove
   */
  dequeueBlock(blockId: string): void {
    this.queue.update(q => q.filter(item => item.block.id !== blockId));
  }

  /**
   * Mark a block as highlighted
   * @param blockId ID of highlighted block
   */
  markHighlighted(blockId: string): void {
    this.highlightedBlockIds.update(set => new Set(set).add(blockId));
    this.dequeueBlock(blockId);
  }

  /**
   * Clear all queued blocks
   */
  clearQueue(): void {
    this.queue.set([]);
  }

  /**
   * Reset the scheduler state
   */
  reset(): void {
    this.stopProcessing();
    this.clearQueue();
    this.highlightedBlockIds.set(new Set());
    this.stats.set({
      totalProcessed: 0,
      totalSkipped: 0,
      totalErrors: 0,
      avgProcessingTime: 0
    });
  }

  /**
   * Update scheduler configuration
   */
  setConfig(config: Partial<HighlightSchedulerConfig>): void {
    this.config.update(c => ({ ...c, ...config }));
  }

  /**
   * Calculate priority for a block based on its position
   * @param index Block index in document
   */
  private calculatePriority(index: number): HighlightPriority {
    const window = this.virtualScroll.window();
    const overscan = this.virtualScroll.getConfig().overscan || 5;

    // Check if block is visible
    if (index >= window.start && index <= window.end) {
      return HighlightPriority.VISIBLE;
    }

    // Check if block is in overscan
    const overscanStart = Math.max(0, window.start - overscan);
    const overscanEnd = window.end + overscan;
    if (index >= overscanStart && index <= overscanEnd) {
      return HighlightPriority.OVERSCAN;
    }

    return HighlightPriority.BACKGROUND;
  }

  /**
   * Update priorities for all queued blocks
   * Called when virtual scroll window changes
   */
  private updatePriorities(): void {
    this.queue.update(items =>
      items.map(item => ({
        ...item,
        priority: this.calculatePriority(item.index)
      }))
    );

    // Sort by priority (visible first, then overscan, then background)
    this.queue.update(items => {
      const priorityOrder = {
        [HighlightPriority.VISIBLE]: 0,
        [HighlightPriority.OVERSCAN]: 1,
        [HighlightPriority.BACKGROUND]: 2
      };

      return [...items].sort((a, b) => {
        const pa = priorityOrder[a.priority];
        const pb = priorityOrder[b.priority];
        if (pa !== pb) return pa - pb;
        // Same priority: sort by index (closer to viewport first)
        return Math.abs(a.index - this.virtualScroll.window().start) -
               Math.abs(b.index - this.virtualScroll.window().start);
      });
    });
  }

  /**
   * Start the processing loop
   */
  private startProcessing(): void {
    if (this.rafId !== null) {
      return; // Already running
    }

    this.isProcessing.set(true);
    this.processQueue();
  }

  /**
   * Stop the processing loop
   */
  private stopProcessing(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.isProcessing.set(false);
  }

  /**
   * Process queue items via RAF
   */
  private processQueue(): void {
    this.rafId = requestAnimationFrame(() => {
      this.frameStartTime = performance.now();
      this.processedThisFrame = 0;

      this.processBatch();

      // Continue if there are more items
      if (this.queue().length > 0) {
        this.processQueue();
      } else {
        this.stopProcessing();
      }
    });
  }

  /**
   * Process a batch of queue items
   */
  private async processBatch(): Promise<void> {
    const config = this.config();
    const queue = this.queue();
    const now = performance.now();

    // Process up to maxBlocksPerFrame or until time budget exhausted
    while (this.processedThisFrame < config.maxBlocksPerFrame &&
           queue.length > 0) {
      // Check time budget
      const elapsed = performance.now() - this.frameStartTime;
      if (elapsed > config.maxTimePerFrame) {
        break;
      }

      // Skip background processing if disabled
      const item = queue[0];
      if (item.priority === HighlightPriority.BACKGROUND && !config.enableBackground) {
        this.queue.update(q => q.slice(1));
        this.updateStats('skipped');
        continue;
      }

      // Process this item
      this.queue.update(q => q.slice(1));
      await this.processItem(item);
      this.processedThisFrame++;
    }
  }

  /**
   * Process a single queued item
   */
  private async processItem(item: QueuedBlock): Promise<void> {
    const startTime = performance.now();

    try {
      const code = item.block.rawContent || item.block.content;
      const language = item.block.language || 'text';
      const theme = this.getCurrentTheme();

      // Highlight the code
      const lines = await this.highlighter.highlightToTokens(code, language, theme);

      // Mark as highlighted
      this.markHighlighted(item.block.id);

      // Update stats
      const elapsed = performance.now() - startTime;
      this.updateStats('processed', elapsed);

    } catch (error) {
      console.error(`[HighlightScheduler] Failed to highlight block ${item.block.id}:`, error);
      this.updateStats('error');
    }
  }

  /**
   * Get current theme for highlighting
   */
  private getCurrentTheme(): 'light' | 'dark' {
    return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  }

  /**
   * Update processing statistics (public for testing)
   */
  updateStats(
    type: 'processed' | 'skipped' | 'error',
    elapsed?: number
  ): void {
    const current = this.stats();

    switch (type) {
      case 'processed':
        const newProcessed = current.totalProcessed + 1;
        const newAvg = elapsed !== undefined
          ? (current.avgProcessingTime * current.totalProcessed + elapsed) / newProcessed
          : current.avgProcessingTime;
        this.stats.set({
          ...current,
          totalProcessed: newProcessed,
          avgProcessingTime: newAvg
        });
        break;
      case 'skipped':
        this.stats.set({ ...current, totalSkipped: current.totalSkipped + 1 });
        break;
      case 'error':
        this.stats.set({ ...current, totalErrors: current.totalErrors + 1 });
        break;
    }
  }

  /**
   * Get priority label for display
   */
  getPriorityLabel(priority: HighlightPriority): string {
    switch (priority) {
      case HighlightPriority.VISIBLE:
        return 'Visible';
      case HighlightPriority.OVERSCAN:
        return 'Overscan';
      case HighlightPriority.BACKGROUND:
        return 'Background';
    }
  }

  /**
   * Check if a specific block is currently queued
   */
  isQueued(blockId: string): boolean {
    return this.queue().some(item => item.block.id === blockId);
  }

  /**
   * Get queue status for debugging
   */
  getQueueStatus(): { byPriority: Record<string, number>; oldestItem: number } {
    const queue = this.queue();
    const byPriority: Record<string, number> = {
      visible: 0,
      overscan: 0,
      background: 0
    };

    for (const item of queue) {
      byPriority[item.priority]++;
    }

    const oldestItem = queue.length > 0
      ? Math.min(...queue.map(i => i.queuedAt))
      : 0;

    return { byPriority, oldestItem };
  }
}
