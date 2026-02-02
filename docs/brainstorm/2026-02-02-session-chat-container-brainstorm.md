# SessionChatContainer 组件设计文档

**日期**: 2026-02-02
**设计师**: Claude Sonnet
**主题**: 组合 SessionTabsBar 和 ChatInput 的纯展示组件

---

## 1. 设计背景与目标

### 原始需求

将 `SessionTabsBar` 和 `ChatInput` 两个独立组件组合成一个统一的容器组件：

1. **组合展示** - 将两个组件垂直布局，形成整体 UI
2. **事件转发** - 将核心事件（new-chat, tab 点击）抛给外层
3. **限制逻辑** - 限制最大 tab 个数为 5 个，超出时关闭最不活跃的会话
4. **状态管理** - 完全由父组件管理所有状态

### 设计决策

| 决策点 | 选择 | 理由 |
|--------|------|------|
| 组件类型 | **纯展示组件** | 最简洁，完全可预测，易测试 |
| 状态管理 | **完全由父组件管理** | 单向数据流，符合 Angular 最佳实践 |
| Tab 限制逻辑 | **由父组件实现** | 保持组件纯粹，逻辑可复用 |
| 关闭策略 | **关闭最不活跃的会话** | 用户体验最优，保留活跃会话 |

---

## 2. 架构设计

### 组件架构图

```
┌─────────────────────────────────────────────┐
│        SessionChatContainerComponent        │
│         (纯展示组合组件)                     │
│                                              │
│  ┌──────────────────────────────────────┐  │
│  │    SessionTabsBar (复用)             │  │
│  │    - 展示会话标签                    │  │
│  │    - 内部管理交互细节                │  │
│  └──────────────────────────────────────┘  │
│                    ↓                         │
│  ┌──────────────────────────────────────┐  │
│  │    ChatInput (复用)                  │  │
│  │    - 仅在 isOpen=true 时显示         │  │
│  │    - 双向绑定输入值                  │  │
│  └──────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
          ↓ Events                ↑ State
    父组件监听并处理         父组件传入所有状态
```

### 数据流向

```
父组件
  ↓ @Input
  - sessions: Map<string, SessionData>
  - activeSessionId: string
  - isOpen: boolean
  - inputValue: string
  - placeholder: string
  - disabled: boolean

SessionChatContainer
  ↓ 转发给子组件
  ├─→ SessionTabsBar (接收 sessions, activeSessionId)
  └─→ ChatInput (接收 inputValue, placeholder, disabled)

用户交互
  ↓ @Output 向上冒泡
  - newChat → 父组件处理（检查5个限制，关闭最旧的）
  - sessionSelect → 父组件更新 activeSessionId
  - sessionToggle → 父组件更新 isOpen
  - send → 父组件处理消息发送
```

---

## 3. 组件接口设计

### Inputs（状态输入）

```typescript
// 会话相关
@Input() sessions: Map<string, SessionData>        // 所有会话数据
@Input() activeSessionId: string                   // 当前激活会话 ID

// 面板状态
@Input() isOpen: boolean                           // Tab 面板展开状态

// 输入框相关
@Input() inputValue: string                        // 输入框值（双向绑定）
@Input() placeholder: string = 'Ask AI anything...' // 占位符
@Input() disabled: boolean = false                 // 禁用状态

// 样式相关（可覆盖）
@Input() containerClass?: string                   // 自定义容器类名
@Input() tabsWrapperClass?: string                 // Tab 栏容器类名
@Input() inputWrapperClass?: string                // 输入框容器类名
@Input() maxTabs: number = 5                       // 最大 tab 数（仅提示，不强制）
```

### Outputs（核心事件）

```typescript
// 会话管理事件
@Output() newChat = new EventEmitter<void>()           // 新建会话
@Output() sessionSelect = new EventEmitter<string>()   // 选择会话（传入 sessionId）
@Output() sessionToggle = new EventEmitter<void>()     // 展开/收起面板

// 消息事件
@Output() send = new EventEmitter<string>()            // 发送消息（传入消息内容）

// 输入事件（双向绑定支持）
@Output() inputValueChange = new EventEmitter<string>() // 输入值变化
```

---

## 4. 样式与布局设计

### Tailwind CSS 优先策略

**核心原则**: Utility-First + 完全可覆盖

