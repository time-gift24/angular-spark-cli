# Block Router State Machine Design

**Date**: 2025-02-10
**Status**: Design Approved
**MVP Scope**: Phase 1

---

## Problem Statement

Current block routing uses chain-style `@if/@else if` in templates:
- Adding new block types requires modifying core routing logic
- No support for nested block rendering (List → List, Blockquote → any)
- Violates open-closed principle

---

## Design Goals

1. **Extensibility**: Add new block types without modifying core code
2. **Nested Rendering**: Support recursive block routing with depth limit
3. **Plugin Support**: Allow external plugins to register new mappings
4. **Type Safety**: Maintain discriminated union types

---

## Architecture

### 1. State Machine Structure

```
┌─────────────────────────────────────────────────────────────────────┐
│                        BlockRouterState                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    ComponentRegistry                        │   │
│  │  BlockType → ComponentType 映射表                           │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    DepthGuard                               │   │
│  │  currentDepth: number                                        │   │
│  │  maxDepth: number = 1                                        │   │
│  │  canNest(): boolean                                          │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  resolve(block: MarkdownBlock): ComponentType | null               │
└─────────────────────────────────────────────────────────────────────┘
```

### 2. Data Flow

```
                        ┌─────────────┐
                        │ MarkdownBlock│
                        └──────┬──────┘
                               │
                               ▼
              ┌────────────────────────────────┐
              │     BlockRouterComponent       │
              │  @Input block: MarkdownBlock    │
              │  @Input depth: number = 0      │
              └───────────────┬────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │  DepthGuard     │
                    │  depth >= 1 ?   │
                    └────┬────────────┘
                         │
              ┌──────────┴──────────┐
              │                     │
             Yes                   No
              │                     │
              ▼                     ▼
       ┌──────────┐       ┌─────────────────┐
       │ Fallback  │       │   ComponentRegistry│
       │ (不渲染嵌套)│       │   查找组件         │
       └──────────┘       └────────┬─────────┘
                                   │
                                   ▼
                            ┌──────────────┐
                            │ ngSwitch/动态渲染
                            │  选择对应组件  │
                            └──────────────┘
```

---

## Nested Rendering

### Depth Limit

- **Max Depth**: 1 layer
- **Parent → Child**: Allowed
- **Parent → Child → Grandchild**: Blocked

| Scenario | Allowed | Blocked |
|----------|---------|---------|
| List → nested List | ✅ | List → List → List ❌ |
| Blockquote → Paragraph | ✅ | Blockquote → Blockquote ❌ |
| Blockquote → List | ✅ | Blockquote → List → List ❌ |

### Nesting Logic (Pseudo-code)

```typescript
function shouldRenderNested(block: MarkdownBlock, currentDepth: number): boolean {
  // 1. Check global depth limit
  if (currentDepth >= MAX_DEPTH) {
    return false;
  }

  // 2. Only List and Blockquote support nesting
  if (!isListBlock(block) && !isBlockquoteBlock(block)) {
    return false;
  }

  return true;
}

// In component
@Input depth: number = 0;

canNest(): boolean {
  return this.depth < MAX_DEPTH &&
         (isListBlock(this.block) || isBlockquoteBlock(this.block));
}
```

---

## Component Structure

### BlockRouterComponent

```angular
@Component({
  selector: 'app-block-router',
  template: `
    <ng-container [ngSwitch]="block.type">
      <!-- Code Block -->
      <app-markdown-code
        *ngSwitchCase="BlockType.CODE_BLOCK"
        [block]="block"
        [isComplete]="isComplete" />

      <!-- Paragraph -->
      <app-markdown-paragraph
        *ngSwitchCase="BlockType.PARAGRAPH"
        [block]="block" />

      <!-- List - supports nesting -->
      <app-markdown-list
        *ngSwitchCase="BlockType.LIST"
        [block]="block"
        [depth]="depth"
        [canNest]="canNest()" />

      <!-- Blockquote - supports nesting -->
      <app-markdown-blockquote
        *ngSwitchCase="BlockType.BLOCKQUOTE"
        [block]="block"
        [depth]="depth"
        [canNest]="canNest()" />

      <!-- Other block types... -->
    </ng-container>
  `
})
export class MarkdownBlockRouterComponent {
  @Input({ required: true }) block!: MarkdownBlock;
  @Input() isComplete: boolean = true;
  @Input() depth: number = 0;

  readonly MAX_DEPTH = 1;

  canNest(): boolean {
    return this.depth < this.MAX_DEPTH &&
      (isListBlock(this.block) || isBlockquoteBlock(this.block));
  }
}
```

### MarkdownListComponent (Nested Support)

```angular
@Component({
  selector: 'app-markdown-list',
  template: `
    <ul [class]="listClasses()" *ngIf="!ordered; else orderedList">
      @for (item of items; track item.id || $index) {
        <li>
          @if (typeof item === 'string') {
            {{ item }}
          } @else if (canNest) {
            <app-block-router [block]="item" [depth]="depth + 1" />
          } @else {
            <span class="nested-fallback">[Nested content]</span>
          }
        </li>
      }
    </ul>
  `
})
export class MarkdownListComponent {
  @Input({ required: true }) block!: ListBlock;
  @Input() depth: number = 0;
  @Input() canNest: boolean = false;

  get items(): (string | MarkdownBlock)[] {
    return this.block.items;
  }
}
```

