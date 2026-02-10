# AI Chat 模块架构改进计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 修复 AI Chat 模块的现有功能问题，重构架构以提高可维护性

**Architecture:** 将消息显示逻辑统一到 SessionStateService，简化组件间通信，建立清晰的数据流

**Tech Stack:** Angular 20+, Signals, RxJS Observable, TypeScript

---

## 当前问题分析

### 问题 1: 会话重命名不生效
- **根因**: `SessionTabsBar.sessionRename` 事件在 `SessionChatContainer` 处断开
- **影响**: 通过标签栏右键菜单重命名会话失败

### 问题 2: 消息发送可能有异常
- **根因**: 流式响应 Observable 的类型和传递链路复杂
- **影响**: 发送消息后 AI 响应可能不显示

### 问题 3: 架构耦合导致修改困难
- **根因**: AiChatShell 职责过多，状态分散在两个服务中
- **影响**: 改一处影响多处

---

## 改进策略

### 阶段 1: 修复现有功能 (必须完成)
1. 修复会话重命名事件链
2. 修复流式响应显示
3. 确保基本功能可用

### 阶段 2: 简化数据流 (推荐)
1. 将流式响应状态移入 SessionStateService
2. 统一消息显示逻辑
3. 简化组件间通信

### 阶段 3: 优化架构 (可选)
1. 拆分 AiChatShell 职责
2. 引入布局服务
3. 改善类型安全

---

## 阶段 1: 修复现有功能

### Task 1: 修复会话重命名事件链

**问题描述**: `SessionTabsBar` 发出 `sessionRename` 事件，但 `SessionChatContainer` 没有转发

**Files:**
- Modify: `src/app/shared/ui/ai-chat/session-chat-container/session-chat-container.component.ts`
- Modify: `src/app/shared/ui/ai-chat/session-chat-container/session-chat-container.component.html`
- Modify: `src/app/shared/ui/ai-chat/ai-chat-shell/ai-chat-shell.component.html`

**Step 1: 在 SessionChatContainerComponent 添加 @Output**

```typescript
// 在 session-chat-container.component.ts 中添加
@Output()
readonly sessionRename = new EventEmitter<{ sessionId: string; newName: string }>();

@Output()
readonly sessionClose = new EventEmitter<string>();
```

**Step 2: 添加转发方法**

```typescript
protected onSessionRename(event: { sessionId: string; newName: string }): void {
  this.sessionRename.emit(event);
}

protected onSessionClose(sessionId: string): void {
  this.sessionClose.emit(sessionId);
}
```

**Step 3: 在模板中绑定事件**

```html
<!-- 在 session-chat-container.component.html 中修改 spark-session-tabs-bar -->
<spark-session-tabs-bar
  [sessions]="sessions"
  [activeSessionId]="activeSessionId"
  (sessionSelect)="onSessionSelect($event)"
  (sessionToggle)="onSessionToggle()"
  (newChat)="onNewChat()"
  (sessionColorChange)="onSessionColorChange($event)"
  (sessionRename)="onSessionRename($event)"
  (sessionClose)="onSessionClose($event)" />
```

**Step 4: 在 AiChatShell 中处理事件**

```html
<!-- 在 ai-chat-shell.component.html 中修改 app-session-chat-container -->
<app-session-chat-container
  ...
  (sessionRename)="onSessionRenameFromTabs($event)"
  (sessionClose)="onDelete($event)" />
```

```typescript
// 在 ai-chat-shell.component.ts 中添加
onSessionRenameFromTabs(data: { sessionId: string; newName: string }): void {
  this.sessionState.renameSession(data.sessionId, data.newName);
}
```

**Step 5: 测试**

1. 打开应用
2. 右键点击会话标签
3. 选择"重命名"
4. 输入新名称并确认
5. 验证会话名称已更新

**Step 6: Commit**

