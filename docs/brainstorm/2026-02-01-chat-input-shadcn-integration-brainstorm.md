# Chat Input Component - Shadcn Integration Brainstorm

**Date:** 2026-02-01
**Component:** `ai-chat/chat-input`
**Goal:** 全面重构 chat-input 组件，引入 shadcn 组件并统一使用 CSS 变量

---

## Background & Context

### Current State

chat-input 组件是一个高度定制化的聊天输入组件，具有以下特点：

**Current Implementation:**
- 原生 `<button>` 标签 + 硬编码 Tailwind 类
- 原生 `<textarea>` 标签
- 样式定义在 `css.ts` 文件（字符串数组）
- 硬编码 OKLCH 颜色值（如 `oklch(0.48 0.07 195)`）
- Liquid Glass directive 毛玻璃效果

**Component Structure:**
```
chat-input
├── Outer Container (布局容器)
├── Liquid Glass Wrapper (毛玻璃效果) ✅ 保留
├── Input Area (textarea 输入区)
└── Toolbar (工具栏)
    ├── Left: File button, Image button
    └── Right: Voice button, Send button
```

### Problem Statement

1. **不一致的设计系统** - 硬编码颜色不使用主题 CSS 变量
2. **组件复用性差** - 不使用 shadcn Button 组件
3. **维护成本高** - 颜色值分散在多个文件中
4. **扩展性差** - 难以统一调整主题和样式

---

## Goals

### Primary Goals

1. ✅ **保留 Liquid Glass 效果** - 维持现有视觉体验
2. ✅ **引入 shadcn 组件** - Toolbar 按钮使用 `spark-button`
3. ✅ **统一 CSS 变量** - 所有硬编码颜色替换为主题变量
4. ✅ **核心功能完整** - 输入、发送、工具按钮、auto-resize

### Non-Goals

- ❌ 创建新的 `AutoResizeTextarea` 组件（过度抽象）
- ❌ 扩展 shadcn Button variant（如 "toolbar-icon"）
- ❌ 完善所有 a11y 属性（保留基础的）
- ❌ 响应式细节优化

---

## Approach Exploration

### Option A: 保守适配

**Description:** 最小化结构变化，主要替换颜色值

**Implementation:**
- 保留 `css.ts` 结构和所有 Tailwind 类
- 将 `oklch(...)` 替换为 `var(--primary)` 等
- 保持原生 `<button>` 和 `<textarea>`

**Trade-offs:**
- ✅ 改动风险最小
- ✅ 迁移成本低
- ❌ 不符合设计系统标准
- ❌ 无法复用 shadcn 组件

---

### Option B: 混合组件 ⭐️ **(Selected)**

**Description:** 使用 shadcn 组件 + 保留定制逻辑

**Implementation:**
- Toolbar 按钮 → `<button spark-button>`
- 输入区 textarea → 原生 + CSS 变量样式
- Liquid Glass → 保留作为 wrapper
- 颜色 → 统一使用 CSS 变量
- 特殊样式 → 通过 `class` input 传入自定义类

**Trade-offs:**
- ✅ 符合设计系统标准
- ✅ 最大化组件复用
- ✅ 保持特殊功能
- ✅ 易于维护和扩展
- ⚠️ 需要轻微调整现有 shadcn 组件

---

### Option C: 完全拆分重构

**Description:** 将 chat-input 拆分为多个可复用组件

**Implementation:**
- 创建独立的 `IconToolbar` 组件
- 创建 `AutoResizeTextarea` 组件
- 创建 `ChatInput` 作为组合组件
- 所有子组件使用 shadcn 标准组件

**Trade-offs:**
- ✅ 最大化可复用性
- ✅ 清晰的组件层次
- ❌ 迁移成本最高
- ❌ 可能过度抽象（YAGNI）

---

## Selected Approach: Option B (Hybrid Components)

### Why This Approach?

1. **平衡性** - 既利用 shadcn 组件优势，又保留特殊功能
2. **实用性** - 符合"够用就好"原则，不过度设计
3. **扩展性** - 未来可逐步提取可复用部分
4. **一致性** - 符合"矿物与时光"设计系统原则

---

## MVP Design

### Architecture

```
chat-input-component.ts
├── Template
│   ├── liquid-glass wrapper (保留)
│   │   ├── input-area
│   │   │   └── textarea (原生 + CSS 变量样式)
│   │   └── toolbar
│   │       ├── left-buttons-container
│   │       │   ├── <button spark-button variant="ghost"> (file)
│   │       │   └── <button spark-button variant="ghost"> (image)
│   │       └── right-buttons-container
│   │           ├── <button spark-button variant="ghost"> (voice)
│   │           └── <button spark-button variant="default"> (send)
│   └── outputs: send, fileClick, imageClick, voiceClick
│
├── Styles
│   ├── ❌ 移除 css.ts 文件
│   ├── ✅ 使用主题 CSS 变量
│   └── ✅ 组件内样式最小化
│
└── Logic (保留现有)
    ├── auto-resize textarea
    ├── Enter to send / Shift+Enter for newline
    └── validation (空值禁用 send)
```