```html
<!-- 主容器 - 使用 Tailwind utility 作为默认值 -->
<div class="flex flex-col w-full gap-2 {containerClass()}">

  <!-- Tab 栏容器 - 可覆盖 -->
  <div class="w-full {tabsWrapperClass()}">
    <spark-session-tabs-bar ... />
  </div>

  <!-- 输入框容器 - 条件渲染 + Tailwind 过渡 -->
  @if (isOpen()) {
    <div class="w-full transition-all duration-200 ease-out {inputWrapperClass()}">
      <ai-chat-input ... />
    </div>
  }
</div>
```

### 默认 Tailwind 样式

```typescript
// 在组件中定义默认样式（可被父组件覆盖）
protected defaultContainerClass = 'flex flex-col w-full gap-2';
protected defaultTabsWrapperClass = 'w-full';
protected defaultInputWrapperClass = 'w-full transition-all duration-200 ease-out';
```

### 父组件使用示例

```html
<!-- 完全自定义样式 -->
<app-session-chat-container
  containerClass="flex flex-col w-2/5 gap-4 p-4 bg-background rounded-lg border"
  tabsWrapperClass="sticky top-0 z-10"
  inputWrapperClass="transition-all duration-300 ease-in-out"
  [sessions]="sessions"
  [activeSessionId]="activeSessionId"
  [isOpen]="isOpen"
  (newChat)="onNewChat()"
/>
```

### CSS 文件职责

**组件 CSS 文件只包含**:
1. 自定义动画（Tailwind 默认不支持的复杂动画）
2. 特定主题效果（如 liquid-glass 特效）

```css
/* session-chat-container.component.css */

/* 只放 Tailwind 无法实现的效果 */
@layer components {
  .custom-slide-in {
    animation: slideIn 0.2s ease-out;
  }

  @keyframes slideIn {
    from {
      transform: translateY(-10px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
}

/* ❌ 不要在这里写布局样式，应该用 Tailwind utility */
```

### 响应式设计

```typescript
// 父组件通过 Tailwind 实现响应式
containerClass="flex flex-col w-full gap-2
                lg:w-2/5 lg:gap-4 lg:p-4"
```

---

## 5. 事件流处理逻辑

### 事件转发策略

```
用户点击"新建对话"
    ↓
SessionTabsBar 触发 newChat 事件
    ↓
SessionChatContainer 转发（不做任何处理）
    ↓
父组件接收 newChat 事件
    ↓
父组件逻辑：
    1. 检查当前 sessions 数量
    2. 如果 ≥ 5，找到最不活跃的会话
    3. 删除该会话
    4. 创建新会话
    5. 更新 sessions
```

### 事件映射表

| 子组件事件 | 容器组件转发 | 父组件处理 |
|-----------|-------------|-----------|
| `SessionTabsBar.newChat` | → `newChat` | 实现 5 个限制 + 关闭最旧 |
| `SessionTabsBar.sessionSelect` | → `sessionSelect` | 更新 activeSessionId |
| `SessionTabsBar.sessionToggle` | → `sessionToggle` | 更新 isOpen 状态 |
| `ChatInput.send` | → `send` | 发送消息到 AI |
| `ChatInput.valueChange` | → `inputValueChange` | 保存输入草稿到 session |

### 不转发的事件

```
SessionTabsBar 的辅助事件（暂不转发）：
- sessionRename      → 父组件直接处理 SessionTabsBar
- sessionColorChange → 父组件直接处理 SessionTabsBar
- sessionClose       → 父组件直接处理 SessionTabsBar

ChatInput 的工具栏事件（暂不转发）：
- fileClick          → 未来需要时再添加
- imageClick         → 未来需要时再添加
- voiceClick         → 未来需要时再添加
```

### 双向绑定处理

```
inputValue 的双向绑定逻辑：

父组件
  ↓ 传入 @Input inputValue
SessionChatContainer
  ↓ 传递给 ChatInput [value]
ChatInput
  ↓ 触发 (valueChange)
SessionChatContainer
  ↓ 转发 (inputValueChange)
父组件
  ↓ 更新 inputValue signal
自动触发重新渲染
```

### 条件渲染逻辑

```
isOpen 状态变化时：

if (isOpen === true) {
  显示 ChatInput
  → 触发 slide-in 动画
  → 自动聚焦到输入框（可选）
}

if (isOpen === false) {
  隐藏 ChatInput
  → 触发 fade-out 动画
  → 不销毁组件（保持状态）
}
```

