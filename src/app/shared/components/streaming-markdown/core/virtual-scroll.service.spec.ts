import { VirtualScrollService } from './virtual-scroll.service';
import { BlockType, type MarkdownBlock } from './models';

describe('VirtualScrollService reactive height cache', () => {
  let service: VirtualScrollService;

  beforeEach(() => {
    service = new VirtualScrollService();
    service.setConfig({ enabled: true, overscan: 0, estimatedBlockHeight: 50 });
  });

  it('recomputes window when measured heights change', () => {
    service.setTotalBlocks(3);
    service.setViewportHeight(50);
    service.setScrollTop(60);

    const before = service.window();
    expect(before.start).toBe(1);
    expect(before.totalHeight).toBe(150);

    service.updateBlockHeight(0, 200);

    const after = service.window();
    expect(after.start).toBe(0);
    expect(after.totalHeight).toBe(300);
  });

  it('updates total height when pre-warming cache', () => {
    service.setTotalBlocks(2);

    expect(service.totalHeight()).toBe(100);

    const blocks: MarkdownBlock[] = [
      {
        id: 'c1',
        type: BlockType.CODE_BLOCK,
        content: 'line1\nline2\nline3',
        rawContent: 'line1\nline2\nline3',
        isComplete: true,
        position: 0,
        language: 'text'
      },
      {
        id: 'p1',
        type: BlockType.PARAGRAPH,
        content: 'short paragraph',
        isComplete: true,
        position: 1
      }
    ];

    service.preWarmHeightCache(blocks);

    expect(service.totalHeight()).toBeGreaterThan(100);
  });

  it('computes visible window with mixed measured heights and overscan', () => {
    service.setConfig({ overscan: 1 });
    service.setTotalBlocks(4);
    service.setViewportHeight(60);

    service.updateBlockHeight(0, 100);
    service.updateBlockHeight(1, 20);
    service.updateBlockHeight(2, 80);
    service.updateBlockHeight(3, 40);

    service.setScrollTop(130);
    const window = service.window();

    expect(window.start).toBe(1);
    expect(window.end).toBe(3);
    expect(window.offsetTop).toBe(100);
    expect(window.totalHeight).toBe(240);
  });
});
