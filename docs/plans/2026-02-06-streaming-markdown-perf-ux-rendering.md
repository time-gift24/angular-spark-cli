# Streaming Markdown — Phase 2: 性能/UX 优化 + 渲染能力扩展

**Goal:** 消除 streaming-markdown 组件的性能瓶颈（O(n²) 全文重解析、UUID 导致 DOM 全量重建、无 chunk 节流），统一流式 UX 反馈，并补齐缺失的渲染能力（inline formatting、table、thematic break、结构化 list）。

**Architecture:** 增量解析缓存 + RxJS bufferTime 节流 + 确定性 Block ID + 插件式新 block 组件注册。所有新组件遵循已有的 `BlockRenderer` 接口（`block: MarkdownBlock` + `isComplete: boolean`）和 `OnPush` + Signal 模式。

**Scope:** `src/app/shared/components/streaming-markdown/` 目录内所有文件，不涉及外部模块。

---

## Master Status Tracker

| Phase | Independence | Dependencies | Status |
| :--- | :--- | :--- | :--- |
| **P1: Parser 性能优化** | High | None | 🔴 To Do |
| **P2: Streaming Pipeline 节流** | Medium | P1 (uses parseIncremental) | 🔴 To Do |
| **P3: 流式 UX 统一** | High | None | 🔴 To Do |
| **P4: 代码高亮主题 + 清理** | High | None | 🔴 To Do |
| **P5: Inline Formatting 解析与渲染** | Medium | P1 (parser changes) | 🔴 To Do |
| **P6: Thematic Break 组件** | High | None | 🔴 To Do |
| **P7: Table 组件** | Medium | P1 (parser changes) | 🔴 To Do |
| **P8: List 解析修复** | Medium | P1 (parser changes) | 🔴 To Do |

> **Status Legend:** 🔴 To Do, 🟡 In Progress, 🟢 Done

> **Parallelism:** P1 是核心依赖，应最先完成。P3、P4、P6 完全独立，可与 P1 并行。P2、P5、P7、P8 依赖 P1 的 parser 改动，应在 P1 之后执行（但彼此之间可并行）。

---

## P1: Parser 性能优化

**Independence:** High — no dependencies
**Files:** `core/block-parser.ts`
**Purpose:** 消除三个核心性能问题：UUID 导致 DOM 全量重建、O(n²) 全文重解析、parseIncremental 名存实亡。

### Task 1.1: 定义增量解析接口与缓存状态类型

**File:** `core/block-parser.ts`
**What to define:**

```typescript
/** Internal cache for incremental parsing */
interface IncrementalCache {
  /** Text that has been fully parsed into stable blocks */
  parsedText: string;
  /** Blocks from parsedText (all complete, stable IDs) */
  stableBlocks: MarkdownBlock[];
  /** Byte offset where the last stable block ends in parsedText */
  stableTextEnd: number;
}
```

**Interface change to `IBlockParser`:**

```typescript
export interface IBlockParser {
  parse(text: string): ParserResult;
  parseIncremental(previousText: string, newText: string): ParserResult;
  /** Clear internal cache (call when stream$ changes) */
  reset(): void;
}
```

### Task 1.2: 实现确定性 Block ID 生成

**File:** `core/block-parser.ts`
**What to change:**

- Remove `import { v4 as uuidv4 } from 'uuid'`
- In `tokenToBlock()`, replace `id: uuidv4()` with `id: this.generateStableId(token.type, position)`
- Add method signature:

```typescript
/** Generate deterministic ID from block type + position */
private generateStableId(type: string, position: number): string
// Returns: `${type}-${position}` e.g. "heading-0", "paragraph-1", "code-2"
```

**Outcome:** Same block at same position always gets same ID → Angular `@for track` reuses DOM nodes.

### Task 1.3: 实现真正的增量解析

**File:** `core/block-parser.ts`
**What to change:**

- Add private field: `private cache: IncrementalCache = { parsedText: '', stableBlocks: [], stableTextEnd: 0 }`
- Rewrite `parseIncremental(previousText, newText)`:

```
Algorithm:
1. If !newText.startsWith(previousText) → cache.reset(), full parse
2. Find last double-newline boundary in previousText → stableTextEnd
3. stableBlocks = blocks from text[0..stableTextEnd] (cached, not re-parsed)
4. tailText = text[stableTextEnd..end]
5. tailTokens = marked.lexer(tailText)  ← only parse the tail
6. tailBlocks = tailTokens.map(tokenToBlock) with position offset
7. return { blocks: [...stableBlocks, ...tailBlocks], hasIncompleteBlock }
8. Update cache
```

- Implement `reset()`: clears `cache` to initial state

### Task 1.4: 移除 unsupported token warn

