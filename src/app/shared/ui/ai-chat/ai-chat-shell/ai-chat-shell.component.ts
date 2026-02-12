import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { SessionColor } from '@app/shared/models';
import { SessionStateService } from '@app/shared/services';
import { StreamingMarkdownComponent } from '@app/shared/components/streaming-markdown';
import { AiChatStateService } from '../services';
import { SessionTabsBarComponent } from '../session-tabs-bar/session-tabs-bar.component';
import { ChatInputComponent } from '../chat-input/chat-input.component';
import { MessageBubbleComponent } from '../message-bubble/message-bubble.component';
import { ResizeHandleComponent } from '../resize-handle/resize-handle.component';
import { DeleteConfirmDialogComponent } from '../delete-confirm-dialog/delete-confirm-dialog.component';

const DOCK_MIN_WIDTH = 320;
const DOCK_MAX_WIDTH = 520;

@Component({
  selector: 'ai-chat-shell',
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    SessionTabsBarComponent,
    ChatInputComponent,
    MessageBubbleComponent,
    ResizeHandleComponent,
    StreamingMarkdownComponent,
    DeleteConfirmDialogComponent,
  ],
  templateUrl: './ai-chat-shell.component.html',
  styleUrl: './ai-chat-shell.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AiChatShellComponent {
  private readonly chatState = inject(AiChatStateService);
  private readonly sessionState = inject(SessionStateService);

  constructor() {
    effect(() => {
      const sessions = this.sessionState.sessions();
      if (sessions.size === 0) {
        this.sessionState.createSession('新建对话');
      }
    });
  }

  readonly dockMode = this.chatState.dockMode;
  readonly dockWidth = this.chatState.dockWidth;
  readonly dockPreviewWidth = signal<number | null>(null);
  readonly isDockPinned = computed(() => this.dockMode() === 'pinned');

  readonly effectiveDockWidth = computed(() => {
    const width = this.dockPreviewWidth() ?? this.dockWidth();
    return this.clampDockWidth(width);
  });

  readonly sessions = this.sessionState.sessions;
  readonly activeSessionId = this.sessionState.activeSessionId;
  readonly activeSession = this.sessionState.activeSession;
  readonly activeMessages = this.sessionState.activeMessages;
  readonly currentInputValue = this.sessionState.activeInputValue;
  readonly streamingResponse = this.sessionState.streamingResponse;

  readonly deleteDialogOpen = signal(false);
  readonly sessionToDelete = signal<string | null>(null);
  readonly sessionToDeleteName = computed(() => {
    const id = this.sessionToDelete();
    return id ? this.sessions().get(id)?.name ?? '' : '';
  });

  onToggleDock(): void {
    this.dockPreviewWidth.set(null);
    this.chatState.toggleDockMode();
  }

  onOpenDock(): void {
    this.dockPreviewWidth.set(null);
    this.chatState.setDockMode('pinned');
  }

  onNewChat(): void {
    this.sessionState.createSession();
    this.chatState.setDockMode('pinned');
  }

  onSessionSelect(sessionId: string): void {
    this.sessionState.switchSession(sessionId);
    this.chatState.setDockMode('pinned');
  }

  onSessionToggle(): void {
    this.onToggleDock();
  }

  onSend(message: string): void {
    const sessionId = this.activeSessionId();
    if (!sessionId) {
      return;
    }

    this.chatState.setDockMode('pinned');

    this.sessionState.addMessage(sessionId, {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: Date.now(),
    });

    this.startStreamingResponse(sessionId, message);
  }

  private startStreamingResponse(sessionId: string, userMessage: string): void {
    const mockResponses: Record<string, string> = {
      default: this.getRichMarkdownResponse(),
      hello: this.getGreetingResponse(),
      code: this.getCodeExampleResponse(),
      table: this.getTableExampleResponse(),
    };

    let response = mockResponses['default'];
    const lowerMessage = userMessage.toLowerCase();

    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('你好')) {
      response = mockResponses['hello'];
    } else if (lowerMessage.includes('code') || lowerMessage.includes('代码')) {
      response = mockResponses['code'];
    } else if (lowerMessage.includes('table') || lowerMessage.includes('表格')) {
      response = mockResponses['table'];
    }

    const stream$ = new Observable<string>((subscriber) => {
      const chunkSize = 20;
      const chunks = this.splitIntoChunks(response, chunkSize);
      let index = 0;
      const delay = 50;

      const interval = setInterval(() => {
        if (index < chunks.length) {
          subscriber.next(chunks[index]);
          index++;
        } else {
          clearInterval(interval);
          subscriber.complete();
        }
      }, delay);

      return () => clearInterval(interval);
    });

    this.sessionState.setStreamingResponse(stream$);

    stream$.subscribe({
      next: () => {
        // streaming content is rendered by StreamingMarkdownComponent
      },
      error: () => {
        this.sessionState.setStreamingResponse(null);
      },
      complete: () => {
        this.sessionState.addMessage(sessionId, {
          id: `msg-ai-${Date.now()}`,
          role: 'assistant',
          content: response,
          timestamp: Date.now(),
        });
        this.sessionState.setStreamingResponse(null);
      },
    });
  }

  private splitIntoChunks(text: string, chunkSize: number): string[] {
    const chunks: string[] = [];
    let remaining = text;

    while (remaining.length > 0) {
      if (remaining.length <= chunkSize) {
        chunks.push(remaining);
        break;
      }

      let breakPoint = chunkSize;
      const lastNewline = remaining.lastIndexOf('\n', chunkSize);
      if (lastNewline > chunkSize * 0.5) {
        breakPoint = lastNewline + 1;
      } else {
        const lastSpace = remaining.lastIndexOf(' ', chunkSize);
        if (lastSpace > chunkSize * 0.5) {
          breakPoint = lastSpace + 1;
        }
      }

      breakPoint = this.adjustBreakPointForMarkers(remaining, breakPoint);
      chunks.push(remaining.substring(0, breakPoint));
      remaining = remaining.substring(breakPoint);
    }

    return chunks;
  }

  private adjustBreakPointForMarkers(text: string, breakPoint: number): number {
    const candidate = text.substring(0, breakPoint);
    let adjusted = breakPoint;

    const backtickCount = (candidate.match(/```/g) || []).length;
    if (backtickCount % 2 !== 0) {
      const fenceEnd = text.indexOf('```', breakPoint);
      if (fenceEnd !== -1 && fenceEnd < breakPoint + 500) {
        adjusted = fenceEnd + 3;
      }
    }

    const boldCount = (candidate.match(/\*\*/g) || []).length;
    if (boldCount % 2 !== 0) {
      const boldEnd = text.indexOf('**', breakPoint);
      if (boldEnd !== -1 && boldEnd < breakPoint + 50) {
        adjusted = Math.max(adjusted, boldEnd + 2);
      }
    }

    const openBrackets = (candidate.match(/\[/g) || []).length;
    const closeBrackets = (candidate.match(/\]/g) || []).length;
    if (openBrackets > closeBrackets) {
      const linkEnd = text.indexOf(']', breakPoint);
      if (linkEnd !== -1 && linkEnd < breakPoint + 100) {
        const parenEnd = text.indexOf(')', linkEnd);
        if (parenEnd !== -1 && parenEnd < breakPoint + 150) {
          adjusted = Math.max(adjusted, parenEnd + 1);
        }
      }
    }

    return adjusted;
  }

  private getRichMarkdownResponse(): string {
    return `# 欢迎使用 AI Chat

这是一个展示 **丰富 Markdown** 功能的示例回复。

## 文本格式化

支持 *斜体*、**粗体**、***粗斜体***、~~删除线~~ 和 \`行内代码\`。

## 代码高亮

\`\`\`typescript
interface User {
  id: string;
  name: string;
  email: string;
}

async function fetchUser(id: string): Promise<User> {
  const response = await fetch(\`/api/users/\${id}\`);
  return response.json();
}
\`\`\`

## 列表

### 无序列表
- 第一项
- 第二项
  - 嵌套项 A
  - 嵌套项 B
- 第三项

### 有序列表
1. 步骤一
2. 步骤二
3. 步骤三

## 引用

> 这是一段引用文本。
>
> 可以包含多行，甚至包含其他 **markdown** 元素。

## 链接

访问 [Angular 文档](https://angular.dev) 了解更多信息。

## 数学公式

行内公式：$E = mc^2$

块级公式：
$$
\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}
$$

---

希望这个示例能帮助你了解 Markdown 的各种功能！`;
  }

  private getGreetingResponse(): string {
    return `# 👋 你好！

很高兴见到你！我是你的 AI 助手。

## 我可以帮助你

| 功能 | 描述 |
|------|------|
| 💬 问答 | 回答你的各种问题 |
| 📝 写作 | 协助撰写文档、邮件等 |
| 💻 编程 | 帮助编写和调试代码 |
| 📊 分析 | 分析数据和提供见解 |

---

试试问："**给我一个代码示例**" 或 "**展示表格功能**"`;
  }

  private getCodeExampleResponse(): string {
    return `# 代码示例

这里是一些常用的代码片段：

## TypeScript / JavaScript

\`\`\`typescript
import { Component, signal, computed } from '@angular/core';

@Component({
  selector: 'app-counter',
  template: \`
    <div>
      <p>Count: {{ count() }}</p>
      <p>Double: {{ doubleCount() }}</p>
      <button (click)="increment()">+1</button>
    </div>
  \`
})
export class CounterComponent {
  count = signal(0);
  doubleCount = computed(() => this.count() * 2);

  increment() {
    this.count.update(v => v + 1);
  }
}
\`\`\`

## Python

\`\`\`python
from dataclasses import dataclass
from typing import List

@dataclass
class User:
    id: int
    name: str
    email: str

class UserManager:
    def __init__(self):
        self.users: List[User] = []

    def add_user(self, user: User) -> None:
        self.users.append(user)

    def find_by_id(self, user_id: int) -> User | None:
        return next((u for u in self.users if u.id == user_id), None)
\`\`\`

## CSS

\`\`\`css
.card {
  background: linear-gradient(135deg, var(--primary) 0%, var(--chart-2) 100%);
  border-radius: 12px;
  padding: 24px;
  box-shadow: var(--shadow-control-hover);
  transition: transform 0.3s ease;
}

.card:hover {
  transform: translateY(-4px);
}
\`\`\`

---

需要更多代码示例吗？`;
  }

  private getTableExampleResponse(): string {
    return `# Markdown 表格示例

## 简单表格

| 姓名 | 年龄 | 职业 |
|------|------|------|
| 张三 | 28 | 工程师 |
| 李四 | 32 | 设计师 |
| 王五 | 25 | 产品经理 |

## 对齐表格

| 左对齐 | 居中对齐 | 右对齐 |
|:-------|:--------:|-------:|
| 内容 1 | 内容 2 | 内容 3 |
| A | B | C |

## API 接口文档表格

| 方法 | 路径 | 描述 | 参数 |
|------|------|------|------|
| GET | /api/users | 获取用户列表 | page, limit |
| POST | /api/users | 创建新用户 | name, email |
| PUT | /api/users/:id | 更新用户 | name, email |
| DELETE | /api/users/:id | 删除用户 | - |

## 价格对比表

| 套餐 | 价格 | 存储空间 | 功能 |
|:-----|------:|:--------|------|
| 免费 | ¥0/月 | 5 GB | 基础功能 |
| 专业 | ¥99/月 | 100 GB | + 高级分析 |
| 企业 | ¥499/月 | 1 TB | + 定制支持 |

---

Markdown 表格让数据展示更清晰！`;
  }

  onInputChange(value: string): void {
    this.sessionState.updateInputValue(value);
  }

  onSessionRenameFromTabs(data: { sessionId: string; newName: string }): void {
    this.sessionState.renameSession(data.sessionId, data.newName);
  }

  onDelete(sessionId: string): void {
    const session = this.sessions().get(sessionId);
    if (!session) {
      return;
    }

    this.sessionToDelete.set(sessionId);
    this.deleteDialogOpen.set(true);
  }

  onConfirmDelete(): void {
    const sessionId = this.sessionToDelete();
    if (sessionId) {
      this.sessionState.deleteSession(sessionId);
      if (!this.activeSession()) {
        this.sessionState.createSession('新建对话');
      }
    }

    this.deleteDialogOpen.set(false);
    this.sessionToDelete.set(null);
  }

  onCancelDelete(): void {
    this.deleteDialogOpen.set(false);
    this.sessionToDelete.set(null);
  }

  onResizePreview(width: number): void {
    if (!Number.isFinite(width)) {
      return;
    }
    this.dockPreviewWidth.set(this.clampDockWidth(width));
  }

  onResizeCommit(width: number): void {
    if (!Number.isFinite(width)) {
      return;
    }

    this.dockPreviewWidth.set(null);
    this.chatState.setDockWidth(width);
  }

  private clampDockWidth(width: number): number {
    return Math.max(DOCK_MIN_WIDTH, Math.min(DOCK_MAX_WIDTH, width));
  }

  onSessionColorChange(event: { sessionId: string; color: SessionColor }): void {
    this.sessionState.updateSessionColor(event.sessionId, event.color);
  }
}
