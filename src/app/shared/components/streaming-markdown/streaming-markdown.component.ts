/**
 * Streaming Markdown - Main Streaming Component
 *
 * This component orchestrates the entire markdown streaming pipeline:
 * 1. Receives raw markdown text as an Observable stream
 * 2. Processes text through preprocessor and parser
 * 3. Maintains reactive state using Angular Signals
 * 4. Renders blocks through BlockRendererComponent
 * 5. Optimizes change detection with OnPush strategy
 *
 * Phase 7 Implementation:
 * - Task 7.1: Define StreamingMarkdownComponent Interface
 * - Task 7.2: Define RxJS Pipeline Interface
 * - Task 7.3: Define ChangeDetectionStrategy Interface
 */

import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  computed,
  signal,
  Signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, Subject, Subscription, of } from 'rxjs';
import { tap, takeUntil, catchError, switchMap } from 'rxjs/operators';
import { BlockRendererComponent } from './renderers/block-renderer.component';
import {
  MarkdownBlock,
  StreamingState,
  ParserResult,
  createEmptyState
} from './core/models';
import {
  IMarkdownPreprocessor,
  MarkdownPreprocessor
} from './core/markdown-preprocessor';
import {
  IBlockParser,
  BlockParser
} from './core/block-parser';

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
 * Represents the complete streaming pipeline with state and lifecycle.
 * Encapsulates the reactive stream processing machinery.
 */
export interface StreamingPipeline {
  /** Computed signal exposing the current streaming state */
  processedState$: Signal<StreamingState>;

  /** Subject for triggering pipeline cleanup */
  destroy$: Subject<void>;
}

/**
 * Represents the difference between two parser results.
 * Used for optimized change detection and minimal DOM updates.
 */
export interface BlockDiff {
  /** Blocks added since last state */
  added: MarkdownBlock[];

  /** Blocks updated since last state */
  updated: MarkdownBlock[];

  /** IDs of blocks removed since last state */
  removed: string[];
}

/**
 * Interface for change detection strategy implementation.
 * Defines how to compute diffs between parser states.
 */
export interface IChangeDetector {
  /**
   * Computes the difference between two parser results.
   *
   * @param previous - Previous parser result state
   * @param current - Current parser result state
   * @returns BlockDiff describing added, updated, and removed blocks
   */
  detectChanges(previous: ParserResult, current: ParserResult): BlockDiff;
}

/**
 * Main streaming markdown component.
 *
 * Responsibilities:
 * - Accept markdown text stream via @Input stream$
 * - Process stream through RxJS pipeline
 * - Maintain reactive state with Signals
 * - Render completed and current blocks
 * - Optimize change detection with OnPush
 *
 * @example
 * ```typescript
 * // In parent component
 * markdownStream$ = this.http.get('/api/markdown', {
 *   responseType: 'text'
 * }).pipe(
 *   throttleTime(100)
 * );
 * ```
 *
 * ```html
 * <app-streaming-markdown [stream$]="markdownStream$">
 * </app-streaming-markdown>
 * ```
 */
