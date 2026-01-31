# AI Chat Panel Refactoring - Brainstorming & Design

**Created:** 2026-01-31
**Status:** Design Complete, Ready for Implementation
**Approach:** Minimal Toggle (Approach 1)

---

## 🎯 Problem Statement

### Current Issues

1. **整个聊天容器被隐藏**: When `isPanelOpen = false`, the entire chat container (messages card + status badges + **input**) is hidden
2. **Session Toggle 是单个 FAB 按钮**: The session toggle is a circular floating action button (bottom-right), not multiple tabs
3. **输入框不始终可见**: Input box is inside the conditional wrapper and hidden when panel is closed

### User Requirements

> "让输入框、session button 永远显示且浮动在页面上；点击 session button 可以打开/隐藏 AI 对话框"

Translation:
- Input box ALWAYS visible and floating
- Session buttons ALWAYS visible and floating
- Clicking session button toggles the chat messages card
- Multiple session buttons (horizontal tabs, left-aligned with input)

---

## 🎨 Design Approach: Minimal Toggle

### Philosophy

**Session tabs + input are permanent fixtures. Messages card is the only thing that toggles.**

### Core Behavior

1. **Session Tabs (Horizontal Row)** + **Input Box** ALWAYS visible at bottom
2. Clicking a session tab toggles ONLY that session's messages card visibility
3. Status badges (parked feature) float between messages card and input
4. When you switch sessions, the input context changes but stays visible

### Why This Approach?

✅ **Simplest mental model** - Easy to understand
✅ **Input always ready** - No friction to start typing
✅ **Fast session switching** - Quick context switching
✅ **Matches HTML preview** - Closest to reference design
✅ **Easier to implement** - Lower complexity

---

## 📦 MVP Scope

### Must Have (Critical Path)

1. **Session Tabs Row** - Horizontal row of session buttons, always visible
   - Minimum 2-3 sessions for demo
   - Active session highlighted
   - Left-aligned with input box

2. **Input Box** - Always visible, always ready
   - Auto-expanding textarea
   - Send button
   - Context switches with active session

3. **Messages Card** - Toggles via session click
   - Shows messages for active session
   - Collapses/expands when clicking session tab
   - Scrollable message history
   - **Draggable and resizable** (desktop only)

4. **Session Switching** - Core functionality
   - Clicking different session tab switches input context
   - Messages update to show selected session's history
   - Active session persists

5. **localStorage Persistence**
   - Session data (messages, drafts)
   - Messages card position and size
   - Active session ID

### Nice to Have (Park for Later)

- [ ] Status badges (Thinking, Typing, Done, Error)
- [ ] File/image/voice upload buttons
- [ ] Add/rename/delete sessions
- [ ] Session search/filter
- [ ] Keyboard shortcuts (Cmd+数字切换会话)

### Future/Divergent Ideas (Parking Lot)

These ideas are intentionally out of scope for MVP but worth exploring later:

1. **Multi-select Sessions** - Bulk operations across sessions
2. **Session Folders** - Organize sessions into groups
3. **Session Templates** - Pre-configured session types
4. **Session Sharing** - Collaborative sessions
5. **Session Analytics** - Usage stats per session
6. **Session Sync** - Cross-device synchronization
7. **Session Export** - Export conversation history
8. **AI Model Selector** - Different tabs = different AI models
9. **Mode Switcher** - Chat, Code, Search modes
10. **Floating Split View** - View two sessions side-by-side

---

## 🏗️ Architecture & Component Structure

### Component Hierarchy

```
AiChatPanel (Root Orchestrator)
├── SessionTabsBar (New Component)
│   ├── SessionTabButton (repeated per session)
│   └── [Add Session Button] (optional, parked)
├── ChatMessagesCard
│   ├── MessageList
│   ├── DragHandleDirective
│   └── ResizeHandleDirective
├── StatusBadgesComponent (parked feature)
└── ChatInputComponent
    ├── TextArea
    ├── ToolbarButtons (parked feature)
    └── SendButton
```

### Layout Structure (No Container Border)

```
Bottom of page (floating, no container box)
  ↓
┌─────────────────────────────────────────┐
│  ┌─────────────────────────────────┐    │
│  │   Chat Messages Card            │    │ ← Messages Card (独立浮动)
│  │   (glass morphism 背景)         │    │
│  └─────────────────────────────────┘    │
└─────────────────────────────────────────┘
              (gap: 8px)
┌─────────────────────────────────────────┐
│  [Session 1] [Session 2] [Session 3]    │ ← Session Tabs (无外框)
└─────────────────────────────────────────┘
              (gap: 8px)
┌─────────────────────────────────────────┐
│  ┌─────────────────────────────────┐    │
│  │  Input: [Ask AI anything...]    │    │ ← Input Box (独立浮动)
│  │  [Send]                          │    │
│  └─────────────────────────────────┘    │
└─────────────────────────────────────────┘
         ↑ 整体垂直堆叠，底部固定
```

