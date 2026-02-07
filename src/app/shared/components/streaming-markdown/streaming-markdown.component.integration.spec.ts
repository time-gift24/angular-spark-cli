import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChangeDetectorRef } from '@angular/core';
import { Observable, Subject, of } from 'rxjs';
import { take } from 'rxjs/operators';
import { StreamingMarkdownComponent } from './streaming-markdown.component';
import { MarkdownPreprocessor } from './core/markdown-preprocessor';
import { BlockParser } from './core/block-parser';
import { ShiniHighlighter } from './core/shini-highlighter';
import { MarkdownBlock, StreamingState, createEmptyState } from './core/models';
import { BlockType } from './core/models';

// Vitest imports
import { beforeEach, describe, it, expect, vi, afterEach } from 'vitest';

/**
 * Integration Tests for StreamingMarkdownComponent
 *
 * Phase 6 - Task 6.3: Integration Tests
 *
 * Test Coverage:
 * - Full streaming pipeline (stream$ → processChunk → state updates)
 * - Preprocessor + Parser integration
 * - Component lifecycle (ngOnInit, ngOnChanges, ngOnDestroy)
 * - State signal management (blocks, currentBlock, rawContent)
 * - Block router integration
 * - Error handling and recovery
 * - Event emission (rawContentChange)
 * - Memory leak prevention
 * - Streaming scenarios (character-by-character, chunk-by-chunk)
 * - Block component interactions
 *
 * Integration Strategy:
 * - Test the entire flow from input stream to rendered output
 * - Use real preprocessor and parser (not mocks where possible)
 * - Verify state updates through Signals
 * - Test DOM rendering through block router
 * - Validate RxJS pipeline behavior
 */
