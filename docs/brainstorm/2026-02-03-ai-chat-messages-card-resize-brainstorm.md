# AI Chat Messages Card - Multi-Edge Resize Feature

**Date**: 2026-02-03
**Status**: Design Complete
**Component**: `ai-chat-messages-card`

---

## 需求概述

为 `ai-chat-messages-card` 组件增加四边拖拽调整大小的能力，允许用户直接拖拽上、下、左、右四个边来放大、缩小卡片。拖拽某一边时，其他三条边保持不变。

### 用户原始需求

> "为 ai-chat-messages-card 增加 resize 能力 —— 可以直接拖拽 4 个边，放大、放小，四个边拖的时候，其他的三条边保持不变"

---

## 设计决策

### 关键决策点

1. **保留现有 handle**：保留现有的右上角 resize handle，增加四边拖拽（总共 5 个控制点）
2. **定位模式**：仅支持 fixed 模式，移除 relative 模式以简化实现
3. **控制点数量**：4 个边 + 1 个角 = 5 个控制点（上、下、左、右 + 右上角）

### MVP 范围

#### ✅ 必需功能（MVP）

- **5 个控制点的拖拽能力**
  - 上边：改变高度和 top 位置，保持 bottom/left/right
  - 下边：改变高度，保持 top/left/right/bottom
  - 左边：改变宽度和 left 位置，保持 right/top/bottom
  - 右边：改变宽度，保持 left/top/bottom
  - 右上角：现有的 resize 逻辑（改变 width/height/top，保持 bottom/left）

- **固定定位约束**
  - 仅在 fixed 模式下工作
  - 拖拽某边时，其他三边保持不变

- **基础边界保护**
  - 最小尺寸限制：280×200px（防止卡片消失或过小）
  - 视口边界检测：防止拖出屏幕（8px padding）

- **拖拽状态管理**
  - 拖拽时禁用 cdkDrag（防止与位置拖拽冲突）
  - 适当的 cursor 样式（ns-resize, ew-resize, nwse-resize）

- **代码简化**
  - 移除 relative 模式支持

#### ❌ 延后功能（Future Plans）

