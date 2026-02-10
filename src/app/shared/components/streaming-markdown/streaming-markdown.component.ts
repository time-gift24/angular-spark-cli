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
  Injector,
  inject,
  computed,
  effect,
  signal,
  Signal,
  WritableSignal,
  ViewChild,
  ElementRef,
  AfterViewChecked
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, Subject, Subscription } from 'rxjs';
import { takeUntil, bufferTime, filter, map } from 'rxjs/operators';
import {
  MarkdownBlock,
  StreamingState,
  StreamingStatus,
  ParserResult,
  createEmptyState,
  VirtualScrollConfig,
  VirtualWindow,
  DEFAULT_VIRTUAL_SCROLL_CONFIG,
  HighlightResult,
  CodeLine
} from './core/models';
import { MarkdownBlockRouterComponent } from './blocks/block-router/block-router.component';
import { ScrollEvent, VirtualScrollViewportComponent } from './blocks/virtual-scroll-viewport.component';
import { VirtualScrollService } from './core/virtual-scroll.service';
import {
  MarkdownPreprocessor
} from './core/markdown-preprocessor';
import {
  BlockParser
} from './core/block-parser';
import { ShiniHighlighter } from './core/shini-highlighter';
import { HighlightSchedulerService } from './core/highlight-scheduler.service';
import { BlockType } from './core/models';

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
  imports: [MarkdownBlockRouterComponent, VirtualScrollViewportComponent, CommonModule],
  providers: [
    MarkdownPreprocessor,
    BlockParser,
    VirtualScrollService,
    HighlightSchedulerService
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      #container
      class="streaming-markdown-container relative"
      [style.max-height]="maxHeight">
      <!-- Copy button - top-right corner -->
      @if (rawContent().length > 0) {
        <button
          class="copy-button absolute top-2 right-2 z-10"
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

      <!-- Virtual scroll mode - activates after streaming completes with enough blocks -->
      @if (shouldUseVirtualScroll()) {
        <app-virtual-scroll-viewport
          [blocks]="blocks"
          [config]="virtualScrollConfig()"
          [window]="visibleWindow()"
          (scroll)="onViewportScroll($event)"
          (visibleRangeChange)="onVisibleRangeChange($event)"
          class="overflow-auto"
          [style.max-height]="maxHeight">
          <!-- Render visible blocks only -->
          @for (block of visibleBlocks(); track trackById(block)) {
            <app-markdown-block-router
              [block]="block"
              [isComplete]="true"
              [blockIndex]="block.position"
              [enableLazyHighlight]="enableLazyHighlight"
              [allowHighlight]="true" />
          }
        </app-virtual-scroll-viewport>
      } @else {
        <!-- Standard rendering mode - during streaming or with few blocks -->
        <div
          class="overflow-auto"
          [style.max-height]="maxHeight"
          [style.overflow-y]="maxHeight ? 'auto' : 'visible'">
          <!-- Render all completed blocks -->
          @for (block of blocks(); track trackById(block)) {
            <app-markdown-block-router
              [block]="block"
              [isComplete]="true"
              [blockIndex]="block.position"
              [enableLazyHighlight]="enableLazyHighlight"
              [allowHighlight]="true" />
          }

          <!-- Render currently streaming block (if any) -->
          @if (currentBlock()) {
            <app-markdown-block-router
              [block]="currentBlock()!"
              [isComplete]="false"
              [blockIndex]="-1"
              [enableLazyHighlight]="false"
              [allowHighlight]="false" />
          }
        </div>
      }
    </div>
  `
})
export class StreamingMarkdownComponent implements OnInit, OnChanges, OnDestroy, AfterViewChecked {
  @Input() stream$!: Observable<string>;
  @Input() maxHeight: string | undefined;
  @Input() set virtualScroll(value: VirtualScrollConfig | boolean) {
    this.virtualScrollInput.set(value);
  }
  get virtualScroll(): VirtualScrollConfig | boolean {
    return this.virtualScrollInput();
  }
  @Input() enableLazyHighlight: boolean = true;
  @Output() rawContentChange = new EventEmitter<string>();
  @Output() statusChange = new EventEmitter<'streaming' | 'completed' | 'error'>();
  @Output() completed = new EventEmitter<string>();
  @Output() error = new EventEmitter<Error>();

  @ViewChild('container', { static: false }) container!: ElementRef<HTMLDivElement>;
  @ViewChild(VirtualScrollViewportComponent, { static: false }) virtualViewport?: VirtualScrollViewportComponent;

  private needsScroll = false;
  private readonly injector = inject(Injector);
  private virtualScrollInput = signal<VirtualScrollConfig | boolean>(true);
  private highlightSignals = new Map<string, WritableSignal<HighlightResult | null>>();
  private streamStatus = signal<StreamingStatus>('idle');

  protected blocks = computed(() => this.state().blocks);
  protected currentBlock = computed(() => this.state().currentBlock);
  protected rawContent = computed(() => this.state().rawContent);
  protected copied = signal<boolean>(false);

  /** Virtual scroll configuration - computed from input */
  protected virtualScrollConfig = computed<VirtualScrollConfig>(() => {
    const virtualScrollInput = this.virtualScrollInput();

    if (typeof virtualScrollInput === 'boolean') {
      return {
        ...DEFAULT_VIRTUAL_SCROLL_CONFIG,
        enabled: virtualScrollInput
      };
    }
    return { ...DEFAULT_VIRTUAL_SCROLL_CONFIG, ...virtualScrollInput };
  });

  /** Whether virtual scrolling should be active */
  protected shouldUseVirtualScroll = computed(() => {
    const config = this.virtualScrollConfig();
    const blockCount = this.blocks().length;
    const isStreaming = this.currentBlock() !== null;
    // Only use virtual scroll after streaming completes and block count exceeds threshold
    return config.enabled && !isStreaming && blockCount >= (config.minBlocksForVirtual ?? 100);
  });

  /** Current visible window computed by virtual scroll service */
  protected visibleWindow = computed<VirtualWindow>(() => {
    if (!this.shouldUseVirtualScroll()) {
      const totalBlocks = this.blocks().length;
      return {
        start: 0,
        end: Math.max(0, totalBlocks - 1),
        totalHeight: 0,
        offsetTop: 0
      };
    }

    return this.virtualScrollService.window();
  });

  /** Currently visible blocks based on virtual window */
  protected visibleBlocks = computed(() => {
    if (!this.shouldUseVirtualScroll()) {
      return this.blocks();
    }
    const window = this.visibleWindow();
    const allBlocks = this.blocks();
    return allBlocks.slice(Math.max(0, window.start), Math.min(allBlocks.length, window.end + 1));
  });

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
    private shini: ShiniHighlighter,
    private virtualScrollService: VirtualScrollService,
    private highlightScheduler: HighlightSchedulerService
  ) {
    effect(() => {
      this.virtualScrollService.setConfig(this.virtualScrollConfig());
      this.virtualScrollService.setTotalBlocks(this.blocks().length);
    }, { injector: this.injector });
  }

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
      // Clean up previous subscription and reset full component state
      this.unsubscribeFromStream();
      this.resetStreamingState();

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
    // Guard against null/undefined stream$
    if (!this.stream$) {
      return;
    }

    // Reset parser cache for new stream
    this.parser.reset();
    this.emitStatus('streaming');

    this.streamSubscription = this.stream$.pipe(
      // Buffer chunks for ~2 frames at 60fps to reduce parse frequency
      bufferTime(32),
      // Skip empty buffers
      filter((chunks: string[]) => chunks.length > 0),
      // Merge buffered chunks into a single string
      map((chunks: string[]) => chunks.join('')),
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
        this.handleStreamError(error);
      },
      complete: () => {
        this.finalizeCompletedState();
        this.emitStatus('completed');
        this.completed.emit(this.rawContent());

        if (this.enableLazyHighlight) {
          setTimeout(() => this.initializeLazyHighlighting(), 0);
        }
      }
    });
  }

  /**
   * Processes a single (possibly merged) chunk of markdown text.
   * Streaming path stays conservative: parse raw text without auto-closing fixes.
   */
  private processChunk(chunk: string): StreamingState {
    const currentState = this.state();
    const updatedRawContent = currentState.rawContent + chunk;

    const parserResult: ParserResult = this.parser.parse(updatedRawContent);

    return this.buildStreamingState(updatedRawContent, parserResult);
  }

  /**
   * Finalize state after stream completion with full preprocessor repairs.
   */
  private finalizeCompletedState(): void {
    const raw = this.rawContent();
    const repairedInput = this.preprocessor.process(raw);
    const parserResult = this.parser.parse(repairedInput);

    this.state.set(this.buildStreamingState(raw, parserResult));
    this.needsScroll = true;

    if (this.pipelineConfig.enableChangeDetectionOptimization) {
      this.cdr.markForCheck();
    }
  }

  private buildStreamingState(rawContent: string, parserResult: ParserResult): StreamingState {
    const renderedBlocks = parserResult.blocks.map((block) => this.decorateBlock(block));
    const hasOpenFence = this.hasUnclosedTopLevelFence(rawContent);

    if (!parserResult.hasIncompleteBlock || !hasOpenFence || renderedBlocks.length === 0) {
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
   * Detect unclosed top-level fenced code block in raw streaming text.
   * Ignores fences inside blockquote lines.
   */
  private hasUnclosedTopLevelFence(text: string): boolean {
    if (!text) {
      return false;
    }

    let fenceCount = 0;
    const lines = text.split('\n');

    for (const line of lines) {
      const trimmed = line.trimStart();
      if (trimmed.startsWith('>')) {
        continue;
      }

      if (/^(```|~~~)/.test(trimmed)) {
        fenceCount++;
      }
    }

    return fenceCount % 2 !== 0;
  }

  trackById(block: MarkdownBlock): string {
    return block.id;
  }

  /**
   * Handle visible range changes from virtual scroll viewport
   * Queues code blocks for highlighting based on visibility
   */
  onVisibleRangeChange(window: VirtualWindow): void {
    const effectiveWindow = this.shouldUseVirtualScroll()
      ? this.visibleWindow()
      : window;

    // Queue visible code blocks for lazy highlighting
    if (this.enableLazyHighlight && this.shouldUseVirtualScroll()) {
      this.queueVisibleCodeBlocks(effectiveWindow);
    }
  }

  /**
   * Handle viewport scroll metrics and update virtual scroll service state
   */
  onViewportScroll(event: ScrollEvent): void {
    this.virtualScrollService.setScrollTop(event.scrollTop);
    this.virtualScrollService.setViewportHeight(event.clientHeight);
  }

  /**
   * Queue code blocks in the visible window for highlighting
   */
  private queueVisibleCodeBlocks(window: VirtualWindow): void {
    const allBlocks = this.blocks();
    const start = Math.max(0, window.start - 5); // Include some overscan
    const end = Math.min(allBlocks.length, window.end + 6);

    for (let i = start; i < end; i++) {
      const block = allBlocks[i];
      if (block.type === BlockType.CODE_BLOCK && !this.hasHighlightResult(block.id) && !block.isHighlighted) {
        this.highlightScheduler.queueBlock(block, i);
      }
    }
  }

  /**
   * Initialize lazy highlighting for all code blocks after streaming completes
   */
  private initializeLazyHighlighting(): void {
    if (!this.enableLazyHighlight) {
      return;
    }

    // Queue all code blocks for progressive highlighting
    const allBlocks = this.blocks();
    for (let i = 0; i < allBlocks.length; i++) {
      const block = allBlocks[i];
      if (block.type === BlockType.CODE_BLOCK && !this.hasHighlightResult(block.id) && !block.isHighlighted) {
        this.highlightScheduler.queueBlock(block, i);
      }
    }
  }

  /**
   * Attach lazy-highlight metadata for code blocks
   */
  private decorateBlock(block: MarkdownBlock): MarkdownBlock {
    if (block.type !== BlockType.CODE_BLOCK) {
      return block;
    }

    const highlightSignal = this.ensureHighlightSignal(block.id);
    const highlighted = !!highlightSignal() || block.isHighlighted === true;

    return {
      ...block,
      canLazyHighlight: this.enableLazyHighlight,
      isHighlighted: highlighted,
      highlightResult: highlightSignal
    };
  }

  /**
   * Lazily create and return highlight result signal for block id
   */
  private ensureHighlightSignal(blockId: string): WritableSignal<HighlightResult | null> {
    const existing = this.highlightSignals.get(blockId);
    if (existing) {
      return existing;
    }

    const created = signal<HighlightResult | null>(null);
    this.highlightSignals.set(blockId, created);
    return created;
  }

  /**
   * Check if a code block already has highlighted output
   */
  private hasHighlightResult(blockId: string): boolean {
    if (this.highlightScheduler.getHighlightedLines(blockId)?.length) {
      return true;
    }

    const signalResult = this.highlightSignals.get(blockId);
    if (!signalResult) {
      return false;
    }

    const result = signalResult();
    return !!result && result.lines.length > 0;
  }

  /**
   * Apply async highlight output to current state so UI receives it.
   * Kept for compatibility with existing tests.
   */
  private applyHighlightResult(blockId: string, lines: CodeLine[]): void {
    const blockSignal = this.ensureHighlightSignal(blockId);
    blockSignal.set({ lines, fallback: false });

    this.state.update((currentState) => {
      let changed = false;

      const updatedBlocks = currentState.blocks.map((block) => {
        if (block.id !== blockId) {
          return block;
        }

        changed = true;
        return {
          ...block,
          isHighlighted: true,
          canLazyHighlight: this.enableLazyHighlight,
          highlightResult: blockSignal
        };
      });

      let updatedCurrentBlock = currentState.currentBlock;
      if (updatedCurrentBlock?.id === blockId) {
        changed = true;
        updatedCurrentBlock = {
          ...updatedCurrentBlock,
          isHighlighted: true,
          canLazyHighlight: this.enableLazyHighlight,
          highlightResult: blockSignal
        };
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

    this.cdr.markForCheck();
  }

  /**
   * Handle stream errors and emit observability events
   */
  private handleStreamError(error: Error): void {
    console.error('[StreamingMarkdownComponent] Stream error:', error);
    this.emitStatus('error');
    this.error.emit(error);
    this.cdr.markForCheck();
  }

  /**
   * Emit stream status transitions to host components
   */
  private emitStatus(status: 'streaming' | 'completed' | 'error'): void {
    if (this.streamStatus() === status) {
      return;
    }

    this.streamStatus.set(status);
    this.statusChange.emit(status);
  }

  /**
   * Reset mutable state before subscribing to a new stream
   */
  private resetStreamingState(): void {
    this.parser.reset();
    this.highlightScheduler.reset();
    this.highlightSignals.clear();
    this.virtualScrollService.clearHeightCache();
    this.virtualScrollService.setScrollTop(0);
    this.virtualScrollService.setViewportHeight(0);
    this.virtualScrollService.setTotalBlocks(0);
    this.streamStatus.set('idle');
    this.needsScroll = false;

    this.state.set(createEmptyState());
    this.rawContentChange.emit('');

    this.cdr.markForCheck();
  }

  ngAfterViewChecked(): void {
    if (!this.needsScroll) return;

    // During streaming, scroll the standard container
    if (!this.shouldUseVirtualScroll() && this.container?.nativeElement) {
      requestAnimationFrame(() => {
        if (!this.container?.nativeElement) return;

        const el = this.container.nativeElement;
        const scrollContainer = el.querySelector('.overflow-auto') as HTMLElement;
        if (scrollContainer) {
          scrollContainer.scrollTop = scrollContainer.scrollHeight;
        }

        this.needsScroll = false;
      });
    }
    // For virtual scroll mode, we'll scroll when switching modes
    else if (this.shouldUseVirtualScroll() && this.virtualViewport) {
      requestAnimationFrame(() => {
        this.virtualViewport?.scrollToBottom();

        const dimensions = this.virtualViewport?.getViewportDimensions();
        if (dimensions) {
          this.onViewportScroll(dimensions);
        }

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

    // Clean up virtual scroll service state
    this.virtualScrollService.clearHeightCache();

    // Clear highlight scheduler queue
    this.highlightScheduler.reset();
  }
}