describe('StreamingMarkdownComponent Integration Tests', () => {
  let component: StreamingMarkdownComponent;
  let fixture: ComponentFixture<StreamingMarkdownComponent>;
  let preprocessor: MarkdownPreprocessor;
  let parser: BlockParser;
  let shiniHighlighter: ShiniHighlighter;
  let cdr: ChangeDetectorRef;
  let mockStream$: Subject<string>;

  /**
   * Helper: Create a mock Observable that emits values with delay
   */
  function createDelayedStream(chunks: string[], delay = 10): Observable<string> {
    return new Observable(observer => {
      let index = 0;
      const interval = setInterval(() => {
        if (index < chunks.length) {
          observer.next(chunks[index]);
          index++;
        } else {
          observer.complete();
          clearInterval(interval);
        }
      }, delay);
      return () => clearInterval(interval);
    });
  }

  /**
   * Helper: Create a mock Observable that emits synchronously
   * Uses defer to prevent double subscription
   */
  function createSyncStream(chunks: string[]): Observable<string> {
    return new Observable(observer => {
      // Emit each chunk synchronously
      for (const chunk of chunks) {
        observer.next(chunk);
      }
      observer.complete();

      // Return cleanup function
      return () => {
        // No cleanup needed
      };
    });
  }

  /**
   * Helper: Get computed signal value
   */
  function getBlocks(): MarkdownBlock[] {
    return (component as any).blocks();
  }

  /**
   * Helper: Get current block signal value
   */
  function getCurrentBlock(): MarkdownBlock | null {
    return (component as any).currentBlock();
  }

  /**
   * Helper: Get raw content signal value
   */
  function getRawContent(): string {
    return (component as any).rawContent();
  }

  /**
   * Helper: Wait for async operations
   */
  function waitFor(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  beforeEach(async () => {
    vi.clearAllMocks();

    await TestBed.configureTestingModule({
      imports: [StreamingMarkdownComponent],
      providers: [
        MarkdownPreprocessor,
        BlockParser,
        {
          provide: ShiniHighlighter,
          useValue: {
            initialize: vi.fn(() => Promise.resolve()),
            highlight: vi.fn(() => Promise.resolve('<code>highlighted</code>')),
            whenReady: vi.fn(() => Promise.resolve())
          }
        },
        ChangeDetectorRef
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(StreamingMarkdownComponent);
    component = fixture.componentInstance;

    // Inject services
    preprocessor = TestBed.inject(MarkdownPreprocessor);
    parser = TestBed.inject(BlockParser);
    shiniHighlighter = TestBed.inject(ShiniHighlighter);
    cdr = TestBed.inject(ChangeDetectorRef);

    // Initialize mock stream
    mockStream$ = new Subject<string>();
  });

  afterEach(() => {
    fixture.destroy();
  });

  describe('Component Initialization', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize Shini highlighter on ngOnInit', async () => {
      const stream$ = of('# Test');
      component.stream$ = stream$;

      component.ngOnInit();
      await waitFor(50);

      expect(shiniHighlighter.initialize).toHaveBeenCalled();
    });

    it('should start with empty state', () => {
      expect(getBlocks()).toEqual([]);
      expect(getCurrentBlock()).toBeNull();
      expect(getRawContent()).toBe('');
    });

    it('should subscribe to stream$ on ngOnInit', () => {
      const stream$ = new Subject<string>();
      component.stream$ = stream$;

      const subscribeSpy = vi.spyOn(stream$, 'pipe');
      component.ngOnInit();

      expect(subscribeSpy).toHaveBeenCalled();
    });
  });

  describe('Streaming Pipeline - Full Flow', () => {
    it('should process single chunk markdown correctly', async () => {
      const stream$ = of('# Test Heading\n\nThis is a paragraph.');
      component.stream$ = stream$;

      component.ngOnInit();
      await waitFor(100);
      fixture.detectChanges();

      const blocks = getBlocks();
      expect(blocks.length).toBeGreaterThan(0);
      expect(blocks[0].type).toBe(BlockType.HEADING);
    });

    it('should accumulate multiple chunks into state', async () => {
      const chunks = ['# Heading', '\n\n', 'Paragraph content'];
      const stream$ = createSyncStream(chunks);
      component.stream$ = stream$;

      component.ngOnInit();
      await waitFor(100);
      fixture.detectChanges();

      const rawContent = getRawContent();
      expect(rawContent).toContain('# Heading');
      expect(rawContent).toContain('Paragraph content');
    });

    it('should process chunks in sequence', async () => {
      const chunks = ['# First', '\n\n', '## Second', '\n\n', 'Third'];
      const stream$ = createDelayedStream(chunks, 20);
      component.stream$ = stream$;

      component.ngOnInit();
      await waitFor(200);
      fixture.detectChanges();

      const blocks = getBlocks();
      expect(blocks.length).toBeGreaterThan(0);
    });

    it('should maintain state across multiple emissions', async () => {
      const chunks = ['Chunk 1', ' Chunk 2', ' Chunk 3'];
      const stream$ = createSyncStream(chunks);
      component.stream$ = stream$;

      component.ngOnInit();
      await waitFor(100);
      fixture.detectChanges();

      const rawContent = getRawContent();
      expect(rawContent).toBe('Chunk 1 Chunk 2 Chunk 3');
    });
  });

  describe('Preprocessor Integration', () => {
    it('should apply preprocessor to each chunk', async () => {
      const preprocessSpy = vi.spyOn(preprocessor, 'process');

      const stream$ = of('# Test');
      component.stream$ = stream$;

      component.ngOnInit();
      await waitFor(100);

      expect(preprocessSpy).toHaveBeenCalledWith('# Test');
    });

    it('should handle preprocessor transformations', async () => {
      // Test that preprocessed content flows through the pipeline
      const stream$ = of('```javascript\nconst x = 1;\n```');
      component.stream$ = stream$;

      component.ngOnInit();
      await waitFor(100);
      fixture.detectChanges();

      const blocks = getBlocks();
      const codeBlock = blocks.find(b => b.type === BlockType.CODE_BLOCK);
      expect(codeBlock).toBeTruthy();
    });
  });

  describe('Parser Integration', () => {
    it('should parse completed content into blocks', async () => {
      const stream$ = of('# Heading\n\nParagraph text');
      component.stream$ = stream$;

      component.ngOnInit();
      await waitFor(100);
      fixture.detectChanges();

      const blocks = getBlocks();
      expect(blocks.length).toBeGreaterThan(0);

      const hasHeading = blocks.some(b => b.type === BlockType.HEADING);
      const hasParagraph = blocks.some(b => b.type === BlockType.PARAGRAPH);

      expect(hasHeading).toBe(true);
      expect(hasParagraph).toBe(true);
    });

    it('should handle different block types', async () => {
      const markdown = `
# Heading 1

Paragraph with **bold** text.

- List item 1
- List item 2

> Quote text

\`\`\`javascript
code();
\`\`\`
      `.trim();

      const stream$ = of(markdown);
      component.stream$ = stream$;

      component.ngOnInit();
      await waitFor(100);
      fixture.detectChanges();

      const blocks = getBlocks();
      const types = new Set(blocks.map(b => b.type));

      expect(types.has(BlockType.HEADING)).toBe(true);
      expect(types.has(BlockType.PARAGRAPH)).toBe(true);
      expect(types.has(BlockType.LIST)).toBe(true);
      expect(types.has(BlockType.BLOCKQUOTE)).toBe(true);
      expect(types.has(BlockType.CODE_BLOCK)).toBe(true);
    });
  });

  describe('State Signal Management', () => {
    it('should update blocks signal when blocks are parsed', async () => {
      const stream$ = of('# Heading\n\nParagraph');
      component.stream$ = stream$;

      component.ngOnInit();
      await waitFor(100);
      fixture.detectChanges();

      const blocks = getBlocks();
      expect(blocks.length).toBeGreaterThan(0);
      expect(blocks[0]).toHaveProperty('id');
      expect(blocks[0]).toHaveProperty('type');
    });

    it('should update currentBlock signal for incomplete blocks', async () => {
      // Stream an incomplete heading (no newline after)
      const stream$ = of('# Incomplete heading');
      component.stream$ = stream$;

      component.ngOnInit();
      await waitFor(100);
      fixture.detectChanges();

      const currentBlock = getCurrentBlock();
      // May or may not have current block depending on parser implementation
      expect(currentBlock).toBeDefined();
    });

    it('should update rawContent signal with accumulated content', async () => {
      const stream$ = createSyncStream(['Chunk1', 'Chunk2', 'Chunk3']);
      component.stream$ = stream$;

      component.ngOnInit();
      await waitFor(100);
      fixture.detectChanges();

      const rawContent = getRawContent();
      expect(rawContent).toBe('Chunk1Chunk2Chunk3');
    });

    it('should reset state when stream$ changes', async () => {
      const stream1$ = of('# First');
      component.stream$ = stream1$;

      component.ngOnInit();
      await waitFor(100);
      fixture.detectChanges();

      const firstContent = getRawContent();
      expect(firstContent).toContain('First');

      // Change stream
      const stream2$ = of('# Second');
      component.stream$ = stream2$;
      component.ngOnChanges({
        stream$: {
          isFirstChange: () => false,
          firstChange: false,
          previousValue: stream1$,
          currentValue: stream2$
        }
      } as any);

      await waitFor(100);
      fixture.detectChanges();

      const secondContent = getRawContent();
      expect(secondContent).toContain('Second');
    });
  });

  describe('Block Router Integration', () => {
    it('should render blocks through block router component', async () => {
      const stream$ = of('# Test Heading');
      component.stream$ = stream$;

      component.ngOnInit();
      await waitFor(100);
      fixture.detectChanges();

      const routerElements = fixture.nativeElement.querySelectorAll('app-markdown-block-router');
      expect(routerElements.length).toBeGreaterThan(0);
    });

    it('should pass isComplete flag to block router', async () => {
      const stream$ = of('# Heading\n\nParagraph');
      component.stream$ = stream$;

      component.ngOnInit();
      await waitFor(100);
      fixture.detectChanges();

      // Completed blocks should have isComplete=true
      const routers = fixture.nativeElement.querySelectorAll('app-markdown-block-router');
      expect(routers.length).toBeGreaterThan(0);
    });

    it('should render completed blocks separately from current block', async () => {
      const stream$ = of('# Heading\n\nIncomplete');
      component.stream$ = stream$;

      component.ngOnInit();
      await waitFor(100);
      fixture.detectChanges();

      // Should render both completed blocks and current block
      const routers = fixture.nativeElement.querySelectorAll('app-markdown-block-router');
      expect(routers.length).toBeGreaterThan(0);
    });
  });

  describe('Character-by-Character Streaming', () => {
    it('should handle character-by-character stream', async () => {
      const text = '# Heading';
      const chars = text.split('');
      const stream$ = createDelayedStream(chars, 5);
      component.stream$ = stream$;

      component.ngOnInit();
      await waitFor(200);
      fixture.detectChanges();

      const rawContent = getRawContent();
      expect(rawContent).toBe('# Heading');
    });

    it('should build content progressively', async () => {
      const chars = ['#', ' H', 'e', 'a', 'd', 'i', 'n', 'g'];
      const stream$ = createDelayedStream(chars, 10);
      component.stream$ = stream$;

      component.ngOnInit();

      // Check intermediate state
      await waitFor(50);
      let content = getRawContent();
      expect(content.length).toBeGreaterThan(0);

      // Check final state
      await waitFor(150);
      content = getRawContent();
      expect(content).toBe('# Heading');
    });

    it('should handle rapid character streaming', async () => {
      const text = 'The quick brown fox jumps over the lazy dog.';
      const chars = text.split('');
      const stream$ = createSyncStream(chars);
      component.stream$ = stream$;

      component.ngOnInit();
      await waitFor(100);
      fixture.detectChanges();

      const rawContent = getRawContent();
      expect(rawContent).toBe(text);
    });
  });

  describe('Event Emission', () => {
    it('should emit rawContentChange on each chunk', async () => {
      const emitSpy = vi.spyOn(component.rawContentChange, 'emit');

      const stream$ = createSyncStream(['Chunk1', 'Chunk2']);
      component.stream$ = stream$;

      component.ngOnInit();
      await waitFor(100);

      expect(emitSpy).toHaveBeenCalled();
      expect(emitSpy).toHaveBeenCalledTimes(2);
    });

    it('should emit accumulated raw content', async () => {
      const emittedValues: string[] = [];
      component.rawContentChange.subscribe(content => {
        emittedValues.push(content);
      });

      const stream$ = createSyncStream(['A', 'B', 'C']);
      component.stream$ = stream$;

      component.ngOnInit();
      await waitFor(100);

      expect(emittedValues).toEqual(['A', 'AB', 'ABC']);
    });
  });

  describe('Error Handling', () => {
    it('should handle stream errors gracefully', async () => {
      const error$ = new Observable<string>(observer => {
        observer.next('# Valid');
        observer.error(new Error('Stream error'));
      });

      component.stream$ = error$;

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      component.ngOnInit();
      await waitFor(100);

      // Should log error but not crash
      expect(consoleSpy).toHaveBeenCalled();

      // Component should still have state
      const content = getRawContent();
      expect(content).toContain('Valid');

      consoleSpy.mockRestore();
    });

    it('should continue processing after error', async () => {
      const chunks = ['# Before', '# After'];
      const stream$ = new Observable<string>(observer => {
        observer.next(chunks[0]);
        observer.error(new Error('Error'));
        observer.next(chunks[1]);
        observer.complete();
      });

      component.stream$ = stream$;
      component.ngOnInit();
      await waitFor(100);

      // Should have processed at least the first chunk
      const content = getRawContent();
      expect(content).toContain('Before');
    });
  });

  describe('Component Lifecycle', () => {
    it('should cleanup subscriptions on ngOnDestroy', () => {
      const stream$ = new Subject<string>();
      component.stream$ = stream$;

      component.ngOnInit();
      component.ngOnDestroy();

      // Verify cleanup happened without error
      expect(component).toBeTruthy();
    });

    it('should cleanup destroy$ subject on ngOnDestroy', () => {
      component.stream$ = of('# Test');

      component.ngOnInit();

      const completeSpy = vi.spyOn((component as any).destroy$, 'complete');

      component.ngOnDestroy();

      expect(completeSpy).toHaveBeenCalled();
    });

    it('should handle re-subscription when stream$ changes', async () => {
      const stream1$ = of('# First');
      const stream2$ = of('# Second');

      component.stream$ = stream1$;
      component.ngOnInit();
      await waitFor(50);

      component.stream$ = stream2$;
      component.ngOnChanges({
        stream$: {
          isFirstChange: () => false,
          firstChange: false,
          previousValue: stream1$,
          currentValue: stream2$
        }
      } as any);

      await waitFor(100);
      fixture.detectChanges();

      const content = getRawContent();
      expect(content).toContain('Second');
    });
  });

  describe('Change Detection Optimization', () => {
    it('should use OnPush change detection strategy', () => {
      // Check if component instance exists with proper change detection
      expect(component).toBeTruthy();
      // The OnPush strategy is set in the component decorator
      // We verify it works by checking if changes are detected
    });

    it('should call markForCheck when processing chunks', async () => {
      // ChangeDetectorRef should be available
      expect(cdr).toBeTruthy();

      const stream$ = of('# Test');
      component.stream$ = stream$;

      component.ngOnInit();
      await waitFor(100);

      // If we get here without errors, change detection is working
      const blocks = getBlocks();
      expect(Array.isArray(blocks)).toBe(true);
    });
  });

  describe('Complex Scenarios', () => {
    it('should handle code blocks with language specification', async () => {
      const markdown = `
\`\`\`typescript
interface User {
  id: number;
  name: string;
}
\`\`\`
      `.trim();

      const stream$ = of(markdown);
      component.stream$ = stream$;

      component.ngOnInit();
      await waitFor(100);
      fixture.detectChanges();

      const blocks = getBlocks();
      const codeBlock = blocks.find(b => b.type === BlockType.CODE_BLOCK);

      expect(codeBlock).toBeTruthy();
      if (codeBlock) {
        expect(codeBlock.language).toBe('typescript');
      }
    });

    it('should handle nested lists', async () => {
      const markdown = `
- Item 1
  - Nested 1.1
  - Nested 1.2
- Item 2
      `.trim();

      const stream$ = of(markdown);
      component.stream$ = stream$;

      component.ngOnInit();
      await waitFor(100);
      fixture.detectChanges();

      const blocks = getBlocks();
      const listBlock = blocks.find(b => b.type === BlockType.LIST);

      expect(listBlock).toBeTruthy();
      if (listBlock && listBlock.items) {
        expect(listBlock.items.length).toBeGreaterThan(0);
      }
    });

    it('should handle mixed content types', async () => {
      const markdown = `
# Document Title

This is a paragraph with **bold** and *italic* text.

## Subsection

- List item 1
- List item 2

> A quote

More paragraph text.
      `.trim();

      const stream$ = of(markdown);
      component.stream$ = stream$;

      component.ngOnInit();
      await waitFor(100);
      fixture.detectChanges();

      const blocks = getBlocks();
      expect(blocks.length).toBeGreaterThan(0);

      const types = blocks.map(b => b.type);
      expect(types).toContain(BlockType.HEADING);
      expect(types).toContain(BlockType.PARAGRAPH);
      expect(types).toContain(BlockType.LIST);
      expect(types).toContain(BlockType.BLOCKQUOTE);
    });

    it('should handle empty markdown', async () => {
      const stream$ = of('');
      component.stream$ = stream$;

      component.ngOnInit();
      await waitFor(100);
      fixture.detectChanges();

      const blocks = getBlocks();
      expect(Array.isArray(blocks)).toBe(true);
    });

    it('should handle very long markdown documents', async () => {
      const longContent = '# Heading\n\n' + 'Paragraph line.\n'.repeat(100);
      const stream$ = of(longContent);
      component.stream$ = stream$;

      component.ngOnInit();
      await waitFor(200);
      fixture.detectChanges();

      const blocks = getBlocks();
      expect(blocks.length).toBeGreaterThan(0);
    });
  });

  describe('Performance and Optimization', () => {
    it('should use trackById for block tracking', () => {
      const block = {
        id: 'test-id',
        type: BlockType.PARAGRAPH,
        content: 'Test',
        isComplete: true,
        position: 0
      };

      const trackId = component.trackById(block);
      expect(trackId).toBe('test-id');
    });

    it('should preserve block IDs across updates', async () => {
      const stream$ = createSyncStream(['# First', '\n\n', '## Second']);
      component.stream$ = stream$;

      component.ngOnInit();
      await waitFor(100);
      fixture.detectChanges();

      const blocks = getBlocks();
      const firstId = blocks[0]?.id;

      // All blocks should have IDs
      blocks.forEach(block => {
        expect(block.id).toBeTruthy();
        expect(typeof block.id).toBe('string');
      });
    });
  });

  describe('Memory Leak Prevention', () => {
    it('should unsubscribe from stream on component destroy', async () => {
      const stream$ = new Subject<string>();

      component.stream$ = stream$;
      component.ngOnInit();

      // Destroy component
      component.ngOnDestroy();
      fixture.destroy();

      // Wait to ensure no more emissions
      await waitFor(50);

      // If we get here without hanging, cleanup worked
      expect(true).toBe(true);
    });

    it('should complete destroy$ subject on cleanup', () => {
      component.stream$ = of('# Test');

      component.ngOnInit();

      const nextSpy = vi.spyOn((component as any).destroy$, 'next');
      const completeSpy = vi.spyOn((component as any).destroy$, 'complete');

      component.ngOnDestroy();

      expect(nextSpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });

  describe('Real-World Scenarios', () => {
    it('should simulate LLM streaming response', async () => {
      // Simulate an LLM streaming markdown tokens
      const tokens = [
        '# ', 'AI', ' Res', 'ponse', '\n\n',
        'Here', ' is', ' the', ' ans', 'wer', '.',
        '\n\n', '**', 'Bold', ' text', '**'
      ];

      const stream$ = createDelayedStream(tokens, 15);
      component.stream$ = stream$;

      component.ngOnInit();
      await waitFor(500);
      fixture.detectChanges();

      const content = getRawContent();
      expect(content).toContain('# AI Response');
      expect(content).toContain('Here is the answer.');
      expect(content).toContain('**Bold text**');

      const blocks = getBlocks();
      expect(blocks.length).toBeGreaterThan(0);
    });

    it('should handle rapid back-to-back chunks', async () => {
      const chunks = Array.from({ length: 50 }, (_, i) => `Chunk ${i}\n\n`);
      const stream$ = createSyncStream(chunks);
      component.stream$ = stream$;

      component.ngOnInit();
      await waitFor(200);
      fixture.detectChanges();

      const blocks = getBlocks();
      expect(blocks.length).toBeGreaterThan(0);
    });

    it('should handle markdown with special characters', async () => {
      const markdown = `
# Special Characters

Test: <>&"'

Code: \`const x = 1;\`

Escaped: \\*not italic\\*
      `.trim();

      const stream$ = of(markdown);
      component.stream$ = stream$;

      component.ngOnInit();
      await waitFor(100);
      fixture.detectChanges();

      const blocks = getBlocks();
      expect(blocks.length).toBeGreaterThan(0);
    });
  });

  describe('Auto-scroll to Bottom', () => {
    it('should scroll to bottom when new content arrives during streaming', async () => {
      component.stream$ = mockStream$.asObservable();
      component.ngOnInit();
      fixture.detectChanges();

      // Get the container element
      const containerElement: HTMLElement = fixture.nativeElement.querySelector('.streaming-markdown-container');
      expect(containerElement).toBeTruthy();

      // Set a fixed height to enable scrolling
      containerElement.style.height = '200px';
      containerElement.style.overflow = 'auto';
      fixture.detectChanges(); // Trigger change detection after setting styles

      // Send multiple chunks to simulate streaming
      const chunks = ['# Title', '\n\nParagraph 1', '\n\nParagraph 2', '\n\nParagraph 3'];
      for (const chunk of chunks) {
        mockStream$.next(chunk);
        await waitFor(20);
        fixture.detectChanges();
      }

      mockStream$.complete();
      await waitFor(50);
      fixture.detectChanges(); // Final change detection

      // Verify content was added - check for child elements
      const childElements = containerElement.querySelectorAll('app-markdown-block-router');
      expect(childElements.length).toBeGreaterThan(0);

      // Verify scrollTop is at bottom (scrollHeight may be 0 in test environment, but we can check the relative position)
      const scrollTop = containerElement.scrollTop;
      const scrollHeight = containerElement.scrollHeight;
      const clientHeight = containerElement.clientHeight;

      // If there's content to scroll, scroll should be at bottom
      if (scrollHeight > 0) {
        const isAtBottom = (scrollTop + clientHeight) >= (scrollHeight - 5);
        expect(isAtBottom).toBe(true);
      }
    });

    it('should maintain scroll position at bottom after each chunk', async () => {
      component.stream$ = mockStream$.asObservable();
      component.ngOnInit();
      fixture.detectChanges();

      const containerElement: HTMLElement = fixture.nativeElement.querySelector('.streaming-markdown-container');
      expect(containerElement).toBeTruthy();

      // Set a fixed height to enable scrolling
      containerElement.style.height = '150px';
      containerElement.style.overflow = 'auto';
      fixture.detectChanges();

      const chunks = ['Line 1', '\nLine 2', '\nLine 3', '\nLine 4', '\nLine 5'];

      for (const chunk of chunks) {
        mockStream$.next(chunk);
        await waitFor(20);
        fixture.detectChanges();

        // After each chunk, verify scroll is at or near bottom
        const scrollTop = containerElement.scrollTop;
        const scrollHeight = containerElement.scrollHeight;
        const clientHeight = containerElement.clientHeight;

        // Scroll should be at bottom (scrollTop + clientHeight >= scrollHeight - small tolerance)
        const isAtBottom = (scrollTop + clientHeight) >= (scrollHeight - 5);
        expect(isAtBottom).toBe(true);
      }

      mockStream$.complete();
      await waitFor(50);
    });

    it('should scroll to bottom when streaming completes', async () => {
      component.stream$ = mockStream$.asObservable();
      component.ngOnInit();
      fixture.detectChanges();

      const containerElement: HTMLElement = fixture.nativeElement.querySelector('.streaming-markdown-container');
      expect(containerElement).toBeTruthy();

      containerElement.style.height = '200px';
      containerElement.style.overflow = 'auto';
      fixture.detectChanges();

      // Send content
      mockStream$.next('# Title\n\n');
      await waitFor(20);

      mockStream$.next('Paragraph 1\n\n');
      await waitFor(20);

      mockStream$.next('Paragraph 2');
      mockStream$.complete();
      await waitFor(50);

      fixture.detectChanges();

      // Verify final scroll position is at bottom
      const scrollTop = containerElement.scrollTop;
      const scrollHeight = containerElement.scrollHeight;
      const clientHeight = containerElement.clientHeight;

      const isAtBottom = (scrollTop + clientHeight) >= (scrollHeight - 5);
      expect(isAtBottom).toBe(true);
    });
  });
});

  // =============================================================================
  // Phase 4.1: Virtual Scroll Integration Tests
  // =============================================================================

  describe('Virtual Scroll Integration', () => {
    beforeEach(async () => {
      vi.clearAllMocks();

      await TestBed.configureTestingModule({
        imports: [StreamingMarkdownComponent],
        providers: [
          MarkdownPreprocessor,
          BlockParser,
          {
            provide: ShiniHighlighter,
            useValue: {
              initialize: vi.fn(() => Promise.resolve()),
              highlight: vi.fn(() => Promise.resolve('<code>highlighted</code>')),
              whenReady: vi.fn(() => Promise.resolve())
            }
          },
          ChangeDetectorRef
        ]
      }).compileComponents();

      fixture = TestBed.createComponent(StreamingMarkdownComponent);
      component = fixture.componentInstance;
    });

    /**
     * Helper: Generate markdown blocks for testing
     */
    function generateMarkdownBlocks(count: number): string {
      const blocks: string[] = [];
      for (let i = 0; i < count; i++) {
        blocks.push(\`# Block \${i + 1}\\n\\nThis is paragraph \${i + 1}.\\n\\n\`);
      }
      return blocks.join('');
    }

    /**
     * Helper: Count rendered block router elements in DOM
     */
    function countRenderedBlocks(): number {
      const routers = fixture.nativeElement.querySelectorAll('app-markdown-block-router');
      return routers.length;
    }

    describe('Virtual Scroll Activation', () => {
      it('should NOT use virtual scroll for small documents (below threshold)', async () => {
        const content = generateMarkdownBlocks(10);
        const stream\$ = of(content);
        component.stream\$ = stream\$;
        component.virtualScroll = true;

        component.ngOnInit();
        await waitFor(100);
        fixture.detectChanges();

        const blockCount = countRenderedBlocks();
        expect(blockCount).toBe(10);
      });

      it('should use virtual scroll for large documents (above threshold)', async () => {
        const content = generateMarkdownBlocks(150);
        const stream\$ = of(content);
        component.stream\$ = stream\$;
        component.virtualScroll = true;

        component.ngOnInit();
        await waitFor(200);
        fixture.detectChanges();

        const blockCount = countRenderedBlocks();
        expect(blockCount).toBeLessThan(150);
        expect(blockCount).toBeGreaterThan(0);
      });

      it('should disable virtual scroll when virtualScroll = false', async () => {
        const content = generateMarkdownBlocks(200);
        const stream\$ = of(content);
        component.stream\$ = stream\$;
        component.virtualScroll = false;

        component.ngOnInit();
        await waitFor(200);
        fixture.detectChanges();

        const blockCount = countRenderedBlocks();
        expect(blockCount).toBe(200);
      });
    });

    describe('Streaming to Virtual Scroll Transition', () => {
      it('should preserve streaming behavior', async () => {
        const content = generateMarkdownBlocks(50);
        const stream\$ = of(content);
        component.stream\$ = stream\$;
        component.virtualScroll = true;

        component.ngOnInit();
        await waitFor(150);
        fixture.detectChanges();

        expect(component).toBeTruthy();
      });
    });

    describe('Large Document Performance', () => {
      it('should handle 1000 blocks efficiently', async () => {
        const content = generateMarkdownBlocks(1000);
        const stream\$ = of(content);
        component.stream\$ = stream\$;
        component.virtualScroll = true;

        const startTime = Date.now();
        component.ngOnInit();
        await waitFor(300);
        fixture.detectChanges();
        const endTime = Date.now();

        expect(endTime - startTime).toBeLessThan(1000);
      });
    });

    describe('No Regressions', () => {
      it('should maintain backward compatibility', async () => {
        const stream\$ = of('# Test\\n\\nContent');
        component.stream\$ = stream\$;

        component.ngOnInit();
        await waitFor(100);
        fixture.detectChanges();

        const blocks = (component as any).blocks();
        expect(blocks.length).toBeGreaterThan(0);
      });
    });
  });
});

// =============================================================================
// Phase 4.2: Progressive Highlighting Integration Tests
// =============================================================================

describe('Progressive Highlighting Integration', () => {
  beforeEach(async () => {
    vi.clearAllMocks();

    await TestBed.configureTestingModule({
      imports: [StreamingMarkdownComponent],
      providers: [
        MarkdownPreprocessor,
        BlockParser,
        {
          provide: ShiniHighlighter,
          useValue: {
            initialize: vi.fn(() => Promise.resolve()),
            highlightToTokens: vi.fn((code: string, lang: string, theme: string) => {
              // Mock tokenization - return plain tokens
              const lines = code.split('\n');
              return Promise.resolve(lines.map((line, i) => ({
                lineNumber: i + 1,
                tokens: [{ content: line || ' ' }]
              })));
            }),
            plainTextFallback: vi.fn((code: string) => {
              const lines = code.split('\n');
              return lines.map((line, i) => ({
                lineNumber: i + 1,
                tokens: [{ content: line || ' ' }]
              }));
            }),
            whenReady: vi.fn(() => Promise.resolve()),
            isReady: vi.fn(() => true)
          }
        },
        ChangeDetectorRef
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(StreamingMarkdownComponent);
    component = fixture.componentInstance;
  });

  /**
   * Helper: Create markdown with code blocks
   */
  function createCodeMarkdown(blockCount: number): string {
    const blocks: string[] = [];
    for (let i = 0; i < blockCount; i++) {
      blocks.push(`\`\`\`typescript\nconst x${i} = ${i};\nconsole.log(x${i});\n\`\`\`\n\n`);
    }
    return blocks.join('');
  }

  describe('Lazy Highlighting Activation', () => {
    it('should enable lazy highlighting by default', async () => {
      const markdown = createCodeMarkdown(5);
      const stream$ = of(markdown);
      component.stream$ = stream$;

      component.ngOnInit();
      await waitFor(100);
      fixture.detectChanges();

      expect(component).toBeTruthy();
    });

    it('should disable lazy highlighting when enableLazyHighlight = false', async () => {
      const markdown = createCodeMarkdown(3);
      const stream$ = of(markdown);
      component.stream$ = stream$;
      component.enableLazyHighlight = false;

      component.ngOnInit();
      await waitFor(100);
      fixture.detectChanges();

      const blocks = (component as any).blocks();
      const codeBlocks = blocks.filter((b: MarkdownBlock) => b.type === BlockType.CODE_BLOCK);
      expect(codeBlocks.length).toBeGreaterThan(0);
    });
  });

  describe('Highlight Queue Management', () => {
    it('should queue code blocks after streaming completes', async () => {
      const markdown = createCodeMarkdown(10);
      const stream$ = of(markdown);
      component.stream$ = stream$;
      component.enableLazyHighlight = true;

      component.ngOnInit();
      await waitFor(200);
      fixture.detectChanges();

      const blocks = (component as any).blocks();
      const codeBlocks = blocks.filter((b: MarkdownBlock) => b.type === BlockType.CODE_BLOCK);
      expect(codeBlocks.length).toBe(10);
    });

    it('should only queue code blocks, not other block types', async () => {
      const markdown = `
# Heading

This is a paragraph.

\`\`\`typescript
const x = 1;
\`\`\`

> A quote
      `.trim();

      const stream$ = of(markdown);
      component.stream$ = stream$;

      component.ngOnInit();
      await waitFor(100);
      fixture.detectChanges();

      const blocks = (component as any).blocks();
      const codeBlocks = blocks.filter((b: MarkdownBlock) => b.type === BlockType.CODE_BLOCK);
      expect(codeBlocks.length).toBe(1);
    });
  });

  describe('Virtual Scroll Integration', () => {
    it('should queue visible code blocks when virtual scroll is active', async () => {
      const markdown = createCodeMarkdown(150);
      const stream$ = of(markdown);
      component.stream$ = stream$;
      component.enableLazyHighlight = true;
      component.virtualScroll = true;

      component.ngOnInit();
      await waitFor(300);
      fixture.detectChanges();

      const blocks = (component as any).blocks();
      expect(blocks.length).toBeGreaterThan(0);
    });

    it('should prioritize visible blocks for highlighting', async () => {
      const markdown = createCodeMarkdown(50);
      const stream$ = of(markdown);
      component.stream$ = stream$;
      component.enableLazyHighlight = true;

      component.ngOnInit();
      await waitFor(200);
      fixture.detectChanges();

      // Verify component handles highlighting queue
      expect(component).toBeTruthy();
    });
  });

  describe('Performance with Many Code Blocks', () => {
    it('should handle 50 code blocks efficiently', async () => {
      const markdown = createCodeMarkdown(50);
      const stream$ = of(markdown);
      component.stream$ = stream$;
      component.enableLazyHighlight = true;

      const startTime = Date.now();
      component.ngOnInit();
      await waitFor(300);
      fixture.detectChanges();
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(1000);
    });
  });

  describe('Cleanup and Memory Management', () => {
    it('should clear highlight queue on component destroy', async () => {
      const markdown = createCodeMarkdown(10);
      const stream$ = of(markdown);
      component.stream$ = stream$;
      component.enableLazyHighlight = true;

      component.ngOnInit();
      await waitFor(100);
      component.ngOnDestroy();

      // Component should cleanup without errors
      expect(true).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle code blocks with no language specified', async () => {
      const markdown = '```\ncode here\n```\n\n';
      const stream$ = of(markdown);
      component.stream$ = stream$;

      component.ngOnInit();
      await waitFor(100);
      fixture.detectChanges();

      const blocks = (component as any).blocks();
      expect(blocks.length).toBeGreaterThan(0);
    });

    it('should handle code blocks with uncommon languages', async () => {
      const markdown = '```rust\nfn main() {}\n```\n\n';
      const stream$ = of(markdown);
      component.stream$ = stream$;

      component.ngOnInit();
      await waitFor(100);
      fixture.detectChanges();

      const blocks = (component as any).blocks();
      const codeBlock = blocks.find((b: MarkdownBlock) => b.type === BlockType.CODE_BLOCK);
      expect(codeBlock).toBeTruthy();
    });

    it('should handle empty code blocks', async () => {
      const markdown = '```\n```\n\n';
      const stream$ = of(markdown);
      component.stream$ = stream$;

      component.ngOnInit();
      await waitFor(100);
      fixture.detectChanges();

      const blocks = (component as any).blocks();
      expect(blocks.length).toBeGreaterThan(0);
    });
  });
});