详见下方 [Future/Divergent Ideas](#futuredivergent-ideas) 章节。

---

## 架构设计

### 组件结构

```
ChatMessagesCardComponent (fixed only)
├── State Management
│   ├── isResizing: Signal<boolean>
│   ├── currentResizeEdge: Signal<'top' | 'bottom' | 'left' | 'right' | 'corner-ne' | null>
│   └── resizeState: ResizeState (记录初始值)
├── Template Elements
│   ├── Card Container (fixed position, 4 edges)
│   ├── 5 Resize Handles (上/下/左/右 + 右上角)
│   └── Drag Handle (现有，用于位置拖拽)
└── Logic Methods
    ├── startResize(edge, event) - 5 个边的通用启动方法
    ├── onResize(event) - 统一的 mousemove 处理
    ├── stopResize() - 统一的 mouseup 处理
    └── calculateNewSize(edge, delta) - 各边的计算逻辑
```

### 核心设计原则

1. **统一入口**：5 个 handle 都调用同一个 `startResize(edge, event)`，通过 `edge` 参数区分
2. **统一监听**：只使用一对 `@HostListener` (`window:mousemove`, `window:mouseup`)，通过 `currentResizeEdge` signal 路由
3. **计算分离**：每个边的计算逻辑拆分为独立的 private 方法

### ResizeHandle 边缘位置

```
┌─────────────────────┐
│ ╺ top handle ─────╸ │  ← cursor: ns-resize
│         │           │
│ left    │     right │
│ handle  │   handle  │  ← cursor: ew-resize
│         │           │
│ ╺ bottom handle ─╸ │  ← cursor: ns-resize
└─────────────────────┘
      ╱ corner-ne ╲
     ╱   (existing)  ╲   ← cursor: nwse-resize
```

**Handle 位置与尺寸**：
- **Top**: `position: absolute; top: 0; left: 20px; right: 20px; height: 4px; cursor: ns-resize`
- **Bottom**: `position: absolute; bottom: 0; left: 20px; right: 20px; height: 4px; cursor: ns-resize`
- **Left**: `position: absolute; left: 0; top: 20px; bottom: 20px; width: 4px; cursor: ew-resize`
- **Right**: `position: absolute; right: 0; top: 20px; bottom: 20px; width: 4px; cursor: ew-resize`
- **Corner-NE**: 现有的右上角 handle（保持不变）

---

## 数据流与状态管理

### Resize 状态数据结构

```typescript
interface ResizeState {
  // 鼠标起始位置
  startMouseX: number;
  startMouseY: number;

  // 卡片起始几何属性
  startTop: number;
  startBottom: number;
  startLeft: number;
  startRight: number;
  startWidth: number;
  startHeight: number;

  // 当前正在拖拽的边
  activeEdge: 'top' | 'bottom' | 'left' | 'right' | 'corner-ne';
}
```

### 完整数据流

```
[用户交互]
   │
   ▼
[鼠标按下某边 Handle]
   │
   ├─► startResize(edge, event)
   │   │
   │   ├─ 1. 设置 isResizing = true
   │   ├─ 2. 记录 currentResizeEdge = edge
   │   ├─ 3. 获取当前卡片几何属性
   │   │   (使用 getBoundingClientRect + getComputedStyle)
   │   ├─ 4. 保存到 resizeState (初始值快照)
   │   ├─ 5. 禁用 cdkDrag (防止冲突)
   │   └─ 6. 设置 body.style.cursor (对应边的 cursor)
   │
   ▼
[鼠标移动] (window:mousemove)
   │
   ├─► onResize(event)
   │   │
   │   ├─ 1. 检查 isResizing && currentResizeEdge
   │   ├─ 2. 计算鼠标位移 deltaX, deltaY
   │   ├─ 3. 根据 currentResizeEdge 路由到对应计算方法:
   │   │   ├─ calculateTopResize()     → 更新 top + height
   │   │   ├─ calculateBottomResize()  → 更新 height
   │   │   ├─ calculateLeftResize()    → 更新 left + width
   │   │   ├─ calculateRightResize()   → 更新 width
   │   │   └─ calculateCornerNEResize() → 更新 top + width + height (现有)
   │   └─ 4. 应用新样式到 card element
   │
   ▼
[鼠标释放] (window:mouseup)
   │
   └─► stopResize()
       │
       ├─ 1. isResizing = false
       ├─ 2. currentResizeEdge = null
       ├─ 3. 恢复 cdkDrag
       ├─ 4. 恢复 body.cursor
       └─ 5. 可选: 触发 resizeEnd 事件（预留扩展点）
```

### 信号依赖关系

```
isResizing (WritableSignal<boolean>)
    │
    ├─► 影响 cdkDragDisabled (自动禁用拖拽)
    └─► 影响 template 条件渲染（可选：拖拽时显示尺寸）

currentResizeEdge (WritableSignal<Edge | null>)
    │
    ├─► 路由到对应的计算方法
    └─► 决定 cursor 样式
```

---

## 各边缘的计算逻辑

### 通用约束（所有计算方法共享）

```
MIN_WIDTH = 280px
MIN_HEIGHT = 200px
VIEWPORT_PADDING = 8px  // 防止完全贴边
```

### 各边缘详细计算

#### 1. Top Edge（上边）

**行为**：改变卡片顶部位置和高度，bottom/left/right 保持不变

```
计算过程：
1. deltaY = event.clientY - startMouseY  // 向上拖拽为负值
2. newHeight = startHeight - deltaY
3. 检查: newHeight >= MIN_HEIGHT ? ✅ 继续 : ❌ 不更新
4. card.style.top = `${startTop + deltaY}px`
5. card.style.height = `${newHeight}px`
6. 保持 bottom/left/right 不变（不修改）
```

**关键点**：
- `top` 向上移动（减小）
- `height` 增加以补偿 top 的移动
- `bottom` 锚定不动

---

#### 2. Bottom Edge（下边）

**行为**：只改变高度，top/left/right/bottom 保持不变

```
计算过程：
1. deltaY = event.clientY - startMouseY  // 向下拖拽为正值
2. newHeight = startHeight + deltaY
3. 检查: newHeight >= MIN_HEIGHT ? ✅ 继续 : ❌ 不更新
4. card.style.height = `${newHeight}px`
5. 保持 top/left/right/bottom 不变
```

**关键点**：
- 最简单的边缘
- 只改变 `height`

---

#### 3. Left Edge（左边）

**行为**：改变卡片左侧位置和宽度，right/top/bottom 保持不变

```
计算过程：
1. deltaX = event.clientX - startMouseX  // 向左拖拽为负值
2. newWidth = startWidth - deltaX
3. 检查: newWidth >= MIN_WIDTH ? ✅ 继续 : ❌ 不更新
4. card.style.left = `${startLeft + deltaX}px`
5. card.style.width = `${newWidth}px`
6. 保持 right/top/bottom 不变
```

**关键点**：
- `left` 向左移动（减小）
- `width` 增加以补偿 left 的移动
- `right` 锚定不动

---

#### 4. Right Edge（右边）

**行为**：只改变宽度，left/top/bottom 保持不变

```
计算过程：
1. deltaX = event.clientX - startMouseX  // 向右拖拽为正值
2. newWidth = startWidth + deltaX
3. 检查: newWidth >= MIN_WIDTH ? ✅ 继续 : ❌ 不更新
4. card.style.width = `${newWidth}px`
5. 保持 left/top/bottom 不变
```

**关键点**：
- 最简单，只改变 `width`

---

#### 5. Corner-NE（右上角，现有逻辑）

**行为**：同时改变宽度、高度和 top 位置，bottom/left 保持不变

```
计算过程：
1. deltaX = event.clientX - startMouseX
2. deltaY = event.clientY - startMouseY  // 向上为负值
3. newWidth = startWidth + deltaX
4. newHeight = startHeight - deltaY
5. 检查最小尺寸
6. card.style.width = `${newWidth}px`
7. card.style.height = `${newHeight}px`
8. card.style.top = `${startTop + deltaY}px`
9. 保持 bottom/left 不变
```

---

### 视口边界检测

```
// 所有边缘计算后额外检查
if (newTop < VIEWPORT_PADDING) → 限制 top
if (newBottom > windowHeight - VIEWPORT_PADDING) → 限制 height
if (newLeft < VIEWPORT_PADDING) → 限制 left
if (newRight > windowWidth - VIEWPORT_PADDING) → 限制 width
```

---

## 错误处理与边界情况

### 1. 最小尺寸限制

**场景**：用户拖拽到小于最小尺寸

```
处理策略：
├─ 计算层面：Math.max(MIN_WIDTH, newWidth)
├─ 结果：尺寸被"卡"在最小值，不会继续缩小
└─ 用户体验：鼠标继续移动，但卡片不再变化

示例：
拖拽上边时：
  if (newHeight < MIN_HEIGHT) {
    newHeight = MIN_HEIGHT  // 强制限制
    top = startBottom - MIN_HEIGHT  // 反推 top
  }
```

---

### 2. 视口边界保护

**场景**：用户拖拽超出屏幕

```
处理策略：
├─ Top Edge: top >= 8px（防止贴顶）
├─ Bottom Edge: top + height <= windowHeight - 8px
├─ Left Edge: left >= 8px
└─ Right Edge: left + width <= windowWidth - 8px

实现：
newTop = Math.max(8, calculatedTop)
newLeft = Math.max(8, calculatedLeft)
newRight = Math.min(windowWidth - 8, calculatedRight)
```

---

### 3. 拖拽状态异常保护

**场景**：鼠标移出浏览器后释放，再移回

```
问题：window:mouseup 在浏览器外可能不会触发

解决方案：
├─ 监听 window:blur（浏览器失焦）
├─ blur 时自动调用 stopResize()
└─ 或者：在 document 上添加 capture 阶段的 mouseup

代码伪逻辑：
@HostListener('window:blur')
onBlur() {
  if (this.isResizing()) {
    this.stopResize()  // 紧急停止
  }
}
```

---

### 4. 拖拽与拖拽的冲突处理

**场景**：用户在拖拽大小时意外触发拖拽移动

```
当前实现：
├─ cdkDragDisabled = isResizing()  ✅ 已实现
└─ 拖拽 resize 时自动禁用位置拖拽

额外保护：
├─ startResize() 时调用 event.stopPropagation()
├─ 防止事件冒泡触发 cdkDrag
└─ 双重保险
```

**为什么需要禁用 cdkDrag？**

1. **避免事件冲突**：cdkDrag 和 resize 同时监听 mousemove，会导致不可预测的行为
2. **明确的用户意图**：调整大小 ≠ 移动位置，这两个意图互斥
3. **技术实现**：避免两个监听器同时运行导致的性能问题和状态不一致
4. **标准做法**：调整窗口大小时，窗口位置不会同时移动

---

### 5. 快速连续拖拽

**场景**：用户快速点击拖拽多次

```
保护措施：
├─ startResize() 检查: if (isResizing()) return（防止重复启动）
├─ stopResize() 检查: if (!isResizing()) return（幂等性）
└─ 信号更新确保状态一致性
```

---

## 测试策略

### 单元测试重点

```
1. 各边缘计算方法
   ├─ 输入：startState + delta
   ├─ 输出：新的 geometry
   └─ 断言：固定边不变，活动边正确变化

2. 最小尺寸限制
   ├─ 拖拽到 MIN_HEIGHT 以下
   └─ 断言：实际值 = MIN_HEIGHT

3. 边界检测
   ├─ 拖拽到视口外
   └─ 断言：值被限制在允许范围

4. 状态管理
   ├─ startResize → isResizing = true
   ├─ stopResize → isResizing = false
   └─ cdkDragDisabled 正确响应
```

### 手动测试场景

```
1. 基础拖拽
   ├─ 依次拖拽 5 个 handle
   └─ 验证：其他三边保持不变

2. 极限尺寸
   ├─ 拖拽到最小尺寸
   └─ 验证：无法继续缩小

3. 快速拖拽
   ├─ 快速移动鼠标
   └─ 验证：无卡顿，尺寸跟随

4. 视口边界
   ├─ 拖拽到屏幕边缘
   └─ 验证：不会超出

5. 交互冲突
   ├─ resize 期间尝试 drag
   └─ 验证：drag 被禁用
```

---

## 实现检查清单

### 组件代码修改

- [ ] 移除 `position` input（仅保留 fixed 模式）
- [ ] 添加 `currentResizeEdge` signal
- [ ] 扩展 `ResizeState` 接口（如需要）
- [ ] 实现 `startResize(edge, event)` 通用方法
- [ ] 修改 `onResize(event)` 支持 5 个边缘路由
- [ ] 实现 5 个计算方法：
  - [ ] `calculateTopResize()`
  - [ ] `calculateBottomResize()`
  - [ ] `calculateLeftResize()`
  - [ ] `calculateRightResize()`
  - [ ] `calculateCornerNEResize()` (已有，需验证)
- [ ] 添加 `@HostListener('window:blur')` 处理

### Template 修改

- [ ] 添加 4 个新的 resize handle div：
  - [ ] `<div class="resize-handle resize-handle-top">`
  - [ ] `<div class="resize-handle resize-handle-bottom">`
  - [ ] `<div class="resize-handle resize-handle-left">`
  - [ ] `<div class="resize-handle resize-handle-right">`
- [ ] 每个绑定 `(mousedown)="startResize('top', $event)"` 等
- [ ] 保持现有的右上角 handle 和 drag handle

### CSS 样式

- [ ] 添加 handle 位置样式（top, bottom, left, right）
- [ ] 添加对应的 cursor 样式
- [ ] 确保 handle 有足够的 hover 区域（4px 宽度）
- [ ] 可选：添加 hover 时的视觉反馈

### 测试

- [ ] 手动测试 5 个 handle
- [ ] 边界情况测试
- [ ] 移除 relative 模式的相关代码

---

## Future/Divergent Ideas

以下功能在 MVP 阶段暂不实现，留待未来迭代：

### 🔮 增强体验功能

1. **尺寸 tooltip**
   - 拖拽时实时显示当前宽高（如 "600×400"）
   - 显示在 handle 旁边或卡片中央

2. **拖拽手柄动画**
   - Handle hover 时的渐入效果
   - 拖拽开始时的缩放动画
   - 更流畅的视觉反馈

3. **平滑过渡动画**
   - 松开鼠标后，卡片平滑过渡到最终位置
   - 使用 CSS transition（拖拽时禁用，结束后启用）

---

### 🔮 高级约束

4. **自定义最大尺寸**
   - 允许父组件传入 `maxSize` 参数
   - 默认为 viewport 尺寸

5. **比例锁定**
   - 按住 Shift 键时保持宽高比
   - 只在角点拖拽时有效

6. **网格吸附**
   - 每 10px 吸附一次
   - 按住 Alt 键禁用吸附

---

### 🔮 事件与持久化

7. **事件 emit**
   - `(resizeStart)` - 拖拽开始
   - `(resizeMove)` - 尺寸变化中
   - `(resizeEnd)` - 拖拽结束，传递最终尺寸

8. **状态持久化**
   - 保存用户调整后的尺寸到 localStorage
   - 下次打开时恢复尺寸
   - 不同 session 独立记忆

---

### 🔮 移动端支持

9. **触摸事件支持**
   - touchstart/touchmove/touchend
   - 移动端优化

10. **移动端 handle 优化**
    - 更大的触摸区域（8-12px）
    - 防止误触

---

### 🔮 键盘辅助

11. **方向键微调**
    - 选中 handle 后，使用方向键微调尺寸
    - Shift + 方向键 = 快速调整（10px 步进）

12. **ESC 取消拖拽**
    - 按 ESC 键取消当前拖拽
    - 恢复到拖拽前的尺寸

---

### 🔮 高级功能

13. **四角拖拽**
    - 添加左上、左下、右下三个角点
    - 完整的 8 个控制点（4 边 + 4 角）

14. **多卡片同步 resize**
    - 按住 Ctrl 键时，同步调整所有打开的卡片大小

15. **预设尺寸**
    - 双击 handle 恢复到默认尺寸
    - 或切换到预设的尺寸（小/中/大）

---

## 实现计划

设计已完成，下一步：

1. ✅ 使用 git worktree 创建隔离的工作空间
2. ✅ 创建详细的 implementation plan
3. ✅ 按照 checklist 实现功能
4. ✅ 测试验证
5. ✅ 合并到主分支

---

## 相关文件

- 组件：`src/app/shared/ui/ai-chat/chat-messages-card/chat-messages-card.component.ts`
- 样式：`src/app/shared/ui/ai-chat/chat-messages-card/chat-messages-card.component.css`
- 类型：`src/app/shared/ui/ai-chat/types/card-state.interface.ts`
- Demo：`src/app/demo/ai-chat-messages-card/demo-ai-chat-messages-card.component.ts`

---

**设计完成** ✅
