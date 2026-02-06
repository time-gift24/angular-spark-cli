/**
 * Streaming Markdown - Main Streaming Component
 *
 * This component orchestrates the entire markdown streaming pipeline:
 * 1. Receives raw markdown text as an Observable stream
 * 2. Buffers high-frequency chunks via bufferTime(32) (~2 frames at 60fps)
 * 3. Processes text through preprocessor and incremental parser
 * 4. Maintains reactive state using Angular Signals
 * 5. Renders blocks through BlockRendererComponent
 * 6. Optimizes change detection with OnPush strategy
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
import { takeUntil, catchError, bufferTime, filter, map } from 'rxjs/operators';
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
  detectChanges(previous: ParserResult, current: ParserResult): BlockDiff;
}

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
            <!-- Copy clipboard icon -->
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
  @Input() stream$!: Observable<string>;
  @Input() maxHeight: string | undefined;
  @Output() rawContentChange = new EventEmitter<string>();

  @ViewChild('container', { static: false }) container!: ElementRef<HTMLDivElement>;

  private needsScroll = false;

  protected blocks = computed(() => this.state().blocks);
  protected currentBlock = computed(() => this.state().currentBlock);
  protected rawContent = computed(() => this.state().rawContent);
  protected copied = signal<boolean>(false);

  private state = signal<StreamingState>(createEmptyState());
  private destroy$ = new Subject<void>();
  private streamSubscription: Subscription | null = null;
  private copyResetTimeout: ReturnType<typeof setTimeout> | null = null;

  private pipelineConfig: PipelineConfig = {
    debounceTime: 50,
    enableChangeDetectionOptimization: true
  };

  constructor(
    private preprocessor: MarkdownPreprocessor,
    private parser: BlockParser,
    private cdr: ChangeDetectorRef,
    private shini: ShiniHighlighter
  ) {}

  ngOnInit(): void {
    // Initialize Shini highlighter asynchronously (don't block streaming)
    this.shini.initialize().catch((error) => {
      console.error('[StreamingMarkdownComponent] Shini initialization failed:', error);
    });

    // Set up the streaming pipeline immediately
    this.subscribeToStream();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['stream$'] && !changes['stream$'].isFirstChange()) {
      // Clean up previous subscription and reset parser cache
      this.unsubscribeFromStream();
      this.parser.reset();

      // Subscribe to new stream
      this.subscribeToStream();
    }
  }

  private unsubscribeFromStream(): void {
    if (this.streamSubscription) {
      this.streamSubscription.unsubscribe();
      this.streamSubscription = null;
    }
  }

  /**
   * Subscribes to the current stream$ observable.
   * Uses bufferTime(32) to merge high-frequency chunk emissions (~2 frames at 60fps),
   * reducing parse + change detection frequency.
   */
  private subscribeToStream(): void {
    // Reset parser cache for new stream
    this.parser.reset();

    this.streamSubscription = this.stream$.pipe(
      // Buffer chunks for ~2 frames at 60fps to reduce parse frequency
      bufferTime(32),
      // Skip empty buffers
      filter((chunks: string[]) => chunks.length > 0),
      // Merge buffered chunks into a single string
      map((chunks: string[]) => chunks.join('')),
      // Handle errors gracefully
      catchError((error: Error) => {
        console.error('[StreamingMarkdownComponent] Stream error:', error);
        return of('');
      }),
      // Complete when component is destroyed
      takeUntil(this.destroy$)
    ).subscribe({
      next: (mergedChunk: string) => {
        if (!mergedChunk) return;

        const updatedState = this.processChunk(mergedChunk);
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
      error: (error: Error) => {
        console.error('[StreamingMarkdownComponent] Subscription error:', error);
      }
    });
  }

  /**
   * Processes a single (possibly merged) chunk of markdown text.
   * Uses incremental parsing to avoid re-tokenizing stable blocks.
   */
  private processChunk(chunk: string): StreamingState {
    // Step 1: Preprocess the chunk for syntax correction
    const processedChunk = this.preprocessor.process(chunk);

    // Step 2: Accumulate to existing raw content
    const currentState = this.state();
    const updatedRawContent = currentState.rawContent + processedChunk;

    // Step 3: Parse incrementally — only re-tokenize the tail
    const parserResult: ParserResult = this.parser.parseIncremental(
      currentState.rawContent,
      updatedRawContent
    );

    // Step 4: Extract current block if parser detected incomplete block
    let currentBlock: MarkdownBlock | null = null;
    let completedBlocks: MarkdownBlock[] = [...parserResult.blocks];

    if (parserResult.hasIncompleteBlock && completedBlocks.length > 0) {
      currentBlock = completedBlocks.pop() || null;
    }

    // Step 5: Return updated state
    return {
      blocks: completedBlocks,
      currentBlock: currentBlock,
      rawContent: updatedRawContent
    };
  }

  trackById(block: MarkdownBlock): string {
    return block.id;
  }

  ngAfterViewChecked(): void {
    if (this.needsScroll && this.container?.nativeElement) {
      requestAnimationFrame(() => {
        if (!this.container?.nativeElement) return;

        const el = this.container.nativeElement;
        el.scrollTop = el.scrollHeight;

        this.needsScroll = false;
      });
    }
  }

  async copyToClipboard(): Promise<void> {
    const content = this.rawContent();

    if (!content) {
      return;
    }

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(content);
      } else {
        this.fallbackCopy(content);
      }

      this.copied.set(true);

      if (this.copyResetTimeout) {
        clearTimeout(this.copyResetTimeout);
      }

      this.copyResetTimeout = setTimeout(() => {
        this.copied.set(false);
        this.copyResetTimeout = null;
      }, 1500);

    } catch (error) {
      console.error('[StreamingMarkdownComponent] Copy to clipboard failed:', error);
    }
  }

  private fallbackCopy(content: string): void {
    const textArea = document.createElement('textarea');
    textArea.value = content;

    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    textArea.style.top = '0';

    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);

    if (!successful) {
      throw new Error('execCommand("copy") failed');
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    if (this.streamSubscription) {
      this.streamSubscription.unsubscribe();
      this.streamSubscription = null;
    }

    if (this.copyResetTimeout) {
      clearTimeout(this.copyResetTimeout);
      this.copyResetTimeout = null;
    }
  }
}
