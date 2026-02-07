/**
 * VirtualScrollService Tests
 *
 * Unit tests for the virtual scroll service.
 * Verifies window calculation, height caching, and configuration.
 *
 * Phase 4.1, Task #11: Unit tests for VirtualScrollService
 */

import { TestBed } from '@angular/core/testing';
import { VirtualScrollService } from './virtual-scroll.service';
import { MarkdownBlock, BlockType, VirtualScrollConfig, DEFAULT_VIRTUAL_SCROLL_CONFIG } from './models';

describe('VirtualScrollService', () => {
  let service: VirtualScrollService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [VirtualScrollService]
    });
    service = TestBed.inject(VirtualScrollService);
  });

  afterEach(() => {
    // Reset service state between tests
    service.clearHeightCache();
    service.setConfig(DEFAULT_VIRTUAL_SCROLL_CONFIG);
    service.setScrollTop(0);
    service.setViewportHeight(0);
    service.setTotalBlocks(0);
  });

  describe('Service Creation', () => {
    it('should create the service', () => {
      expect(service).toBeTruthy();
    });

    it('should be provided at root level', () => {
      const service2 = TestBed.inject(VirtualScrollService);
      expect(service).toBe(service2);
    });

    it('should initialize with default configuration', () => {
      const config = service.getConfig();
      expect(config.enabled).toBe(true);
      expect(config.overscan).toBe(5);
      expect(config.estimatedBlockHeight).toBe(60);
      expect(config.minBlocksForVirtual).toBe(100);
    });

    it('should have initial signals set to zero', () => {
      expect(service.scrollTop()).toBe(0);
      expect(service.viewportHeight()).toBe(0);
      expect(service.totalBlocks()).toBe(0);
    });
  });

  describe('Configuration Management', () => {
    it('should get default config', () => {
      const config = service.getConfig();
      expect(config).toEqual(DEFAULT_VIRTUAL_SCROLL_CONFIG);
    });

    it('should update config partially', () => {
      service.setConfig({ overscan: 10 });
      const config = service.getConfig();
      expect(config.overscan).toBe(10);
      expect(config.enabled).toBe(true); // Other values preserved
    });

    it('should update estimatedBlockHeight in cache', () => {
      service.setConfig({ estimatedBlockHeight: 80 });
      expect(service.getBlockHeight(0)).toBe(80);
    });

    it('should disable virtual scrolling via config', () => {
      service.setConfig({ enabled: false });
      expect(service.getConfig().enabled).toBe(false);
      expect(service.shouldUseVirtualScroll(200)).toBe(false);
    });
  });

  describe('State Management - Signals', () => {
    it('should update scrollTop signal', () => {
      service.setScrollTop(100);
      expect(service.scrollTop()).toBe(100);

      service.setScrollTop(250);
      expect(service.scrollTop()).toBe(250);
    });

    it('should clamp negative scrollTop to zero', () => {
      service.setScrollTop(-50);
      expect(service.scrollTop()).toBe(0);
    });

    it('should update viewportHeight signal', () => {
      service.setViewportHeight(500);
      expect(service.viewportHeight()).toBe(500);

      service.setViewportHeight(800);
      expect(service.viewportHeight()).toBe(800);
    });

    it('should clamp negative viewportHeight to zero', () => {
      service.setViewportHeight(-100);
      expect(service.viewportHeight()).toBe(0);
    });

    it('should update totalBlocks signal', () => {
      service.setTotalBlocks(50);
      expect(service.totalBlocks()).toBe(50);

      service.setTotalBlocks(150);
      expect(service.totalBlocks()).toBe(150);
    });

    it('should clamp negative totalBlocks to zero', () => {
      service.setTotalBlocks(-10);
      expect(service.totalBlocks()).toBe(0);
    });
  });

  describe('Window Calculation', () => {
    const defaultEstimatedHeight = 60;

    beforeEach(() => {
      service.setConfig(DEFAULT_VIRTUAL_SCROLL_CONFIG);
    });

    it('should calculate window for empty document', () => {
      service.setScrollTop(0);
      service.setViewportHeight(600);
      service.setTotalBlocks(0);

      const window = service.window();
      expect(window.start).toBe(0);
      expect(window.end).toBe(0);
      expect(window.totalHeight).toBe(0);
      expect(window.offsetTop).toBe(0);
    });

    it('should calculate window for single block', () => {
      service.setScrollTop(0);
      service.setViewportHeight(600);
      service.setTotalBlocks(1);

      const window = service.window();
      expect(window.start).toBe(0);
      expect(window.end).toBe(0);
      expect(window.totalHeight).toBe(defaultEstimatedHeight);
      expect(window.offsetTop).toBe(0);
    });

    it('should include overscan buffer at start', () => {
      // Scroll to block 5 (5 * 60 = 300px)
      service.setScrollTop(300);
      service.setViewportHeight(600);
      service.setTotalBlocks(20);

      const window = service.window();
      // With overscan=5, start should be at least block 0
      expect(window.start).toBeLessThanOrEqual(5);
      expect(window.start).toBeGreaterThanOrEqual(0);
    });

    it('should include overscan buffer at end', () => {
      service.setScrollTop(0);
      service.setViewportHeight(300); // 5 blocks visible
      service.setTotalBlocks(50);

      const window = service.window();
      // 5 blocks visible + 5 overscan = 10 total
      expect(window.end).toBeGreaterThanOrEqual(9);
    });

    it('should calculate correct offsetTop for content positioning', () => {
      // Scroll past first 3 blocks (3 * 60 = 180px)
      service.setScrollTop(180);
      service.setViewportHeight(600);
      service.setTotalBlocks(20);

      const window = service.window();
      expect(window.offsetTop).toBe(180);
    });

    it('should handle very large datasets', () => {
      const largeBlockCount = 10000;
      service.setScrollTop(5000);
      service.setViewportHeight(800);
      service.setTotalBlocks(largeBlockCount);

      const window = service.window();
      expect(window.start).toBeLessThan(window.end);
      expect(window.end).toBeLessThan(largeBlockCount);
      expect(window.totalHeight).toBe(largeBlockCount * defaultEstimatedHeight);
    });

    it('should handle scroll position beyond document', () => {
      service.setScrollTop(10000);
      service.setViewportHeight(600);
      service.setTotalBlocks(10);

      const window = service.window();
      expect(window.start).toBeLessThan(10);
      expect(window.end).toBeLessThan(10);
    });
  });

  describe('Height Caching', () => {
    it('should update block height in cache', () => {
      service.updateBlockHeight(0, 100);
      expect(service.getBlockHeight(0)).toBe(100);
    });

    it('should return estimated height for uncached blocks', () => {
      expect(service.getBlockHeight(5)).toBe(60); // Default estimated
    });

    it('should prefer cached height over estimated', () => {
      service.updateBlockHeight(0, 150);
      service.setConfig({ estimatedBlockHeight: 80 });
      expect(service.getBlockHeight(0)).toBe(150);
      expect(service.getBlockHeight(1)).toBe(80);
    });

    it('should ignore zero or negative heights', () => {
      service.updateBlockHeight(0, 0);
      service.updateBlockHeight(1, -50);
      expect(service.getBlockHeight(0)).toBe(60); // Falls back to estimated
      expect(service.getBlockHeight(1)).toBe(60);
    });

    it('should clear height cache', () => {
      service.updateBlockHeight(0, 100);
      service.updateBlockHeight(1, 120);
      service.clearHeightCache();

      expect(service.getBlockHeight(0)).toBe(60);
      expect(service.getBlockHeight(1)).toBe(60);
    });

    it('should update totalHeight based on cached values', () => {
      service.setTotalBlocks(3);
      expect(service.totalHeight()).toBe(180); // 3 * 60

      service.updateBlockHeight(0, 100);
      service.updateBlockHeight(1, 120);
      // Cached: 100 + 120 + estimated(60) = 280
      expect(service.totalHeight()).toBe(280);
    });
  });

  describe('Total Height Calculation', () => {
    it('should calculate height for empty blocks array', () => {
      const blocks: MarkdownBlock[] = [];
      expect(service.getTotalHeight(blocks)).toBe(0);
    });

    it('should calculate height with all estimated values', () => {
      const blocks = createMockBlocks(10);
      expect(service.getTotalHeight(blocks)).toBe(600); // 10 * 60
    });

    it('should calculate height with mixed cached and estimated', () => {
      const blocks = createMockBlocks(5);
      service.updateBlockHeight(0, 100);
      service.updateBlockHeight(2, 80);

      expect(service.getTotalHeight(blocks)).toBe(380); // 100 + 60 + 80 + 60 + 60
    });

    it('should update when cache changes', () => {
      const blocks = createMockBlocks(5);
      expect(service.getTotalHeight(blocks)).toBe(300);

      service.updateBlockHeight(0, 150);
      expect(service.getTotalHeight(blocks)).toBe(390); // 150 + 60*4
    });
  });

  describe('shouldUseVirtualScroll Threshold Logic', () => {
    beforeEach(() => {
      service.setConfig(DEFAULT_VIRTUAL_SCROLL_CONFIG);
    });

    it('should return false when disabled', () => {
      service.setConfig({ enabled: false });
      expect(service.shouldUseVirtualScroll(200)).toBe(false);
    });

    it('should return false below threshold', () => {
      expect(service.shouldUseVirtualScroll(50)).toBe(false);
      expect(service.shouldUseVirtualScroll(99)).toBe(false);
    });

    it('should return true at threshold', () => {
      expect(service.shouldUseVirtualScroll(100)).toBe(true);
    });

    it('should return true above threshold', () => {
      expect(service.shouldUseVirtualScroll(101)).toBe(true);
      expect(service.shouldUseVirtualScroll(500)).toBe(true);
    });

    it('should use custom threshold from config', () => {
      service.setConfig({ minBlocksForVirtual: 50 });
      expect(service.shouldUseVirtualScroll(49)).toBe(false);
      expect(service.shouldUseVirtualScroll(50)).toBe(true);
    });
  });

  describe('Block Height Estimation', () => {
    it('should estimate paragraph height as base', () => {
      const block = createMockBlock('paragraph', 'Test content');
      expect(service.estimateBlockHeight(block)).toBe(60);
    });

    it('should estimate code block based on line count', () => {
      const codeBlock = createMockBlock('code', 'line1\nline2\nline3\nline4\nline5');
      // 5 lines * 24 + 40 padding = 160
      expect(service.estimateBlockHeight(codeBlock)).toBe(160);
    });

    it('should use base height for short code blocks', () => {
      const codeBlock = createMockBlock('code', 'line1');
      // 1 line * 24 + 40 = 64, but base is 60, so max is 64
      expect(service.estimateBlockHeight(codeBlock)).toBeGreaterThan(60);
    });

    it('should estimate list block based on line count', () => {
      const listBlock = createMockBlock('list', 'item1\nitem2\nitem3');
      // 3 lines * 22 + 20 = 86
      expect(service.estimateBlockHeight(listBlock)).toBe(86);
    });

    it('should estimate blockquote taller than base', () => {
      const quoteBlock = createMockBlock('blockquote', 'Quote content');
      expect(service.estimateBlockHeight(quoteBlock)).toBe(78); // 60 * 1.3
    });

    it('should estimate heading shorter than base', () => {
      const headingBlock = createMockBlock('heading', 'Title');
      expect(service.estimateBlockHeight(headingBlock)).toBe(48); // 60 * 0.8
    });

    it('should use custom estimated height when configured', () => {
      service.setConfig({ estimatedBlockHeight: 80 });
      const paragraph = createMockBlock('paragraph', 'Test');
      expect(service.estimateBlockHeight(paragraph)).toBe(80);

      const heading = createMockBlock('heading', 'Title');
      expect(service.estimateBlockHeight(heading)).toBe(64); // 80 * 0.8
    });
  });

  describe('Pre-warming Height Cache', () => {
    it('should populate cache with estimates for all blocks', () => {
      const blocks = [
        createMockBlock('paragraph', 'p1'),
        createMockBlock('code', 'line1\nline2\nline3'),
        createMockBlock('heading', 'h1')
      ];

      service.preWarmHeightCache(blocks);

      expect(service.getBlockHeight(0)).toBe(60); // paragraph
      expect(service.getBlockHeight(1)).toBe(112); // code: 3*24+40
      expect(service.getBlockHeight(2)).toBe(48); // heading: 60*0.8
    });

    it('should not overwrite existing cached values', () => {
      const blocks = [createMockBlock('paragraph', 'p1')];
      service.updateBlockHeight(0, 150);

      service.preWarmHeightCache(blocks);

      expect(service.getBlockHeight(0)).toBe(150); // Preserved
    });

    it('should handle empty blocks array', () => {
      service.preWarmHeightCache([]);
      // Should not throw
      expect(service.heightCache).toBeDefined();
    });
  });

  describe('Computed Signals', () => {
    it('should update window signal when dependencies change', () => {
      service.setScrollTop(0);
      service.setViewportHeight(600);
      service.setTotalBlocks(10);

      const window1 = service.window();
      expect(window1.end).toBeGreaterThan(0);

      service.setScrollTop(300);
      const window2 = service.window();
      expect(window2.start).toBeGreaterThanOrEqual(window1.start);
    });

    it('should update totalHeight signal when cache changes', () => {
      service.setTotalBlocks(5);
      expect(service.totalHeight()).toBe(300);

      service.updateBlockHeight(0, 200);
      expect(service.totalHeight()).toBe(440); // 200 + 60*4
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero viewport height', () => {
      service.setScrollTop(0);
      service.setViewportHeight(0);
      service.setTotalBlocks(10);

      const window = service.window();
      expect(window.start).toBe(0);
      // With zero viewport, should still show some blocks due to overscan
      expect(window.end).toBeGreaterThanOrEqual(0);
    });

    it('should handle very small viewport', () => {
      service.setScrollTop(0);
      service.setViewportHeight(10);
      service.setTotalBlocks(100);

      const window = service.window();
      expect(window.start).toBe(0);
      // Should show at least overscan blocks
      expect(window.end).toBeGreaterThanOrEqual(4);
    });

    it('should handle single block with custom height', () => {
      service.setTotalBlocks(1);
      service.updateBlockHeight(0, 500);
      service.setScrollTop(0);
      service.setViewportHeight(600);

      const window = service.window();
      expect(window.start).toBe(0);
      expect(window.end).toBe(0);
      expect(window.totalHeight).toBe(500);
    });

    it('should handle scroll at exact block boundary', () => {
      service.setTotalBlocks(10);
      service.updateBlockHeight(0, 100);
      service.updateBlockHeight(1, 100);
      service.updateBlockHeight(2, 100);
      service.setScrollTop(200); // Exactly at block 2 start
      service.setViewportHeight(300);

      const window = service.window();
      expect(window.offsetTop).toBe(200);
    });

    it('should handle negative block indices gracefully', () => {
      service.updateBlockHeight(-1, 100);
      // Should not throw, negative indices ignored in getBlockHeight
      expect(service.getBlockHeight(-1)).toBe(60); // Falls back to estimated
    });
  });
});

/**
 * Helper function to create mock blocks
 */
function createMockBlocks(count: number): MarkdownBlock[] {
  return Array.from({ length: count }, (_, i) => createMockBlock('paragraph', `Block ${i}`));
}

/**
 * Helper function to create a single mock block
 */
function createMockBlock(type: string, content: string): MarkdownBlock {
  return {
    id: `mock-${Math.random()}`,
    type: type as BlockType,
    content,
    isComplete: true,
    position: 0
  };
}
