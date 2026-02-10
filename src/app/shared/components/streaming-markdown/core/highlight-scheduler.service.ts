import { Injectable, signal, computed, inject, DestroyRef, effect, EffectRef } from '@angular/core';
import { MarkdownBlock, BlockType, CodeLine, isCodeBlock } from './models';
import { VirtualScrollService } from './virtual-scroll.service';
import { ShiniHighlighter } from './shini-highlighter';

export enum HighlightPriority {
  VISIBLE = 'visible',
  OVERSCAN = 'overscan',
  BACKGROUND = 'background'
}

interface QueuedBlock {
  block: MarkdownBlock;
  priority: HighlightPriority;
  index: number;
  queuedAt: number;
}

interface HighlightCallback {
  blockId: string;
  lines: CodeLine[];
  success: boolean;
}

export interface HighlightSchedulerConfig {
  maxBlocksPerFrame: number;
  maxTimePerFrame: number;
  maxQueueSize: number;
  enableBackground: boolean;
}

export const DEFAULT_SCHEDULER_CONFIG: HighlightSchedulerConfig = {
  maxBlocksPerFrame: 4,
  maxTimePerFrame: 8,
  maxQueueSize: 100,
  enableBackground: true
};

@Injectable({ providedIn: 'root' })
export class HighlightSchedulerService {
  readonly config = signal<HighlightSchedulerConfig>(DEFAULT_SCHEDULER_CONFIG);
  readonly queue = signal<QueuedBlock[]>([]);
  readonly highlightedBlockIds = signal<Set<string>>(new Set());
  readonly queueSize = computed(() => this.queue().length);
  readonly highlightResults = signal<Map<string, CodeLine[]>>(new Map());
  readonly isProcessing = signal<boolean>(false);

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

  private rafId: number | null = null;
  private queueWatcher: EffectRef;
  private windowWatcher: EffectRef;

  private resultSubscribers = new Set<(result: HighlightCallback) => void>();
  private inFlight = new Map<string, Promise<CodeLine[]>>();

  constructor() {
    this.queueWatcher = effect(() => {
      if (this.queueSize() > 0) {
        this.ensureProcessing();
      }
    });

    this.windowWatcher = effect(() => {
      this.virtualScroll.window();
      this.updatePriorities();
    });

    this.destroyRef.onDestroy(() => {
      this.stopProcessing();
      this.queueWatcher.destroy();
      this.windowWatcher.destroy();
    });
  }

  queueBlock(block: MarkdownBlock, index: number): void {
    if (block.type !== BlockType.CODE_BLOCK) {
      return;
    }

    if (this.highlightedBlockIds().has(block.id) || this.highlightResults().has(block.id)) {
      return;
    }

    if (this.inFlight.has(block.id)) {
      return;
    }

    this.queue.update((items) => {
      if (items.some((item) => item.block.id === block.id)) {
        return items;
      }

      const next = [...items, {
        block,
        index,
        priority: this.calculatePriority(index),
        queuedAt: performance.now()
      }];

      if (next.length <= this.config().maxQueueSize) {
        return this.sortQueue(next);
      }

      const trimmed = [...next];
      const removableIndex = trimmed.findIndex((item) => item.priority === HighlightPriority.BACKGROUND);

      if (removableIndex >= 0) {
        trimmed.splice(removableIndex, 1);
      } else {
        trimmed.pop();
      }

      return this.sortQueue(trimmed);
    });
  }

  queueBlocks(blocks: MarkdownBlock[]): void {
    for (let i = 0; i < blocks.length; i++) {
      this.queueBlock(blocks[i], i);
    }
  }

  dequeueBlock(blockId: string): void {
    this.queue.update((items) => items.filter((item) => item.block.id !== blockId));
  }

  markHighlighted(blockId: string): void {
    this.highlightedBlockIds.update((set) => {
      const next = new Set(set);
      next.add(blockId);
      return next;
    });
    this.dequeueBlock(blockId);
  }

  onHighlightResult(callback: (result: HighlightCallback) => void): () => void {
    this.resultSubscribers.add(callback);
    return () => {
      this.resultSubscribers.delete(callback);
    };
  }

  getHighlightedLines(blockId: string): CodeLine[] | undefined {
    return this.highlightResults().get(blockId);
  }

  async highlightNow(block: MarkdownBlock, index: number): Promise<CodeLine[]> {
    if (!isCodeBlock(block)) {
      return [];
    }

    const cached = this.getHighlightedLines(block.id);
    if (cached) {
      (block as any).isHighlighted = true;
      this.markHighlighted(block.id);
      return cached;
    }

    const active = this.inFlight.get(block.id);
    if (active) {
      return active;
    }

    const task = this.highlightInternal(block, index);
    this.inFlight.set(block.id, task);

    try {
      return await task;
    } finally {
      this.inFlight.delete(block.id);
    }
  }

  clearQueue(): void {
    this.queue.set([]);
  }

  reset(): void {
    this.stopProcessing();
    this.clearQueue();
    this.inFlight.clear();
    this.highlightedBlockIds.set(new Set());
    this.highlightResults.set(new Map());
    this.stats.set({
      totalProcessed: 0,
      totalSkipped: 0,
      totalErrors: 0,
      avgProcessingTime: 0
    });
  }

