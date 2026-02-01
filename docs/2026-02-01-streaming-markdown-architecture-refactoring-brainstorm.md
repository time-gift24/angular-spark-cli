# Streaming Markdown 架构重构设计

**日期**: 2026-02-01
**状态**: 🎯 设计完成，待实施
**设计目标**: 解决 innerHTML 导致的样式封装失效和缺乏 Angular 特性问题

---

## 📋 问题陈述

### 当前架构的痛点

根据 `docs/ISSUE_SUMMARY.md` 的分析，当前 streaming markdown 组件存在以下架构问题：

1. **innerHTML inflexibility** ⭐ 核心问题
   - 无法使用 Angular 的模板特性（指令、管道、组件嵌套）
   - 样式封装失效，被迫使用全局 CSS
   - 无法实现交互功能（如代码块复制按钮）

2. **依赖链过长**
   ```
   StreamingMarkdownComponent (7层抽象)
     → MarkdownFormatterService
       → ShiniHighlighter
         → ThemeService
           → CodeBlockWrapper (innerHTML)
             → 全局 CSS
   ```

3. **样式管理混乱**
   - 破坏了组件封装
   - 全局命名空间污染
   - 调试困难

### 架构评分

| 维度 | 当前评分 | 目标评分 |
|------|---------|---------|
| 关注点分离 | ⭐⭐⭐⭐☆ | ⭐⭐⭐⭐⭐ |
| 样式管理 | ⭐⭐☆☆☆ | ⭐⭐⭐⭐⭐ |
| 可维护性 | ⭐⭐⭐☆☆ | ⭐⭐⭐⭐⭐ |
| 性能优化 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| 可扩展性 | ⭐⭐⭐⭐☆ | ⭐⭐⭐⭐⭐ |

---

## 🎯 MVP 范围

### Must Have（核心目标）

- ✅ 替换 innerHTML 为结构化模板
- ✅ 保留流式渲染能力（字符逐个显示）
- ✅ 保持 Shiki 语法高亮
- ✅ 恢复组件样式封装
- ✅ 支持 5 种核心块类型：
  - Headings (h1-h6)
  - Paragraphs
  - Code blocks (with syntax highlighting)
  - Lists (ordered/unordered, nested)
  - Blockquotes

### Parked for Later（未来改进）

- 📋 自定义块类型（tables, callouts, embeds）
- 📋 交互式代码块（复制按钮、执行按钮）
- 📋 嵌套组件支持（在 markdown 中使用 Angular 组件）
- 📋 自定义 Angular 指令支持
- 📋 结构化 Token 渲染（替代 Shiki HTML 输出）

---

## 🏗️ 架构设计

### 核心架构转型

**Before（当前架构）：**
```
MarkdownBlock
  → MarkdownFormatterService
    → HTML String
      → innerHTML
        → 样式封装失效 ❌
```

**After（新架构）：**
```
MarkdownBlock
  → MarkdownBlockRouter
    → 专用 Block 组件
      → 结构化模板
        → 样式封装 ✅
```

### 关键变化

1. **移除 MarkdownFormatter**
   - 不再将所有块转为 HTML 字符串
   - 每个块类型有独立的 Angular 组件

2. **引入 MarkdownBlockRouter 组件**
   - 根据 `block.type` 路由到对应的子组件
   - 模板版本的 switch 语句
   - 保持流式渲染能力

3. **专用 Block 组件系列**
   - `app-markdown-heading` - 渲染 h1-h6
   - `app-markdown-paragraph` - 渲染段落
   - `app-markdown-code` - 保留 Shiki 高亮
   - `app-markdown-list` - 处理列表嵌套
   - `app-markdown-blockquote` - 渲染引用

### 数据流

```
Observable<MarkdownBlock[]>
  ↓
StreamingMarkdownComponent (流管理器)
  ↓
@for (block of blocks(); track block.id) {
  <app-markdown-block-router [block]="block" />
}
  ↓
MarkdownBlockRouter 根据 block.type 分发：
  - HEADING → <app-markdown-heading />
  - PARAGRAPH → <app-markdown-paragraph />
  - CODE → <app-markdown-code />
  - LIST → <app-markdown-list />
  - BLOCKQUOTE → <app-markdown-blockquote />
```

---

## 🧩 组件职责划分

### StreamingMarkdownComponent（流管理器）

