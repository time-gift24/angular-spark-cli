# Streaming Markdown Phase 3 - 后续任务执行提示词

## 📋 任务执行指南

> **创建日期**: 2026-02-01
> **当前分支**: `feature/streaming-markdown-phase3`
> **工作目录**: `/Users/wanyaozhong/Projects/angular-spark-cli/.worktrees/streaming-markdown-phase3`

---

## ✅ 已完成工作总结

### 1. 核心问题修复

**问题**: Code 代码块没有实际渲染（内容为空）

**根本原因**: `ShiniHighlighter.initialize()` 从未被调用，导致语法高亮器处于未就绪状态

**解决方案**:
- 在 `StreamingMarkdownComponent.ngOnInit()` 中添加 `shini.initialize()` 调用
- 使用异步非阻塞初始化，不影响流式渲染

**代码变更**:
```typescript
// streaming-markdown.component.ts
constructor(
  private preprocessor: MarkdownPreprocessor,
  private parser: BlockParser,
  private cdr: ChangeDetectorRef,
  private shini: ShiniHighlighter  // 新增注入
) {}

ngOnInit(): void {
  // 异步初始化 Shini（不阻塞流式渲染）
  this.shini.initialize().then(() => {
    console.log('[StreamingMarkdownComponent] Shini initialized successfully');
  }).catch((error) => {
    console.error('[StreamingMarkdownComponent] Shini initialization failed:', error);
  });

  this.subscribeToStream();
}
```

### 2. UI 样式优化

**变更文件**: `code-block-wrapper.component.css`

**Copy 按钮优化**:
- 移除背景色和边框（透明背景）
- 默认状态使用 `--muted-foreground` 柔和灰色
- 悬停时显示浅色背景 `--muted`
- 移除到代码块上方，右对齐

**语言标签样式**:
- 使用 `--secondary` 颜色
- 文字使用 `--secondary-foreground` 确保对比度
- 与 Copy 按钮并排在右侧

**整体间距优化** (Ultra Compact 设计):
- 标题下边距: `0` (完全移除)
- 段落上边距: `0` (完全移除)
- 块之间间距: `var(--spacing-sm)` (4px)
- 标题上边距: `var(--spacing-md)` (8px)

---

## 🏗️ 当前架构状态

### 使用中的架构

**注意**: 当前仍在使用 **旧架构** (innerHTML 方式)，尚未切换到 Phase 3 的新组件架构。

**数据流**:
```
Observable<T> stream$
  ↓
StreamingMarkdownComponent (流管理器)
  ↓
BlockParser (解析块)
  ↓
BlockRendererComponent (使用 innerHTML)
  ↓
MarkdownFormatterServiceExtended
  ↓
ShiniHighlighter (现已正确初始化) ✅
  ↓
CodeBlockWrapperComponent
```

### 关键文件位置

**核心组件**:
```
src/app/shared/components/streaming-markdown/
├── streaming-markdown.component.ts    # 主控制器 (已修复)
├── core/
│   ├── models.ts                       # 数据结构定义
│   ├── block-parser.ts                 # 块解析器
│   ├── markdown-preprocessor.ts        # 预处理器
│   ├── shini-highlighter.ts            # Shiki 适配器 (已初始化)
│   └── theme.service.ts                # 主题管理
├── renderers/
│   ├── block-renderer.component.ts     # 块渲染器 (innerHTML)
│   ├── code-block-wrapper.component.ts # 代码块包装器
│   ├── code-block-wrapper.component.html
│   └── code-block-wrapper.component.css # 已优化样式
└── blocks/
    ├── heading/heading.component.ts    # 新组件 (未使用)
    ├── paragraph/paragraph.component.ts
    ├── code/code.component.ts
    └── list/list.component.ts
```

**Demo 页面**:
```
src/app/demo/streaming-markdown/
├── demo-streaming-markdown.component.ts
├── demo-streaming-markdown.component.html
└── mock-ai.service.ts                  # 模拟 AI 流
```

