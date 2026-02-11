import { Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { EMPTY, Observable, concatMap, delay, from, of } from 'rxjs';
import { StreamingMarkdownComponent } from './streaming-markdown.component';
import { provideStreamingMarkdown } from './core/provide-streaming-markdown';
import { builtinPlugin } from './plugins/builtin-plugin';
import { CodeLine } from './core/models';
import { ShiniHighlighter } from './core/shini-highlighter';

const STREAMING_MARKDOWN = `## Streaming Code

\`\`\`typescript
const value = 1;
const nextValue = value + 1;
console.log(nextValue);
\`\`\`

Tail paragraph.
`;

@Component({
  selector: 'app-streaming-markdown-host',
  standalone: true,
  imports: [StreamingMarkdownComponent],
  template: `
    <app-streaming-markdown
      [stream$]="stream$"
      [enableLazyHighlight]="false"
      (completed)="completed = $event" />
  `
})
class StreamingMarkdownHostComponent {
  stream$: Observable<string> = EMPTY;
  completed = '';

  startStream(content: string, chunkSize: number = 24, delayMs: number = 70): void {
    const chunks: string[] = [];
    for (let cursor = 0; cursor < content.length; cursor += chunkSize) {
      chunks.push(content.slice(cursor, cursor + chunkSize));
    }

    this.stream$ = from(chunks).pipe(
      concatMap((chunk, index) => of(chunk).pipe(delay(index === 0 ? 0 : delayMs)))
    );
  }
}

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

describe('StreamingMarkdownComponent integration', () => {
  it('renders full code block after chunked streaming completes', async () => {
    await TestBed.configureTestingModule({
      imports: [StreamingMarkdownHostComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideStreamingMarkdown(builtinPlugin()),
        { provide: ShiniHighlighter, useClass: FakeShiniHighlighter }
      ]
    }).compileComponents();

    const fixture = TestBed.createComponent(StreamingMarkdownHostComponent);
    const host = fixture.componentInstance;

    host.startStream(STREAMING_MARKDOWN, 24, 70);
    fixture.detectChanges();

    await waitFor(() => host.completed.length > 0, 4000);
    fixture.detectChanges();

    const codeNodes = fixture.nativeElement.querySelectorAll('pre code');
    expect(codeNodes.length).toBeGreaterThan(0);

    const rendered = Array.from(codeNodes)
      .map((node: any) => node.textContent || '')
      .join('\n');

    expect(rendered).toContain('const value = 1;');
    expect(rendered).toContain('const nextValue = value + 1;');
    expect(rendered).toContain('console.log(nextValue);');
    expect(host.completed).toBe(STREAMING_MARKDOWN);
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

