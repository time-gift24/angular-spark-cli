/**
 * HighlightSchedulerService Tests
 *
 * Unit tests for the progressive code highlighting scheduler.
 * Verifies queue management, priority handling, and throttling.
 *
 * Phase 4.2, Task #19: Unit tests for HighlightSchedulerService
 */

import { TestBed } from '@angular/core/testing';
import { runInInjectionContext } from '@angular/core';
import { HighlightSchedulerService, HighlightPriority, DEFAULT_SCHEDULER_CONFIG } from './highlight-scheduler.service';
import { VirtualScrollService } from './virtual-scroll.service';
import { ShiniHighlighter } from './shini-highlighter';
import { MarkdownBlock, BlockType } from './models';

describe('HighlightSchedulerService', () => {
  let service: HighlightSchedulerService;
  let virtualScrollService: jasmine.SpyObj<VirtualScrollService>;
  let highlighter: jasmine.SpyObj<ShiniHighlighter>;

  beforeEach(() => {
    // Create spy for VirtualScrollService
    virtualScrollService = jasmine.createSpyObj('VirtualScrollService', [
      'window',
      'getConfig'
    ], {
      window: jasmine.createSpyObj('window', ['subscribe', 'pipe']),
      getConfig: jasmine.createSpyObj('getConfig', [], {
        value: { overscan: 5 }
      })
    });

    // Create spy for ShiniHighlighter
    highlighter = jasmine.createSpyObj('ShiniHighlighter', [
      'highlightToTokens',
      'whenReady'
    ]);

    TestBed.configureTestingModule({
      providers: [
        HighlightSchedulerService,
        { provide: VirtualScrollService, useValue: virtualScrollService },
        { provide: ShiniHighlighter, useValue: highlighter }
      ]
    });

    service = TestBed.inject(HighlightSchedulerService);
  });

  afterEach(() => {
    // Reset service state between tests
    service.reset();
  });

  describe('Service Creation', () => {
    it('should create the service', () => {
      expect(service).toBeTruthy();
    });

    it('should initialize with default configuration', () => {
      const config = service.config();
      expect(config.maxBlocksPerFrame).toBe(DEFAULT_SCHEDULER_CONFIG.maxBlocksPerFrame);
      expect(config.maxTimePerFrame).toBe(DEFAULT_SCHEDULER_CONFIG.maxTimePerFrame);
      expect(config.maxQueueSize).toBe(DEFAULT_SCHEDULER_CONFIG.maxQueueSize);
      expect(config.enableBackground).toBe(DEFAULT_SCHEDULER_CONFIG.enableBackground);
    });

    it('should have empty initial state', () => {
      expect(service.queue()).toEqual([]);
      expect(service.queueSize()).toBe(0);
      expect(service.isProcessing()).toBe(false);
      expect(service.highlightedBlockIds().size).toBe(0);
    });
  });

  describe('Configuration Management', () => {
    it('should update config partially', () => {
      service.setConfig({ maxBlocksPerFrame: 8 });

      const config = service.config();
      expect(config.maxBlocksPerFrame).toBe(8);
      expect(config.maxTimePerFrame).toBe(DEFAULT_SCHEDULER_CONFIG.maxTimePerFrame);
    });

    it('should update multiple config values', () => {
      service.setConfig({
        maxBlocksPerFrame: 2,
        maxTimePerFrame: 16,
        enableBackground: false
      });

      const config = service.config();
      expect(config.maxBlocksPerFrame).toBe(2);
      expect(config.maxTimePerFrame).toBe(16);
      expect(config.enableBackground).toBe(false);
    });
  });

  describe('Queue Management', () => {
    const createCodeBlock = (id: string, content: string): MarkdownBlock => ({
      id,
      type: BlockType.CODE_BLOCK,
      content,
      rawContent: content,
      language: 'typescript',
      isComplete: true,
      position: 0
    });

    it('should add block to queue', () => {
      const block = createCodeBlock('block-1', 'console.log("test");');
      service.queueBlock(block, 0);

      expect(service.queueSize()).toBe(1);
      expect(service.queue()[0].block.id).toBe('block-1');
    });

    it('should not queue non-code blocks', () => {
      const paragraphBlock: MarkdownBlock = {
        id: 'para-1',
        type: BlockType.PARAGRAPH,
        content: 'Test',
        isComplete: true,
        position: 0
      };

      service.queueBlock(paragraphBlock, 0);

      expect(service.queueSize()).toBe(0);
    });

    it('should not queue already highlighted blocks', () => {
      const block = createCodeBlock('block-1', 'code');
      block.isHighlighted = true;

      service.queueBlock(block, 0);

      expect(service.queueSize()).toBe(0);
    });

    it('should not queue blocks in highlightedBlockIds', () => {
      const block = createCodeBlock('block-1', 'code');
      service.markHighlighted('block-1');

      service.queueBlock(block, 0);

      expect(service.queueSize()).toBe(0);
    });

    it('should handle duplicate block additions', () => {
      const block = createCodeBlock('block-1', 'code');

      service.queueBlock(block, 0);
      service.queueBlock(block, 0);

      expect(service.queueSize()).toBe(1);
    });

    it('should remove block from queue', () => {
      const block = createCodeBlock('block-1', 'code');
      service.queueBlock(block, 0);

      service.dequeueBlock('block-1');

      expect(service.queueSize()).toBe(0);
      expect(service.isQueued('block-1')).toBe(false);
    });

    it('should clear all queued blocks', () => {
      service.queueBlocks([
        createCodeBlock('block-1', 'code1'),
        createCodeBlock('block-2', 'code2'),
        createCodeBlock('block-3', 'code3')
      ]);

      service.clearQueue();

      expect(service.queueSize()).toBe(0);
    });

    it('should enforce max queue size', () => {
      service.setConfig({ maxQueueSize: 3 });

      // Add 5 blocks
      for (let i = 0; i < 5; i++) {
        service.queueBlock(createCodeBlock(`block-${i}`, `code${i}`), i);
      }

      // Queue should not exceed max size
      expect(service.queueSize()).toBeLessThanOrEqual(3);
    });
  });

  describe('Queue Multiple Blocks', () => {
    it('should queue multiple code blocks', () => {
      const blocks: MarkdownBlock[] = [
        {
          id: 'block-1',
          type: BlockType.CODE_BLOCK,
          content: 'code1',
          rawContent: 'code1',
          language: 'ts',
          isComplete: true,
          position: 0
        },
        {
          id: 'block-2',
          type: BlockType.PARAGRAPH, // Should be skipped
          content: 'paragraph',
          isComplete: true,
          position: 1
        },
        {
          id: 'block-3',
          type: BlockType.CODE_BLOCK,
          content: 'code2',
          rawContent: 'code2',
          language: 'js',
          isComplete: true,
          position: 2
        }
      ];

      service.queueBlocks(blocks);

      // Only code blocks should be queued
      expect(service.queueSize()).toBe(2);
    });
  });

  describe('Priority Calculation', () => {
    it('should return VISIBLE priority for blocks in viewport', () => {
      // Mock virtual scroll window
      Object.defineProperty(virtualScrollService, 'window', {
        value: jasmine.createSpyObj('window', ['subscribe', 'pipe', 'call'], {
          value: { start: 10, end: 20, totalHeight: 1000, offsetTop: 0 }
        })
      });

      const block = {
        id: 'block-15',
        type: BlockType.CODE_BLOCK,
        content: 'code',
        rawContent: 'code',
        language: 'ts',
        isComplete: true,
        position: 0
      };

      service.queueBlock(block, 15); // Within viewport
      expect(service.queue()[0].priority).toBe(HighlightPriority.VISIBLE);
    });
  });

  describe('Highlight State Management', () => {
    it('should track highlighted blocks', () => {
      service.markHighlighted('block-1');
      service.markHighlighted('block-2');

      const ids = service.highlightedBlockIds();
      expect(ids.has('block-1')).toBe(true);
      expect(ids.has('block-2')).toBe(true);
      expect(ids.size).toBe(2);
    });

    it('should remove block from queue when marked highlighted', () => {
      const block = {
        id: 'block-1',
        type: BlockType.CODE_BLOCK,
        content: 'code',
        rawContent: 'code',
        language: 'ts',
        isComplete: true,
        position: 0
      };

      service.queueBlock(block, 0);
      expect(service.queueSize()).toBe(1);

      service.markHighlighted('block-1');
      expect(service.queueSize()).toBe(0);
    });
  });

  describe('Statistics Tracking', () => {
    beforeEach(() => {
      service.reset();
    });

    it('should track processed blocks', () => {
      const initialStats = service.stats();
      expect(initialStats.totalProcessed).toBe(0);

      // Simulate processing (would happen in processItem)
      service.updateStats('processed', 5);

      const newStats = service.stats();
      expect(newStats.totalProcessed).toBe(1);
      expect(newStats.avgProcessingTime).toBeGreaterThan(0);
    });

    it('should track skipped blocks', () => {
      service.updateStats('skipped');
      expect(service.stats().totalSkipped).toBe(1);
    });

    it('should track errors', () => {
      service.updateStats('error');
      expect(service.stats().totalErrors).toBe(1);
    });

    it('should calculate average processing time', () => {
      service.updateStats('processed', 10);
      service.updateStats('processed', 20);

      const stats = service.stats();
      expect(stats.avgProcessingTime).toBe(15);
    });
  });

  describe('Reset Functionality', () => {
    it('should clear all state on reset', () => {
      const block = {
        id: 'block-1',
        type: BlockType.CODE_BLOCK,
        content: 'code',
        rawContent: 'code',
        language: 'ts',
        isComplete: true,
        position: 0
      };

      service.queueBlock(block, 0);
      service.markHighlighted('block-2');
      service.updateStats('processed', 10);

      service.reset();

      expect(service.queueSize()).toBe(0);
      expect(service.highlightedBlockIds().size).toBe(0);
      expect(service.stats().totalProcessed).toBe(0);
      expect(service.isProcessing()).toBe(false);
    });
  });

  describe('Queue Status', () => {
    it('should return queue status with priority breakdown', () => {
      const status = service.getQueueStatus();

      expect(status.byPriority).toBeDefined();
      expect(status.byPriority.visible).toBe(0);
      expect(status.byPriority.overscan).toBe(0);
      expect(status.byPriority.background).toBe(0);
    });

    it('should check if block is queued', () => {
      const block = {
        id: 'block-1',
        type: BlockType.CODE_BLOCK,
        content: 'code',
        rawContent: 'code',
        language: 'ts',
        isComplete: true,
        position: 0
      };

      expect(service.isQueued('block-1')).toBe(false);

      service.queueBlock(block, 0);

      expect(service.isQueued('block-1')).toBe(true);
    });
  });

  describe('Priority Labels', () => {
    it('should return correct labels for priorities', () => {
      expect(service.getPriorityLabel(HighlightPriority.VISIBLE)).toBe('Visible');
      expect(service.getPriorityLabel(HighlightPriority.OVERSCAN)).toBe('Overscan');
      expect(service.getPriorityLabel(HighlightPriority.BACKGROUND)).toBe('Background');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty queue operations', () => {
      service.dequeueBlock('non-existent');
      expect(service.queueSize()).toBe(0);
    });

    it('should handle marking non-existent block as highlighted', () => {
      service.markHighlighted('non-existent');
      expect(service.highlightedBlockIds().has('non-existent')).toBe(true);
    });

    it('should handle queueing with negative index', () => {
      const block = {
        id: 'block-1',
        type: BlockType.CODE_BLOCK,
        content: 'code',
        rawContent: 'code',
        language: 'ts',
        isComplete: true,
        position: 0
      };

      service.queueBlock(block, -1);

      expect(service.queueSize()).toBe(1);
    });
  });
});