### CSS Positioning (Using Design Tokens)

```css
/* Messages Card */
.messages-card {
  position: fixed;
  bottom: calc(var(--spacing-xl) * 5);  /* ~80px */
  left: 50%;
  transform: translateX(-50%);
}

/* Session Tabs */
.session-tabs {
  position: fixed;
  bottom: calc(var(--spacing-xl) * 3);  /* ~48px */
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: var(--spacing-sm);  /* 4px */
}

/* Input Box */
.input-box {
  position: fixed;
  bottom: var(--spacing-xl);  /* 16px */
  left: 50%;
  transform: translateX(-50%);
}

/* Session Tab Styling (using tokens) */
.session-tab {
  background: var(--primary / 15%);  /* 浅石绿 */
  color: var(--primary);
  padding: var(--spacing-sm) var(--spacing-md);  /* 4px 8px */
  border-radius: var(--radius-lg);  /* 5px */
  transition: all var(--duration-normal) ease;  /* 200ms */
}

.session-tab.active {
  background: var(--primary);  /* 深石绿 */
  color: var(--primary-foreground);  /* 白色 */
}

.session-tab:hover {
  background: var(--primary / 25%);
}
```

---

## 🔄 Data Flow

### Core User Flows

```
1. 初始化流程
   └─> 加载 sessions 数据（从 localStorage 或默认值）
   └─> 设置 activeSessionId = 第一个 session
   └─> 渲染：显示所有 Tabs + 活跃 session 的 Messages + Input

2. 点击不同 Session Tab
   └─> 更新 activeSessionId
   └─> 保存当前 session 的 inputValue（draft）
   └─> 恢复新 session 的 inputValue
   └─> 重新渲染 Messages（显示新 session 的历史）
   └─> 保持 isMessagesVisible 状态不变

3. 点击同一个 Session Tab (Toggle)
   └─> 切换 isMessagesVisible = !isMessagesVisible
   └─> Messages Card 显示/隐藏（带动画）

4. 输入框发送消息
   └─> 创建 message 对象
   └─> 添加到当前 session 的 messages 数组
   └─> 清空 inputValue
   └─> emit messageSend 事件给父组件
   └─> 滚动 Messages 到底部
```

### Session Switching Logic

```
切换前:
  activeSessionId = "session-1"
  inputValue = "hello" (draft)
  messages = [...session1 messages]

用户点击 [Session 2] Tab:

切换步骤:
  1. 保存 draft: sessions["session-1"].inputValue = "hello"
  2. 切换: activeSessionId = "session-2"
  3. 恢复 draft: inputValue = sessions["session-2"].inputValue
  4. 更新 UI: Messages 显示 session-2 的历史
  5. 高亮 Tab: Session 2 激活态样式
```

### Message Send Flow

```
用户输入 + 点击 Send:

1. 组件内部处理:
   └─> 创建 message: { id, role: "user", content, timestamp }
   └─> push 到 messages 数组
   └─> 清空 input
   └─> emit messageSend(message) 给父组件

2. 父组件处理（Demo Page）:
   └─> 接收 messageSend 事件
   └─> 调用 AI API
   └─> 收到响应后调用 panel.addMessage(aiResponse)
   └─> 更新 UI
```

---

## 💾 State Management

### Core State Structure

```
AiChatPanel State:

  sessions: Map<string, SessionData>
    ├─ "session-1": { messages: [], inputValue: "", lastUpdated: 123456 }
    ├─ "session-2": { messages: [], inputValue: "draft", lastUpdated: 123457 }
    └─ "session-3": { messages: [], inputValue: "", lastUpdated: 123458 }

  activeSessionId: "session-2"

  isMessagesVisible: true

  (computed) activeSession: sessions.get(activeSessionId())

  (computed) canSendMessage: activeSession.inputValue.trim().length > 0
```

### Key Signal Computations

```
当前活跃会话的输入值:
  activeInputValue = computed(() =>
    sessions.get(activeSessionId())?.inputValue || ''
  )

当前会话的消息:
  activeMessages = computed(() =>
    sessions.get(activeSessionId())?.messages || []
  )

是否显示消息卡片:
  shouldShowMessages = computed(() =>
    isMessagesVisible() && activeMessages().length > 0
  )
```