**职责：**
- 订阅 `Observable<T>` 流
- 调用 `MarkdownPreprocessor` 修正语法
- 调用 `BlockParser` 解析块
- 管理 `blocks` Signal（响应式状态）
- 处理流式状态（streaming/completed）
- **不再负责格式化逻辑**

**输入/输出：**
```
输入: Observable<T> (stream$)
输出: Signal<MarkdownBlock[]> (blocks)
```

---

### MarkdownBlockRouterComponent（智能路由器）

**职责：**
- 接收单个 `MarkdownBlock`
- 根据 `block.type` + `block.level` 选择渲染组件
- 传递必要的 props（content, level, metadata）
- 处理未知块类型（降级到纯文本）

**路由逻辑：**
```
输入: block: MarkdownBlock

switch (block.type) {
  case HEADING:
    → <app-markdown-heading [level]="block.level" [content]="block.content" />

  case PARAGRAPH:
    → <app-markdown-paragraph [content]="block.content" />

  case CODE:
    → <app-markdown-code
         [language]="block.language"
         [code]="block.content"
         [streaming]="block.streaming"
       />

  case LIST:
    → <app-markdown-list
         [items]="block.items"
         [ordered]="block.ordered"
       />

  case BLOCKQUOTE:
    → <app-markdown-blockquote [content]="block.content" />

  default:
    → <app-markdown-paragraph [content]="block.raw || ''" />
}
```

---

### 专用 Block 组件

#### app-markdown-heading
- 接收 `level` (1-6) 和 `content`
- 使用 `<h[level]>` 动态标签
- 应用主题样式变量
- 完全样式封装

#### app-markdown-paragraph
- 接收 `content` 文本
- 渲染 `<p>` 标签
- 支持内联格式（**bold**, *italic*, `code`）
- 可以嵌套 `<app-markdown-inline-code>`

#### app-markdown-code
- 保留 Shiki 高亮逻辑
- 接收 `language`, `code`, `streaming` 状态
- 调用 `ShiniHighlighter`（复用现有服务）
- **关键差异**: 不再用 innerHTML 渲染整个容器，仅用于高亮后的代码
- 使用 CSS 类而非全局样式

#### app-markdown-list
- 接收 `items` 数组和 `ordered` 布尔值
- 支持嵌套列表（递归渲染）
- 使用 `<ol>` 或 `<ul>`
- 每个 `<li>` 可包含嵌套内容

#### app-markdown-blockquote
- 渲染 `<blockquote>` 或带边框的 `<div>`
- 应用主题色（`--primary` 边框）
- 支持嵌套块

---

## 📊 数据流与状态管理

### 流式渲染保留策略

**关键约束：** 必须保持当前的流式体验（字符逐个显示）

**当前问题：**
```
流式更新 → MarkdownFormatter.formatBlock() → 完整 HTML 字符串 → 整块替换 ❌
```

**新策略：**
```
流式更新 → Block.content 追加字符 → Signal 更新 → 局部 re-render ✅
```

### 信号依赖链

```
// 输入流
stream$: Observable<string>

// 内部状态
preprocessedChunks = signal<string[]>([])
parsedBlocks = signal<MarkdownBlock[]>([])
isStreaming = signal<boolean>(true)

// 依赖逻辑
stream$.pipe(
  debounceTime(10),  // 防抖
  bufferTime(50)     // 批量处理
).subscribe(chunk => {
  // 1. 追加到 preprocessedChunks
  // 2. 调用 MarkdownPreprocessor
  // 3. 调用 BlockParser
  // 4. 更新 parsedBlocks
  // 5. Angular 检测变化 → 仅更新的 block re-render
})
```

### OnPush 优化

```
每个 Block 组件：
- 输入: @Input() block: MarkdownBlock
- 策略: OnPush
- 结果: 只有 block 对象引用改变时才 re-render

性能优势：
- 字符追加时，只有当前 streaming block 更新
- 已完成的 block 不重新渲染
- 利用 Angular 的细粒度变更检测
```

### Block 数据结构（增强版）

**当前结构：**
```typescript
interface MarkdownBlock {
  type: BlockType
  content: string
  level?: number
  streaming: boolean
}
```

