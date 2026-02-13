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
import { StreamingMarkdownComponent } from '@app/shared/ui/streaming-markdown';
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
    const response = this.getMockResponseForMessage(userMessage);
    const stream$ = this.createStreamingMarkdown$(response);

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

  private createStreamingMarkdown$(response: string): Observable<string> {
    return new Observable<string>((subscriber) => {
      const chunks = this.splitIntoChunks(response, 22);
      let index = 0;
      let timeoutId: ReturnType<typeof setTimeout> | null = null;

      const emitNext = () => {
        if (index >= chunks.length) {
          subscriber.complete();
          return;
        }

        subscriber.next(chunks[index]);
        index++;
        const delay = index <= 2 ? 35 : 50 + (index % 3) * 15;
        timeoutId = setTimeout(emitNext, delay);
      };

      timeoutId = setTimeout(emitNext, 40);

      return () => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
      };
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

  private getMockResponseForMessage(userMessage: string): string {
    const lower = userMessage.trim().toLowerCase();

    if (this.includesAny(lower, ['help', '帮助', '功能', '能做什么'])) {
      return this.getHelpMenuResponse();
    }

    if (this.includesAny(lower, ['hello', 'hi', '你好', '在吗'])) {
      return this.getGreetingResponse();
    }

    if (this.includesAny(lower, ['code', '代码', 'typescript', 'ts', 'javascript', 'js'])) {
      return this.getCodeExampleResponse();
    }

    if (this.includesAny(lower, ['table', '表格', '报表', 'dashboard', '看板'])) {
      return this.getTableExampleResponse();
    }

    if (this.includesAny(lower, ['plan', '方案', '架构', '设计'])) {
      return this.getPlanningResponse();
    }

    if (this.includesAny(lower, ['bug', '报错', 'error', '异常', 'debug'])) {
      return this.getDebugChecklistResponse();
    }

    if (this.includesAny(lower, ['release', 'changelog', '更新日志', '版本'])) {
      return this.getReleaseNotesResponse();
    }

    if (this.includesAny(lower, ['test', '测试', 'case', '用例'])) {
      return this.getTestCaseResponse();
    }

    if (!lower) {
      return this.getHelpMenuResponse();
    }

    return this.getContextualDefaultResponse(userMessage);
  }

  private includesAny(text: string, keywords: readonly string[]): boolean {
    return keywords.some((keyword) => text.includes(keyword));
  }

  private getHelpMenuResponse(): string {
    return `# Mock Streaming 已启用

你发送消息后，我会返回 **Markdown 流式回复**。

## 可用触发词

| 触发词 | 返回内容 |
| --- | --- |
| \`code\` / \`代码\` | 代码片段示例 |
| \`table\` / \`表格\` | 表格数据示例 |
| \`plan\` / \`方案\` | 实施方案模板 |
| \`bug\` / \`报错\` | 排查清单 |
| \`test\` / \`测试\` | 测试用例模板 |
| \`release\` / \`更新日志\` | 版本发布模板 |

## 直接测试

1. 输入：\`请给我一个 code 示例\`
2. 输入：\`做个 table\`
3. 输入：\`帮我写个 plan\``;
  }

  private getRichMarkdownResponse(): string {
    return `# 通用 Markdown 回复

这是默认 mock 回复，支持流式渲染。

## 重点

- 支持段落、列表、表格、代码块
- 支持长文本分片流式输出
- 支持关键词路由到不同模板

## 示例代码

\`\`\`typescript
type ReplyMode = 'code' | 'table' | 'plan' | 'debug' | 'default';

function pickMode(text: string): ReplyMode {
  if (text.includes('code')) return 'code';
  if (text.includes('table')) return 'table';
  return 'default';
}
\`\`\`

> 你可以试试输入：\`code\`、\`table\`、\`plan\`。`;
  }

  private getGreetingResponse(): string {
    return `# 你好

当前是 **Mock Streaming 模式**，适合联调消息流和 Markdown 渲染。

## 当前状态

- 输入任意内容都会返回 markdown
- 回复会以 chunk 形式逐步输出
- 完成后会落入会话消息列表

继续发一条消息试试看。`;
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

  private getPlanningResponse(): string {
    return `# 实施方案（Mock）

## 目标

将“发送消息 -> 返回 markdown streaming”稳定落地到聊天区。

## 任务拆分

1. 输入消息后立即写入用户气泡
2. 创建 mock markdown 响应模板
3. 以 chunk 流式输出到 streaming 区域
4. 完成后固化为 assistant 消息

## 风险与处理

| 风险 | 影响 | 处理 |
| --- | --- | --- |
| 分片切断代码块 | markdown 闪烁 | 断点避开 \`\`\`、\`**\`、链接括号 |
| 高频更新卡顿 | 滚动不顺滑 | 控制 chunk 大小与延迟 |
| 多次发送并发 | 状态错乱 | 新请求前清理旧流状态 |`;
  }

  private getDebugChecklistResponse(): string {
    return `# 排查清单（Mock）

## 快速检查

- [ ] 是否调用了 \`setStreamingResponse(stream$)\`
- [ ] \`stream$\` 是否有 \`next\` 与 \`complete\`
- [ ] complete 时是否写回 assistant 消息
- [ ] error 时是否清空 streaming 状态

## 建议日志点

\`\`\`text
[chat] onSend
[chat] stream next chunk
[chat] stream complete
[chat] persist assistant message
\`\`\`

## 常见原因

1. chunk 太大导致“看起来不像 streaming”
2. 分片间隔太短导致瞬间完成
3. 组件销毁后订阅未清理`;
  }

  private getReleaseNotesResponse(): string {
    return `# Release Notes（Mock）

## v0.1.0

### Added

- 新增 markdown 模板回复（code/table/plan/debug/test）
- 新增关键词路由逻辑
- 新增流式分片节奏控制

### Changed

- 默认回复从固定文本改为上下文化模板
- chunk 发送从固定间隔改为轻微节奏变化

### Validation

- development build 通过
- 手动发送消息可观测 streaming 效果`;
  }

  private getTestCaseResponse(): string {
    return `# 测试用例（Mock）

## 功能用例

| 编号 | 输入 | 预期 |
| --- | --- | --- |
| TC-01 | \`code\` | 返回包含代码块的 markdown streaming |
| TC-02 | \`table\` | 返回包含表格的 markdown streaming |
| TC-03 | \`plan\` | 返回结构化方案 markdown |
| TC-04 | 空输入 | 不发送，不触发 streaming |

## 体验用例

1. 连续快速发送 3 条消息，确认 UI 不错乱
2. 切换 session 后发送，确认回复写入当前会话
3. 等待 streaming 完成，确认最终消息被固化`;
  }

  private getContextualDefaultResponse(userMessage: string): string {
    return `# 已收到你的消息

> ${userMessage}

这是一个 **mock markdown streaming** 回复，用于联调界面与渲染逻辑。

## 我理解的意图

1. 你希望发送后立即看到流式输出
2. 输出内容需要是 markdown（而非纯文本）
3. 最终内容应落盘到当前会话

## 下一步建议

- 如果你要看代码渲染，发：\`code\`
- 如果你要看表格渲染，发：\`table\`
- 如果你要看结构化文档，发：\`plan\``;
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