---

## 🎯 后续任务重点

### Phase 3: Block Components 实现

**目标**: 替换 innerHTML 架构为结构化组件架构

**当前状态**: Phase 3 组件已创建但 **未集成使用**

**需要实现的组件**:

1. **MarkdownBlockRouterComponent** (未创建)
   - 根据 `block.type` 路由到对应子组件
   - 处理未知类型降级
   - 使用 `@switch` 模板语法

2. **MarkdownHeadingComponent** ✅ 已存在
   - 渲染 h1-h6 标题
   - 文件: `blocks/heading/heading.component.ts`

3. **MarkdownParagraphComponent** ✅ 已存在
   - 渲染段落
   - 支持内联格式
   - 文件: `blocks/paragraph/paragraph.component.ts`

4. **MarkdownCodeComponent** ✅ 已存在
   - 渲染代码块
   - 集成 Shini 高亮
   - 文件: `blocks/code/code.component.ts`

5. **MarkdownListComponent** ✅ 已存在
   - 渲染列表（有序/无序）
   - 支持嵌套
   - 文件: `blocks/list/list.component.ts`

6. **MarkdownBlockquoteComponent** (可能未创建)
   - 渲染引用块
   - 文件: `blocks/blockquote/` (需要检查)

### 集成步骤

**Step 1**: 创建 `MarkdownBlockRouterComponent`
```typescript
@Component({
  selector: 'app-markdown-block-router',
  template: `
    @switch (block.type) {
      @case ('heading') {
        <app-markdown-heading [...props] />
      }
      @case ('paragraph') {
        <app-markdown-paragraph [...props] />
      }
      @case ('code') {
        <app-markdown-code [...props] />
      }
      @case ('list') {
        <app-markdown-list [...props] />
      }
      @case ('blockquote') {
        <app-markdown-blockquote [...props] />
      }
      @default {
        <app-markdown-paragraph [content]="block.raw || ''" />
      }
    }
  `
})
export class MarkdownBlockRouterComponent {}
```

**Step 2**: 更新 `StreamingMarkdownComponent` 模板
```html
<!-- 旧架构 -->
<app-block-renderer [block]="block" />

<!-- 新架构 -->
<app-markdown-block-router [block]="block" />
```

**Step 3**: 移除旧组件
- 删除 `MarkdownFormatterService` (如果新架构不需要)
- 删除 `BlockRendererComponent`
- 更新依赖注入

---

## ⚠️ 技术债务与注意事项

### 1. BlockType 枚举值

**问题**: 代码中使用不同的块类型标识符

**检查点**:
```typescript
// 可能的枚举值
BlockType.CODE_BLOCK  // 旧值?
BlockType.CODE        // 新值?

// 需要确认正确的枚举值
```

**位置**: `src/app/shared/components/streaming-markdown/core/models.ts`

### 2. 样式封装

**当前状态**: 使用全局 CSS + `::ng-deep` 穿透

**新架构目标**: 每个组件独立封装样式

**迁移策略**:
1. 将 `.markdown-block` 样式迁移到各组件 CSS
2. 使用 `@component` 样式封装
3. 移除 `::ng-deep` 依赖

### 3. Shini 初始化时机

**当前实现**: 在 `StreamingMarkdownComponent.ngOnInit()` 初始化

**潜在问题**:
- 多个组件实例可能重复初始化
- 初始化是异步的，早期流式内容可能使用 fallback

**改进建议**:
- 考虑使用 `APP_INITIALIZER` 在应用启动时初始化
- 或确保初始化完成后再开始流式渲染

### 4. 测试覆盖

**当前状态**: 缺少新组件的单元测试

**需要补充**:
- `MarkdownBlockRouterComponent` 测试
- 路由逻辑测试
- 边界情况测试
- 集成测试

---

## 🔧 开发环境设置

### Angular Dev Server
```bash
npm start
# 访问: http://localhost:4200/demo/streaming-markdown
```