---

## 6. 错误处理与边界情况

### 输入验证（父组件职责）

```typescript
// SessionChatContainer 不做验证，只转发
// 父组件需要处理的边界情况：

1. sessions 为空
   → 显示空状态提示
   → 禁用输入框

2. activeSessionId 无效
   → 自动选择第一个可用 session
   → 或显示错误提示

3. inputValue 超长
   → 父组件限制长度
   → 或显示字符计数

4. 快速点击 newChat
   → 父组件实现防抖
   → 避免创建重复会话
```

### 边界情况处理

| 场景 | 处理方式 | 责任方 |
|------|---------|--------|
| 关闭最后一个 tab | 阻止关闭，显示提示 | 父组件 |
| 创建第 6 个 tab | 关闭最不活跃，创建新会话 | 父组件 |
| 切换到已关闭的 tab | 重置 activeSessionId | 父组件 |
| 网络错误发送失败 | 保留输入内容，显示错误 | 父组件 |

### 组件内部保护

```typescript
// SessionChatContainer 内部最小保护

1. 确保 inputs 有默认值
   - placeholder: 'Ask AI anything...'
   - disabled: false
   - maxTabs: 5

2. EventEmitter 安全性
   - new EventEmitter<void>()
   - 确保不会 emit undefined

3. 不依赖外部服务
   - 纯展示组件，无副作用
```

---

## 7. 测试策略

### 单元测试重点

```typescript
describe('SessionChatContainerComponent', () => {

  ✅ 组件渲染
  ✅ 条件渲染（isOpen 控制显示）
  ✅ 事件正确转发
  ✅ 双向绑定正常工作
  ✅ 默认值正确

});
```

### 集成测试场景

```typescript
describe('SessionChatContainer Integration', () => {

  场景 1: 新建会话流程
  场景 2: 超限处理（5 个 tab）
  场景 3: 面板展开/收起
  场景 4: 发送消息 + 草稿保存

});
```

### 测试覆盖率目标

```
- 语句覆盖率：> 80%
- 分支覆盖率：> 75%
- 函数覆盖率：> 90%
- 行覆盖率：> 80%

关键路径：
✅ 事件转发：100% 覆盖
✅ 条件渲染：100% 覆盖
✅ 双向绑定：100% 覆盖
```

---

## 8. Future/Divergent Ideas

### Parking Lot（未来扩展）

#### 1. 辅助事件转发（优先级：中）

**需求**: 父组件可能需要更多事件

**实现**:
```typescript
@Output() sessionRename = new EventEmitter<{sessionId: string, newName: string}>()
@Output() sessionColorChange = new EventEmitter<{sessionId: string, color: SessionColor}>()
@Output() sessionClose = new EventEmitter<string>()
@Output() fileClick = new EventEmitter<void>()
@Output() imageClick = new EventEmitter<void>()
@Output() voiceClick = new EventEmitter<void>()
```

**时机**: 当实际使用场景需要时再添加

---

#### 2. 内部状态管理（优先级：低）

**需求**: 简化父组件代码，让组合组件管理部分状态

**方案**:
- 组合组件内部管理 `isOpen` 状态
- 只暴露 `toggle` 事件通知父组件状态变化
- 减少父组件的状态管理负担

**权衡**: 降低纯粹性 vs 提升易用性

**时机**: 如果多个使用场景都重复实现相同逻辑

---

#### 3. 业务逻辑封装（优先级：低）

**需求**: 将 5 个限制和关闭最不活跃逻辑封装到组件内

**方案**:
```typescript
@Input()
maxTabs: number = 5

@Output()
sessionsChange = new EventEmitter<Map<string, SessionData>>()

// 组件内部处理超限逻辑
private handleNewChat(): void {
  if (this.sessions.size >= this.maxTabs) {
    this.closeLeastActiveSession();
  }
  this.createNewSession();
  this.sessionsChange.emit(this.sessions);
}
```

**权衡**: 降低父组件复杂度 vs 降低组件灵活性

**时机**: 如果 90% 的使用场景都是相同的逻辑

---

#### 4. 智能输入保存（优先级：中）

**需求**: 自动保存每个 session 的输入草稿