### MarkdownBlockquoteComponent (Nested Support)

```angular
@Component({
  selector: 'app-markdown-blockquote',
  template: `
    <blockquote [class]="blockquoteClasses()">
      @if (canNest) {
        @for (childBlock of blocks; track childBlock.id) {
          <app-block-router [block]="childBlock" [depth]="depth + 1" />
        }
      } @else {
        {{ block.content }}
      }
    </blockquote>
  `
})
export class MarkdownBlockquoteComponent {
  @Input({ required: true }) block!: BlockquoteBlock;
  @Input() depth: number = 0;
  @Input() canNest: boolean = false;

  get blocks(): MarkdownBlock[] {
    return this.block.blocks || [];
  }
}
```

---

## Updated Data Models

```typescript
// Restore circular reference for full nesting support
interface ListBlock extends MarkdownBlockBase {
  type: BlockType.LIST;
  subtype: 'ordered' | 'unordered';
  items: (string | MarkdownBlock)[];  // Mixed type: text or nested block
}

interface BlockquoteBlock extends MarkdownBlockBase {
  type: BlockType.BLOCKQUOTE;
  content: string;
  blocks: MarkdownBlock[];  // Full child blocks for recursive rendering
}
```

---

## Error Handling

| Error Scenario | Handling Strategy |
|----------------|-------------------|
| Unknown block type | Render FallbackComponent with raw content + console warning |
| Nest depth exceeded | Silent degradation, render simplified text-only version |
| Circular reference | Log warning, render `[Circular Reference]` placeholder |
| Component registration failed | Use NullComponent placeholder, log error |

```typescript
// Pseudo-code for error handling
function renderWithGuard(block: MarkdownBlock, context: RenderContext): ComponentRef {
  // Circular reference detection
  if (context.visitedIds.has(block.id)) {
    console.warn(`[BlockRouter] Circular reference: ${block.id}`);
    return createFallbackComponent('[Circular Reference]');
  }
  context.visitedIds.add(block.id);

  // Depth limit
  if (context.depth >= MAX_DEPTH) {
    return createFallbackComponent(block.content);
  }

  // Find component
  const component = registry.get(block.type);
  if (!component) {
    console.warn(`[BlockRouter] Unknown type: ${block.type}`);
    return createFallbackComponent(block.content);
  }

  return createComponent(component, block);
}
```

---

## Plugin Extension Mechanism

```typescript
interface BlockPlugin {
  name: string;
  blockTypes: BlockType[];
  component: Type<any>;
}

class BlockRouterRegistry {
  private componentMap = new Map<BlockType, Type<any>>();

  register(plugin: BlockPlugin): void {
    for (const type of plugin.blockTypes) {
      this.componentMap.set(type, plugin.component);
    }
  }

  unregister(name: string): void {
    // Remove all components registered by this plugin
  }

  get(blockType: BlockType): Type<any> | undefined {
    return this.componentMap.get(blockType);
  }
}
```

**Usage Example**:
```typescript
// Register custom chart block
const chartPlugin: BlockPlugin = {
  name: 'chart',
  blockTypes: [BlockType.CALLOUT],
  component: ChartBlockComponent
};

registry.register(chartPlugin);
```

---

## Testing Strategy

### Unit Tests
- `DepthGuard.canNest()` with various boundary values
- Registry register/unregister functionality
- Unknown type returns fallback
- Circular reference detection

### Integration Tests
- List → List (depth=0 → 1, allowed)
- List → List → List (depth=0→1→2, blocked)
- Blockquote → Paragraph → Code (allowed)
- Complex nested tree rendering

### Performance Tests
- 1000+ flat blocks render time
- Performance at max nesting depth

---

## MVP Scope

### Phase 1 (本次实现)
- ✅ BlockType → Component mapping registry
- ✅ Depth limit (maxDepth = 1)
- ✅ List and Blockquote 1-level nesting (static, after stream complete)
- ✅ Unknown type degradation to fallback
- ✅ Basic test coverage

### Phase 2 (后续迭代)
- 🔄 Streaming nested detection
- 🔄 Partial nested rendering with cursor
- 🔄 NestContext state machine

### Phase 3 (未来)
- 🔄 Circular reference detection
- 🔄 Dynamic plugin hot-reload
- 🔄 Configurable nesting depth

---

## Future/Divergent Ideas

1. **Dynamic Component Loading** - Lazy load block components from external bundles
2. **Nested Depth Configuration** - Allow users to set custom max depth per component
3. **Block Middleware** - Pre/post-processing hooks for block rendering
4. **Visual Debug Mode** - Show block boundaries and depth indicators
5. **Performance Profiling** - Track render time per block type

---

## Streaming + Nested Rendering Integration

### Challenge

Current streaming uses incremental parsing, but nested blocks require complete structures.

### Solution: Partial Rendering Mode