@Component({
  selector: 'app-streaming-markdown',
  standalone: true,
  imports: [BlockRendererComponent, CommonModule],
  providers: [
    MarkdownPreprocessor,
    BlockParser
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    /* Markdown Block Styles */
    .markdown-block {
      margin-bottom: var(--spacing-lg);
      padding: var(--spacing-md);
      border-radius: var(--radius-md);
      line-height: 1.6;
    }

    /* Paragraph spacing - use ::ng-deep to penetrate ViewEncapsulation */
    .markdown-block ::ng-deep p {
      margin-top: var(--spacing-md);
      margin-bottom: var(--spacing-md);
    }

    .markdown-block.block-paragraph {
      color: var(--foreground);
    }

    .markdown-block.block-heading {
      font-weight: 600;
      margin-top: var(--spacing-xl);
      margin-bottom: var(--spacing-md);
    }

    .markdown-block.block-code {
      background: var(--muted);
      padding: var(--spacing-md);
      border-radius: var(--radius-md);
      font-family: 'Monaco', 'Menlo', monospace;
      font-size: 0.875rem;
      overflow-x: auto;
    }

    /* List styles - restore bullets and indentation */
    .markdown-block.block-list {
      padding-left: var(--spacing-xl);
    }

    /* Use ::ng-deep for list elements inside innerHTML content */
    .markdown-block ::ng-deep ul,
    .markdown-block ::ng-deep ol {
      margin-left: var(--spacing-md);
      margin-bottom: var(--spacing-md);
    }

    .markdown-block ::ng-deep ul {
      list-style-type: disc;
    }

    .markdown-block ::ng-deep ol {
      list-style-type: decimal;
    }

    .markdown-block ::ng-deep li {
      margin-left: var(--spacing-md);
      padding-left: var(--spacing-sm);
    }

    .markdown-block ::ng-deep li::marker {
      color: var(--muted-foreground);
    }

    .markdown-block.block-blockquote {
      border-left: 3px solid var(--primary);
      padding-left: var(--spacing-md);
      color: var(--muted-foreground);
    }

    .markdown-block.streaming {
      opacity: 0.7;
      border-left: 2px solid var(--accent);
    }

    .streaming-indicator {
      position: relative;
    }

    .streaming-indicator::after {
      content: '▌';
      animation: blink 1s infinite;
      margin-left: var(--spacing-sm);
      color: var(--accent);
    }

    @keyframes blink {
      0%, 50% { opacity: 1; }
      51%, 100% { opacity: 0; }
    }
  `],
  template: `
    <div class="streaming-markdown-container">
      <!-- Render all completed blocks -->
      @for (block of blocks(); track trackById(block)) {
        <app-block-renderer
          [block]="block"
          [isComplete]="true" />
      }

      <!-- Render currently streaming block (if any) -->
      @if (currentBlock()) {
        <app-block-renderer
          [block]="currentBlock()!"
          [isComplete]="false" />
      }
    </div>
  `
})
export class StreamingMarkdownComponent implements OnInit, OnChanges, OnDestroy {
  /**
   * Input stream of markdown text chunks.
   * Each emission represents a new chunk of markdown content.
   *
   * Required input - must be provided by parent component.
   */
  @Input() stream$!: Observable<string>;

  /**
   * Output event emitting the accumulated raw markdown content.
   * Emits whenever new content is received.
   */
  @Output() rawContentChange = new EventEmitter<string>();

  /**
   * Computed signal exposing all completed blocks.
   * Blocks are guaranteed to have isComplete = true.
   *
   * @returns Array of completed MarkdownBlock objects
   */
  protected blocks = computed(() => this.state().blocks);

  /**
   * Computed signal exposing the currently streaming block.
   * May be null if no block is currently being received.
   *
   * @returns Current MarkdownBlock or null
   */
  protected currentBlock = computed(() => this.state().currentBlock);

  /**
   * Computed signal exposing the raw markdown content.
   * Useful for debugging and displaying original markdown.
   *
   * @returns Raw markdown text
   */
  protected rawContent = computed(() => this.state().rawContent);

  /**
   * Internal state signal for the streaming process.
   * Initialized with empty state, updated by RxJS pipeline.
   */
  private state = signal<StreamingState>(createEmptyState());

  /**
   * Subject for component lifecycle cleanup.
   * Emits when component is destroyed to cancel all subscriptions.
   */
  private destroy$ = new Subject<void>();

  /**
   * Active subscription to the markdown stream.
   * Tracked for cleanup in ngOnDestroy.
   */
  private streamSubscription: Subscription | null = null;

  /**
   * Pipeline configuration for stream processing.
   * Default values optimize for typical streaming scenarios.
   */
  private pipelineConfig: PipelineConfig = {
    debounceTime: 50,
    enableChangeDetectionOptimization: true
  };

  /**
   * Constructor with dependency injection.
   *
   * @param preprocessor - Markdown preprocessor service for syntax correction
   * @param parser - Block parser service for converting markdown to blocks
   * @param cdr - Change detector reference for OnPush optimization
   */
  constructor(
    private preprocessor: MarkdownPreprocessor,
    private parser: BlockParser,
    private cdr: ChangeDetectorRef
  ) {}

  /**
   * Component initialization hook.
   * Sets up the RxJS streaming pipeline.
   *
   * Pipeline implementation:
   * - Subscribe to stream$
   * - Process each chunk through preprocessor
   * - Accumulate raw content
   * - Parse into blocks
   * - Update state signal
   * - Handle cleanup via destroy$
   */
  ngOnInit(): void {
    console.log('[StreamingMarkdownComponent] ngOnInit called');
    console.log('[StreamingMarkdownComponent] stream$ input:', this.stream$);

    // Set up the streaming pipeline
    this.subscribeToStream();
  }

  /**
   * Detects changes to @Input properties.
   * Re-subscribes to stream$ when it changes.
   *
   * @param changes - Changes object containing previous and current values
   */
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['stream$'] && !changes['stream$'].isFirstChange()) {
      console.log('[StreamingMarkdownComponent] stream$ changed, re-subscribing');

      // Clean up previous subscription
      this.unsubscribeFromStream();

      // Subscribe to new stream
      this.subscribeToStream();
    }
  }

  /**
   * Unsubscribes from the current stream subscription.
   * Safely cleans up the active subscription.
   */
  private unsubscribeFromStream(): void {
    if (this.streamSubscription) {
      this.streamSubscription.unsubscribe();
      this.streamSubscription = null;
      console.log('[StreamingMarkdownComponent] Unsubscribed from previous stream');
    }
  }

  /**
   * Subscribes to the current stream$ observable.
   * Sets up the RxJS streaming pipeline.
   */
  private subscribeToStream(): void {
    this.streamSubscription = this.stream$.pipe(
      // Cancel previous stream when new one arrives (handle stream$ reassignment)
      switchMap((chunk: string) => {
        // Process chunk: preprocess -> accumulate -> parse -> update state
        return of(this.processChunk(chunk));
      }),
      // Handle errors gracefully
      catchError((error: Error) => {
        console.error('[StreamingMarkdownComponent] Stream error:', error);
        // Return current state on error (stream continues)
        return of(this.state());
      }),
      // Complete when component is destroyed
      takeUntil(this.destroy$)
    ).subscribe({
      next: (updatedState: StreamingState) => {
        console.log('[StreamingMarkdownComponent] State updated, blocks:', updatedState.blocks.length);
        // Update the state signal with new blocks and currentBlock
        this.state.set(updatedState);
        // Emit raw content change event for parent component
        this.rawContentChange.emit(updatedState.rawContent);
        // Trigger change detection manually for OnPush strategy
        if (this.pipelineConfig.enableChangeDetectionOptimization) {
          this.cdr.markForCheck();
        }
      },
      complete: () => {
        console.log('[StreamingMarkdownComponent] Stream completed');
      },
      error: (error: Error) => {
        console.error('[StreamingMarkdownComponent] Subscription error:', error);
      }
    });
  }

  /**
   * Processes a single chunk of markdown text.
   *
   * Pipeline:
   * 1. Preprocess the chunk (syntax correction)
   * 2. Accumulate to existing raw content
   * 3. Parse full content into blocks
   * 4. Extract current block if incomplete
   *
   * @param chunk - New markdown text chunk
   * @returns Updated StreamingState
   */
  private processChunk(chunk: string): StreamingState {
    console.log('[StreamingMarkdownComponent] Processing chunk:', chunk);

    // Step 1: Preprocess the chunk for syntax correction
    const processedChunk = this.preprocessor.process(chunk);
    console.log('[StreamingMarkdownComponent] Processed chunk:', processedChunk);

    // Step 2: Accumulate to existing raw content
    const currentState = this.state();
    const updatedRawContent = currentState.rawContent + processedChunk;

    // Step 3: Parse the full content into blocks
    const parserResult: ParserResult = this.parser.parse(updatedRawContent);

    // Step 4: Extract current block if parser detected incomplete block
    let currentBlock: MarkdownBlock | null = null;
    let completedBlocks: MarkdownBlock[] = [...parserResult.blocks];

    if (parserResult.hasIncompleteBlock && completedBlocks.length > 0) {
      // Last block is incomplete, treat as current block
      currentBlock = completedBlocks.pop() || null;
    }

    // Step 5: Return updated state
    return {
      blocks: completedBlocks,
      currentBlock: currentBlock,
      rawContent: updatedRawContent
    };
  }

  /**
   * TrackBy function for @for optimization.
   * Tracks blocks by their unique ID to minimize DOM manipulation.
   *
   * Angular 17+ @for syntax provides only the item (not index like *ngFor).
   *
   * @param block - MarkdownBlock to track
   * @returns Unique block identifier
   */
  trackById(block: MarkdownBlock): string {
    return block.id;
  }

  /**
   * Cleanup hook for component destruction.
   * Unsubscribes from RxJS streams to prevent memory leaks.
   */
  ngOnDestroy(): void {
    // Signal all subscriptions to complete
    this.destroy$.next();
    this.destroy$.complete();

    // Unsubscribe from active stream
    if (this.streamSubscription) {
      this.streamSubscription.unsubscribe();
      this.streamSubscription = null;
    }

    console.log('[StreamingMarkdownComponent] Cleanup complete');
  }
}
