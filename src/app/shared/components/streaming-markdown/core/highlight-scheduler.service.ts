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
  readonly highlightSignatures = signal<Map<string, string>>(new Map());
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
  private lastPriorityWindowKey = '';
  private lastSortAnchorKey = '';
  private scrollDirection: 'up' | 'down' | 'none' = 'none';
  private lastWindowStart = -1;
  private lastWindowEnd = -1;

  private resultSubscribers = new Set<(result: HighlightCallback) => void>();
  private blockResultSubscribers = new Map<string, Set<(result: HighlightCallback) => void>>();
  private inFlight = new Map<string, Promise<CodeLine[]>>();
  private queuedBlockIds = new Set<string>();

  constructor() {
    this.queueWatcher = effect(() => {
      if (this.queueSize() > 0) {
        this.ensureProcessing();
      }
    });

    this.windowWatcher = effect(() => {
      const window = this.virtualScroll.window();
      this.updateScrollDirection(window);
      this.updatePriorities();
    });

    this.destroyRef.onDestroy(() => {
      this.stopProcessing();
      this.resultSubscribers.clear();
      this.blockResultSubscribers.clear();
      this.queueWatcher.destroy();
      this.windowWatcher.destroy();
    });
  }

  queueBlock(block: MarkdownBlock, index: number): void {
    if (block.type !== BlockType.CODE_BLOCK) {
      return;
    }

    const signature = this.getBlockSignature(block);
    const cachedSignature = this.highlightSignatures().get(block.id);

    if (cachedSignature && cachedSignature !== signature) {
      this.invalidateBlockResult(block.id);
    }

    if (cachedSignature === signature && (this.highlightedBlockIds().has(block.id) || this.highlightResults().has(block.id))) {
      return;
    }

    if (this.inFlight.has(block.id)) {
      return;
    }

    if (this.queuedBlockIds.has(block.id)) {
      return;
    }

    this.queue.update((items) => {
      const next = [...items, {
        block,
        index,
        priority: this.calculatePriority(index),
        queuedAt: performance.now()
      }];
      this.queuedBlockIds.add(block.id);

      if (next.length <= this.config().maxQueueSize) {
        return this.sortQueue(next);
      }

      const trimmed = [...next];
      const removableIndex = trimmed.findIndex((item) => item.priority === HighlightPriority.BACKGROUND);

      if (removableIndex >= 0) {
        const [removed] = trimmed.splice(removableIndex, 1);
        if (removed) {
          this.queuedBlockIds.delete(removed.block.id);
        }
      } else {
        const removed = trimmed.pop();
        if (removed) {
          this.queuedBlockIds.delete(removed.block.id);
        }
      }

      return this.sortQueue(trimmed);
    });
  }

  queueBlocks(blocks: MarkdownBlock[]): void {
    if (blocks.length === 0) {
      return;
    }

    const entries: Array<{ block: MarkdownBlock; index: number }> = [];
    for (let i = 0; i < blocks.length; i++) {
      entries.push({ block: blocks[i], index: i });
    }

    this.queueIndexedBlocks(entries);
  }

  queueIndexedBlocks(entries: ReadonlyArray<{ block: MarkdownBlock; index: number }>): void {
    if (entries.length === 0) {
      return;
    }

    const highlightSignatures = this.highlightSignatures();
    const highlightedIds = this.highlightedBlockIds();
    const highlightResults = this.highlightResults();
    const pendingInvalidations: string[] = [];
    const candidates: Array<{ block: MarkdownBlock; index: number }> = [];

    for (let i = 0; i < entries.length; i++) {
      const { block, index } = entries[i];
      if (block.type !== BlockType.CODE_BLOCK) {
        continue;
      }

      const signature = this.getBlockSignature(block);
      const cachedSignature = highlightSignatures.get(block.id);

      if (cachedSignature && cachedSignature !== signature) {
        pendingInvalidations.push(block.id);
      }

      if (cachedSignature === signature && (highlightedIds.has(block.id) || highlightResults.has(block.id))) {
        continue;
      }

      if (this.inFlight.has(block.id) || this.queuedBlockIds.has(block.id)) {
        continue;
      }

      candidates.push({ block, index });
    }

    if (pendingInvalidations.length > 0) {
      this.invalidateBlockResults(pendingInvalidations);
    }

    if (candidates.length === 0) {
      return;
    }

    const window = this.virtualScroll.window();
    const overscan = this.virtualScroll.getConfig().overscan || 5;
    const anchorIndex = this.scrollDirection === 'down' ? window.end : window.start;
    const maxQueueSize = this.config().maxQueueSize;
    const queuedAtBase = performance.now();

    this.queue.update((items) => {
      const next = [...items];
      let offset = 0;
      for (const { block, index } of candidates) {
        next.push({
          block,
          index,
          priority: this.calculatePriorityWithWindow(index, window, overscan),
          queuedAt: queuedAtBase + offset++
        });
        this.queuedBlockIds.add(block.id);
      }

      if (next.length <= maxQueueSize) {
        return this.sortQueue(next, anchorIndex);
      }

      const trimmed = [...next];
      while (trimmed.length > maxQueueSize) {
        const removableIndex = trimmed.findIndex((item) => item.priority === HighlightPriority.BACKGROUND);
        if (removableIndex >= 0) {
          const [removed] = trimmed.splice(removableIndex, 1);
          if (removed) {
            this.queuedBlockIds.delete(removed.block.id);
          }
          continue;
        }

        const removed = trimmed.pop();
        if (removed) {
          this.queuedBlockIds.delete(removed.block.id);
        }
      }

      return this.sortQueue(trimmed, anchorIndex);
    });
  }

  dequeueBlock(blockId: string): void {
    if (!this.queuedBlockIds.has(blockId)) {
      return;
    }

    this.queuedBlockIds.delete(blockId);
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

  onHighlightResult(callback: (result: HighlightCallback) => void, blockId?: string): () => void {
    if (blockId) {
      const blockSubscribers = this.blockResultSubscribers.get(blockId) ?? new Set<(result: HighlightCallback) => void>();
      blockSubscribers.add(callback);
      this.blockResultSubscribers.set(blockId, blockSubscribers);
      return () => {
        const current = this.blockResultSubscribers.get(blockId);
        if (!current) {
          return;
        }
        current.delete(callback);
        if (current.size === 0) {
          this.blockResultSubscribers.delete(blockId);
        }
      };
    }

    this.resultSubscribers.add(callback);
    return () => {
      this.resultSubscribers.delete(callback);
    };
  }

  getHighlightedLines(blockId: string): CodeLine[] | undefined {
    return this.highlightResults().get(blockId);
  }

  hasHighlightedResult(blockId: string): boolean {
    return this.highlightResults().has(blockId);
  }

  getHighlightedLinesBySignature(blockId: string, signature: string): CodeLine[] | undefined {
    const cachedSignature = this.highlightSignatures().get(blockId);
    if (cachedSignature !== signature) {
      return undefined;
    }

    return this.highlightResults().get(blockId);
  }

  async highlightNow(block: MarkdownBlock, index: number): Promise<CodeLine[]> {
    if (!isCodeBlock(block)) {
      return [];
    }

    const signature = this.getBlockSignature(block);
    const cached = this.getHighlightedLinesBySignature(block.id, signature);
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
    this.queuedBlockIds.clear();
    this.queue.set([]);
  }

  reset(): void {
    this.stopProcessing();
    this.clearQueue();
    this.inFlight.clear();
    this.queuedBlockIds.clear();
    this.highlightedBlockIds.set(new Set());
    this.highlightResults.set(new Map());
    this.highlightSignatures.set(new Map());
    this.blockResultSubscribers.clear();
    this.lastPriorityWindowKey = '';
    this.lastSortAnchorKey = '';
    this.scrollDirection = 'none';
    this.lastWindowStart = -1;
    this.lastWindowEnd = -1;
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
    const snapshot = this.queue();
    if (snapshot.length === 0) {
      this.stopProcessing();
      return;
    }

    const consumedBlockIds: string[] = [];
    let cursor = 0;
    let processedInFrame = 0;

    while (processedInFrame < maxBlocksPerFrame && cursor < snapshot.length) {
      const item = snapshot[cursor];
      cursor++;
      consumedBlockIds.push(item.block.id);

      if (item.priority === HighlightPriority.BACKGROUND && !enableBackground) {
        this.updateStats('skipped');
      } else {
        await this.highlightNow(item.block, item.index);
        processedInFrame++;
      }

      if (performance.now() - frameStart >= maxTimePerFrame) {
        break;
      }
    }

    if (consumedBlockIds.length > 0) {
      for (const blockId of consumedBlockIds) {
        this.queuedBlockIds.delete(blockId);
      }
      this.queue.update((items) => {
        // Fast path: queue head is unchanged since snapshot, so drop by cursor.
        let headMatches = items.length >= cursor;
        for (let i = 0; i < cursor && headMatches; i++) {
          if (items[i]?.block.id !== snapshot[i]?.block.id) {
            headMatches = false;
          }
        }

        if (headMatches) {
          return items.slice(cursor);
        }

        // Fallback for concurrent queue mutations.
        const consumedSet = new Set(consumedBlockIds);
        return items.filter((item) => !consumedSet.has(item.block.id));
      });
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
    const signature = this.getBlockSignature(block);

    this.highlightResults.update((results) => {
      const next = new Map(results);
      next.set(block.id, lines);
      return next;
    });
    this.highlightSignatures.update((signatures) => {
      const next = new Map(signatures);
      next.set(block.id, signature);
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
    const blockSubscribers = this.blockResultSubscribers.get(result.blockId);
    if (blockSubscribers) {
      for (const callback of blockSubscribers) {
        callback(result);
      }
    }

    for (const callback of this.resultSubscribers) {
      callback(result);
    }
  }

  private invalidateBlockResult(blockId: string): void {
    this.highlightResults.update((results) => {
      if (!results.has(blockId)) {
        return results;
      }

      const next = new Map(results);
      next.delete(blockId);
      return next;
    });

    this.highlightSignatures.update((signatures) => {
      if (!signatures.has(blockId)) {
        return signatures;
      }

      const next = new Map(signatures);
      next.delete(blockId);
      return next;
    });

    this.highlightedBlockIds.update((ids) => {
      if (!ids.has(blockId)) {
        return ids;
      }

      const next = new Set(ids);
      next.delete(blockId);
      return next;
    });
  }

  private invalidateBlockResults(blockIds: string[]): void {
    if (blockIds.length === 0) {
      return;
    }

    const ids = new Set(blockIds);

    this.highlightResults.update((results) => {
      let changed = false;
      const next = new Map(results);
      for (const id of ids) {
        changed = next.delete(id) || changed;
      }
      return changed ? next : results;
    });

    this.highlightSignatures.update((signatures) => {
      let changed = false;
      const next = new Map(signatures);
      for (const id of ids) {
        changed = next.delete(id) || changed;
      }
      return changed ? next : signatures;
    });

    this.highlightedBlockIds.update((highlightedIds) => {
      let changed = false;
      const next = new Set(highlightedIds);
      for (const id of ids) {
        changed = next.delete(id) || changed;
      }
      return changed ? next : highlightedIds;
    });
  }

  private getBlockSignature(block: MarkdownBlock): string {
    if (!isCodeBlock(block)) {
      return '';
    }

    const code = block.rawContent || block.content;
    const head = code.slice(0, 120);
    const tail = code.length > 120 ? code.slice(-120) : '';
    return `${code.length}:${head}:${tail}`;
  }

  private calculatePriority(index: number): HighlightPriority {
    const window = this.virtualScroll.window();
    const overscan = this.virtualScroll.getConfig().overscan || 5;
    return this.calculatePriorityWithWindow(index, window, overscan);
  }

  private calculatePriorityWithWindow(
    index: number,
    window: { start: number; end: number },
    overscan: number
  ): HighlightPriority {
    if (index < 0) {
      return HighlightPriority.VISIBLE;
    }

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
    const window = this.virtualScroll.window();
    const overscan = this.virtualScroll.getConfig().overscan || 5;
    const anchorIndex = this.scrollDirection === 'down' ? window.end : window.start;
    const anchorKey = `${this.scrollDirection}:${anchorIndex}`;

    this.queue.update((items) => {
      if (items.length === 0) {
        this.lastPriorityWindowKey = '';
        this.lastSortAnchorKey = '';
        return items;
      }

      const windowKey = `${window.start}:${window.end}:${overscan}:${items.length}:${this.scrollDirection}`;
      if (this.lastPriorityWindowKey === windowKey) {
        return items;
      }
      this.lastPriorityWindowKey = windowKey;

      let changed = false;
      const reprioritized = items.map((item) => {
        const priority = this.calculatePriorityWithWindow(item.index, window, overscan);
        if (priority !== item.priority) {
          changed = true;
          return { ...item, priority };
        }
        return item;
      });

      if (!changed) {
        if (this.lastSortAnchorKey === anchorKey) {
          return items;
        }

        this.lastSortAnchorKey = anchorKey;
        return this.sortQueue(items, anchorIndex);
      }

      this.lastSortAnchorKey = anchorKey;
      return this.sortQueue(reprioritized, anchorIndex);
    });
  }

  private sortQueue(items: QueuedBlock[], anchorIndex?: number): QueuedBlock[] {
    const priorityOrder: Record<HighlightPriority, number> = {
      [HighlightPriority.VISIBLE]: 0,
      [HighlightPriority.OVERSCAN]: 1,
      [HighlightPriority.BACKGROUND]: 2
    };

    const effectiveAnchor = anchorIndex ?? this.getDefaultAnchorIndex();

    return [...items].sort((left, right) => {
      const priorityDiff = priorityOrder[left.priority] - priorityOrder[right.priority];
      if (priorityDiff !== 0) {
        return priorityDiff;
      }

      const leftDistance = Math.abs(left.index - effectiveAnchor);
      const rightDistance = Math.abs(right.index - effectiveAnchor);
      if (leftDistance !== rightDistance) {
        return leftDistance - rightDistance;
      }

      return left.queuedAt - right.queuedAt;
    });
  }

  private getAnchorIndex(window: { start: number; end: number }): number {
    this.updateScrollDirection(window);
    return this.scrollDirection === 'down' ? window.end : window.start;
  }

  private getDefaultAnchorIndex(): number {
    const window = this.virtualScroll.window();
    return this.getAnchorIndex(window);
  }

  private updateScrollDirection(window: { start: number; end: number }): void {
    if (this.lastWindowStart < 0 || this.lastWindowEnd < 0) {
      this.scrollDirection = 'none';
      this.lastWindowStart = window.start;
      this.lastWindowEnd = window.end;
      return;
    }

    if (window.start > this.lastWindowStart || (window.start === this.lastWindowStart && window.end > this.lastWindowEnd)) {
      this.scrollDirection = 'down';
    } else if (window.start < this.lastWindowStart || (window.start === this.lastWindowStart && window.end < this.lastWindowEnd)) {
      this.scrollDirection = 'up';
    }

    this.lastWindowStart = window.start;
    this.lastWindowEnd = window.end;
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
