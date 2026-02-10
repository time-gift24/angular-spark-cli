import { Injectable, signal, computed, Signal, inject, DestroyRef, effect, EffectRef, OnDestroy } from '@angular/core';
import { MarkdownBlock, BlockType, HighlightResult, VirtualWindow } from './models';
import { HighlightSchedulerService } from './highlight-scheduler.service';
import { ShiniHighlighter } from './shini-highlighter';

/**
 * Simple type guard for code blocks.
 * Can be replaced with discriminated union version from Phase 1 when available.
 */
function isCodeBlock(block: MarkdownBlock): block is MarkdownBlock & { type: BlockType.CODE_BLOCK } {
  return block.type === BlockType.CODE_BLOCK;
}

/**
 * HighlightCoordinator - Single Source of Truth for Code Highlighting State
 *
 * This service consolidates the 4-way split highlight state into one location:
 * 1. results: Map<string, HighlightResult> - THE single source of truth
 * 2. blockSignals: Map<string, Signal<HighlightResult | null>> - cached derived signals
 *
 * Key Design Principles:
 * - No mutation of block.isHighlighted (moved to internal state)
 * - No highlightSignals Map in components (use getResult() instead)
 * - Results stored centrally, derived signals created on demand
 * - Coordinates between HighlightSchedulerService and ShiniHighlighter
 *
 * @example
 * ```ts
 * // In component, get reactive highlight result
 * readonly highlightResult = computed(() =>
 *   isCodeBlock(this.block)
 *     ? this.highlightCoordinator.getResult(this.block.id)
 *     : null
 * );
 * ```
 */
@Injectable({ providedIn: 'root' })
export class HighlightCoordinator implements OnDestroy {
  private readonly shini = inject(ShiniHighlighter);
  private readonly scheduler = inject(HighlightSchedulerService);
  private readonly destroyRef = inject(DestroyRef);

  /**
   * THE single source of truth for all highlight results.
   * Maps block ID -> HighlightResult.
   * All highlight state flows from this signal.
   */
  private readonly results = signal<Map<string, HighlightResult>>(new Map());

  /**
   * Cache of derived signals per block.
   * Each Signal<HighlightResult | null> is a computed that derives from results().
   * Created once per block ID and reused.
   */
  private readonly blockSignals = new Map<string, Signal<HighlightResult | null>>();

  /**
   * Effect to sync results from scheduler when highlighting completes.
   * This bridges the scheduler's callback-based results to our signal-based state.
   */
  private readonly syncEffect: EffectRef;

  constructor() {
    // Subscribe to scheduler results and update our single source of truth
    this.syncEffect = effect(() => {
      const schedulerResults = this.scheduler.highlightResults();
      const highlightedIds = this.scheduler.highlightedBlockIds();

      // Sync results from scheduler to our centralized state
      this.results.update((current) => {
        const next = new Map(current);
        const entries = Array.from(schedulerResults.entries());

        for (const [blockId, lines] of entries) {
          // Only add if not already present (avoid redundant updates)
          if (!next.has(blockId)) {
            next.set(blockId, { lines, fallback: false });
          }
        }

        return next;
      });
    });

    // Cleanup on destroy
    this.destroyRef.onDestroy(() => {
      this.syncEffect.destroy();
    });
  }

  /**
   * Initialize the highlight coordinator and underlying Shini highlighter.
   * Must be called before any highlighting operations.
   */
  async initialize(): Promise<void> {
    return this.shini.initialize();
  }

  /**
   * Get a reactive Signal for a block's highlight result.
   * The signal is derived from the single results map and updates when highlighting completes.
   *
   * @param blockId - Unique identifier for the block
   * @returns Signal<HighlightResult | null> - null if not yet highlighted
   *
   * @example
   * ```ts
   * const highlightResult = this.coordinator.getResult(blockId);
   * // In template: highlightResult()?.lines
   * ```
   */
  getResult(blockId: string): Signal<HighlightResult | null> {
    let cached = this.blockSignals.get(blockId);
    if (cached) {
      return cached;
    }

    // Create a computed that derives from the single results map
    // This ensures all signals stay in sync with the single source of truth
    const derived = computed(() => this.results().get(blockId) ?? null);
    this.blockSignals.set(blockId, derived);
    return derived;
  }

  /**
   * Queue a single code block for highlighting.
   * Skips if already highlighted (exists in results).
   *
   * @param block - The code block to highlight
   * @param index - Block index for priority calculation
   */
  queueBlock(block: MarkdownBlock, index: number): void {
    if (!isCodeBlock(block)) {
      return;
    }

    // Skip if already highlighted
    if (this.results().has(block.id)) {
      return;
    }

    this.scheduler.queueBlock(block, index);
  }

  /**
   * Queue all code blocks within the visible window for prioritized highlighting.
   * Includes overscan blocks around the visible area.
   *
   * @param window - The virtual scroll window
   * @param blocks - All blocks in the document
   */
  queueVisibleBlocks(window: VirtualWindow, blocks: MarkdownBlock[]): void {
    const overscan = 5;
    const start = Math.max(0, window.start - overscan);
    const end = Math.min(blocks.length, window.end + overscan + 1);

    for (let i = start; i < end; i++) {
      const block = blocks[i];
      if (isCodeBlock(block) && !this.results().has(block.id)) {
        this.scheduler.queueBlock(block, i);
      }
    }
  }

  /**
   * Queue all code blocks in the document for background highlighting.
   * Useful for finalizing all highlights after streaming completes.
   *
   * @param blocks - All blocks in the document
   */
  initializeAll(blocks: MarkdownBlock[]): void {
    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      if (isCodeBlock(block) && !this.results().has(block.id)) {
        this.scheduler.queueBlock(block, i);
      }
    }
  }

  /**
   * Reset all highlight state.
   * Clears results, signal cache, and underlying scheduler state.
   */
  reset(): void {
    this.scheduler.reset();
    this.results.set(new Map());
    this.blockSignals.clear();
  }

  /**
   * Cleanup on service destroy.
   */
  ngOnDestroy(): void {
    this.reset();
    this.syncEffect.destroy();
  }

  /**
   * Check if a block has been highlighted.
   * Useful for conditional rendering.
   *
   * @param blockId - Block identifier
   * @returns true if highlight result exists
   */
  hasResult(blockId: string): boolean {
    return this.results().has(blockId);
  }

  /**
   * Get the current count of highlighted blocks.
   * Useful for progress tracking.
   */
  readonly highlightedCount = computed(() => this.results().size);

  /**
   * Get the current scheduler status.
   * Exposes scheduler state for monitoring.
   */
  readonly isProcessing = this.scheduler.isProcessing;

  /**
   * Get the current queue size.
   * Exposes scheduler state for monitoring.
   */
  readonly queueSize = this.scheduler.queueSize;
}
