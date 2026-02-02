# Phase 3 实施提示词 - Streaming Markdown 组件架构迁移

> **创建日期**: 2026-02-01
> **当前分支**: `feature/streaming-markdown-phase3`
> **工作目录**: `/Users/wanyaozhong/Projects/angular-spark-cli/.worktrees/streaming-markdown-phase3`

---

## 🎯 目标

将 Streaming Markdown 组件从 innerHTML 架构迁移到结构化组件架构。

**当前架构** (innerHTML):
```
StreamingMarkdownComponent → BlockRendererComponent → innerHTML
```

**目标架构** (结构化组件):
```
StreamingMarkdownComponent → MarkdownBlockRouterComponent → 具体块组件
```

---

## 📋 实施步骤

### Step 1: 创建 MarkdownListComponent

**文件**: `src/app/shared/components/streaming-markdown/blocks/list/list.component.ts`

```typescript
/**
 * Markdown List Component
 *
 * Renders ordered and unordered lists with nested list support.
 * Phase 3 - Component Implementation
 */

import { Component, Input, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MarkdownBlock } from '../../core/models';

@Component({
  selector: 'app-markdown-list',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ul [class]="listClasses()" *ngIf="!ordered; else orderedList">
      @for (item of items; track item.id) {
        <li [class]="getItemClass()">
          {{ item.content }}
          @if (item.items && item.items.length > 0) {
            <app-markdown-list
              [items]="item.items"
              [ordered]="false"
              [depth]="depth + 1" />
          }
        </li>
      }
    </ul>

    <ng-template #orderedList>
      <ol [class]="listClasses()">
        @for (item of items; track item.id) {
          <li [class]="getItemClass()">
            {{ item.content }}
            @if (item.items && item.items.length > 0) {
              <app-markdown-list
                [items]="item.items"
                [ordered]="true"
                [depth]="depth + 1" />
            }
          </li>
        }
      </ol>
    </ng-template>
  `,
  styleUrls: ['./list.component.css']
})
export class MarkdownListComponent {
  @Input({ required: true }) items!: MarkdownBlock[];
  @Input() ordered: boolean = false;
  @Input() depth: number = 0;

  listClasses = signal<string>('markdown-list block-list');
  itemClass = 'list-item';

  protected getItemClass(): string {
    return `${this.itemClass} depth-${this.depth}`;
  }
}
```

**文件**: `src/app/shared/components/streaming-markdown/blocks/list/list.component.css`

```css
.markdown-list {
  padding-left: var(--spacing-xl);
  margin-bottom: var(--spacing-sm);
}

.markdown-list li {
  margin-left: var(--spacing-md);
  padding-left: var(--spacing-sm);
  color: var(--foreground);
}

.markdown-list li::marker {
  color: var(--muted-foreground);
}

.markdown-list.depth-1 {
  padding-left: calc(var(--spacing-xl) * 2);
}

.markdown-list.depth-2 {
  padding-left: calc(var(--spacing-xl) * 3);
}

/* Nested list indentation */
.markdown-list app-markdown-list {
  margin-top: var(--spacing-xs);
}
```

---

### Step 2: 创建 MarkdownBlockquoteComponent

**文件**: `src/app/shared/components/streaming-markdown/blocks/blockquote/blockquote.component.ts`

```typescript
/**
 * Markdown Blockquote Component
 *
 * Renders quoted text with left border styling.
 * Phase 3 - Component Implementation
 */

