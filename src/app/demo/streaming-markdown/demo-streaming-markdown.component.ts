import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EMPTY, Observable, concatMap, delay, from, of, tap } from 'rxjs';
import { StreamingMarkdownComponent, builtinPlugin, provideStreamingMarkdownComponent } from '@app/shared/ui/streaming-markdown';
import { StaticMarkdownComponent } from '@app/shared/ui/ai-chat/static-markdown/static-markdown.component';

const DEMO_MARKDOWN = `# Streaming Markdown 对照演示

同一份 Markdown 同时用于：

- 左侧: 静态渲染一次性
- 右侧: 流式渲染分块输入

## Blockquote 内代码块

> 下面是 blockquote 内的 fenced code block:
>
> \`\`\`typescript
> const inQuote = true;
> function greet(name: string) {
>   return \`hello, \${name}\`;
> }
> \`\`\`

## 顶层代码块

\`\`\`typescript
interface User {
  id: string;
  name: string;
}

const users: User[] = [
  { id: 'u-1', name: 'Ada' },
  { id: 'u-2', name: 'Grace' }
];

console.log(users.map((u) => u.name).join(', '));
\`\`\`

## 其他元素

- 列表项 A
- 列表项 B

## 嵌套列表示例

- 父项 1
    - 子项 1.1
    - 子项 1.2
- 父项 2
    1. 子项 2.1
    2. 子项 2.2

| Key | Value |
|---|---|
| mode | demo |
| source | shared markdown |
`;

@Component({
  selector: 'app-demo-streaming-markdown',
  imports: [CommonModule, StreamingMarkdownComponent, StaticMarkdownComponent],
  providers: [
    provideStreamingMarkdownComponent(builtinPlugin()),
  ],
  templateUrl: './demo-streaming-markdown.component.html',
  styleUrl: './demo-streaming-markdown.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DemoStreamingMarkdownComponent {
  protected readonly markdownContent = DEMO_MARKDOWN;

  protected stream$: Observable<string> = EMPTY;
  protected isStreaming = false;
  protected enableLazyHighlight = true;

  protected startStreaming(): void {
    this.isStreaming = true;

    this.stream$ = this.createChunkedStream(this.markdownContent, 28, 18).pipe(
      tap({
        complete: () => {
          this.isStreaming = false;
        }
      })
    );
  }

  protected stopStreaming(): void {
    this.stream$ = EMPTY;
    this.isStreaming = false;
  }

  protected replayStreaming(): void {
    this.stopStreaming();
    this.startStreaming();
  }

  private createChunkedStream(content: string, chunkSize: number, delayMs: number): Observable<string> {
    const chunks: string[] = [];

    for (let cursor = 0; cursor < content.length; cursor += chunkSize) {
      chunks.push(content.slice(cursor, cursor + chunkSize));
    }

    return from(chunks).pipe(
      concatMap((chunk, index) => of(chunk).pipe(delay(index === 0 ? 0 : delayMs)))
    );
  }
}
