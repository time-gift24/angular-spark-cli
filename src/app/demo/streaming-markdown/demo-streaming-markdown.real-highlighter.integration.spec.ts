import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { DemoStreamingMarkdownComponent } from './demo-streaming-markdown.component';
import { provideStreamingMarkdown } from '@app/shared/components/streaming-markdown/core/provide-streaming-markdown';
import { builtinPlugin } from '@app/shared/components/streaming-markdown/plugins/builtin-plugin';

describe('DemoStreamingMarkdownComponent real highlighter integration', () => {
  it('does not hang when starting stream with real highlighter', async () => {
    await TestBed.configureTestingModule({
      imports: [DemoStreamingMarkdownComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideStreamingMarkdown(builtinPlugin()),
      ]
    }).compileComponents();

    const fixture = TestBed.createComponent(DemoStreamingMarkdownComponent);
    const component = fixture.componentInstance as any;
    fixture.detectChanges();

    const startButton = fixture.nativeElement.querySelector('.btn.primary') as HTMLButtonElement | null;
    expect(startButton).toBeTruthy();

    startButton?.click();
    fixture.detectChanges();

    await waitFor(() => component.isStreaming === false, 10000);
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