**File:** `core/block-parser.ts`
**What to change:**

- In `tokenToBlock()` default case, replace `console.warn(...)` with silent `return null`

---

## P2: Streaming Pipeline 节流

**Independence:** Medium — depends on P1 (uses `parseIncremental` + `reset`)
**Files:** `streaming-markdown.component.ts`
**Purpose:** 合并高频 chunk emission，减少 parse + change detection 频率。

### Task 2.1: 添加 bufferTime 到 RxJS pipeline

**File:** `streaming-markdown.component.ts`
**What to change:**

- Add imports: `bufferTime`, `filter`, `map` from `rxjs/operators`
- In `subscribeToStream()`, before `switchMap`, insert:

```typescript
bufferTime(32),                          // ~2 frames at 60fps
filter((chunks: string[]) => chunks.length > 0),
map((chunks: string[]) => chunks.join('')),
```

- The `switchMap` callback now receives a single merged chunk string (same as before)

### Task 2.2: 切换到 parseIncremental + reset

**File:** `streaming-markdown.component.ts`
**What to change:**

- In `processChunk()`: replace `this.parser.parse(updatedRawContent)` with `this.parser.parseIncremental(currentState.rawContent, updatedRawContent)`
- In `subscribeToStream()`: call `this.parser.reset()` at the start (before subscribing)
- In `ngOnChanges` stream change handler: call `this.parser.reset()` before re-subscribing

### Task 2.3: 移除所有 console.log

**File:** `streaming-markdown.component.ts`
**What to remove:**

- All `console.log('[StreamingMarkdownComponent]...')` calls (~10 occurrences)
- Keep `console.error` and `console.warn` calls

---

## P3: 流式 UX 统一

**Independence:** High — no dependencies on parser changes
**Files:** `streaming-markdown.component.css`, `blocks/paragraph/paragraph.component.ts`, `blocks/heading/heading.component.ts`, `blocks/blockquote/blockquote.component.ts`, `blocks/blockquote/blockquote.component.css`
**Purpose:** 所有 block 类型在 streaming 状态下显示统一的 `▌` 闪烁光标。

### Task 3.1: 定义全局 streaming cursor 样式

**File:** `streaming-markdown.component.css`
**What to add:**

```css
/* Unified streaming cursor for all block types */
.streaming-cursor::after {
  content: '▌';
  color: var(--primary);
  animation: cursor-blink 1s step-end infinite;
  font-weight: 400;
  margin-left: 1px;
}

@keyframes cursor-blink {
  50% { opacity: 0; }
}
```

### Task 3.2: 添加 streaming cursor 到 paragraph 组件

**File:** `blocks/paragraph/paragraph.component.ts`
**What to change:**

- In template, after content rendering and before closing `</p>`, add:
  ```html
  @if (!isComplete) { <span class="streaming-cursor"></span> }
  ```

### Task 3.3: 添加 streaming cursor 到 heading 组件

**File:** `blocks/heading/heading.component.ts`
**What to change:**

- In each `@case` template, after `{{ block.content }}`, add:
  ```html
  @if (!isComplete) { <span class="streaming-cursor"></span> }
  ```

### Task 3.4: 迁移 blockquote streaming indicator

**File:** `blocks/blockquote/blockquote.component.ts`
**What to change:**

- Replace `<span class="streaming-indicator"></span>` with `<span class="streaming-cursor"></span>`

**File:** `blocks/blockquote/blockquote.component.css`
**What to remove:**

- `.streaming-indicator::after` block and `@keyframes blink` block (now handled globally)

---

## P4: 代码高亮主题 + 清理

**Independence:** High — no dependencies on parser changes
**Files:** `blocks/code/code.component.ts`, `core/shini-highlighter.ts`
**Purpose:** 代码高亮跟随系统 dark/light 主题；移除 deprecated 方法。

### Task 4.1: 代码高亮跟随主题

**File:** `blocks/code/code.component.ts`
**What to change:**

- Add theme detection:

```typescript
private getCurrentTheme(): 'light' | 'dark' {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}
```

- In `highlightCode()`, replace hardcoded `'light'` with `this.getCurrentTheme()`

### Task 4.2: 移除 deprecated highlight() 方法

**File:** `core/shini-highlighter.ts`
**What to remove:**

- The entire `highlight()` method (lines 135-169, marked `@deprecated`)
- `import { codeToHtml }` from the shiki import (keep `codeToTokensBase`)

---

## P5: Inline Formatting 解析与渲染

**Independence:** Medium — depends on P1 (shares block-parser.ts changes)
**Files:** `core/block-parser.ts`, `blocks/paragraph/paragraph.component.ts`, `blocks/heading/heading.component.ts`
**Purpose:** 让 parser 填充 `block.children: MarkdownInline[]`，使 paragraph/heading 能渲染 bold/italic/code/link。

