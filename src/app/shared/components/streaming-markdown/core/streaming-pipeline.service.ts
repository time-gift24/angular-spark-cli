/**
 * Streaming Pipeline Service
 *
 * Extracts stream subscription, buffering, preprocessing, and parsing logic
 * from StreamingMarkdownComponent into a dedicated service.
 *
 * This service manages the reactive streaming pipeline:
 * 1. Subscribes to markdown text streams (Observable<string>)
 * 2. Buffers high-frequency chunks via bufferTime(32) (~2 frames at 60fps)
 * 3. Processes text through preprocessor and incremental parser
 * 4. Maintains reactive state using Angular Signals
 *
 * @module StreamingMarkdown.Core
 */

import { Injectable, inject, DestroyRef, computed, signal, Signal, WritableSignal, OnDestroy } from '@angular/core';
import { Observable, Subject, Subscription } from 'rxjs';
import { takeUntil, bufferTime, filter, map } from 'rxjs/operators';
import {
  MarkdownBlock,
  StreamingState,
  StreamingStatus,
  ParserResult,
  createEmptyState,
  HighlightResult,
  CodeLine,
  BlockType
} from './models';
import { MarkdownPreprocessor } from './markdown-preprocessor';
import { BlockParser } from './block-parser';

/**
 * Configuration for the RxJS streaming pipeline.
 * Controls buffering and change detection behavior.
 */
export interface PipelineConfig {
  /** Debounce time in milliseconds for stream chunks (default: 50ms) */
  debounceTime?: number;

  /** Enable manual change detection optimization (default: true) */
  enableChangeDetectionOptimization: boolean;
}

/**
 * Default pipeline configuration
 */
const DEFAULT_PIPELINE_CONFIG: PipelineConfig = {
  debounceTime: 50,
  enableChangeDetectionOptimization: true
};

/**
 * Service for managing the streaming markdown pipeline.
 *
 * Extracted from StreamingMarkdownComponent to separate concerns:
 * - Component focuses on rendering and user interaction
 * - Service manages stream processing and state
 *
 * @publicApi
 */
@Injectable({ providedIn: 'root' })
export class StreamingPipelineService implements OnDestroy {
  private readonly preprocessor = inject(MarkdownPreprocessor);
  private readonly parser = inject(BlockParser);
  private readonly destroyRef = inject(DestroyRef);

  // State signals
  private readonly internalState = signal<StreamingState>(createEmptyState());
  private readonly internalStatus: WritableSignal<StreamingStatus> = signal('idle');
  private readonly destroy$ = new Subject<void>();
  private subscription: Subscription | null = null;

  /** Pipeline configuration */
  private pipelineConfig: PipelineConfig = { ...DEFAULT_PIPELINE_CONFIG };

  /** Highlight signals map for code blocks */
  private readonly highlightSignals = new Map<string, WritableSignal<HighlightResult | null>>();

  /**
   * Public computed signal exposing the current streaming state
   * Contains blocks, currentBlock, and rawContent
   */
  readonly state: Signal<StreamingState> = computed(() => this.internalState());

  /**
   * Public computed signal for streaming status
   */
  readonly status: Signal<StreamingStatus> = computed(() => this.internalStatus());

  /**
   * Public computed signal for accumulated raw markdown content
   */
  readonly rawContent: Signal<string> = computed(() => this.internalState().rawContent);

  /**
   * Public computed signal for completed blocks
   */
  readonly blocks: Signal<MarkdownBlock[]> = computed(() => this.internalState().blocks);

  /**
   * Public computed signal for the currently streaming block (if any)
   */
  readonly currentBlock: Signal<MarkdownBlock | null> = computed(() => this.internalState().currentBlock);

  constructor() {
    // Register cleanup on destroy
    this.destroyRef.onDestroy(() => {
      this.destroy$.next();
      this.destroy$.complete();
    });
  }

  /**
   * Start processing a markdown stream.
   *
   * Resets any existing state and subscribes to the new stream.
   * Uses bufferTime(32) to merge high-frequency chunk emissions (~2 frames at 60fps).
   *
   * @param stream$ - Observable emitting markdown text chunks
   */
  start(stream$: Observable<string>): void {
    this.reset();
    this.internalStatus.set('streaming');

    this.subscription = stream$.pipe(
      // Buffer chunks for ~2 frames at 60fps to reduce parse frequency
      bufferTime(this.pipelineConfig.debounceTime ?? 32),
      // Skip empty buffers
      filter((chunks: string[]) => chunks.length > 0),
      // Merge buffered chunks into a single string
      map((chunks: string[]) => chunks.join('')),
      // Complete when component/service is destroyed
      takeUntil(this.destroy$)
    ).subscribe({
      next: (mergedChunk: string) => this.processChunk(mergedChunk),
      error: (error: Error) => this.handleError(error),
      complete: () => this.finalize()
    });
  }