```bash
git add src/app/shared/ui/ai-chat/session-chat-container/
git add src/app/shared/ui/ai-chat/ai-chat-shell/
git commit -m "fix(ai-chat): connect session rename event chain from tabs to shell"
```

---

### Task 2: 修复流式响应显示

**问题描述**: streamingContent 的类型和传递链路复杂，可能导致显示异常

**Files:**
- Modify: `src/app/shared/ui/ai-chat/ai-chat-panel/ai-chat-panel.component.ts`
- Modify: `src/app/shared/ui/ai-chat/ai-chat-panel/ai-chat-panel.component.html`

**Step 1: 简化 streamingContent 类型处理**

```typescript
// 在 ai-chat-panel.component.ts 中
import { Observable, of, isObservable } from 'rxjs';

@Component({...})
export class AiChatPanelComponent {
  @Input({ required: true }) activeSession!: Signal<SessionData | null | undefined>;
  @Input() streamingContent: Observable<string> | string | null = null;
  @Input() previewWidth: number | null = null;
  @Input() panelWidth = 500;

  // ... 其他代码

  /** 统一获取流式 Observable */
  protected getStreamingStream(): Observable<string> | null {
    if (!this.streamingContent) return null;
    if (isObservable(this.streamingContent)) {
      return this.streamingContent;
    }
    return of(this.streamingContent);
  }
}
```

**Step 2: 简化模板中的条件渲染**

```html
<!-- 在 ai-chat-panel.component.html 中 -->
@if (getStreamingStream(); as stream) {
  <div class="flex justify-start">
    <div class="max-w-[85%] rounded-lg rounded-tl-sm bg-muted/50 border border-border/50 px-3 py-1.5">
      <app-streaming-markdown
        [stream$]="stream"
        [maxHeight]="'none'"
        [virtualScroll]="false" />
    </div>
  </div>
}
```

**Step 3: 确保 AiChatShell 正确创建流式 Observable**

```typescript
// 在 ai-chat-shell.component.ts 中验证
private startStreamingResponse(sessionId: string, userMessage: string): void {
  // ... 选择响应内容

  // 创建流式 Observable
  const stream$ = new Observable<string>(subscriber => {
    const chars = response.split('');
    let index = 0;
    const speed = 15; // ms per character

    const interval = setInterval(() => {
      if (index < chars.length) {
        subscriber.next(chars[index]);
        index++;
      } else {
        clearInterval(interval);
        subscriber.complete();
      }
    }, speed);

    return () => clearInterval(interval);
  });

  this.streamingResponse.set(stream$);

  // 订阅完成事件
  stream$.subscribe({
    complete: () => {
      this.sessionState.addMessage(sessionId, {
        id: `msg-ai-${Date.now()}`,
        role: 'assistant',
        content: response,
        timestamp: Date.now()
      });
      this.streamingResponse.set(null);
    },
    error: (err) => console.error('Streaming error:', err)
  });
}
```

**Step 4: 测试**

1. 打开应用
2. 在输入框输入消息
3. 点击发送
4. 验证 AI 响应以打字机效果逐字符显示
5. 验证响应完成后消息被保存到历史记录

**Step 5: Commit**

```bash
git add src/app/shared/ui/ai-chat/ai-chat-panel/
git add src/app/shared/ui/ai-chat/ai-chat-shell/
git commit -m "fix(ai-chat): simplify streaming content handling and display"
```

---

### Task 3: 确保面板关闭/打开功能正常

**Files:**
- Modify: `src/app/shared/ui/ai-chat/ai-chat-shell/ai-chat-shell.component.ts`
- Test: 手动测试

**Step 1: 验证面板状态管理**

```typescript
// 确保这些方法正确实现
onSessionToggle(): void {
  this.panelPreviewWidth.set(null);
  this.chatState.togglePanel();
}

onClosePanel(): void {
  this.panelPreviewWidth.set(null);
  this.chatState.closePanel();
}
```

**Step 2: 测试**

