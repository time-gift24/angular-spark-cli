# Streaming Markdown 错误处理示范

下面给一个“可直接复制”的统一错误处理器示例。

## 1) 自定义 ErrorHandler

```ts
import { Injectable } from '@angular/core';
import {
  ComponentErrorType,
  type ErrorInput,
  type IErrorHandler,
  type ErrorHandlerResult,
  BlockType,
  type MarkdownBlock
} from '@app/shared/components/streaming-markdown';

@Injectable({ providedIn: 'root' })
export class AppStreamingErrorHandler implements IErrorHandler {
  handle(error: ErrorInput): ErrorHandlerResult {
    const code = this.getCode(error);

    const result: ErrorHandlerResult = {
      handled: true,
      action: 'fallback_to_plain_text',
      shouldLog: true,
      logLevel: code === ComponentErrorType.INVALID_INPUT ? 'warn' : 'error'
    };

    console.error('[AppStreamingErrorHandler]', error);
    return result;
  }

  createFallback(content: string): MarkdownBlock;
  createFallback(error: ErrorInput, code: string): string;
  createFallback(input: string | ErrorInput, code?: string): MarkdownBlock | string {
    if (typeof input === 'string') {
      return {
        id: `fallback-${Date.now()}`,
        type: BlockType.PARAGRAPH,
        content: input,
        isComplete: true,
        position: 0
      };
    }

    const raw = code ?? '';
    return raw
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  isRecoverable(error: ErrorInput): boolean {
    const code = this.getCode(error);
    return code !== ComponentErrorType.INVALID_INPUT;
  }

  private getCode(error: ErrorInput): string {
    return 'type' in error ? error.type : error.code;
  }
}
```

## 2) 在组件里使用

如果你有自己的 code block 组件或包装层，按统一类型传入 `ErrorInput` 即可：

```ts
this.errorHandler.handle({
  type: ComponentErrorType.HIGHLIGHT_FAILED,
  message: 'Failed to highlight code',
  originalError: err,
  context: { lang: 'typescript' }
});
```

## 3) 推荐实践

- 统一从 `@app/shared/components/streaming-markdown` 导入错误类型。
- `handle()` 始终返回结构化 `ErrorHandlerResult`，便于后续埋点。
- `createFallback(error, code)` 只做“安全降级输出”，不要抛异常。