**新结构（支持结构化渲染）：**
```typescript
interface MarkdownBlock {
  id: string  // 唯一标识，用于 trackBy

  type: BlockType
  subtype?: 'heading' | 'ordered' | 'unordered'

  // 原始内容（用于代码块）
  rawContent?: string

  // 结构化内容（用于段落、列表）
  content?: string
  children?: MarkdownInline[]  // 内联元素数组

  // 元数据
  level?: number        // heading level
  language?: string     // code language
  items?: MarkdownBlock[]  // 嵌套列表
  streaming?: boolean

  // 高亮相关（代码块专用）
  highlightedHTML?: string
  tokens?: SyntaxToken[]  // 结构化 token（未来）
}
```

### CodeBlock 特殊处理

**Shiki 高亮集成策略：**

```
当前流程:
MarkdownFormatter.formatCodeBlock()
  → ShiniHighlighter.highlight()
  → 返回 HTML 字符串
  → CodeBlockWrapper [innerHTML] ❌

新流程:
MarkdownCodeComponent:
  输入: code, language, streaming

  ngOnChanges():
    if (code 变化 && !streaming) {
      ShiniHighlighter.highlight(code, language)
        → 生成 highlightedHTML
        → 存入 Signal
    }

  模板:
    @if (highlightedHTML(); as html) {
      <pre [innerHTML]="html" />  // 仅代码块保留 innerHTML
    } @else {
      <pre>{{ rawCode }}</pre>
    }
```

**为什么代码块可以保留 innerHTML：**
- Shiki 输出的是静态 HTML + inline styles
- 不需要 Angular 交互功能
- 样式已经内联，不受 ViewEncapsulation 影响

---

## 🛡️ 错误处理与降级策略

### 分层错误处理

**原则：** 每一层独立处理错误，不向上传播，确保用户始终看到内容

### Layer 1: StreamingMarkdownComponent（流层）

**错误场景：**
- Observable 流中断
- Preprocessor 失败
- BlockParser 失败

**处理策略：**
```
stream$.pipe(
  catchError((error) => {
    // 记录错误
    console.error('[StreamingMarkdown] Stream error:', error)

    // 降级策略：显示已接收的内容
    return of(preprocessedChunks())
  })
)

Preprocessor 失败:
  → 返回原始 chunk（不处理）
  → 标记为 RAW 类型
  → 传递给下一层

Parser 失败:
  → 将整个 chunk 作为单个 PARAGRAPH block
  → 不中断流，继续处理后续 chunk
```

### Layer 2: MarkdownBlockRouter（路由层）

**错误场景：**
- 未知 block.type
- 缺少必需属性（如 heading 缺少 level）
- Block 数据结构损坏

**处理策略：**
```
输入验证:
  if (!block.id || !block.type) {
    console.warn('[BlockRouter] Invalid block:', block)
    → 降级到 <app-markdown-fallback />
  }

未知类型:
  switch (block.type) {
    case HEADING: ...
    case PARAGRAPH: ...
    default:
      console.warn(`[BlockRouter] Unknown type: ${block.type}`)
      → 降级到 <app-markdown-paragraph [content]="block.raw || ''" />
  }
```

### Layer 3: 专用 Block 组件（渲染层）

#### app-markdown-code 错误处理

**错误场景：**
- Shiki 初始化失败
- 语言不支持
- 高亮超时

**处理策略：**
```
ShiniHighlighter.highlight(code, language)
  .pipe(
    timeout(5000),  // 5秒超时
    catchError((error) => {
      console.warn('[CodeBlock] Highlight failed:', error)

      // 降级：显示原始代码（无高亮）
      return of({
        html: escapeHtml(code),  // HTML 转义
        fallback: true
      })
    })
  )

模板:
  @if (highlightResult(); as result) {
    @if (result.fallback) {
      <pre class="code-fallback">{{ rawCode }}</pre>
    } @else {
      <pre [innerHTML]="result.html" />
    }
  }
```

#### app-markdown-list 错误处理

**错误场景：**
- items 数组为空或损坏
- 嵌套层级过深（>10层）

**处理策略：**
```
输入验证:
  if (!Array.isArray(block.items) || block.items.length === 0) {
    → 降级到 <app-markdown-paragraph [content]="block.raw" />
  }

递归深度限制:
  if (currentDepth > 10) {
    console.warn('[ListBlock] Max nesting depth exceeded')
    → 停止递归，显示为纯文本
  }
```

### 错误边界（Error Boundary）

