# Streaming Markdown 快速接入指南

本指南目标：让调用方在 **10 分钟内**完成接入，并支持后续语法扩展。

## 1) 最小接入（推荐）

### 应用层 provider

```ts
import { ApplicationConfig } from '@angular/core';
import { provideDefaultStreamingMarkdown } from '@app/shared/components/streaming-markdown';

export const appConfig: ApplicationConfig = {
  providers: [
    provideDefaultStreamingMarkdown()
  ]
};
```

### 组件层使用

```ts
import { Component } from '@angular/core';
import {
  StreamingMarkdownComponent,
  fetchStreamToMarkdownStream$
} from '@app/shared/components/streaming-markdown';

@Component({
  standalone: true,
  imports: [StreamingMarkdownComponent],
  template: `<app-streaming-markdown [stream$]="stream$" />`
})
export class DemoComponent {
  stream$ = fetchStreamToMarkdownStream$('/api/chat/stream');
}
```

## 2) Stream Adapter（SSE / Fetch）

### SSE -> Observable<string>

```ts
import { sseToMarkdownStream$ } from '@app/shared/components/streaming-markdown';

const stream$ = sseToMarkdownStream$('/api/chat/sse');
```

### Fetch ReadableStream -> Observable<string>

```ts
import { fetchStreamToMarkdownStream$ } from '@app/shared/components/streaming-markdown';

const stream$ = fetchStreamToMarkdownStream$('/api/chat/stream', {
  request: {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: 'hello' })
  }
});
```

## 3) 语法扩展（不改 parser 主干）

通过 parser extension 插件扩展 token 处理，不需要修改 `block-parser.ts` 主体 `switch`。

```ts
import {
  BlockType,
  createParserExtensionPlugin,
  defineBlockParserExtension,
  provideDefaultStreamingMarkdown
} from '@app/shared/components/streaming-markdown';

const calloutExtension = defineBlockParserExtension({
  type: 'paragraph',
  match: (token) => typeof token.text === 'string' && token.text.startsWith(':::callout'),
  handler: ({ token, baseBlock }) => {
    const lines = String(token.text || '').split('\n');
    const body = lines.slice(1).join('\n').replace(/\n?:::\s*$/, '').trim();
    return {
      ...baseBlock,
      type: BlockType.CALLOUT,
      content: body
    };
  }
});

const calloutPlugin = createParserExtensionPlugin('callout', calloutExtension);

// appConfig.providers
provideDefaultStreamingMarkdown(calloutPlugin);
```

## 4) 常见错误

- `No provider for BLOCK_COMPONENT_REGISTRY`：未注册 `provideDefaultStreamingMarkdown()` 或 `provideStreamingMarkdown(...)`。
- `stream$` 无输出：后端未持续 flush chunk，或中间层缓冲（如反向代理）未关闭。
- 代码块高亮失败：语言未支持时会自动回退纯文本，建议保留默认错误处理。
- 自定义 block 不渲染：仅做 parser extension 会产出新 block type，需额外注册对应渲染组件映射。

## 5) 推荐配置

- provider：优先 `provideDefaultStreamingMarkdown()`，减少样板代码。
- 大文本渲染：保留组件默认 `virtualScroll=true` 与 `enableLazyHighlight=true`。
- 流式请求：优先使用 adapter 统一产出 `Observable<string>`，避免各调用方重复手写解析逻辑。
- 扩展策略：语法扩展走 `parserExtensions`，渲染扩展走 `components` 映射，职责清晰。