### Session Data Structure

```typescript
interface SessionData {
  id: string;
  name: string;  // e.g., "Session 1", "Analytics Help"
  messages: ChatMessage[];
  inputValue: string;  // Draft state
  position: PanelPosition;  // { x: number, y: number }
  size: PanelSize;  // { width: number, height: number }
  lastUpdated: number;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  actions?: MessageAction[];
}
```

---

## 🎯 Edge Cases

### 1. 首次访问（无 localStorage 数据）

```
创建默认 session:
  sessions = {
    "session-default": {
      messages: [welcomeMessage],
      inputValue: "",
      lastUpdated: Date.now()
    }
  }
  activeSessionId = "session-default"
  isMessagesVisible = false  (初始隐藏)
```

### 2. 发送空消息

```
Send 按钮禁用条件:
  disabled = !canSendMessage()  (input 为空或仅空格)

用户按 Enter 时:
  if (!inputValue.trim()) return;  (忽略)
```

### 3. 切换到空会话

```
Messages 显示:
  - 保持空白（最简洁）
  - 或显示占位符: "Start a new conversation..."

推荐: 空白 + input 占位符引导
```

### 4. localStorage 失败（隐私模式）

```
try {
  load from localStorage
} catch {
  fallback to memory-only storage
  console.warn('LocalStorage unavailable, using in-memory storage')
}
```

### 5. Session ID 冲突

```
生成 ID: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

碰撞检查（可选）:
  while (sessions.has(newId)) {
    newId = generateId()
  }
```

---

## 🎬 Interaction Logic

### Session Tab Click Logic

```
点击 Session Tab 的两种情况:

情况 A: 点击不同的 Tab
  ├─ activeSessionId 改变
  ├─ 保存当前 draft
  ├─ 恢复新 session 的 draft
  ├─ Messages 平滑切换（淡出旧内容 → 淡入新内容）
  └─ Tab 高亮状态更新

情况 B: 点击当前活跃的 Tab (Toggle)
  ├─ activeSessionId 不变
  ├─ isMessagesVisible = !isMessagesVisible
  ├─ Messages Card 滑动展开/收起动画
  └─ Session Tab 保持高亮
```

### Animation Timing

```
切换 Session Tab（不同会话）:
  1. Tab 高亮更新 (0ms)
  2. Messages 旧内容淡出 (150ms) → var(--duration-fast)
  3. Messages 新内容淡入 (150ms)
  4. Input value 平滑过渡 (200ms) → var(--duration-normal)

Toggle Messages Card（同一会话）:
  1. Messages Card 滑动收起/展开 (300ms) → var(--duration-slow)
  2. 透明度同步变化 (300ms)
  3. 其他元素位置自动调整（flex gap）
```

### Input Box Interactions

```
自动高度:
  input 事件 → scrollHeight 计算 → 设置 height
  最小: 24px (单行)
  最大: 120px (5行)

Send 按钮状态:
  input 为空 → disabled (灰色，不可点击)
  input 有值 → enabled (石绿，可点击)

快捷键:
  Enter → 发送
  Shift+Enter → 换行
  Escape → 收起 Messages Card（可选）
```

### Messages Card Scroll Behavior

```
发送消息后:
  scrollTo({ top: scrollHeight, behavior: 'smooth' })

切换会话后:
  立即滚动到底部（保持最新消息可见）
  scrollTo({ top: scrollHeight, behavior: 'auto' })
```

---

## 🖱️ Drag & Resize (Desktop Only)

### Messages Card Interactive Elements

```
Messages Card 结构:

  ┌─────────────────────────────────┐
  │     ≡ ≡ ≡ (拖拽手柄)            │ ← Drag Handle（顶部居中）
  ├─────────────────────────────────┤
  │                                 │
  │   Message 1                     │
  │   Message 2                     │ ← 可滚动内容区
  │   Message 3                     │
  │                                 │
  │                         ┏      │ ← Resize Handle（右下角）
  │                         ┗      │
  └─────────────────────────────────┘
```

### Drag Logic

```
用户点击并拖动 Drag Handle:

1. mousedown
   ├─ 记录初始位置：startX, startY
   ├─ 禁用过渡动画：transition = 'none'
   ├─ 记录当前卡片的 left, top
   └─ 添加全局 mousemove, mouseup 监听

2. mousemove
   ├─ 计算位移：deltaX = currentX - startX
   ├─ 更新位置：left = initialLeft + deltaX
   │              top = initialTop + deltaY
   └─ 实时更新 DOM（无动画）

3. mouseup
   ├─ 恢复过渡动画：transition = 'all 200ms ease'
   ├─ 保存新位置到 localStorage
   └─ 移除全局监听器
```

