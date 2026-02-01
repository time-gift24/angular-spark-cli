# Streaming Markdown - 快速参考

> **问题**: 列表样式缺失 + 段落间距缺失
> **原因**: Angular ViewEncapsulation 无法穿透 innerHTML
> **解决**: 使用全局 CSS (`src/styles.css`)

---

## 🔴 问题根源

### 为什么样式没有渲染？

```typescript
// BlockRendererComponent.ts
@Component({ template: `<div [innerHTML]="formattedContent()"></div>` })
export class BlockRendererComponent {
  // innerHTML 插入的元素没有 _ngcontent 属性
  // 导致 ViewEncapsulation 的 CSS 选择器无法匹配
}
```

**问题演示**:
```css
/* 组件 CSS (编译后) */
.markdown-block[_ngcontent-ng-c123] p[_ngcontent-ng-c123] {
  margin: 8px;  /* ❌ 无法匹配 innerHTML 中的 <p> */
}

/* innerHTML 插入的 HTML */
<p>没有 _ngcontent 属性！</p>
```

---

## ✅ 解决方案

### 方案对比

| 方案 | 配置 | 结果 | 推荐度 |
|------|------|------|--------|
| 全局 CSS | `styles.css` | ✅ 工作 | ⭐⭐⭐⭐⭐ |
| ::ng-deep | `.markdown-block::ng-deep p{}` | ⚠️ 被废弃 | ⭐⭐⭐ |
| styleUrl | `styleUrl: './comp.css'` | ❌ 无效 | ⭐ |
| styles 数组 | `styles: ['...']` | ❌ 未加载 | ⭐ |
| encapsulation: None | `encapsulation: ViewEncapsulation.None` | ✅ 工作 | ⭐⭐⭐⭐ |

**最终方案**: 在 `src/styles.css` 添加全局样式

```css
/* Markdown Block Styles */
.markdown-block {
  margin-bottom: var(--spacing-lg);
  padding: var(--spacing-md);
  border-radius: var(--radius-md);
  line-height: 1.6;
}

/* 段落间距 */
.markdown-block p {
  margin-top: var(--spacing-md);
  margin-bottom: var(--spacing-md);
}

/* 列表样式 */
.markdown-block ul {
  list-style-type: disc;
  margin-left: var(--spacing-md);
  margin-bottom: var(--spacing-md);
}

.markdown-block ol {
  list-style-type: decimal;
  margin-left: var(--spacing-md);
  margin-bottom: var(--spacing-md);
}
```

---

## 🏗️ 架构评估

### 当前架构

```
Observable<T> stream$
        ↓
StreamingMarkdownComponent (流管理)
        ↓
MarkdownPreprocessor (语法修正)
        ↓
BlockParser (块解析)
        ↓
MarkdownFormatterService (Markdown → HTML)
        ↓
  ┌───────┴────────┐
  ↓                ↓
CodeBlockWrapper   BlockRenderer (innerHTML)
  (innerHTML)           ↓
    ↓              样式无法应用 ❌
  样式也无法应用 ❌
```

### 评分

| 维度 | 评分 | 说明 |
|------|------|------|
| 关注点分离 | ⭐⭐⭐⭐☆ | 流、解析、渲染分离清晰 |
| 可测试性 | ⭐⭐⭐⭐☆ | 依赖注入清晰 |
| 性能优化 | ⭐⭐⭐⭐⭐ | Signals + OnPush |
| **样式管理** | **⭐⭐☆☆☆** | **全局 CSS 破坏封装** |
| 可维护性 | ⭐⭐⭐☆☆ | 依赖链长，样式难追踪 |

**综合**: ⭐⭐⭐⭐☆ (3.5/5)

---

## 💡 为什么代码渲染修复困难？

### 1. 多层抽象

```
MarkdownBlock
  → MarkdownFormatterService.formatCodeBlock()
    → ShiniHighlighter.highlight()  [异步]
      → Shiki 库  [需要初始化]
        → ThemeService.getCurrentTheme()
          → 返回 inline styles HTML
            → CodeBlockWrapperComponent
              → [innerHTML] 插入
                → 样式封装失效 ❌
```

每一层都可能出错，难以定位问题。

### 2. ViewEncapsulation 的限制

| 封装模式 | 组件 CSS | innerHTML | 适用 |
|----------|----------|-----------|------|
| Emulated (默认) | ✅ | ❌ | 大多数场景 |
| None | ✅ | ✅ | 全局组件 |
| ShadowDom | ✅ | ✅ | Web Components |

当前使用默认模式 + 大量 innerHTML = 样式失效

### 3. 依赖链过长

```
StreamingMarkdownComponent
  → BlockRendererComponent
    → MarkdownFormatterServiceExtended
      → MarkdownFormatterService
        → ShiniHighlighter
          → Shiki (外部库)
            → ThemeService
              → CodeBlockWrapperComponent
                → 全局 CSS
```

### 4. 调试工具盲区

- Playwright 检测不到 `::ng-deep` 规则
- `getComputedStyle()` 显示样式未应用
- 无法直接看到哪些样式被真正加载

---

## 🎯 最佳实践

### 规避 ViewEncapsulation 陷阱

```
需要渲染动态内容？
    ├─ 否 → 组件 CSS (默认)
    └─ 是 → 内容来源？
        ├─ 可控 → 结构化模板
        ├─ 不可控 (Markdown) → 全局 CSS
        └─ 第三方库 → 检查库的样式支持
```

### 经验教训

1. **innerHTML 是样式封装的敌人**
   - 尽量避免使用
   - 必须使用时，预先规划样式策略

2. **ViewEncapsulation 不是万能的**
   - 只对模板中声明的元素有效
   - innerHTML、第三方组件不受保护

3. **全局样式不是坏事**
   - 对于设计系统，全局样式有时合理
   - 重要的是有清晰的命名约定

4. **架构设计要考虑样式**
   - 不要只关注逻辑分离
   - 样式也是架构的一部分

5. **测试驱动调试**
   - Playwright 可以快速发现样式问题
   - 自动化测试比手动调试更可靠

---

## 📂 关键文件

```
src/app/shared/components/streaming-markdown/
├── streaming-markdown.component.ts      # 主控制器
├── renderers/
│   ├── block-renderer.component.ts      # 块渲染器 (innerHTML)
│   ├── markdown-formatter.service.ts    # Markdown → HTML
│   └── code-block-wrapper.component.ts  # 代码块 (innerHTML)
├── core/
│   ├── models.ts                        # 类型定义
│   ├── block-parser.ts                  # 块解析器
│   └── shini-highlighter.ts             # Shiki 适配器
└── streaming-markdown.component.css     # ❌ 未生效

src/styles.css                           # ✅ 最终解决方案
```

---

## 🚀 未来改进方向

### 短期 (已完成)
- ✅ 使用全局 CSS 修复样式问题

### 中期 (建议)
- 考虑 `encapsulation: ViewEncapsulation.None`
- 使用 `::ng-deep` (注意已废弃)

### 长期 (重构)
- 替换 innerHTML 为结构化模板
- 实现真正的组件级样式封装
- 添加样式单元测试

---

**文档更新**: 2026-02-01
**相关文档**: [ARCHITECTURE_ANALYSIS.md](./ARCHITECTURE_ANALYSIS.md)