**方案**:
```typescript
// 组件内部维护草稿映射
private drafts = new Map<string, string>();

// 切换 session 时自动恢复草稿
onSessionSelect(sessionId: string): void {
  const draft = this.drafts.get(sessionId) || '';
  this.inputValueChange.emit(draft);
}

// 输入时自动保存
onInputChange(value: string): void {
  this.drafts.set(this.activeSessionId, value);
  this.inputValueChange.emit(value);
}
```

**时机**: 当用户体验需要提升时

---

#### 5. 键盘快捷键（优先级：中）

**需求**: 支持键盘快捷键提升效率

**方案**:
```typescript
@HostListener('document:keydown', ['$event'])
handleKeyDown(event: KeyboardEvent): void {
  // Ctrl/Cmd + Shift + N: 新建会话
  if (event.ctrlKey && event.shiftKey && event.key === 'n') {
    this.newChat.emit();
  }

  // Ctrl/Cmd + [1-5]: 切换到指定 tab
  if (event.ctrlKey && event.key >= '1' && event.key <= '5') {
    const index = parseInt(event.key) - 1;
    const sessionId = this.getSessionByIndex(index);
    if (sessionId) {
      this.sessionSelect.emit(sessionId);
    }
  }

  // Escape: 关闭面板
  if (event.key === 'Escape' && this.isOpen()) {
    this.sessionToggle.emit();
  }
}
```

**时机**: 当高级用户需要提升效率时

---

#### 6. 动画优化（优先级：低）

**需求**: 更流畅的展开/收起动画

**方案**:
- 使用 Angular Animations
- 添加弹性效果
- 支持手势滑动（移动端）

**时机**: 当用户体验调研显示动画卡顿时

---

#### 7. 可访问性增强（优先级：中）

**需求**: 更好的无障碍支持

**方案**:
- 完整的键盘导航
- ARIA live region（状态变化通知）
- 屏幕阅读器优化
- 高对比度模式支持

**时机**: 当需要符合 WCAG AAA 标准时

---

#### 8. 性能优化（优先级：低）

**需求**: 大量 session 时的性能优化

**方案**:
- 虚拟滚动（超过 10 个 tabs）
- 懒加载 ChatInput
- OnPush 变更检测策略

**时机**: 当实际使用中出现性能问题时

---

## 9. 实施检查清单

### MVP 实现

- [ ] 创建组件文件结构
- [ ] 实现 Inputs 接口
- [ ] 实现 Outputs 事件转发
- [ ] 实现模板布局（SessionTabsBar + ChatInput）
- [ ] 实现条件渲染（isOpen 控制）
- [ ] 实现双向绑定（inputValue）
- [ ] 添加 Tailwind 默认样式
- [ ] 添加样式覆盖支持（containerClass 等）
- [ ] 编写单元测试
- [ ] 编写集成测试
- [ ] 添加 demo 页面
- [ ] 更新文档

### 测试验证

- [ ] 事件转发正确性测试
- [ ] 条件渲染测试
- [ ] 双向绑定测试
- [ ] 样式覆盖测试
- [ ] 响应式布局测试
- [ ] 可访问性测试

### 文档

- [ ] 组件 API 文档
- [ ] 使用示例
- [ ] Storybook（如果项目使用）
- [ ] 迁移指南（从现有代码）

---

## 10. 设计总结

### 核心设计原则

1. **纯粹性** - 纯展示组件，不包含业务逻辑
2. **可组合性** - 复用现有组件，不重复造轮
3. **可覆盖性** - Tailwind utility 优先，完全可定制
4. **类型安全** - 充分利用 TypeScript 类型系统
5. **单向数据流** - 状态向下，事件向上

### 权衡决策

| 决策 | 收益 | 代价 |
|------|------|------|
| 纯展示组件 | 易测试、可预测 | 父组件代码增多 |
| 父组件管理逻辑 | 灵活、可复用 | 重复实现可能性 |
| Tailwind 优先 | 样式完全可控 | 样式分散 |
| 事件转发而非聚合 | 细粒度控制 | 事件较多 |

### 未来演进方向

1. **渐进增强** - 根据实际使用反馈逐步添加功能
2. **性能优化** - 在出现问题时再优化
3. **可访问性** - 持续改进 A11y 支持
4. **开发体验** - 提供更多便捷方法（可选）

---

**文档版本**: 1.0
**最后更新**: 2026-02-02
**状态**: 设计完成，待实施
