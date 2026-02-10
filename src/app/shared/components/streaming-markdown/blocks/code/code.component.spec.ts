import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MarkdownCodeComponent } from './code.component';
import { MarkdownBlock, BlockType, CodeLine } from '../../core/models';
import { HighlightSchedulerService } from '../../core/highlight-scheduler.service';

import { beforeEach, describe, it, expect, vi } from 'vitest';

const createCodeBlock = (overrides: Partial<MarkdownBlock> = {}): MarkdownBlock => ({
  id: 'code-1',
  type: BlockType.CODE_BLOCK,
  content: 'const x = 1;',
  rawContent: 'const x = 1;',
  language: 'typescript',
  isComplete: true,
  position: 0,
  ...overrides
});

const highlightedLines: CodeLine[] = [
  { lineNumber: 1, tokens: [{ content: 'const x = 1;', color: '#111' }] }
];

describe('MarkdownCodeComponent', () => {
  let component: MarkdownCodeComponent;
  let fixture: ComponentFixture<MarkdownCodeComponent>;

  let onHighlightResultHandler: ((result: { blockId: string; lines: CodeLine[]; success: boolean }) => void) | null = null;
  const mockScheduler = {
    queueBlock: vi.fn(),
    highlightNow: vi.fn(() => Promise.resolve(highlightedLines)),
    getHighlightedLines: vi.fn(() => undefined),
    onHighlightResult: vi.fn((callback: (result: { blockId: string; lines: CodeLine[]; success: boolean }) => void) => {
      onHighlightResultHandler = callback;
      return () => {
        onHighlightResultHandler = null;
      };
    })
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    onHighlightResultHandler = null;

    await TestBed.configureTestingModule({
      imports: [MarkdownCodeComponent],
      providers: [
        { provide: HighlightSchedulerService, useValue: mockScheduler }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MarkdownCodeComponent);
    component = fixture.componentInstance;
    component.block = createCodeBlock();
  });

  it('should create component', () => {
    expect(component).toBeTruthy();
  });

  it('should queue highlight when lazyHighlight is enabled', async () => {
    component.enableLazyHighlight = true;
    component.blockIndex = 7;

    component.ngOnChanges({ block: {} as any });
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(mockScheduler.queueBlock).toHaveBeenCalledWith(component.block, 7);
    expect(mockScheduler.highlightNow).not.toHaveBeenCalled();
  });

  it('should highlight immediately when lazyHighlight is disabled', async () => {
    component.enableLazyHighlight = false;
    component.blockIndex = 3;

    component.ngOnChanges({ block: {} as any });
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(mockScheduler.highlightNow).toHaveBeenCalledWith(component.block, 3);
    expect(component.highlightedLines()).toEqual(highlightedLines);
  });

  it('should prefer external highlightResult when available', async () => {
    const linesFromExternal: CodeLine[] = [{ lineNumber: 1, tokens: [{ content: 'external' }] }];
    component.block = createCodeBlock({
      highlightResult: (() => ({ lines: linesFromExternal, fallback: false })) as any
    });

    component.ngOnChanges({ block: {} as any });
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(component.highlightedLines()).toEqual(linesFromExternal);
    expect(mockScheduler.queueBlock).not.toHaveBeenCalled();
    expect(mockScheduler.highlightNow).not.toHaveBeenCalled();
  });

  it('should consume scheduler callback result', async () => {
    component.enableLazyHighlight = true;
    component.ngOnChanges({ block: {} as any });
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(onHighlightResultHandler).toBeTruthy();
    onHighlightResultHandler?.({
      blockId: component.block.id,
      lines: highlightedLines,
      success: true
    });

    expect(component.highlightedLines()).toEqual(highlightedLines);
    expect(component.block.isHighlighted).toBe(true);
  });

  it('should not trigger highlight while streaming', async () => {
    component.isComplete = false;
    component.ngOnChanges({ isComplete: {} as any });
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(mockScheduler.queueBlock).not.toHaveBeenCalled();
    expect(mockScheduler.highlightNow).not.toHaveBeenCalled();
    expect(component.highlightedLines()).toEqual([]);
  });

  it('should not trigger highlight when allowHighlight is false', async () => {
    component.allowHighlight = false;
    component.enableLazyHighlight = false;

    component.ngOnChanges({ allowHighlight: {} as any });
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(mockScheduler.queueBlock).not.toHaveBeenCalled();
    expect(mockScheduler.highlightNow).not.toHaveBeenCalled();
    expect(component.highlightedLines()).toEqual([]);
  });
});