### Task 5.1: 实现 inline token 解析方法

**File:** `core/block-parser.ts`
**What to add:**

```typescript
/**
 * Parse marked.js inline tokens into MarkdownInline array.
 * Maps: strong→bold, em→italic, codespan→code, link→link, br→hard-break, text→text
 */
private parseInlineTokens(tokens: any[]): MarkdownInline[]
```

**Mapping table:**

| marked token.type | MarkdownInline.type | Fields |
| :--- | :--- | :--- |
| `text` | `text` | `content: token.text` |
| `strong` | `bold` | `content: token.text` |
| `em` | `italic` | `content: token.text` |
| `codespan` | `code` | `content: token.text` |
| `link` | `link` | `content: token.text, href: token.href` |
| `br` | `hard-break` | `content: ''` |

### Task 5.2: 在 paragraph/heading 解析中填充 children

**File:** `core/block-parser.ts`
**What to change:**

- In `tokenToBlock()` case `'paragraph'`: if `token.tokens` exists and has length, set `children: this.parseInlineTokens(token.tokens)`
- In `tokenToBlock()` case `'heading'`: same treatment

### Task 5.3: 更新 paragraph 模板支持 link 和 code 渲染

**File:** `blocks/paragraph/paragraph.component.ts`
**What to change:**

Current template renders all inlines as `<span>`. Update to:

```html
@for (inline of block.children; track $index) {
  @switch (inline.type) {
    @case ('link') { <a [href]="inline.href" class="inline-link" target="_blank" rel="noopener">{{ inline.content }}</a> }
    @case ('code') { <code class="inline-code">{{ inline.content }}</code> }
    @case ('hard-break') { <br /> }
    @default { <span [class]="getInlineClass(inline.type)">{{ inline.content }}</span> }
  }
}
```

- Change `track inline.type` to `track $index` (multiple inlines can have same type)

### Task 5.4: 更新 heading 模板支持 inline children

**File:** `blocks/heading/heading.component.ts`
**What to change:**

- Extract inline rendering into a shared pattern: if `block.children?.length`, render children; else render `{{ block.content }}`
- Apply same `@switch` pattern as paragraph for link/code/bold/italic

---

## P6: Thematic Break 组件

**Independence:** High — no dependencies
**Files:** New `blocks/thematic-break/` directory, `plugins/builtin-plugin.ts`
**Purpose:** `---` 渲染为视觉水平线而非文字。

### Task 6.1: 创建 ThematicBreak 组件

**New file:** `blocks/thematic-break/thematic-break.component.ts`
**Interface:**

```typescript
@Component({
  selector: 'app-markdown-thematic-break',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<hr class="markdown-hr" />`,
  styleUrls: ['./thematic-break.component.css']
})
export class MarkdownThematicBreakComponent {
  @Input({ required: true }) block!: MarkdownBlock;
  @Input() isComplete: boolean = true;
}
```

### Task 6.2: 创建 ThematicBreak 样式

**New file:** `blocks/thematic-break/thematic-break.component.css`
**Design tokens:**

```css
.markdown-hr {
  border: none;
  height: 1px;
  background: var(--border);
  margin: var(--spacing-lg) 0;
}
```

### Task 6.3: 注册到 builtin plugin

**File:** `plugins/builtin-plugin.ts`
**What to change:**

- Import `MarkdownThematicBreakComponent`
- Replace `[BlockType.THEMATIC_BREAK]: MarkdownParagraphComponent` with `[BlockType.THEMATIC_BREAK]: MarkdownThematicBreakComponent`

---

## P7: Table 组件

**Independence:** Medium — depends on P1 (parser changes in block-parser.ts)
**Files:** `core/models.ts`, `core/block-parser.ts`, new `blocks/table/` directory, `plugins/builtin-plugin.ts`
**Purpose:** 解析并渲染 markdown table。

### Task 7.1: 定义 Table 数据模型

**File:** `core/models.ts`
**What to add to `MarkdownBlock`:**

```typescript
/** Table data, only for TABLE type blocks */
tableData?: {
  headers: string[];
  rows: string[][];
  align?: (string | null)[];  // 'left' | 'center' | 'right' | null
};
```

### Task 7.2: 实现 table token 解析

**File:** `core/block-parser.ts`
**What to add:**

- In `tokenToBlock()`, new `case 'table'`:

```typescript
case 'table': {
  const headerCells = (token as any).header?.map((h: any) => h.text || '') || [];
  const bodyRows = (token as any).rows?.map((row: any) =>
    row.map((cell: any) => cell.text || '')
  ) || [];
  const alignments = (token as any).align || [];
  return {
    ...baseBlock,
    type: BlockType.TABLE,
    content: '',  // tables don't use content string
    tableData: { headers: headerCells, rows: bodyRows, align: alignments }
  };
}
```

### Task 7.3: 创建 Table 组件

**New file:** `blocks/table/table.component.ts`
**Interface:**

```typescript
@Component({
  selector: 'app-markdown-table',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `...`, // table with thead/tbody, @for loops
  styleUrls: ['./table.component.css']
})
export class MarkdownTableComponent {
  @Input({ required: true }) block!: MarkdownBlock;
  @Input() isComplete: boolean = true;