---

### Component Breakdown

#### 1. Liquid Glass Wrapper

**保持不变:**
- Directive: `liquidGlass`
- 参数: `lgTheme="mineral-light"`, `lgCornerRadius="16px"`
- 位置: 最外层 wrapper

---

#### 2. Input Area (Textarea)

**改造方案:**

```typescript
// 当前实现
<textarea class="w-full min-h-6 max-h-[120px] bg-transparent ...">

// 改造后 (保留原生，使用 CSS 变量)
<textarea
  class="chat-textarea"
  [style]--textarea-placeholder: var(--muted-foreground)
  [style]--textarea-color: var(--foreground)
>
```

**CSS 映射:**
```
旧硬编码颜色 → CSS 变量
----------------------------------------
oklch(0.28 0.03 185) → var(--foreground)
oklch(0.50 0.02 185) → var(--muted-foreground)
oklch(0.94 0.015 85)  → var(--foreground) (dark mode)
```

**Auto-resize 逻辑:**
- 保留现有 `adjustTextareaHeight()` 方法
- 通过 `@ViewChild` 访问 textarea 元素

---

#### 3. Toolbar Buttons

**改造方案:**

```typescript
// 当前实现
<button class="w-[30px] h-[30px] rounded-lg ... text-[oklch(0.50_0.02_185)]">

// 改造后 (使用 shadcn Button)
<button
  spark-button
  variant="ghost"
  size="icon"
  [class]="'toolbar-icon-btn'"
  (click)="onFileClick()"
>
  <svg>...</svg>
</button>
```

**按钮映射:**

| 按钮 | Variant | Size | 说明 |
|------|---------|------|------|
| File | `ghost` | `icon` | 左侧工具按钮 |
| Image | `ghost` | `icon` | 左侧工具按钮 |
| Voice | `ghost` | `icon` | 右侧工具按钮 |
| Send | `default` | `icon` | 主操作按钮，受控 disabled |

**CSS 变量映射:**

```
旧颜色 → CSS 变量
----------------------------------------
oklch(0.48 0.07 195) → var(--primary)
oklch(0.28 0.03 185) → var(--muted-foreground)
oklch(0.70 0.12 75)  → var(--accent) (voice hover)
oklch(0.98 0.01 85)  → var(--primary-foreground)
```

**特殊样式处理:**

```typescript
// 在组件中定义自定义样式
@HostStyles({
  ':host': {
    '--toolbar-icon-size': '30px',
  }
})

// 或通过 class input 传入自定义类
<button
  spark-button
  variant="ghost"
  size="icon"
  class="chat-toolbar-btn"
>
```

---

#### 4. Send Button (特殊处理)

**Send 按钮的特殊逻辑:**

```typescript
// 动态 variant
<button
  spark-button
  [variant]="canSend() ? 'default' : 'ghost'"
  [disabled]="!canSend()"
  class="send-button"
>
```

**状态样式:**
```typescript
// 通过 computed class 控制
computedClass = computed(() =>
  cn(
    'send-button',
    this.canSend() ? 'send-active' : 'send-disabled'
  )
)
```

---

### Data Flow

```
User Input → textarea.value
                ↓
            onInput()
                ↓
      adjustTextareaHeight() + canSend.check()
                ↓
        User presses Enter
                ↓
            onSend()
                ↓
      send.emit(message) + clear input
```

**Button Events:**
```
File Button Click → fileClick.emit()
Image Button Click → imageClick.emit()
Voice Button Click → voiceClick.emit()
```

---

### Style Mapping Table

#### Input Area (Textarea)

| 当前样式 | CSS 变量 | 说明 |
|---------|----------|------|
| `text-[oklch(0.28_0.03_185)]` | `color: var(--foreground)` | 文本颜色 |
| `placeholder:text-[oklch(0.50_0.02_185)]` | `color: var(--muted-foreground)` | 占位符 |
| `dark:text-[oklch(0.94_0.015_85)]` | `color: var(--foreground)` | Dark mode |
| `dark:placeholder:text-[oklch(0.65_0.035_195)]` | `color: var(--muted-foreground)` | Dark mode |

#### Toolbar Buttons

