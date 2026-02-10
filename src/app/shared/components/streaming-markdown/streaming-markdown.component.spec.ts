import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SimpleChange } from '@angular/core';
import { of, Subject } from 'rxjs';
import { StreamingMarkdownComponent } from './streaming-markdown.component';
import { VirtualScrollService } from './core/virtual-scroll.service';
import { ShiniHighlighter } from './core/shini-highlighter';
import { BlockType, CodeLine, MarkdownBlock, StreamingState } from './core/models';

describe('StreamingMarkdownComponent', () => {
  let component: StreamingMarkdownComponent;
  let fixture: ComponentFixture<StreamingMarkdownComponent>;
  let virtualScrollService: VirtualScrollService;

  const wait = (ms = 50): Promise<void> =>
    new Promise((resolve) => setTimeout(resolve, ms));

  const createParagraphBlock = (index: number): MarkdownBlock => ({
    id: `p-${index}`,
    type: BlockType.PARAGRAPH,
    content: `Paragraph ${index}`,
    isComplete: true,
    position: index
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StreamingMarkdownComponent],
      providers: [
        {
          provide: ShiniHighlighter,
          useValue: {
            initialize: jasmine.createSpy('initialize').and.resolveTo(),
            whenReady: jasmine.createSpy('whenReady').and.resolveTo(),
            highlightToTokens: jasmine
              .createSpy('highlightToTokens')
              .and.resolveTo([{ lineNumber: 1, tokens: [{ content: 'x' }] }]),
            plainTextFallback: jasmine
              .createSpy('plainTextFallback')
              .and.callFake((code: string) => [{ lineNumber: 1, tokens: [{ content: code }] }])
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(StreamingMarkdownComponent);
    component = fixture.componentInstance;
    virtualScrollService = TestBed.inject(VirtualScrollService);
  });

  it('should emit statusChange(streaming/completed) and completed event', async () => {
    const statusSpy = jasmine.createSpy('statusSpy');
    const completedSpy = jasmine.createSpy('completedSpy');

    component.statusChange.subscribe(statusSpy);
    component.completed.subscribe(completedSpy);

    component.stream$ = of('# done');
    fixture.detectChanges();

    await wait(90);

    expect(statusSpy).toHaveBeenCalledWith('streaming');
    expect(statusSpy).toHaveBeenCalledWith('completed');
    expect(completedSpy).toHaveBeenCalledWith('# done');
  });

  it('should emit statusChange(error) and error event on stream failure', async () => {
    const statusSpy = jasmine.createSpy('statusSpy');
    const errorSpy = jasmine.createSpy('errorSpy');
    const source$ = new Subject<string>();

    component.statusChange.subscribe(statusSpy);
    component.error.subscribe(errorSpy);

    component.stream$ = source$.asObservable();
    fixture.detectChanges();

    const failure = new Error('stream failed');
    source$.error(failure);

    await wait(40);

    expect(statusSpy).toHaveBeenCalledWith('error');
    expect(errorSpy).toHaveBeenCalledWith(failure);
  });

  it('should reset state when stream$ switches quickly', async () => {
    const first$ = new Subject<string>();
    const second$ = new Subject<string>();

    component.stream$ = first$.asObservable();
    fixture.detectChanges();

    first$.next('# OLD');
    await wait(50);

    expect((component as any).rawContent()).toContain('# OLD');

    component.stream$ = second$.asObservable();
    component.ngOnChanges({
      stream$: new SimpleChange(first$.asObservable(), second$.asObservable(), false)
    });

    second$.next('# NEW');
    await wait(50);

    const raw = (component as any).rawContent() as string;
    expect(raw).toContain('# NEW');
    expect(raw).not.toContain('# OLD');
  });

  it('should close virtual-scroll loop from viewport scroll to visible window', () => {
    const blocks = Array.from({ length: 150 }, (_, index) => createParagraphBlock(index));
    const nextState: StreamingState = {
      blocks,
      currentBlock: null,
      rawContent: blocks.map((b) => b.content).join('\n')
    };

    (component as any).state.set(nextState);
    fixture.detectChanges();

    component.onViewportScroll({
      scrollTop: 1200,
      scrollHeight: 12000,
      clientHeight: 360
    });

    const window = (component as any).visibleWindow();

    expect(virtualScrollService.scrollTop()).toBe(1200);
    expect(virtualScrollService.viewportHeight()).toBe(360);
    expect(window.start).toBeGreaterThan(0);
    expect(window.end).toBeGreaterThanOrEqual(window.start);
  });

  it('should apply lazy highlight results into block signal/state', () => {
    const rawCodeBlock: MarkdownBlock = {
      id: 'code-1',
      type: BlockType.CODE_BLOCK,
      content: 'const x = 1;',
      rawContent: 'const x = 1;',
      isComplete: true,
      position: 0
    };

    const decorated = (component as any).decorateBlock(rawCodeBlock) as MarkdownBlock;
    (component as any).state.set({
      blocks: [decorated],
      currentBlock: null,
      rawContent: '```ts\nconst x = 1;\n```'
    } as StreamingState);

    const lines: CodeLine[] = [{ lineNumber: 1, tokens: [{ content: 'const x = 1;' }] }];
    (component as any).applyHighlightResult('code-1', lines);

    const block = (component as any).blocks()[0] as MarkdownBlock;
    expect(block.isHighlighted).toBe(true);
    expect(block.highlightResult?.()?.lines.length).toBe(1);
  });
});
