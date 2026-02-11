import { provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { HighlightSchedulerService } from './highlight-scheduler.service';
import { VirtualScrollService } from './virtual-scroll.service';
import { ShiniHighlighter } from './shini-highlighter';
import { BlockType, CodeBlock, CodeLine, VirtualWindow } from './models';

class FakeVirtualScrollService {
  private readonly currentWindow = signal<VirtualWindow>({
    start: 0,
    end: 20,
    totalHeight: 0,
    offsetTop: 0
  });

  window(): VirtualWindow {
    return this.currentWindow();
  }

  setWindow(window: VirtualWindow): void {
    this.currentWindow.set(window);
  }

  getConfig(): { overscan: number } {
    return { overscan: 5 };
  }
}

describe('HighlightSchedulerService content-aware cache', () => {
  let scheduler: HighlightSchedulerService;
  let highlighter: FakeShiniHighlighter;
  let virtualScroll: FakeVirtualScrollService;

  beforeEach(() => {
    highlighter = new FakeShiniHighlighter();

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        HighlightSchedulerService,
        { provide: VirtualScrollService, useClass: FakeVirtualScrollService },
        { provide: ShiniHighlighter, useValue: highlighter }
      ]
    });

    scheduler = TestBed.inject(HighlightSchedulerService);
    virtualScroll = TestBed.inject(VirtualScrollService) as unknown as FakeVirtualScrollService;
  });

  it('re-highlights when code content grows with same block id', async () => {
    const shortCode = 'const value = 1;';
    const longCode = 'const value = 1;\nconst nextValue = value + 1;';

    const firstBlock = createCodeBlock('code-0', shortCode);
    const secondBlock = createCodeBlock('code-0', longCode);

    const firstResult = await scheduler.highlightNow(firstBlock, 0);
    expect(firstResult[0].tokens[0].content).toBe(shortCode);
    expect(highlighter.highlightCalls).toBe(1);

    const cachedFirst = await scheduler.highlightNow(firstBlock, 0);
    expect(cachedFirst[0].tokens[0].content).toBe(shortCode);
    expect(highlighter.highlightCalls).toBe(1);

    const secondResult = await scheduler.highlightNow(secondBlock, 0);
    expect(secondResult[0].tokens[0].content).toBe(longCode);
    expect(highlighter.highlightCalls).toBe(2);

    expect(scheduler.getHighlightedLinesBySignature('code-0', signatureFor(shortCode))).toBeUndefined();
    expect(scheduler.getHighlightedLinesBySignature('code-0', signatureFor(longCode))).toEqual(secondResult);
  });

  it('invalidates stale highlighted result when queueing updated content', async () => {
    const shortCode = 'console.log(1);';
    const longCode = 'console.log(1);\nconsole.log(2);';

    const firstBlock = createCodeBlock('code-1', shortCode);
    const secondBlock = createCodeBlock('code-1', longCode);

    await scheduler.highlightNow(firstBlock, 0);
    expect(scheduler.getHighlightedLinesBySignature('code-1', signatureFor(shortCode))).toBeTruthy();

    scheduler.queueBlock(secondBlock, 0);

    expect(scheduler.getHighlightedLinesBySignature('code-1', signatureFor(shortCode))).toBeUndefined();
    expect(scheduler.queue().some((item) => item.block.id === 'code-1')).toBe(true);
  });

  it('prioritizes blocks near window end when scrolling down', async () => {
    virtualScroll.setWindow({ start: 0, end: 5, totalHeight: 0, offsetTop: 0 });
    scheduler.queueBlock(createCodeBlock('near-start', 'const a = 1;'), 1);

    virtualScroll.setWindow({ start: 1, end: 6, totalHeight: 0, offsetTop: 0 });
    await Promise.resolve();

    scheduler.queueBlock(createCodeBlock('near-end', 'const b = 2;'), 5);
    await Promise.resolve();

    const queue = scheduler.queue();
    expect(queue.length).toBe(2);
    expect(queue[0].block.id).toBe('near-end');
    expect(queue[1].block.id).toBe('near-start');
  });

  it('uses absolute indices when queueing indexed blocks in batch', () => {
    virtualScroll.setWindow({ start: 90, end: 95, totalHeight: 0, offsetTop: 0 });

    scheduler.queueIndexedBlocks([
      { block: createCodeBlock('far', 'const a = 1;'), index: 10 },
      { block: createCodeBlock('near', 'const b = 2;'), index: 94 }
    ]);

    const queue = scheduler.queue();
    expect(queue.length).toBe(2);
    expect(queue[0].block.id).toBe('near');
    expect(queue[1].block.id).toBe('far');
  });

  it('exposes highlighted result presence via hasHighlightedResult', async () => {
    const block = createCodeBlock('presence', 'const present = true;');

    expect(scheduler.hasHighlightedResult(block.id)).toBe(false);
    await scheduler.highlightNow(block, 0);
    expect(scheduler.hasHighlightedResult(block.id)).toBe(true);
  });
});

class FakeShiniHighlighter {
  highlightCalls = 0;

  async whenReady(): Promise<void> {
    return;
  }

  async highlightToTokens(code: string): Promise<CodeLine[]> {
    this.highlightCalls += 1;
    return [{
      lineNumber: 1,
      tokens: [{ content: code }]
    }];
  }

  plainTextFallback(_code: string): CodeLine[] {
    return [];
  }
}

function createCodeBlock(id: string, code: string): CodeBlock {
  return {
    id,
    type: BlockType.CODE_BLOCK,
    content: code,
    rawContent: code,
    language: 'typescript',
    isComplete: true,
    position: 0
  };
}

function signatureFor(code: string): string {
  const head = code.slice(0, 120);
  const tail = code.length > 120 ? code.slice(-120) : '';
  return `${code.length}:${head}:${tail}`;
}