import { Component, Input, signal, OnChanges, SimpleChanges, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-markdown-blockquote',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <blockquote [class]="blockquoteClasses()">
      {{ content }}
      @if (streaming) {
        <span class="streaming-indicator"></span>
      }
    </blockquote>
  `,
  styleUrls: ['./blockquote.component.css']
})
export class MarkdownBlockquoteComponent implements OnChanges {
  @Input({ required: true }) content!: string;
  @Input() streaming: boolean = false;

  blockquoteClasses = signal<string>('markdown-blockquote block-blockquote');

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['streaming']) {
      this.updateClasses();
    }
  }

  private updateClasses(): void {
    const baseClass = 'markdown-blockquote block-blockquote';
    const streamingClass = this.streaming ? ' streaming' : '';
    this.blockquoteClasses.set(`${baseClass}${streamingClass}`);
  }
}
```

**文件**: `src/app/shared/components/streaming-markdown/blocks/blockquote/blockquote.component.css`

```css
.markdown-blockquote {
  border-left: 3px solid var(--primary);
  padding-left: var(--spacing-md);
  margin-bottom: var(--spacing-sm);
  color: var(--muted-foreground);
  font-style: italic;
}

.markdown-blockquote.streaming {
  opacity: 0.8;
}

.streaming-indicator::after {
  content: '▌';
  animation: blink 1s infinite;
  margin-left: var(--spacing-sm);
  color: var(--accent);
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}
```

---

### Step 3: 创建 MarkdownBlockRouterComponent

**文件**: `src/app/shared/components/streaming-markdown/blocks/block-router/block-router.component.ts`

```typescript
/**
 * Markdown Block Router Component
 *
 * Routes markdown blocks to their respective rendering components
 * based on block type. Handles unknown types with graceful fallback.
 *
 * Phase 3 - Router Implementation
 */

import { Component, Input, OnChanges, SimpleChanges, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MarkdownBlock, BlockType } from '../../core/models';
import { MarkdownParagraphComponent } from '../paragraph/paragraph.component';
import { MarkdownHeadingComponent } from '../heading/heading.component';
import { MarkdownCodeComponent } from '../code/code.component';
import { MarkdownListComponent } from '../list/list.component';
import { MarkdownBlockquoteComponent } from '../blockquote/blockquote.component';

@Component({
  selector: 'app-markdown-block-router',
  standalone: true,
  imports: [
    CommonModule,
    MarkdownParagraphComponent,
    MarkdownHeadingComponent,
    MarkdownCodeComponent,
    MarkdownListComponent,
    MarkdownBlockquoteComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="markdown-block-router" [attr.data-block-type]="block.type">
      @switch (block.type) {
        @case ('paragraph') {
          <app-markdown-paragraph
            [content]="block.content"
            [streaming]="!isComplete" />
        }
        @case ('heading') {
          <app-markdown-heading
            [level]="block.level || 1"
            [content]="block.content"
            [streaming]="!isComplete" />
        }
        @case ('code') {
          <app-markdown-code
            [code]="block.rawContent || block.content"
            [language]="block.language || 'text'"
            [streaming]="!isComplete" />
        }
        @case ('list') {
          <app-markdown-list
            [items]="block.items || []"
            [ordered]="block.subtype === 'ordered'"
            [depth]="0" />
        }
        @case ('blockquote') {
          <app-markdown-blockquote
            [content]="block.content"
            [streaming]="!isComplete" />
        }
        @default {
          @if (block.raw) {
            <app-markdown-paragraph [content]="block.raw" />
          } @else {
            <app-markdown-paragraph [content]="block.content" />
          }
        }
      }
    </div>
  `
})
export class MarkdownBlockRouterComponent implements OnChanges {
  @Input({ required: true }) block!: MarkdownBlock;
  @Input() isComplete: boolean = true;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['block'] && changes['block'].currentValue) {
      const block = changes['block'].currentValue as MarkdownBlock;

      // Log warning for unknown block types
      const knownTypes = [
        BlockType.PARAGRAPH,
        BlockType.HEADING,
        BlockType.CODE_BLOCK,
        BlockType.LIST,
        BlockType.BLOCKQUOTE
      ];

      if (!knownTypes.includes(block.type)) {
        console.warn(`[MarkdownBlockRouter] Unknown block type: ${block.type}, rendering as paragraph`);
      }
    }
  }
}
```

---

### Step 4: 更新 StreamingMarkdownComponent

**文件**: `src/app/shared/components/streaming-markdown/streaming-markdown.component.ts`

**修改导入**:
```typescript
// 删除旧的导入
// import { BlockRendererComponent } from './renderers/block-renderer.component';