### Resize Logic

```
用户拖动 Resize Handle:

约束条件:
  minWidth: 300px
  minHeight: 200px
  maxWidth: 90vw
  maxHeight: 70vh

1. mousedown
   ├─ 记录初始尺寸：startWidth, startHeight
   ├─ 禁用过渡动画
   └─ 添加全局监听器

2. mousemove
   ├─ 计算尺寸变化：deltaX = currentX - startX
   ├─ 新尺寸：newWidth = clamp(startWidth + deltaX, 300, 90vw)
   │          newHeight = clamp(startHeight + deltaY, 200, 70vh)
   └─ 实时更新 DOM

3. mouseup
   ├─ 恢复过渡动画
   ├─ 保存新尺寸到 localStorage
   └─ 移除监听器
```

### Per-Session Position & Size

```
每个 Session 独立的位置和尺寸:

sessions: Map<string, SessionData>
  "session-1": {
    messages: [],
    inputValue: "",
    position: { x: 0, y: 0 },
    size: { width: 600, height: 400 },
    lastUpdated: 123456
  }

共享初始位置:
  DEFAULT_POSITION = { x: 0, y: 0 }
  DEFAULT_SIZE = { width: 600, height: 400 }
```

### localStorage Persistence Schema

```
存储键: 'ai-chat-panel-preferences'

存储结构:
{
  sessions: {
    "session-1": {
      position: { x: 120, y: 50 },
      size: { width: 650, height: 380 },
      inputValue: "draft",
      messages: [...]
    },
    ...
  },
  activeSessionId: "session-1",
  isMessagesVisible: true
}
```

---

## ✅ Testing Strategy

### Manual Testing Checklist

**1. Session Tabs 功能**
- [ ] 显示多个 session tabs（至少 3 个）
- [ ] 点击不同 tab 切换活跃会话
- [ ] 活跃 tab 高亮显示
- [ ] Tab 点击时保持 input draft 状态

**2. Messages Card Toggle**
- [ ] 点击活跃 tab 收起 messages card
- [ ] 再次点击展开 messages card
- [ ] 切换到其他 tab 时保持 toggle 状态

**3. Input Box**
- [ ] Input 始终可见
- [ ] 输入时自动扩展高度
- [ ] 达到最大高度后滚动
- [ ] Enter 发送，Shift+Enter 换行
- [ ] Send 按钮状态正确（空值禁用）

**4. 消息发送**
- [ ] 发送后消息显示在 card 中
- [ ] 发送后 input 清空
- [ ] 自动滚动到底部
- [ ] 消息归属正确的 session

**5. 拖拽功能**
- [ ] 拖拽手柄可见且可点击
- [ ] 拖拽时卡片跟随移动
- [ ] 拖拽平滑无延迟
- [ ] 释放后保存位置

**6. 调整大小**
- [ ] Resize 手柄悬停时显示
- [ ] 拖动时实时调整尺寸
- [ ] 遵守最小/最大约束
- [ ] 释放后保存尺寸

**7. localStorage 持久化**
- [ ] 刷新页面后 session 数据保留
- [ ] 位置和尺寸恢复
- [ ] Input draft 恢复
- [ ] 活跃 session 保持

**8. 边缘情况**
- [ ] 首次访问显示默认 session
- [ ] 空消息无法发送
- [ ] 切换到空 session 正常显示
- [ ] 长消息正确换行

---

## 🚀 Implementation Notes

### Key Technical Decisions

1. **No Mobile Support** - Drag & resize is desktop-only (mouse events)
2. **No Container Border** - Each component floats independently
3. **Session Per-Session State** - Each session has independent position, size, and draft
4. **Minimal Toggle Approach** - Only messages card toggles, input always visible
5. **Design Tokens** - All styles use `styles.css` variables

### Angular Signals to Use

- `signal<T>()` - Primitive state
- `computed(() => ...)` - Derived state
- `effect(() => ...)` - Side effects (localStorage sync)

---

## 📚 Implementation Plan

**Next Steps:**

1. ✅ Design complete
2. ⏳ Create git worktree (isolated workspace)
3. ⏳ Write detailed implementation plan
4. ⏳ Implement components
5. ⏳ Test against checklist
6. ⏳ Merge to main

**Current Status:** ✅ Design Complete, Ready for Implementation Handoff

---

**Design Version:** 1.0
**Last Updated:** 2026-01-31
**Designer:** Claude (Brainstorming Skill)
**Approach:** Minimal Toggle (Approach 1)