  get headers(): string[]
  get rows(): string[][]
  get align(): (string | null)[]
}
```

### Task 7.4: 创建 Table 样式

**New file:** `blocks/table/table.component.css`
**Design tokens:** 矿物主题紧凑表格 — `var(--border)` 边框, `var(--muted)` 交替行背景, `var(--spacing-sm)` padding, `text-sm` 字体。

### Task 7.5: 注册到 builtin plugin

**File:** `plugins/builtin-plugin.ts`
**What to change:**

- Import `MarkdownTableComponent`
- Add `[BlockType.TABLE]: MarkdownTableComponent`

---

## P8: List 解析修复

**Independence:** Medium — depends on P1 (parser changes in block-parser.ts)
**Files:** `core/block-parser.ts`
**Purpose:** 当前 list 解析将 items 拼接为纯文本 content，但 `MarkdownListComponent` 期望 `block.items: MarkdownBlock[]`。修复解析使 list 组件的递归渲染生效。

### Task 8.1: 重写 list token 解析

**File:** `core/block-parser.ts`
**What to change:**

- Rewrite `case 'list'` in `tokenToBlock()`:

```
Algorithm:
1. Set block.subtype = token.ordered ? 'ordered' : 'unordered'
2. For each token.items[i]:
   a. Create child MarkdownBlock with type=PARAGRAPH, content=item.text
   b. If item has nested list tokens, recursively parse them as block.items
   c. Generate stable ID: `${parentId}-item-${i}`
3. Set block.items = parsedItems
4. Set block.content = items.map(i => i.content).join('\n') (fallback)
```

### Task 8.2: 验证 list 组件递归渲染

**File:** `blocks/list/list.component.ts`
**What to verify (no changes expected):**

- `get items()` returns `this.block.items || []` — should work with new structured items
- Recursive `<app-markdown-list [block]="item">` — should work since each item is now a `MarkdownBlock`
- `get ordered()` returns `this.block.subtype === 'ordered'` — should work with new `subtype` field

---

## 文件变更清单

| 操作 | 文件路径 | Phase |
|------|---------|-------|
| **修改** | `core/block-parser.ts` | P1, P5, P7, P8 |
| **修改** | `streaming-markdown.component.ts` | P2 |
| **修改** | `streaming-markdown.component.css` | P3 |
| **修改** | `blocks/paragraph/paragraph.component.ts` | P3, P5 |
| **修改** | `blocks/heading/heading.component.ts` | P3, P5 |
| **修改** | `blocks/blockquote/blockquote.component.ts` | P3 |
| **修改** | `blocks/blockquote/blockquote.component.css` | P3 |
| **修改** | `blocks/code/code.component.ts` | P4 |
| **修改** | `core/shini-highlighter.ts` | P4 |
| **修改** | `core/models.ts` | P7 |
| **修改** | `plugins/builtin-plugin.ts` | P6, P7 |
| **新建** | `blocks/thematic-break/thematic-break.component.ts` | P6 |
| **新建** | `blocks/thematic-break/thematic-break.component.css` | P6 |
| **新建** | `blocks/table/table.component.ts` | P7 |
| **新建** | `blocks/table/table.component.css` | P7 |

---

## 验证计划

1. **编译检查**: `ng build` 无错误
2. **性能验证**:
   - 确认 `@for track` 不再因 UUID 变化导致全量 DOM 重建
   - 确认 `parseIncremental` 只对 tail 部分调用 `marked.lexer()`
   - 确认 `bufferTime(32)` 生效（parse 频率 ≤ 30/s）
3. **UX 验证**:
   - 所有 block 类型在 streaming 时显示 `▌` 闪烁光标
   - 代码高亮在 dark mode 下使用 dark-plus 主题
   - 无 console.log 输出（仅 error/warn）
4. **渲染验证**:
   - `---` 渲染为水平线
   - `**bold**`、`*italic*`、`` `code` ``、`[link](url)` 在 paragraph 中正确渲染
   - Markdown table 正确渲染为 HTML table（含对齐）
   - 有序/无序列表正确渲染，嵌套列表正确缩进
5. **测试**: `ng build` 通过，现有 spec 文件编译无错误