  setConfig(config: Partial<HighlightSchedulerConfig>): void {
    this.config.update((current) => ({ ...current, ...config }));
  }

  private ensureProcessing(): void {
    if (this.rafId !== null) {
      return;
    }

    this.isProcessing.set(true);
    this.rafId = requestAnimationFrame(() => {
      this.rafId = null;
      void this.processFrame();
    });
  }

  private stopProcessing(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.isProcessing.set(false);
  }

  private async processFrame(): Promise<void> {
    const frameStart = performance.now();
    const { maxBlocksPerFrame, maxTimePerFrame, enableBackground } = this.config();
    let processedInFrame = 0;

    while (processedInFrame < maxBlocksPerFrame) {
      const item = this.queue()[0];
      if (!item) {
        break;
      }

      this.queue.update((items) => items.slice(1));

      if (item.priority === HighlightPriority.BACKGROUND && !enableBackground) {
        this.updateStats('skipped');
        continue;
      }

      await this.highlightNow(item.block, item.index);
      processedInFrame++;

      if (performance.now() - frameStart >= maxTimePerFrame) {
        break;
      }
    }

    if (this.queue().length > 0) {
      this.ensureProcessing();
      return;
    }

    this.stopProcessing();
  }

  private async highlightInternal(block: MarkdownBlock, index: number): Promise<CodeLine[]> {
    if (!isCodeBlock(block)) {
      return [];
    }
    const startTime = performance.now();
    const code = block.rawContent || block.content;
    const language = block.language || 'text';
    const theme = this.getCurrentTheme();

    try {
      await this.highlighter.whenReady();
      const lines = await this.highlighter.highlightToTokens(code, language, theme);
      this.persistResult(block, lines, true, startTime);
      return lines;
    } catch (error) {
      console.error(`[HighlightScheduler] Failed to highlight block ${block.id} at index ${index}:`, error);
      this.updateStats('error');
      const fallbackLines = this.highlighter.plainTextFallback(code);
      this.persistResult(block, fallbackLines, false, startTime);
      return fallbackLines;
    }
  }

  private persistResult(
    block: MarkdownBlock,
    lines: CodeLine[],
    success: boolean,
    startTime: number
  ): void {
    this.highlightResults.update((results) => {
      const next = new Map(results);
      next.set(block.id, lines);
      return next;
    });

    // Only code blocks have isHighlighted property
    if (isCodeBlock(block)) {
      (block as any).isHighlighted = true;
    }
    this.markHighlighted(block.id);
    this.notifyHighlightResult({ blockId: block.id, lines, success });

    const elapsed = performance.now() - startTime;
    this.updateStats('processed', elapsed);
  }

  private notifyHighlightResult(result: HighlightCallback): void {
    for (const callback of this.resultSubscribers) {
      callback(result);
    }
  }

  private calculatePriority(index: number): HighlightPriority {
    if (index < 0) {
      return HighlightPriority.VISIBLE;
    }

    const window = this.virtualScroll.window();
    const overscan = this.virtualScroll.getConfig().overscan || 5;

    if (index >= window.start && index <= window.end) {
      return HighlightPriority.VISIBLE;
    }

    const overscanStart = Math.max(0, window.start - overscan);
    const overscanEnd = window.end + overscan;
    if (index >= overscanStart && index <= overscanEnd) {
      return HighlightPriority.OVERSCAN;
    }

    return HighlightPriority.BACKGROUND;
  }

  private updatePriorities(): void {
    this.queue.update((items) => this.sortQueue(items.map((item) => ({
      ...item,
      priority: this.calculatePriority(item.index)
    }))));
  }

  private sortQueue(items: QueuedBlock[]): QueuedBlock[] {
    const priorityOrder: Record<HighlightPriority, number> = {
      [HighlightPriority.VISIBLE]: 0,
      [HighlightPriority.OVERSCAN]: 1,
      [HighlightPriority.BACKGROUND]: 2
    };

    const windowStart = this.virtualScroll.window().start;

    return [...items].sort((left, right) => {
      const priorityDiff = priorityOrder[left.priority] - priorityOrder[right.priority];
      if (priorityDiff !== 0) {
        return priorityDiff;
      }

      const leftDistance = Math.abs(left.index - windowStart);
      const rightDistance = Math.abs(right.index - windowStart);
      if (leftDistance !== rightDistance) {
        return leftDistance - rightDistance;
      }

      return left.queuedAt - right.queuedAt;
    });
  }

  private getCurrentTheme(): 'light' | 'dark' {
    return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  }

  updateStats(type: 'processed' | 'skipped' | 'error', elapsed?: number): void {
    const current = this.stats();

    switch (type) {
      case 'processed': {
        const nextProcessed = current.totalProcessed + 1;
        const nextAvg = elapsed === undefined
          ? current.avgProcessingTime
          : ((current.avgProcessingTime * current.totalProcessed) + elapsed) / nextProcessed;

        this.stats.set({
          ...current,
          totalProcessed: nextProcessed,
          avgProcessingTime: nextAvg
        });
        return;
      }

      case 'skipped':
        this.stats.set({ ...current, totalSkipped: current.totalSkipped + 1 });
        return;

      case 'error':
        this.stats.set({ ...current, totalErrors: current.totalErrors + 1 });
        return;
    }
  }
}