**全局错误捕获：**
```
StreamingMarkdownComponent:
  @Component({
    host: {
      '(error)': 'handleGlobalError($event)'
    }
  })

  handleGlobalError(error: Error) {
    console.error('[StreamingMarkdown] Unhandled error:', error)

    // 显示友好的错误消息
    this.error = {
      message: 'Failed to render markdown',
      retry: () => this.retry()
    }
  }
```

---

## 🧪 测试策略

### 测试金字塔

```
        E2E (10%)
       ─────────
      集成测试 (20%)
     ────────────────
    单元测试 (70%)
   ──────────────────────
```

### 1. 单元测试（Component Testing）

**测试矩阵：**

| 组件 | 测试场景 | Mock 依赖 |
|------|---------|----------|
| **MarkdownBlockRouter** | - 路由到正确的子组件<br>- 未知类型降级到 paragraph<br>- 输入验证失败处理 | 无 |
| **MarkdownParagraph** | - 纯文本渲染<br>- 内联格式（**bold**, *italic*）<br>- 空内容处理 | 无 |
| **MarkdownHeading** | - level 1-6 正确渲染<br>- 无效 level 降级到 h6<br>- 内容为空显示占位符 | 无 |
| **MarkdownCode** | - Shiki 高亮成功<br>- 高亮失败降级到纯文本<br>- streaming 状态正确显示<br>- 超时处理 | ShiniHighlighter |
| **MarkdownList** | - 有序列表渲染<br>- 无序列表渲染<br>- 嵌套列表（最多3层）<br>- 空数组降级 | 无 |
| **MarkdownBlockquote** | - 渲染带边框的 blockquote<br>- 嵌套内容渲染<br>- 空内容处理 | 无 |

### 2. 集成测试（Integration Testing）

**测试场景：**

```
场景 1: 完整流式渲染
  输入: Observable<string> (模拟 LLM 流)
  验证:
    - StreamingMarkdownComponent 接收流
    - BlockParser 正确分块
    - MarkdownBlockRouter 正确路由
    - 每个 Block 组件正确渲染
    - streaming 状态正确传播

场景 2: 错误恢复
  输入: 模拟 Preprocessor 失败
  验证:
    - 降级到 paragraph 渲染
    - 用户看到原始内容
    - 流不中断

场景 3: 状态同步
  输入: 多个 chunk 快速到达
  验证:
    - Signal 更新正确
    - OnPush 变更检测生效
    - 只有变化的 block re-render
```

### 3. E2E 测试（Playwright）

**测试用例：**

| 用例 | 验证点 | 测试方法 |
|------|--------|---------|
| **列表样式** | - list-style-type: disc<br>- margin-left: 8px<br>- 嵌套缩进正确 | `getComputedStyle()` |
| **段落间距** | - margin-top: 8px<br>- margin-bottom: 8px | `getComputedStyle()` |
| **流式效果** | - 字符逐个显示<br>- streaming 指示器闪烁 | 等待 + 断言文本内容 |
| **代码高亮** | - Shiki token 颜色正确<br>- 背景色正确 | 断言 CSS 变量 |
| **主题切换** | - light/dark 模式切换<br>- 样式正确应用 | 切换 class + 断言 |
| **错误降级** | - 高亮失败显示原始代码<br>- 错误提示可见 | 模拟网络失败 + 断言 |

**复用现有测试：**
```
已有的 docs/ISSUE_SUMMARY.md 中的 Playwright 测试:
- 列表样式验证 ✅
- 段落间距验证 ✅

新增测试:
- 代码块高亮验证
- 流式效果验证
- 错误降级验证
```

### 4. 性能测试

**测试指标：**

```
指标 1: 首次渲染时间
  方法: performance.mark()
  目标: < 100ms (1000 blocks)

指标 2: 增量更新时间
  方法: 追加单个字符 + 测量 re-render 时间
  目标: < 16ms (60fps)

指标 3: 内存占用
  方法: Chrome DevTools Memory profiler
  目标: < 50MB (10000 blocks)

指标 4: Signal 更新频率
  方法: spyOn 并计数
  目标: 每个流式 chunk 最多 1 次 Signal 更新
```

### 5. 可访问性测试

**测试清单：**

```
✓ 语义化 HTML (h1-h6, p, ul/ol, blockquote)
✓ ARIA 标签（streaming 状态）
✓ 键盘导航（可聚焦元素）
✓ 屏幕阅读器兼容（NVDA 测试）
✓ 颜色对比度（使用 axe DevTools）
✓ 焦点管理（错误恢复后焦点位置）
```

### 测试优先级