**Strategy**: Already-closed parent items render immediately, unclosed nested content stays in `currentBlock` with cursor.

### State Machine Extension

```
┌─────────────────────────────────────────────────────────────────┐
│                    Nested Streaming State                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              NestContext (栈结构)                        │   │
│  │  ┌─────────────────────────────────────────────────┐    │   │
│  │  │ depth: number                                    │    │   │
│  │  │ expectedIndent: number  (下一行期望的缩进)        │    │   │
│  │  │ blockType: 'list' | 'blockquote'                 │    │   │
│  │  │ isComplete: boolean                              │    │   │
│  │  └─────────────────────────────────────────────────┘    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  currentContext: NestContext | null                             │
│  contextStack: NestContext[]  ← 用于多层嵌套检测                │
└─────────────────────────────────────────────────────────────────┘
```

### State Transitions

```
┌─────────┐    缩进增加     ┌──────────────┐
│  FLAT   │ ──────────────> │ NEST_ENTERED │
│ (平铺)  │                 │ (进入嵌套)    │
└─────────┘                 └──────┬───────┘
     ▲                            │
     │                            │ 缩进减少 且 有父项继续
     │                            │
     │                    ┌───────▼─────────┐
     │                    │ NEST_SIBLING    │
     │                    │ (同级项继续)     │
     │                    └───────┬─────────┘
     │                            │
     │                            │ 缩进减少 且 无父项继续
     │                            │
     │                    ┌───────▼─────────┐
     │                    │ NEST_EXITED     │
     └────────────────────┘                │
                                          │
                                          ▼
                                    ┌─────────┐
                                    │  FLAT   │
                                    └─────────┘
```

### Nested Completeness Detection

```typescript
// 伪代码：检测 List 嵌套是否完整
interface ListContext {
  depth: number;
  expectedIndent: number;
  parentItems: string[];
  nestedList?: ListBlock;
}

function detectListNestingComplete(lines: string[], context: ListContext): boolean {
  const currentLine = lines[lines.length - 1];
  const indent = getIndent(currentLine);

  // 缩进减少 = 子列表可能闭合
  if (indent < context.expectedIndent) {
    const hasParentContinuation = currentLine.matches(/^[*\-\+]\s/);
    return hasParentContinuation;
  }

  return false;
}

// 检测 Blockquote 嵌套是否完整
function detectBlockquoteNestingComplete(lines: string[]): boolean {
  const lastLine = lines[lines.length - 1];
  // 空行或非 `>` 开头表示引用结束
  return !lastLine.trim().startsWith('>');
}
```

### Streaming Render Strategy

```
incoming chunk
       │
       ▼
  ┌─────────────────┐
  │ 有嵌套结构？      │
  └────┬────────────┘
       │
   ┌───┴────┐
   │        │
  No       Yes
   │        │
   ▼        ▼
 平铺    ┌─────────────────┐
 处理    │ 嵌套完整？        │
         └────┬────────────┘
              │
          ┌───┴────┐
          │        │
        Yes       No
          │        │
          ▼        ▼
    递归解析   保持 currentBlock
    加入 blocks   (带嵌套光标)
```

### Data Structure Extensions

```typescript
// 扩展的流式状态
interface StreamingState {
  blocks: MarkdownBlock[];
  currentBlock: MarkdownBlock | null;
  rawContent: string;

  // 新增：嵌套上下文
  nestContext?: {
    type: 'list' | 'blockquote';
    depth: number;
    expectedIndent?: number;
    incompletePath: string[];
  };
}

// 部分嵌套块（用于 currentBlock）
interface PartialListBlock extends ListBlock {
  isPartial: true;
  nestedPartial?: PartialListBlock;
}

interface PartialBlockquoteBlock extends BlockquoteBlock {
  isPartial: true;
  nestedPartial?: MarkdownBlock;
}
```

### Component Handling

```angular
<!-- BlockRouter 处理部分块 -->
@Component({
  template: `
    @if (block.isPartial) {
      <app-partial-block-renderer [block]="block" />
    } @else {
      <!-- 正常渲染 -->
      <ng-container [ngSwitch]="block.type">...</ng-container>
    }
  `
})
export class MarkdownBlockRouterComponent {
  @Input() block!: MarkdownBlock;

  isPartial(): boolean {
    return 'isPartial' in block && (block as any).isPartial === true;
  }
}
```

### Performance Optimizations

1. **缓存嵌套解析结果** - 已解析的嵌套块不重新解析
2. **延迟递归解析** - streaming 期间只构建结构树
3. **增量 ID 生成** - 嵌套块使用 "parent-id.child-index" 格式
4. **浅拷贝优化** - blocks[] 更新时只替换变化部分

### Test Scenarios

| Category | Cases |
|----------|-------|
| **基础嵌套** | `- a\n  - b` → a 渲染, b 在 currentBlock |
| **深度限制** | `- a\n  - b\n    - c` → c 不渲染 (depth=2) |
| **边界情况** | 缩进忽多忽少、空行打断、代码块内的列表样式 |
| **性能测试** | 1000 行平铺列表、100 层嵌套限制触发 |

---

## Open Questions

None

