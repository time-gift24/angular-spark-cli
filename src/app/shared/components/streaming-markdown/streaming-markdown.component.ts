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
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Injector,
  inject,
  computed,
  effect,
  signal,
  WritableSignal,
  ViewChild,
  ElementRef,
  AfterViewChecked
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, Subject, EMPTY, ReplaySubject } from 'rxjs';
import { takeUntil, bufferTime, filter, map, switchMap, tap, catchError, finalize } from 'rxjs/operators';
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
  CodeLine,
  isCodeBlock,
  CodeBlock,
  BlockType
} from './core/models';
import { MarkdownBlockRouterComponent } from './blocks/block-router/block-router.component';
import { BlockHeightTrackerDirective, type HeightMeasurement } from './blocks/block-height-tracker.directive';
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

/**
 * Configuration for the RxJS streaming pipeline.
 * Controls buffering and change detection behavior.
 */
interface PipelineConfig {
  /** Debounce time in milliseconds for stream chunks (default: 50ms) */
  debounceTime?: number;
  /** Enable manual change detection optimization (default: true) */
  enableChangeDetectionOptimization: boolean;
}

@Component({
  selector: 'app-streaming-markdown',
  standalone: true,
  imports: [MarkdownBlockRouterComponent, BlockHeightTrackerDirective, VirtualScrollViewportComponent, CommonModule],
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
            <div
              [appBlockHeightTracker]="block"
              [appBlockHeightTrackerIndex]="block.position"
              [appBlockHeightTrackerId]="block.id"
              (heightMeasured)="onBlockHeightMeasured($event)">
              <app-markdown-block-router
                [block]="block"
                [isComplete]="true"
                [blockIndex]="block.position"
                [enableLazyHighlight]="enableLazyHighlight"
                [allowHighlight]="true" />
            </div>
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
export class StreamingMarkdownComponent implements OnInit, OnDestroy, AfterViewChecked {
  private currentStream$: Observable<string> = EMPTY;

  @Input()
  set stream$(value: Observable<string> | null | undefined) {
    this.currentStream$ = value ?? EMPTY;
    this.streamInput$.next(this.currentStream$);
  }

  get stream$(): Observable<string> {
    return this.currentStream$;
  }

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
  private streamInput$ = new ReplaySubject<Observable<string>>(1);
  private streamVersion = 0;
  private copyResetTimeout: ReturnType<typeof setTimeout> | null = null;
  private lastQueuedVisibleRange: { start: number; end: number } | null = null;

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
    this.streamInput$.next(this.currentStream$);

    effect(() => {
      this.virtualScrollService.setConfig(this.virtualScrollConfig());
    }, { injector: this.injector });

    effect(() => {
      const allBlocks = this.blocks();
      this.virtualScrollService.setTotalBlocks(allBlocks.length);
      if (this.shouldUseVirtualScroll()) {
        this.virtualScrollService.preWarmHeightCache(allBlocks);
      }
    }, { injector: this.injector });
  }

  ngOnInit(): void {
    // Initialize Shini highlighter asynchronously (don't block streaming)
    this.shini.initialize().catch((error) => {
      console.error('[StreamingMarkdownComponent] Shini initialization failed:', error);
    });

    this.streamInput$.pipe(
      takeUntil(this.destroy$),
      switchMap((source$) => this.bindStream(source$))
    ).subscribe();
  }

  /**
   * Subscribes to the current stream$ observable.
   * Uses bufferTime(32) to merge high-frequency chunk emissions (~2 frames at 60fps),
   * reducing parse + change detection frequency.
   */
  private bindStream(source$: Observable<string>): Observable<string> {
    const version = ++this.streamVersion;
    let hasData = false;
    let completed = false;

    this.resetStreamingState();
    this.emitStatus('streaming');

    return source$.pipe(
      bufferTime(this.pipelineConfig.debounceTime ?? 32),
      filter((chunks: string[]) => chunks.length > 0),
      map((chunks: string[]) => chunks.join('')),
      tap((mergedChunk: string) => {
        if (!mergedChunk) {
          return;
        }

        hasData = true;
        const updatedState = this.processChunk(mergedChunk);
        this.state.set(updatedState);
        this.rawContentChange.emit(updatedState.rawContent);
        this.needsScroll = true;

        if (this.pipelineConfig.enableChangeDetectionOptimization) {
          this.cdr.markForCheck();
        }
      }),
      tap({ complete: () => { completed = true; } }),
      catchError((error: unknown) => {
        if (this.streamVersion === version) {
          this.handleStreamError(this.normalizeStreamError(error));
        }
        return EMPTY;
      }),
      finalize(() => {
        if (this.streamVersion !== version || !completed) {
          return;
        }

        if (!hasData) {
          this.emitStatus('completed');
          this.completed.emit('');
          return;
        }

        this.finalizeCompletedState();
        this.emitStatus('completed');
        this.completed.emit(this.rawContent());

        if (this.enableLazyHighlight) {
          queueMicrotask(() => this.initializeLazyHighlighting());
        }
      })
    );
  }

  private normalizeStreamError(error: unknown): Error {
    if (error instanceof Error) {
      return error;
    }

    return new Error(typeof error === 'string' ? error : 'Unknown stream error');
  }

  /**
   * Processes a single (possibly merged) chunk of markdown text.
   * Streaming path stays conservative: parse raw text without auto-closing fixes.
   */
  private processChunk(chunk: string): StreamingState {
    const currentState = this.state();
    const updatedRawContent = currentState.rawContent + chunk;

    const parserResult: ParserResult = this.parser.parseIncremental(currentState.rawContent, updatedRawContent);

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

    if (!parserResult.hasIncompleteBlock || renderedBlocks.length === 0) {
      return {
        blocks: renderedBlocks,
        currentBlock: null,
        rawContent
      };
    }

    const completedBlocks = [...renderedBlocks];
    const currentBlock = completedBlocks.pop();

    return {
      blocks: completedBlocks,
      currentBlock: currentBlock ? { ...currentBlock, isComplete: false } : null,
      rawContent
    };
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

  onBlockHeightMeasured(measurement: HeightMeasurement): void {
    this.virtualScrollService.updateBlockHeight(measurement.index, measurement.height);
  }

  /**
   * Queue code blocks in the visible window for highlighting
   */
  private queueVisibleCodeBlocks(window: VirtualWindow): void {
    const allBlocks = this.blocks();
    const start = Math.max(0, window.start - 5); // Include some overscan
    const end = Math.min(allBlocks.length, window.end + 6);

    if (this.lastQueuedVisibleRange && this.lastQueuedVisibleRange.start === start && this.lastQueuedVisibleRange.end === end) {
      return;
    }
    this.lastQueuedVisibleRange = { start, end };

    const pending: Array<{ block: MarkdownBlock; index: number }> = [];
    for (let i = start; i < end; i++) {
      const block = allBlocks[i];
      if (block.type === BlockType.CODE_BLOCK && !this.hasHighlightResult(block.id) && !block.isHighlighted) {
        pending.push({ block, index: i });
      }
    }

    if (pending.length > 0) {
      this.highlightScheduler.queueIndexedBlocks(pending);
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
    const pending: Array<{ block: MarkdownBlock; index: number }> = [];
    for (let i = 0; i < allBlocks.length; i++) {
      const block = allBlocks[i];
      if (block.type === BlockType.CODE_BLOCK && !this.hasHighlightResult(block.id) && !block.isHighlighted) {
        pending.push({ block, index: i });
      }
    }

    if (pending.length > 0) {
      this.highlightScheduler.queueIndexedBlocks(pending);
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

      const updatedBlocks = currentState.blocks.map((block): MarkdownBlock => {
        if (block.id !== blockId) {
          return block;
        }

        changed = true;
        // Only code blocks should have highlight properties
        if (isCodeBlock(block)) {
          return {
            ...block,
            isHighlighted: true,
            canLazyHighlight: this.enableLazyHighlight,
            highlightResult: blockSignal
          } as CodeBlock;
        }
        return block;
      });

      let updatedCurrentBlock = currentState.currentBlock;
      if (updatedCurrentBlock?.id === blockId) {
        changed = true;
        if (isCodeBlock(updatedCurrentBlock)) {
          updatedCurrentBlock = {
            ...updatedCurrentBlock,
            isHighlighted: true,
            canLazyHighlight: this.enableLazyHighlight,
            highlightResult: blockSignal
          } as CodeBlock;
        }
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
    this.lastQueuedVisibleRange = null;

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