| 当前样式 | CSS 变量 | 说明 |
|---------|----------|------|
| `text-[oklch(0.50_0.02_185)]` | `color: var(--muted-foreground)` | 默认图标颜色 |
| `hover:bg-[oklch(0.48_0.07_195_/8%)]` | `bg: var(--primary/8%)` | Hover 背景 |
| `hover:text-[oklch(0.48_0.07_195)]` | `color: var(--primary)` | Hover 文本 |
| `bg-[oklch(0.48_0.07_195)]` | `bg: var(--primary)` | Send 按钮激活 |
| `text-[oklch(0.98_0.01_85)]` | `color: var(--primary-foreground)` | Send 文本 |

---

### Component Dependencies

**Current:**
```typescript
imports: [LiquidGlassDirective]
```

**After Refactor:**
```typescript
imports: [LiquidGlassDirective, ButtonComponent]
```

---

### Migration Steps

#### Step 1: 准备 CSS 变量
- 确认 `styles.css` 中已定义所需变量
- 添加 `--primary/8%` 等 alpha 变量（如需要）

#### Step 2: 重构 Toolbar 按钮
- 将 `<button>` 替换为 `<button spark-button>`
- 移除自定义 class，使用 `variant` 和 `size`
- 添加自定义 class（如 `chat-toolbar-btn`）处理特殊样式

#### Step 3: 重构 Textarea 样式
- 移除硬编码 OKLCH 颜色
- 使用 CSS 变量替换
- 保留 auto-resize 逻辑

#### Step 4: 清理
- 删除 `css.ts` 文件
- 更新导入语句
- 测试所有交互功能

#### Step 5: 验证
- Light/Dark mode 切换
- 按钮 hover/disabled 状态
- Auto-resize 功能
- 键盘快捷键（Enter/Shift+Enter）

---

## Testing Strategy

### Manual Testing Checklist

**Visual Tests:**
- [ ] Light mode: 所有颜色正确显示
- [ ] Dark mode: 所有颜色正确显示
- [ ] Liquid glass 效果正常
- [ ] Toolbar 按钮布局正确

**Interaction Tests:**
- [ ] 输入文本后 auto-resize 工作正常
- [ ] Enter 发送消息
- [ ] Shift+Enter 换行
- [ ] 空输入时 Send 按钮禁用
- [ ] 点击 File/Image/Voice 按钮触发事件

**Component Tests:**
- [ ] shadcn Button variant 正确应用
- [ ] 按钮尺寸符合设计系统
- [ ] CSS 变量正确引用

---

## Future / Divergent Ideas

### Parked for Future

1. **创建 AutoResizeTextarea 组件**
   - 当前: 在 chat-input 内部实现
   - 未来: 提取为可复用的 shadcn 组件
   - 需求: 其他组件也需要 auto-resize 功能时

2. **扩展 shadcn Button variant**
   - 当前: 使用现有 variant (ghost, default)
   - 未来: 添加 "toolbar-icon" variant
   - 需求: 多个组件需要统一的工具栏图标按钮样式时

3. **完善 a11y 属性**
   - 当前: 保留基础 a11y (aria-label)
   - 未来: 添加 keyboard navigation, screen reader support
   - 需求: 需要满足 WCAG AAA 标准时

4. **响应式优化**
   - 当前: 使用固定的 max-width
   - 未来: 完整的响应式断点 (sm/md/lg/xl)
   - 需求: 在移动设备上需要更精细的控制时

5. **高级键盘快捷键**
   - 当前: Enter 发送, Shift+Enter 换行
   - 未来: Cmd+K 打开聊天, Cmd+I 聚焦输入等
   - 需求: 用户明确需要时

6. **按钮动画优化**
   - 当前: 基础的 transition 效果
   - 未来: 微交互动画 (scale, bounce 等)
   - 需求: 需要增强用户体验时

---

## Open Questions

1. **CSS Alpha 变量**
   - 是否需要在 `styles.css` 中预定义 `--primary/8%` 等变量？
   - 还是在组件中使用 `rgba(var(--primary), 0.08)` ？

2. **自定义样式方式**
   - 通过 `class` input 传入自定义类？
   - 还是通过 `@HostStyles` 在组件级别定义？

3. **按钮尺寸一致性**
   - Toolbar 图标按钮是否应该使用标准的 `--button-height-md`？
   - 还是可以保持自定义的 `30px`？

---

## Success Criteria

✅ 所有硬编码 OKLCH 颜色替换为 CSS 变量
✅ Toolbar 按钮使用 `spark-button` 组件
✅ Liquid Glass 效果保持不变
✅ 所有交互功能正常工作
✅ Light/Dark mode 正常切换
✅ 代码更简洁、更易维护