1. 点击会话标签 → 面板应打开
2. 点击活跃会话标签 → 面板应切换
3. 点击面板关闭按钮 → 面板应关闭
4. 点击新建会话 → 面板应打开

**Step 3: Commit (如果有修改)**

```bash
git commit -m "fix(ai-chat): ensure panel open/close works correctly"
```

---

## 阶段 2: 简化数据流 (推荐完成)

### Task 4: 将流式响应状态移入 SessionStateService

**目标**: 统一消息状态管理，避免在 Shell 中管理流式状态

**Files:**
- Modify: `src/app/shared/services/session-state.service.ts`
- Modify: `src/app/shared/ui/ai-chat/ai-chat-shell/ai-chat-shell.component.ts`

**Step 1: 在 SessionStateService 中添加流式响应状态**

```typescript
// 在 session-state.service.ts 中添加
export class SessionStateService {
  // ... 现有代码

  /** 当前正在流式传输的响应 */
  private readonly streamingResponse = signal<Observable<string> | null>(null);

  /** 获取流式响应 (只读) */
  readonly getStreamingResponse = computed(() => this.streamingResponse());

  /** 开始流式响应 */
  startStreaming(content$: Observable<string>): void {
    this.streamingResponse.set(content$);
  }

  /** 清除流式响应 */
  clearStreaming(): void {
    this.streamingResponse.set(null);
  }
}
```

**Step 2: 修改 AiChatShell 使用统一的状态**

```typescript
// 在 ai-chat-shell.component.ts 中
export class AiChatShellComponent {
  // ... 移除 private streamingResponse

  readonly streamingResponse = computed(() => this.sessionState.getStreamingResponse());

  private startStreamingResponse(sessionId: string, userMessage: string): void {
    // ... 创建 stream$

    this.sessionState.startStreaming(stream$);

    stream$.subscribe({
      complete: () => {
        this.sessionState.addMessage(sessionId, {
          id: `msg-ai-${Date.now()}`,
          role: 'assistant',
          content: response,
          timestamp: Date.now()
        });
        this.sessionState.clearStreaming();
      },
      error: (err) => {
        console.error('Streaming error:', err);
        this.sessionState.clearStreaming();
      }
    });
  }
}
```

**Step 3: Commit**

```bash
git add src/app/shared/services/session-state.service.ts
git add src/app/shared/ui/ai-chat/ai-chat-shell/
git commit -m "refactor(ai-chat): move streaming state to SessionStateService"
```

---

### Task 5: 简化组件通信 - 移除不必要的事件转发

**目标**: 减少中间组件的事件转发，让组件直接访问服务

**Files:**
- Modify: `src/app/shared/ui/ai-chat/session-chat-container/session-chat-container.component.ts`
- Modify: `src/app/shared/ui/ai-chat/session-chat-container/session-chat-container.component.html`
- Modify: `src/app/shared/ui/ai-chat/ai-chat-shell/ai-chat-shell.component.html`

**Step 1: 评估可移除的转发**

分析当前的事件链：
- `sessionRename`: SessionTabsBar → SessionChatContainer → AiChatShell → SessionStateService
- `sessionClose`: 类似路径
- `sessionColorChange`: 类似路径

**Step 2: 考虑直接注入服务**

对于简单操作，可以让子组件直接注入服务：

```typescript
// 在 SessionTabsBarComponent 中
constructor(private sessionState: SessionStateService) {}

renameSession(sessionId: string): void {
  // 直接调用服务，而不是 emit 事件
  const newName = prompt('输入新的会话名称:', this.session().name);
  if (newName && newName.trim()) {
    this.sessionState.renameSession(sessionId, newName.trim());
  }
}
```

**注意**: 这会增加组件与服务的耦合，需要权衡

**Step 3: 记录决策**

在代码中添加注释说明为什么保留/移除某个事件转发

---

## 阶段 3: 优化架构 (可选)

### Task 6: 创建布局服务

