import { TestBed } from '@angular/core/testing';
import {
  HighlightPriority,
  HighlightSchedulerService,
  DEFAULT_SCHEDULER_CONFIG
} from './highlight-scheduler.service';
import { VirtualScrollService } from './virtual-scroll.service';
import { ShiniHighlighter } from './shini-highlighter';
import { BlockType, CodeLine, MarkdownBlock } from './models';

describe('HighlightSchedulerService', () => {
  let service: HighlightSchedulerService;
  let virtualScrollService: VirtualScrollService;
  let highlighter: jasmine.SpyObj<ShiniHighlighter>;

  const createCodeBlock = (id: string, content = 'const x = 1;'): MarkdownBlock => ({
    id,
    type: BlockType.CODE_BLOCK,
    content,
    rawContent: content,
    language: 'typescript',
    isComplete: true,
    position: 0
  });

  const waitForCondition = async (condition: () => boolean, timeoutMs = 1500): Promise<void> => {
    const start = Date.now();
    while (!condition()) {
      if (Date.now() - start > timeoutMs) {
        throw new Error('Condition not satisfied in time');
      }
      await new Promise(resolve => setTimeout(resolve, 5));
    }
  };

  beforeEach(() => {
    highlighter = jasmine.createSpyObj<ShiniHighlighter>('ShiniHighlighter', [
      'whenReady',
      'highlightToTokens'
    ]);

    highlighter.whenReady.and.resolveTo();
    highlighter.highlightToTokens.and.callFake(async (code: string): Promise<CodeLine[]> => [
      { lineNumber: 1, tokens: [{ content: code }] }
    ]);

    spyOn(window, 'requestAnimationFrame').and.callFake((callback: FrameRequestCallback) => {
      return setTimeout(() => callback(performance.now()), 0) as unknown as number;
    });
    spyOn(window, 'cancelAnimationFrame').and.callFake((id: number) => {
      clearTimeout(id);
    });

    TestBed.configureTestingModule({
      providers: [
        HighlightSchedulerService,
        VirtualScrollService,
        { provide: ShiniHighlighter, useValue: highlighter }
      ]
    });

    service = TestBed.inject(HighlightSchedulerService);
    virtualScrollService = TestBed.inject(VirtualScrollService);

    virtualScrollService.setConfig({
      enabled: true,
      overscan: 5,
      estimatedBlockHeight: 60,
      minBlocksForVirtual: 100
    });
    virtualScrollService.setViewportHeight(600);
    virtualScrollService.setTotalBlocks(300);
    virtualScrollService.setScrollTop(0);
  });

  afterEach(() => {
    service.reset();
  });

  it('should initialize with default configuration', () => {
    expect(service.config()).toEqual(DEFAULT_SCHEDULER_CONFIG);
    expect(service.queueSize()).toBe(0);
    expect(service.isProcessing()).toBe(false);
  });

  it('should queue only code blocks', () => {
    service.queueBlock(createCodeBlock('code-1'), 0);
    service.queueBlock(
      {
        id: 'paragraph-1',
        type: BlockType.PARAGRAPH,
        content: 'paragraph',
        isComplete: true,
        position: 1
      },
      1
    );

    expect(service.queueSize()).toBe(1);
    expect(service.queue()[0].block.id).toBe('code-1');
  });

  it('should process dynamically updated queue across multiple frames', async () => {
    service.setConfig({ maxBlocksPerFrame: 1, maxTimePerFrame: 16 });

    service.queueBlock(createCodeBlock('code-1', 'a'), 0);
    service.queueBlock(createCodeBlock('code-2', 'b'), 1);
    service.queueBlock(createCodeBlock('code-3', 'c'), 2);

    await waitForCondition(() => service.highlightedBlockIds().size === 3);

    expect(service.queueSize()).toBe(0);
    expect(service.stats().totalProcessed).toBe(3);
    expect(highlighter.highlightToTokens.calls.count()).toBe(3);
  });

  it('should persist highlight results and notify subscribers', async () => {
    const callbackSpy = jasmine.createSpy('callbackSpy');
    const unsubscribe = service.onHighlightResult(callbackSpy);

    service.queueBlock(createCodeBlock('code-callback', 'console.log("ok")'), 0);

    await waitForCondition(() => service.highlightedBlockIds().has('code-callback'));

    expect(service.getHighlightedLines('code-callback')?.length).toBe(1);
    expect(callbackSpy).toHaveBeenCalled();
    expect(callbackSpy.calls.mostRecent().args[0]).toEqual(
      jasmine.objectContaining({ blockId: 'code-callback', success: true })
    );

    unsubscribe();
  });

  it('should update item priority when viewport window changes', async () => {
    const nearTop = createCodeBlock('code-top');
    const nearBottom = createCodeBlock('code-bottom');

    service.queueBlock(nearBottom, 120);
    service.queueBlock(nearTop, 0);

    expect(service.queue().find(item => item.block.id === 'code-top')?.priority).toBe(
      HighlightPriority.VISIBLE
    );

    virtualScrollService.setScrollTop(120 * 60);

    await waitForCondition(
      () =>
        service.queue().find(item => item.block.id === 'code-bottom')?.priority ===
        HighlightPriority.VISIBLE
    );

    expect(service.queue().find(item => item.block.id === 'code-bottom')?.priority).toBe(
      HighlightPriority.VISIBLE
    );
  });

  it('should clear queue, highlighted ids, and results on reset', () => {
    service.queueBlock(createCodeBlock('code-reset'), 0);
    service.markHighlighted('code-already');
    service.highlightResults.set(new Map([['code-result', [{ lineNumber: 1, tokens: [{ content: 'x' }] }]]]));

    service.reset();

    expect(service.queueSize()).toBe(0);
    expect(service.highlightedBlockIds().size).toBe(0);
    expect(service.highlightResults().size).toBe(0);
    expect(service.stats().totalProcessed).toBe(0);
  });
});
