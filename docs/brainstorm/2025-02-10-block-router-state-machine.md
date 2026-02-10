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

### Must Have (Phase 1)
- ✅ BlockType → Component mapping registry
- ✅ Depth limit (maxDepth = 1)
- ✅ List and Blockquote 1-level nesting
- ✅ Unknown type degradation to fallback
- ✅ Basic test coverage

### Nice to Have (Future)
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

## Open Questions

1. **Streaming Integration**: How does nested block rendering work with incremental parsing?
   - Needs investigation into current streaming mechanism

