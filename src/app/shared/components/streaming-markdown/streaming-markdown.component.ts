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
  Signal,
  ViewChild,
  ElementRef,
  AfterViewChecked
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, Subject, Subscription, of } from 'rxjs';
import { tap, takeUntil, catchError, switchMap, first } from 'rxjs/operators';
import {
  MarkdownBlock,
  StreamingState,
  ParserResult,
  createEmptyState
} from './core/models';
import { MarkdownBlockRouterComponent } from './blocks/block-router/block-router.component';
import {
  IMarkdownPreprocessor,
  MarkdownPreprocessor
} from './core/markdown-preprocessor';
import {
  IBlockParser,
  BlockParser
} from './core/block-parser';
import { ShiniHighlighter } from './core/shini-highlighter';

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
  imports: [MarkdownBlockRouterComponent, CommonModule],
  providers: [
    MarkdownPreprocessor,
    BlockParser
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      #container
      class="streaming-markdown-container"
      [style.max-height]="maxHeight"
      [style.overflow-y]="maxHeight ? 'auto' : 'visible'">
      <!-- Copy button - top-right corner -->
      @if (rawContent().length > 0) {
        <button
          class="copy-button"
          (click)="copyToClipboard()"
          [title]="copied() ? 'Copied!' : 'Copy markdown'"
          [attr.aria-label]="copied() ? 'Copied to clipboard' : 'Copy markdown to clipboard'">
          @if (copied()) {
            <!-- Check icon (✓) -->
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          } @else {
            <!-- Copy clipboard icon (📋) -->
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
            </svg>
          }
        </button>
      }

      <!-- Render all completed blocks -->
      @for (block of blocks(); track trackById(block)) {
        <app-markdown-block-router
          [block]="block"
          [isComplete]="true" />
      }

      <!-- Render currently streaming block (if any) -->
      @if (currentBlock()) {
        <app-markdown-block-router
          [block]="currentBlock()!"
          [isComplete]="false" />
      }
    </div>
  `
})
export class StreamingMarkdownComponent implements OnInit, OnChanges, OnDestroy, AfterViewChecked {
  /**
   * Input stream of markdown text chunks.
   * Each emission represents a new chunk of markdown content.
   *
   * Required input - must be provided by parent component.
   */
  @Input() stream$!: Observable<string>;

  /**
   * Maximum height for the container (for auto-scroll functionality).
   * Set to a CSS value like '500px', '60vh', etc. to enable scrolling.
   * If not set, container will grow with content and scrolling won't be visible.
   */
  @Input() maxHeight: string | undefined;

  /**
   * Output event emitting the accumulated raw markdown content.
   * Emits whenever new content is received.
   */
  @Output() rawContentChange = new EventEmitter<string>();

  /**
   * Reference to the container element for auto-scrolling.
   * Used to scroll to bottom when new content arrives.
   */
  @ViewChild('container', { static: false }) container!: ElementRef<HTMLDivElement>;

  /**
   * Flag to track if scrolling is needed after view update.
   * Set to true when new content arrives, reset after scrolling.
   */
  private needsScroll = false;

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
   * Signal tracking the copy to clipboard state.
   * Used for UI feedback (icon change after copy).
   */
  protected copied = signal<boolean>(false);

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
   * @param shini - Shiki highlighter service for code syntax highlighting
   */
  constructor(
    private preprocessor: MarkdownPreprocessor,
    private parser: BlockParser,
    private cdr: ChangeDetectorRef,
    private shini: ShiniHighlighter
  ) {}

  /**
   * Component initialization hook.
   * Sets up the RxJS streaming pipeline and initializes Shini.
   *
   * Pipeline implementation:
   * - Initialize Shini highlighter (async, non-blocking)
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

    // Initialize Shini highlighter asynchronously (don't block streaming)
    this.shini.initialize().then(() => {
      console.log('[StreamingMarkdownComponent] Shini initialized successfully');
    }).catch((error) => {
      console.error('[StreamingMarkdownComponent] Shini initialization failed:', error);
    });

    // Set up the streaming pipeline immediately
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
        // Mark that scrolling is needed after view update
        this.needsScroll = true;
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
   * After view checked hook.
   * Scrolls the container to bottom when new content arrives.
   */
  ngAfterViewChecked(): void {
    if (this.needsScroll && this.container?.nativeElement) {
      const element = this.container.nativeElement;

      // Use requestAnimationFrame to ensure DOM is fully rendered
      requestAnimationFrame(() => {
        if (!this.container?.nativeElement) return;

        const el = this.container.nativeElement;
        // Set scrollTop to scrollHeight to scroll to bottom
        el.scrollTop = el.scrollHeight;

        this.needsScroll = false;
      });
    }
  }

  /**
   * Copies the raw markdown content to clipboard.
   * Provides visual feedback by changing the copy button icon.
   *
   * Uses modern Clipboard API with fallback to legacy method.
   */
  async copyToClipboard(): Promise<void> {
    const content = this.rawContent();

    // Guard against empty content
    if (!content) {
      console.warn('[StreamingMarkdownComponent] No content to copy');
      return;
    }

    try {
      // Prefer modern Clipboard API (requires secure context)
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(content);
        console.log('[StreamingMarkdownComponent] Copied to clipboard via Clipboard API');
      } else {
        // Fallback to legacy execCommand method
        this.fallbackCopy(content);
        console.log('[StreamingMarkdownComponent] Copied to clipboard via fallback method');
      }

      // Update UI state to show success
      this.copied.set(true);

      // Reset UI state after 1.5 seconds
      setTimeout(() => {
        this.copied.set(false);
      }, 1500);

    } catch (error) {
      console.error('[StreamingMarkdownComponent] Copy to clipboard failed:', error);
    }
  }

  /**
   * Fallback method for copying to clipboard in older browsers.
   * Creates a temporary textarea element to copy text.
   *
   * @param content - Text content to copy
   */
  private fallbackCopy(content: string): void {
    const textArea = document.createElement('textarea');
    textArea.value = content;

    // Position off-screen to avoid visual flicker
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    textArea.style.top = '0';

    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    // Execute copy command
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);

    if (!successful) {
      throw new Error('execCommand("copy") failed');
    }
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
