import { Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { BLOCK_COMPONENT_REGISTRY, BlockComponentRegistry } from '../../core/plugin';
import { HighlightSchedulerService } from '../../core/highlight-scheduler.service';
import { BlockType, BlockquoteBlock, CodeBlock, CodeLine, MarkdownBlock } from '../../core/models';
import { MarkdownBlockRouterComponent } from './block-router.component';
import { MarkdownCodeComponent } from '../code/code.component';
import { MarkdownBlockquoteComponent } from '../blockquote/blockquote.component';
import { MarkdownParagraphComponent } from '../paragraph/paragraph.component';
import { MarkdownListComponent } from '../list/list.component';

class FakeHighlightSchedulerService {
  private subscribers = new Set<(result: { blockId: string; lines: CodeLine[]; success: boolean }) => void>();
  private blockSubscribers = new Map<string, Set<(result: { blockId: string; lines: CodeLine[]; success: boolean }) => void>>();
  private cache = new Map<string, CodeLine[]>();

  queueBlockCalls: Array<{ block: MarkdownBlock; index: number }> = [];
  highlightNowCalls: Array<{ block: MarkdownBlock; index: number }> = [];

  queueBlock(block: MarkdownBlock, index: number): void {
    this.queueBlockCalls.push({ block, index });
  }

  async highlightNow(block: MarkdownBlock, index: number): Promise<CodeLine[]> {
    this.highlightNowCalls.push({ block, index });
    const lines = this.createLines(block.id);
    this.cache.set(block.id, lines);
    this.emit(block.id, lines, true);
    return lines;
  }

  getHighlightedLines(blockId: string): CodeLine[] | undefined {
    return this.cache.get(blockId);
  }

  getHighlightedLinesBySignature(blockId: string, _signature: string): CodeLine[] | undefined {
    return this.cache.get(blockId);
  }

  onHighlightResult(
    callback: (result: { blockId: string; lines: CodeLine[]; success: boolean }) => void,
    blockId?: string
  ): () => void {
    if (blockId) {
      const blockSet = this.blockSubscribers.get(blockId) ?? new Set<(result: { blockId: string; lines: CodeLine[]; success: boolean }) => void>();
      blockSet.add(callback);
      this.blockSubscribers.set(blockId, blockSet);
      return () => {
        const current = this.blockSubscribers.get(blockId);
        if (!current) {
          return;
        }
        current.delete(callback);
        if (current.size === 0) {
          this.blockSubscribers.delete(blockId);
        }
      };
    }

    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  emit(blockId: string, lines: CodeLine[], success: boolean): void {
    this.cache.set(blockId, lines);
    const byBlock = this.blockSubscribers.get(blockId);
    if (byBlock) {
      for (const callback of byBlock) {
        callback({ blockId, lines, success });
      }
    }

    for (const callback of this.subscribers) {
      callback({ blockId, lines, success });
    }
  }

  private createLines(label: string): CodeLine[] {
    return [{
      lineNumber: 1,
      tokens: [{ content: `highlighted:${label}`, color: '#ffffff' }]
    }];
  }
}

@Component({
  selector: 'app-test-host',
  imports: [MarkdownBlockRouterComponent],
  template: `
    <app-markdown-block-router
      [block]="block"
      [isComplete]="isComplete"
      [blockIndex]="blockIndex"
      [enableLazyHighlight]="enableLazyHighlight"
      [allowHighlight]="allowHighlight"
      [depth]="depth" />
  `
})
class TestHostComponent {
  block!: MarkdownBlock;
  isComplete = true;
  blockIndex = 0;
  enableLazyHighlight = false;
  allowHighlight = true;
  depth = 0;
}

describe('MarkdownBlockRouterComponent highlight integration', () => {
  let scheduler: FakeHighlightSchedulerService;

  const registry: BlockComponentRegistry = {
    componentMap: new Map<string, any>([
      [BlockType.CODE_BLOCK, MarkdownCodeComponent],
      [BlockType.BLOCKQUOTE, MarkdownBlockquoteComponent],
      [BlockType.PARAGRAPH, MarkdownParagraphComponent],
      [BlockType.LIST, MarkdownListComponent],
      [BlockType.UNKNOWN, MarkdownParagraphComponent]
    ]),
    matchers: [],
    parserExtensions: []
  };

  beforeEach(async () => {
    scheduler = new FakeHighlightSchedulerService();

    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: [
        provideZonelessChangeDetection(),
        { provide: BLOCK_COMPONENT_REGISTRY, useValue: registry },
        { provide: HighlightSchedulerService, useValue: scheduler }
      ]
    }).compileComponents();
  });

  it('highlights top-level fenced code block when lazyHighlight=false', async () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    const host = fixture.componentInstance;

    host.blockIndex = 3;
    host.enableLazyHighlight = false;
    host.block = createCodeBlock('top-code', 3);

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(scheduler.highlightNowCalls.length).toBe(1);
    expect(scheduler.queueBlockCalls.length).toBe(0);
    expect((scheduler.highlightNowCalls[0].block as CodeBlock).id).toBe('top-code');
    expect(scheduler.highlightNowCalls[0].index).toBe(3);
    expect(fixture.nativeElement.querySelectorAll('.code-line').length).toBeGreaterThan(0);
  });

  it('highlights fenced code block nested in blockquote', async () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    const host = fixture.componentInstance;

    host.enableLazyHighlight = false;
    host.block = createBlockquoteWithCode('quote-1', 'quote-code');

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(scheduler.highlightNowCalls.length).toBe(1);
    expect((scheduler.highlightNowCalls[0].block as CodeBlock).id).toBe('quote-code');
    expect(fixture.nativeElement.querySelectorAll('.code-line').length).toBeGreaterThan(0);
  });

  it('queues then consumes highlight result when lazyHighlight=true', async () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    const host = fixture.componentInstance;

    host.blockIndex = 5;
    host.enableLazyHighlight = true;
    host.block = createCodeBlock('lazy-code', 5);

    fixture.detectChanges();
    await fixture.whenStable();

    expect(scheduler.queueBlockCalls.length).toBe(1);
    expect(scheduler.highlightNowCalls.length).toBe(0);

    scheduler.emit('lazy-code', [{ lineNumber: 1, tokens: [{ content: 'lazy-highlighted' }] }], true);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('lazy-highlighted');
  });
});

function createCodeBlock(id: string, position: number): CodeBlock {
  return {
    id,
    type: BlockType.CODE_BLOCK,
    content: 'const value = 1;',
    rawContent: 'const value = 1;',
    language: 'typescript',
    isComplete: true,
    position
  };
}

function createBlockquoteWithCode(id: string, codeId: string): BlockquoteBlock {
  return {
    id,
    type: BlockType.BLOCKQUOTE,
    content: 'quote',
    blocks: [createCodeBlock(codeId, 0)],
    isComplete: true,
    position: 0
  };
}