**Phase 1 (MVP):**
- ✅ 单元测试：所有 Block 组件
- ✅ 集成测试：完整流式渲染场景
- ✅ E2E 测试：复用现有的列表/段落测试

**Phase 2 (后续):**
- 性能测试
- 可访问性测试
- 高级场景测试

---

## 🎁 Future/Divergent Ideas

以下想法被 parked，留待未来迭代：

### 1. 高级块类型支持
- **表格块** - 专门的表格渲染组件，支持对齐、合并单元格
- **Callout 块** - 类似 Notion 的提示块（info, warning, success, error）
- **代码块交互** - 复制按钮、语言切换、代码执行
- **嵌入块** - 支持嵌入 YouTube、Twitter、其他组件

### 2. 结构化 Token 渲染
- 替代 Shiki 的 HTML 输出
- 使用 Angular 组件渲染每个 token
- 实现语法高亮的完全控制
- 支持自定义 token 主题

### 3. 自定义 Angular 指令支持
- 允许在 markdown 中使用 Angular 指令
- 例如：`<p highlight>重要内容</p>`
- 需要编译器集成和安全性考虑

### 4. 组件嵌套
- 在 markdown 中嵌入 Angular 组件
- 例如：`<app-chart [data]="..." />`
- 需要动态组件加载器

### 5. Markdown 编辑器
- 双向绑定（编辑 + 预览）
- 实时转换
- 协同编辑支持

### 6. 导出功能
- 导出为 PDF
- 导出为纯 HTML
- 保留样式的高亮代码导出

---

## 📈 实施检查清单

### Phase 1: 基础架构（MVP）

- [ ] 创建 `MarkdownBlockRouterComponent`
- [ ] 创建 `MarkdownHeadingComponent`
- [ ] 创建 `MarkdownParagraphComponent`
- [ ] 创建 `MarkdownCodeComponent`（集成 Shiki）
- [ ] 创建 `MarkdownListComponent`（支持嵌套）
- [ ] 创建 `MarkdownBlockquoteComponent`
- [ ] 更新 `StreamingMarkdownComponent`（移除 MarkdownFormatter）
- [ ] 更新 Block 数据结构（添加 id, children 等）
- [ ] 迁移全局 CSS 到组件样式
- [ ] 编写单元测试（每个组件）
- [ ] 编写集成测试（流式渲染场景）
- [ ] 更新 E2E 测试（复用现有测试）

### Phase 2: 错误处理

- [ ] 实现分层错误处理
- [ ] 添加错误边界（Error Boundary）
- [ ] 实现降级策略
- [ ] 添加错误日志
- [ ] 编写错误场景测试

### Phase 3: 性能优化

- [ ] 验证 OnPush 变更检测
- [ ] 性能测试（首次渲染、增量更新）
- [ ] 内存优化（大量 blocks）
- [ ] Signal 更新频率优化
- [ ] 添加性能监控

### Phase 4: 清理与文档

- [ ] 删除旧的 `MarkdownFormatter`
- [ ] 删除 `CodeBlockWrapper`（如果不再需要）
- [ ] 删除全局 CSS（已迁移到组件）
- [ ] 更新 `docs/ARCHITECTURE_ANALYSIS.md`
- [ ] 更新 `docs/QUICK_REFERENCE.md`
- [ ] 添加架构图

---

## 🎯 成功标准

### 功能性
- ✅ 所有 5 种核心块类型正确渲染
- ✅ 流式渲染保持流畅（字符逐个显示）
- ✅ Shiki 语法高亮正常工作
- ✅ 样式封装恢复（不再依赖全局 CSS）
- ✅ 错误降级正常工作

### 性能
- ✅ 首次渲染时间 < 100ms (1000 blocks)
- ✅ 增量更新时间 < 16ms (60fps)
- ✅ 内存占用 < 50MB (10000 blocks)

### 可维护性
- ✅ 架构评分提升到 4.5/5
- ✅ 单元测试覆盖率 > 80%
- ✅ 集成测试覆盖核心场景
- ✅ E2E 测试复用通过

### 可访问性
- ✅ WCAG AA 合规
- ✅ 语义化 HTML
- ✅ 键盘导航支持
- ✅ 屏幕阅读器兼容

---

**文档创建**: 2026-02-01
**状态**: 🎯 设计完成，待实施
**下一步**: 创建实施计划 → 使用 git worktree 隔离开发环境