  /**
   * Reset the pipeline state.
   *
   * Unsubscribes from any active stream, clears state,
   * and resets parser cache and highlight signals.
   */
  reset(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = null;
    }
    this.parser.reset();
    this.internalStatus.set('idle');
    this.internalState.set(createEmptyState());
    this.highlightSignals.clear();
  }

  /**
   * Get or create a highlight signal for a specific block ID.
   * Used by code block components to receive async highlighting results.
   *
   * @param blockId - The block ID to get/create a signal for
   * @returns A writable signal containing the highlight result
   */
  ensureHighlightSignal(blockId: string): WritableSignal<HighlightResult | null> {
    const existing = this.highlightSignals.get(blockId);
    if (existing) {
      return existing;
    }

    const created = signal<HighlightResult | null>(null);
    this.highlightSignals.set(blockId, created);
    return created;
  }

  /**
   * Check if a code block already has a highlight result.
   *
   * @param blockId - The block ID to check
   * @returns true if the block has a highlight result
   */
  hasHighlightResult(blockId: string): boolean {
    const signalResult = this.highlightSignals.get(blockId);
    if (!signalResult) {
      return false;
    }

    const result = signalResult();
    return !!result && result.lines.length > 0;
  }

  /**
   * Apply async highlight output to current state.
   * Called by HighlightScheduler when highlighting completes.
   *
   * @param blockId - The block ID that was highlighted
   * @param lines - The highlighted code lines
   */
  applyHighlightResult(blockId: string, lines: CodeLine[]): void {
    const blockSignal = this.ensureHighlightSignal(blockId);
    blockSignal.set({ lines, fallback: false });

    this.internalState.update((currentState) => {
      let changed = false;

      const updatedBlocks = currentState.blocks.map((block) => {
        if (block.id !== blockId) {
          return block;
        }

        changed = true;
        return {
          ...block,
          isHighlighted: true,
          highlightResult: blockSignal
        } as MarkdownBlock;
      });

      let updatedCurrentBlock = currentState.currentBlock;
      if (updatedCurrentBlock?.id === blockId) {
        changed = true;
        updatedCurrentBlock = {
          ...updatedCurrentBlock,
          isHighlighted: true,
          highlightResult: blockSignal
        } as MarkdownBlock;
      }

      if (!changed) {
        return currentState;
      }

      return {
        ...currentState,
        blocks: updatedBlocks,
        currentBlock: updatedCurrentBlock
      };
    });
  }

  /**
   * Configure the pipeline behavior.
   *
   * @param config - Partial configuration to apply
   */
  configure(config: Partial<PipelineConfig>): void {
    this.pipelineConfig = { ...this.pipelineConfig, ...config };
  }

  /**
   * Clean up resources when service is destroyed.
   */
  ngOnDestroy(): void {
    this.reset();
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ─── Private Methods ─────────────────────────────────────────────

  /**
   * Process a single (possibly merged) chunk of markdown text.
   * Streaming path stays conservative: parse raw text without auto-closing fixes.
   *
   * @param chunk - The markdown text chunk to process
   */
  private processChunk(chunk: string): void {
    const currentState = this.internalState();
    const updatedRawContent = currentState.rawContent + chunk;

    const parserResult: ParserResult = this.parser.parseIncremental(currentState.rawContent, updatedRawContent);

    this.internalState.set(this.buildStreamingState(updatedRawContent, parserResult));
  }

  /**
   * Finalize state after stream completion.
   * Applies full preprocessor repairs to clean up any incomplete syntax.
   */
  private finalize(): void {
    const raw = this.rawContent();
    const repairedInput = this.preprocessor.process(raw);
    const parserResult = this.parser.parse(repairedInput);

    this.internalState.set(this.buildStreamingState(raw, parserResult));
    this.internalStatus.set('completed');
  }

  /**
   * Build streaming state from parser result.
   * Separates completed blocks from the currently streaming block.
   *
   * @param rawContent - The accumulated raw markdown content
   * @param parserResult - The parser result containing blocks
   * @returns A new StreamingState object
   */
  private buildStreamingState(rawContent: string, parserResult: ParserResult): StreamingState {
    const renderedBlocks = parserResult.blocks.map((block) => this.decorateBlock(block));

    if (!parserResult.hasIncompleteBlock || renderedBlocks.length === 0) {
      return {
        blocks: renderedBlocks,
        currentBlock: null,
        rawContent
      };
    }

    const completedBlocks = [...renderedBlocks];
    const currentBlock = completedBlocks.pop() || null;

    return {
      blocks: completedBlocks,
      currentBlock: currentBlock ? this.decorateBlock(currentBlock) : null,
      rawContent
    };
  }

  /**
   * Attach lazy-highlight metadata for code blocks.
   * Ensures each code block has a highlight signal and metadata.
   *
   * @param block - The block to decorate
   * @returns The decorated block with highlight metadata
   */
  private decorateBlock(block: MarkdownBlock): MarkdownBlock {
    if (block.type !== BlockType.CODE_BLOCK) {
      return block;
    }

    const highlightSignal = this.ensureHighlightSignal(block.id);
    const highlighted = !!highlightSignal() || (block as any).isHighlighted === true;

    return {
      ...block,
      ...(highlighted ? { isHighlighted: highlighted } : {}),
      highlightResult: highlightSignal
    } as MarkdownBlock;
  }

  /**
   * Handle stream errors.
   *
   * @param error - The error that occurred
   */
  private handleError(error: Error): void {
    console.error('[StreamingPipeline] Stream error:', error);
    this.internalStatus.set('error');
  }
}