// 添加新的导入
import { MarkdownBlockRouterComponent } from './blocks/block-router/block-router.component';
```

**修改 @Component 装饰器**:
```typescript
@Component({
  selector: 'app-streaming-markdown',
  standalone: true,
  imports: [MarkdownBlockRouterComponent, CommonModule],  // 更新这里
  providers: [
    MarkdownPreprocessor,
    BlockParser
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  // 删除 styles 配置块（样式迁移到各组件）
  template: `
    <div class="streaming-markdown-container">
      <!-- Render all completed blocks -->
      @for (block of blocks(); track trackById(block)) {
        <app-markdown-block-router
          [block]="block"
          [isComplete]="true" />
      }

      <!-- Render currently streaming block (if any) -->
      @if (currentBlock()) {
        <app-markdown-block-router
          [block]="currentBlock()!"
          [isComplete]="false" />
      }
    </div>
  `
})
```

**删除样式块** - 移除整个 `styles: [`...`]` 配置，样式已迁移到各组件。

---

### Step 5: 迁移样式到各组件

**更新 heading.component.css**:
```css
.markdown-heading {
  font-weight: 600;
  margin-top: var(--spacing-md);
  margin-bottom: 0;
  color: var(--foreground);
}

.markdown-heading.streaming {
  opacity: 0.7;
}

.markdown-heading.fallback {
  color: var(--destructive);
  font-style: italic;
}
```

**更新 paragraph.component.css**:
```css
.markdown-paragraph {
  margin-top: 0;
  margin-bottom: var(--spacing-sm);
  color: var(--foreground);
  line-height: 1.6;
}

.markdown-paragraph.streaming {
  opacity: 0.7;
}

.inline-bold {
  font-weight: 600;
}

.inline-italic {
  font-style: italic;
}

.inline-code {
  font-family: 'Monaco', 'Menlo', monospace;
  background: var(--muted);
  padding: 2px 4px;
  border-radius: 3px;
  font-size: 0.9em;
}
```

**更新 code.component.css**:
```css
.markdown-code {
  background: var(--muted);
  padding: var(--spacing-md);
  border-radius: var(--radius-md);
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 0.875rem;
  overflow-x: auto;
  margin-bottom: var(--spacing-sm);
}

.code-fallback {
  white-space: pre-wrap;
  word-break: break-word;
}

.code-streaming {
  opacity: 0.7;
}
```

---

### Step 6: 清理旧文件

**删除以下文件**:
```bash
# BlockRendererComponent
rm src/app/shared/components/streaming-markdown/renderers/block-renderer.component.ts
rm src/app/shared/components/streaming-markdown/renderers/block-renderer.component.spec.ts

# MarkdownFormatterServiceExtended
rm src/app/shared/components/streaming-markdown/renderers/markdown-formatter.service.extended.ts
rm src/app/shared/components/streaming-markdown/renderers/markdown-formatter.service.extended.spec.ts
rm src/app/shared/components/streaming-markdown/renderers/markdown-formatter.extensions.ts

# CodeBlockWrapperComponent
rm src/app/shared/components/streaming-markdown/renderers/code-block-wrapper.component.ts
rm src/app/shared/components/streaming-markdown/renderers/code-block-wrapper.component.html
rm src/app/shared/components/streaming-markdown/renderers/code-block-wrapper.component.css
rm src/app/shared/components/streaming-markdown/renderers/code-block-wrapper.component.spec.ts
rm src/app/shared/components/streaming-markdown/renderers/code-block-wrapper.types.ts

# 如果不再需要 MarkdownFormatterService
rm src/app/shared/components/streaming-markdown/renderers/markdown-formatter.service.ts
rm src/app/shared/components/streaming-markdown/renderers/markdown-formatter.service.spec.ts
```

**更新 renderers/index.ts** (如果存在):
```typescript
// 清理导出
export { BlockRendererComponent } from './block-renderer.component'; // 删除
export { MarkdownFormatterService } from './markdown-formatter.service'; // 删除
// ... 其他清理
```

---

### Step 7: 更新 blocks/index.ts (创建 barrel export)

**文件**: `src/app/shared/components/streaming-markdown/blocks/index.ts`

```typescript
export { MarkdownParagraphComponent } from './paragraph/paragraph.component';
export { MarkdownHeadingComponent } from './heading/heading.component';
export { MarkdownCodeComponent } from './code/code.component';
export { MarkdownListComponent } from './list/list.component';
export { MarkdownBlockquoteComponent } from './blockquote/blockquote.component';
export { MarkdownBlockRouterComponent } from './block-router/block-router.component';
```

---

## ✅ 验证检查清单

### 编译检查
```bash
npm run build
# 应该无 TypeScript 错误
```

### 单元测试
```bash
npm test
# 所有测试应该通过
```

### 手动测试
```bash
# 1. 启动开发服务器
npm start

# 2. 访问 Demo 页面
open http://localhost:4200/demo/streaming-markdown

# 3. 点击 "Start Streaming" 按钮

# 4. 验证功能
```

**功能验证**:
- [ ] 段落正确渲染
- [ ] 标题正确渲染 (h1-h6)
- [ ] 代码块显示语法高亮
- [ ] 列表显示项目符号/数字
- [ ] 嵌套列表正确缩进
- [ ] 引用块显示左边框
- [ ] 流式指示器显示
- [ ] 无控制台错误

**样式验证**:
- [ ] 符合"矿物与时光"设计系统
- [ ] Ultra compact 间距系统
- [ ] 所有颜色使用 CSS 变量
- [ ] 无 `::ng-deep` 穿透

---

## 🐛 调试提示

**检查 BlockType 枚举**:
```typescript
// 在 models.ts 中确认
BlockType.CODE_BLOCK  // 值应该是 'code'
BlockType.PARAGRAPH   // 值应该是 'paragraph'
BlockType.HEADING     // 值应该是 'heading'
BlockType.LIST        // 值应该是 'list'
BlockType.BLOCKQUOTE  // 值应该是 'blockquote'
```

**检查路由器输出**:
```typescript
// 在 MarkdownBlockRouterComponent.ngOnChanges 中添加日志
console.log('[BlockRouter] Routing block:', {
  type: block.type,
  level: block.level,
  language: block.language,
  hasItems: !!block.items
});
```

**检查 Shini 初始化**:
```bash
# 浏览器控制台应该看到
[StreamingMarkdownComponent] Shini initialized successfully
```

---

## 📝 Git 提交信息

```
feat(streaming-markdown): migrate to structured component architecture (Phase 3)

- Create MarkdownListComponent with nested support
- Create MarkdownBlockquoteComponent with left border styling
- Create MarkdownBlockRouterComponent with @switch routing
- Update StreamingMarkdownComponent to use router
- Migrate styles from global to component-scoped
- Remove old BlockRendererComponent and formatter services
- Remove ::ng-deep dependencies

BREAKING CHANGE: innerHTML rendering replaced with structured components
```

---

## 🔗 相关文档

- **架构设计**: `docs/2026-02-01-streaming-markdown-refactoring-architecture.md`
- **头脑风暴**: `docs/2026-02-01-streaming-markdown-architecture-refactoring-brainstorm.md`
- **问题总结**: `docs/ISSUE_SUMMARY.md`
- **设计系统**: `CLAUDE.md` (矿物与时光岩彩主题)

---

**执行前记得**:
1. ✅ 确认当前功能正常 (先运行 `npm start` 验证)
2. ✅ 阅读完整实施计划
3. ✅ 按步骤顺序执行 (不要跳过)
4. ✅ 每步完成后验证功能

**祝实施顺利！** 🚀
