# MainLayout + LLM Hybrid Dock Design

> Date: 2026-02-11  
> Status: Approved for implementation  
> Scope: Production path only (demo/dev-only pages are out of scope)

## 1. Architecture and boundaries

本次改版将当前 AI 面板从“浮层思路”重构为“页面布局思路”：

- 主体布局改为左右分区，基于 `MainLayout` 承载
- 顶部增加悬浮导航栏（简化版 A）：仅 Logo + 路由入口 + LLM 开关
- 右侧 LLM 区改为混合态（`pinned` / `collapsed`）
- 默认状态为 `pinned`（首次进入即展开）

明确边界如下：

- 不使用 demo 页面实现作为主路径依赖
- demo 仅在 dev 模式存在，不参与本次主改造
- 不增加“小屏自动收起”等兜底规则
- 保留多会话能力，不退化为单会话
- 移除右栏顶部 `PanelHeader`，会话管理入口保留在 tab 右键菜单

布局策略：

- 左侧主视图优先，最大化可视面积
- 右侧仅在 `pinned` 时占据布局宽度，在 `collapsed` 时释放空间
- 右侧宽度可拖拽，范围 `320px - 520px`

## 2. Components and responsibilities

### 2.1 `MainLayoutComponent`（主骨架）

职责：

- 渲染顶部悬浮导航
- 承载左侧主视图区（业务路由内容）
- 承载右侧 LLM Dock 容器（混合态）
- 以 CSS/Tailwind 为主做布局与响应式

不负责：

- 会话 CRUD
- 消息流式处理
- LLM 请求实现

### 2.2 `TopFloatingNavComponent`（新增）

职责：

- 顶部轻量导航（A 方案）
- 提供 LLM 开关按钮（切换 `pinned/collapsed`）

不负责：

- 会话切换与会话管理

### 2.3 `LlmDockPanelComponent`（新增或重构现有容器）

职责：

- 右栏混合态容器（固定/收起）
- 拖拽宽度预览与提交
- 在内部组合聊天组件链路（tabs、消息区、输入区）

不负责：

- 多会话业务逻辑本身（由状态服务负责）

### 2.4 复用现有聊天链路组件

- `SessionTabsBarComponent`：保留会话切换、右键菜单（重命名/删除）
- `MessageList / MessageBubble / StreamingMarkdown`：保留消息展示
- `ChatInputComponent`：保留发送行为，移除 liquid 视觉依赖

## 3. Data flow and state management

状态拆分为两条主线，避免耦合：

### 3.1 布局状态（`AiChatStateService`）

新增/扩展字段：

- `dockMode: 'pinned' | 'collapsed'`
- `dockWidth: number`（默认建议 `420`，边界 `320-520`）
- `panelWidth` 与新字段统一收敛（避免双语义并存）

新增行为：

- `toggleDockMode()`
- `setDockMode(mode)`
- `setDockWidth(width)`（内部 clamp）

持久化：

- 新增 localStorage keys：`ai-chat-dock-mode`、`ai-chat-dock-width`
- 首次无缓存时默认 `pinned`

### 3.2 会话状态（`SessionStateService`）

保持现有职责不变：

- 会话列表、激活会话、消息追加、流式响应、输入草稿

关键原则：

- 布局状态不进入 `SessionStateService`
- 会话状态不进入 `AiChatStateService`

### 3.3 交互流

1. 顶部按钮点击 -> `toggleDockMode()`
2. `pinned` 时拖拽 -> 组件内 preview -> mouseup 后 `setDockWidth()`
3. 右键 tab 菜单 -> 重命名/删除 -> `SessionStateService`

## 4. Error handling and edge cases

### 4.1 布局与交互边界

- 拖拽过程中临时禁用文本选中，避免误选
- 拖拽提交后再写存储，避免高频写入
- `dockWidth` 非法值统一 clamp 到 `320-520`

### 4.2 可用性边界

- 不加自动收起规则（按需求明确）
- 在窄视口下仍保持当前模式与宽度语义
- 容器溢出由 CSS 处理（独立滚动区），避免 JS 兜底布局

### 4.3 样式降级策略

- 响应式优先使用 Tailwind 断点与 CSS 变量
- 若高级视觉特性不可用，退化为普通边框+阴影，不影响功能

### 4.4 输入视觉一致性

- `ChatInput` 去 liquid，统一为紧凑实体风格
- 删除确认弹窗可后续统一去 liquid（本次优先主链路）

## 5. Testing strategy

### 5.1 Unit tests

`AiChatStateService`：

- 默认 `dockMode === 'pinned'`
- 默认宽度与 clamp 逻辑
- 持久化读写与恢复

### 5.2 Component tests

`MainLayoutComponent`：

- `pinned/collapsed` 两态下 class 与结构切换正确
- 顶部导航按钮能切换右栏状态

`LlmDockPanelComponent`：

- 拖拽预览与提交行为正确
- 宽度边界生效

### 5.3 E2E tests

- 首次进入默认右栏展开
- 收起/展开状态切换正常
- 宽度拖拽后刷新可恢复
- 多会话切换、右键重命名/删除可用（无顶部 header 前提下）

### 5.4 Visual regression

- 紧凑排版基线截图：顶部栏、左右分区、右栏消息区、输入区

## 6. Rollout and migration notes

分三步迁移，保证可控：

1. **Layout phase**  
   落地 `MainLayout` 新骨架 + 顶部悬浮导航，右栏先接现有聊天容器。

2. **Dock phase**  
   引入 `dockMode/dockWidth` 与拖拽逻辑，完成混合态行为与持久化。

3. **Visual phase**  
   去除输入区 liquid，统一紧凑字体/行高/间距；移除主链路 `PanelHeader`。

验收标准：

- 默认右栏固定展开
- 可切换收起/固定
- 拖拽宽度范围正确且可恢复
- 左侧主视图区明显增大
- 多会话链路完整（切换、重命名、删除、发送、流式）