### 运行测试
```bash
npm test
```

### 构建
```bash
npm run build
```

---

## 📊 验证检查清单

在提交代码前，确保以下检查通过：

### 功能性
- [ ] 代码块正确渲染（包含实际代码内容）
- [ ] Shiki 语法高亮正常工作
- [ ] Copy 按钮功能正常
- [ ] 流式渲染保持流畅
- [ ] 所有块类型正确渲染

### 样式
- [ ] 符合"矿物与时光"设计系统
- [ ] Ultra compact 间距系统
- [ ] Copy 按钮无背景/边框
- [ ] 语言标签使用 --secondary 颜色
- [ ] 工具栏右对齐在代码块上方

### 性能
- [ ] Shini 初始化不阻塞渲染
- [ ] OnPush 变更检测策略生效
- [ ] 无内存泄漏

### 代码质量
- [ ] TypeScript 编译无错误
- [ ] ESLint 检查通过
- [ ] 单元测试通过
- [ ] E2E 测试通过

---

## 🚀 快速开始命令

```bash
# 1. 切换到工作目录
cd /Users/wanyaozhong/Projects/angular-spark-cli/.worktrees/streaming-markdown-phase3

# 2. 启动开发服务器
npm start

# 3. 访问 Demo 页面
open http://localhost:4200/demo/streaming-markdown

# 4. 点击 "Start Streaming" 按钮测试

# 5. 检查浏览器控制台
# 应该看到:
# [StreamingMarkdownComponent] Shini initialized successfully
# [ShiniHighlighter] codeToHtml returned: {htmlLength: ..., hasStyle: true}
```

---

## 📝 提交信息规范

### Fix 格式
```
fix(streaming-markdown): initialize ShiniHighlighter to enable code rendering

- Add shini.initialize() call in ngOnInit()
- Fix empty code blocks issue
- Code blocks now render with syntax highlighting

Closes #XXX
```

### Style 格式
```
style(streaming-markdown): optimize code block toolbar and spacing

- Remove background and border from copy button
- Move toolbar above code content, right-aligned
- Apply ultra compact spacing system
- Use --secondary color for language tags

Closes #XXX
```

---

## 📚 参考文档

- **架构设计**: `docs/2026-02-01-streaming-markdown-refactoring-architecture.md`
- **头脑风暴**: `docs/2026-02-01-streaming-markdown-architecture-refactoring-brainstorm.md`
- **问题总结**: `docs/ISSUE_SUMMARY.md`
- **设计系统**: `CLAUDE.md` (矿物与时光岩彩主题)

---

## 🎨 设计系统速查

### 间距系统
```css
--spacing-xs: 0.125rem;  /* 2px */
--spacing-sm: 0.25rem;   /* 4px */
--spacing-md: 0.5rem;    /* 8px */
--spacing-lg: 0.75rem;   /* 12px */
--spacing-xl: 1rem;      /* 16px */
```

### 圆角系统
```css
--radius: 0.25rem;        /* 4px - 基础圆角 */
--radius-sm: 3px;
--radius-md: 4px;
--radius-lg: 5px;
```

### 颜色变量
```css
--background            # 绢黄 (背景)
--foreground            # 深灰 (主文本)
--primary               # 石绿 (主色)
--secondary             # 浅绢黄 (次要)
--muted                 # 柔和背景
--muted-foreground      # 柔和文本
```

---

## 🔍 调试技巧

### 查看浏览器控制台
```javascript
// 应该看到的日志
[StreamingMarkdownComponent] Shini initialized successfully
[ShiniHighlighter] codeToHtml returned: {htmlLength: 2427, hasStyle: true}
```

### Playwright 验证
```bash
# 运行验证脚本
cd ~/.claude/plugins/cache/playwright-skill/playwright-skill/4.1.0/skills/playwright-skill
node run.js /tmp/playwright-test-console-debug.js
```

---

**祝开发顺利！** 🚀