**目标**: 将布局计算逻辑从 AiChatShell 中分离

**Files:**
- Create: `src/app/shared/ui/ai-chat/services/ai-chat-layout.service.ts`
- Modify: `src/app/shared/ui/ai-chat/ai-chat-shell/ai-chat-shell.component.ts`

**Step 1: 创建布局服务**

```typescript
// ai-chat-layout.service.ts
@Injectable({ providedIn: 'root' })
export class AiChatLayoutService {
  readonly panelOpen = signal(false);
  readonly panelWidth = signal(500);
  readonly previewWidth = signal<number | null>(null);

  readonly effectivePanelWidth = computed(() => {
    const width = this.previewWidth() ?? this.panelWidth();
    return this.clampPanelWidth(width);
  });

  readonly mainContentStyle = computed(() => ({
    'padding-right': this.panelOpen() ? `${this.effectivePanelWidth() + 12}px` : '0'
  }));

  readonly sessionContainerStyle = computed(() => {
    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1920;
    const panelW = this.panelOpen() ? this.effectivePanelWidth() : 0;
    const mainContentWidth = viewportWidth - panelW - (this.panelOpen() ? 24 : 0);
    return {
      left: `${mainContentWidth / 2}px`,
      width: `${mainContentWidth * 0.4}px`
    };
  });

  private clampPanelWidth(width: number): number {
    return Math.max(300, Math.min(800, width));
  }
}
```

**Step 2: 在 AiChatShell 中使用布局服务**

```typescript
constructor(
  private layout: AiChatLayoutService,
  private chatState: AiChatStateService,
  private sessionState: SessionStateService
) {}

// 使用服务的计算属性，而不是在组件中计算
```

**Step 3: Commit**

```bash
git add src/app/shared/ui/ai-chat/services/
git commit -m "refactor(ai-chat): extract layout logic to dedicated service"
```

---

### Task 7: 改善类型安全

**目标**: 使用严格的类型定义，减少 any 类型

**Files:**
- Modify: `src/app/shared/ui/ai-chat/**/*.ts`

**Step 1: 定义事件载荷类型**

```typescript
// 创建 types/events.ts
export interface SessionRenameEvent {
  sessionId: string;
  name: string;
}

export interface SessionColorChangeEvent {
  sessionId: string;
  color: SessionColor;
}

export interface PanelResizeEvent {
  width: number;
}
```

**Step 2: 替换内联类型**

```typescript
// 替换前
@Output() readonly sessionRename = new EventEmitter<{ sessionId: string; name: string }>();

// 替换后
@Output() readonly sessionRename = new EventEmitter<SessionRenameEvent>();
```

---

## 测试清单

完成所有任务后，验证以下功能：

### 基本功能
- [ ] 新建会话
- [ ] 切换会话
- [ ] 删除会话
- [ ] 重命名会话（通过面板头部）
- [ ] 重命名会话（通过标签栏右键菜单）
- [ ] 修改会话颜色

### 消息功能
- [ ] 发送消息
- [ ] 查看 AI 流式响应
- [ ] 响应完成后保存到历史
- [ ] 切换会话后查看不同历史
- [ ] 输入草稿在会话间保持

### 面板功能
- [ ] 打开/关闭面板
- [ ] 调整面板宽度
- [ ] 面板宽度持久化

### 持久化
- [ ] 刷新页面后会话保持
- [ ] 刷新后面板宽度保持
- [ ] 刷新后活跃会话保持

---

## 回滚计划

如果改进过程中出现问题：

```bash
# 查看提交历史
git log --oneline

# 回滚到特定提交
git reset --hard <commit-hash>

# 或者创建备份分支
git branch backup-before-refactor
git checkout main
```

---

## 参考资料

- Angular Signals: https://angular.dev/guide/signals
- RxJS Observable: https://rxjs.dev/
- 项目架构文档: `docs/plans/2025-02-09-ai-chat-panel-implementation.md`
