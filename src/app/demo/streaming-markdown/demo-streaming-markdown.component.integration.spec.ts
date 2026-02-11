import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { DemoStreamingMarkdownComponent } from './demo-streaming-markdown.component';
import { provideStreamingMarkdown } from '@app/shared/components/streaming-markdown/core/provide-streaming-markdown';
import { builtinPlugin } from '@app/shared/components/streaming-markdown/plugins/builtin-plugin';
import { ShiniHighlighter } from '@app/shared/components/streaming-markdown/core/shini-highlighter';
import { CodeLine } from '@app/shared/components/streaming-markdown/core/models';

class FakeShiniHighlighter {
  async initialize(): Promise<void> {
    return;
  }

  async whenReady(): Promise<void> {
    return;
  }

  async highlightToTokens(code: string): Promise<CodeLine[]> {
    return code.split('\n').map((line, index) => ({
      lineNumber: index + 1,
      tokens: [{ content: line }]
    }));
  }

  plainTextFallback(code: string): CodeLine[] {
    return code.split('\n').map((line, index) => ({
      lineNumber: index + 1,
      tokens: [{ content: line }]
    }));
  }
}

describe('DemoStreamingMarkdownComponent integration', () => {
  it('keeps page responsive after clicking start streaming', async () => {
    await TestBed.configureTestingModule({
      imports: [DemoStreamingMarkdownComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideStreamingMarkdown(builtinPlugin()),
        { provide: ShiniHighlighter, useClass: FakeShiniHighlighter }
      ]
    }).compileComponents();

    const fixture = TestBed.createComponent(DemoStreamingMarkdownComponent);
    const component = fixture.componentInstance as any;

    fixture.detectChanges();

    const startButton = fixture.nativeElement.querySelector('.btn.primary') as HTMLButtonElement | null;
    expect(startButton).toBeTruthy();

    startButton?.click();
    fixture.detectChanges();

    expect(component.isStreaming).toBe(true);
    await waitFor(() => component.isStreaming === false, 5000);
    fixture.detectChanges();

    const routers = fixture.nativeElement.querySelectorAll('app-markdown-block-router');
    expect(routers.length).toBeGreaterThan(0);
  });
});

async function waitFor(predicate: () => boolean, timeoutMs: number): Promise<void> {
  const start = Date.now();

  while (!predicate()) {
    if (Date.now() - start >= timeoutMs) {
      throw new Error('Timed out waiting for condition');
    }
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
}
