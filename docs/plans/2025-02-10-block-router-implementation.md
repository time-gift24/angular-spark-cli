# Block Router State Machine - Implementation Plan

**Date**: 2025-02-10
**Status**: Ready for Implementation
**Phase**: 1 (Registry + Static Nesting)

---

## Overview

Replace chain-style `@if/@else if` block routing with a Registry-based state machine supporting 1-level nested rendering.

---

## Architecture Summary

```
┌─────────────────────────────────────────────────────────────────┐
│                        BlockRouterState                          │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              ComponentRegistry                           │   │
│  │  BlockType → ComponentType 映射                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              DepthGuard                                  │   │
│  │  maxDepth: number = 1                                    │   │
│  │  canNest(block, depth): boolean                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  resolve(block: MarkdownBlock): ComponentType | null            │
└─────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Core Registry (Tasks 1.1 - 1.4)

### Task 1.1: Create BlockRouterRegistry Service

**File**: `src/app/shared/components/streaming-markdown/core/block-router-registry.ts`

```typescript
@Injectable({ providedIn: 'root' })
export class BlockRouterRegistry {
  private componentMap = new Map<BlockType, Type<any>>();

  // Register a block type mapping
  register(blockType: BlockType, component: Type<any>): void {
    this.componentMap.set(blockType, component);
  }

  // Register multiple mappings at once
  registerAll(mappings: Record<BlockType, Type<any>>): void {
    Object.entries(mappings).forEach(([type, component]) => {
      this.componentMap.set(type as BlockType, component);
    });
  }

  // Get component for block type
  get(blockType: BlockType): Type<any> | undefined {
    return this.componentMap.get(blockType);
  }

  // Check if block type is registered
  has(blockType: BlockType): boolean {
    return this.componentMap.has(blockType);
  }

  // Get all registered types
  getRegisteredTypes(): BlockType[] {
    return Array.from(this.componentMap.keys());
  }
}
```

**Acceptance Criteria**:
- [ ] Service created with all methods
- [ ] Injectable decorator with providedIn: 'root'
- [ ] Exported from core/index.ts

---

### Task 1.2: Define DepthGuard Utility

**File**: `src/app/shared/components/streaming-markdown/core/depth-guard.ts`

```typescript
export const MAX_NEST_DEPTH = 1;

export class DepthGuard {
  static canNest(block: MarkdownBlock, currentDepth: number): boolean {
    // 1. Check depth limit
    if (currentDepth >= MAX_NEST_DEPTH) {
      return false;
    }

    // 2. Only List and Blockquote support nesting
    return isListBlock(block) || isBlockquoteBlock(block);
  }

  static isAtMaxDepth(depth: number): boolean {
    return depth >= MAX_NEST_DEPTH;
  }
}
```

**Acceptance Criteria**:
- [ ] DepthGuard created with canNest() method
- [ ] MAX_NEST_DEPTH exported as constant
- [ ] Type guards used for block type checking

---

### Task 1.3: Restore Circular Reference in Models

**File**: `src/app/shared/components/streaming-markdown/core/models.ts`

**Changes**:
```typescript
// Remove circular reference workaround
// OLD: items: string[]
// NEW: items: (string | MarkdownBlock)[]

interface ListBlock extends MarkdownBlockBase {
  type: BlockType.LIST;
  subtype: 'ordered' | 'unordered';
  items: (string | MarkdownBlock)[];  // Restore nested support
}

interface BlockquoteBlock extends MarkdownBlockBase {
  type: BlockType.BLOCKQUOTE;
  content: string;
  blocks: MarkdownBlock[];  // Restore full child blocks
}
```

**Acceptance Criteria**:
- [ ] ListBlock.items changed to `(string | MarkdownBlock)[]`
- [ ] BlockquoteBlock.blocks changed to `MarkdownBlock[]`
- [ ] No build errors from circular reference

---

### Task 1.4: Update Plugin Types for Registry

**File**: `src/app/shared/components/streaming-markdown/core/plugin.ts`

**Changes**:
- Ensure `BlockComponentRegistry` aligns with new `BlockRouterRegistry`
- Export types for plugin registration

**Acceptance Criteria**:
- [ ] Plugin types compatible with registry
- [ ] Exported from core/index.ts

---

## Phase 2: Component Updates (Tasks 2.1 - 2.3)

### Task 2.1: Refactor BlockRouterComponent

**File**: `src/app/shared/components/streaming-markdown/blocks/block-router/block-router.component.ts`

**Current**: Chain-style `@if/@else if`
**Target**: Use `@switch` with registry lookup

```typescript
@Component({
  selector: 'app-block-router',
  standalone: true,
  imports: [CommonModule, /* all block components */],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ng-container [ngSwitch]="block.type">
      <!-- Code Block -->
      <app-markdown-code
        *ngSwitchCase="BlockType.CODE_BLOCK"
        [block]="block"
        [isComplete]="isComplete"
        [blockIndex]="blockIndex"
        [enableLazyHighlight]="enableLazyHighlight"
        [allowHighlight]="allowHighlight" />

      <!-- Paragraph -->
      <app-markdown-paragraph
        *ngSwitchCase="BlockType.PARAGRAPH"
        [block]="block" />

      <!-- Heading -->
      <app-markdown-heading
        *ngSwitchCase="BlockType.HEADING"
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

      <!-- Table -->
      <app-markdown-table
        *ngSwitchCase="BlockType.TABLE"
        [block]="block" />

      <!-- Thematic Break -->
      <app-markdown-thematic-break
        *ngSwitchCase="BlockType.THEMATIC_BREAK"
        [block]="block" />

      <!-- Footnote -->
      <app-markdown-footnote
        *ngSwitchCase="BlockType.FOOTNOTE_DEF"
        [block]="block" />

      <!-- Fallback for unknown types -->
      <div *ngSwitchDefault class="block-fallback">
        {{ block.content }}
      </div>
    </ng-container>
  `
})
export class MarkdownBlockRouterComponent {
  @Input({ required: true }) block!: MarkdownBlock;
  @Input() isComplete: boolean = true;
  @Input() blockIndex: number = -1;
  @Input() enableLazyHighlight: boolean = false;
  @Input() allowHighlight: boolean = true;
  @Input() depth: number = 0;

  protected readonly BlockType = BlockType;

  canNest(): boolean {
    return DepthGuard.canNest(this.block, this.depth);
  }
}
```

**Acceptance Criteria**:
- [ ] Template uses `@switch` instead of `@if/@else if`
- [ ] `canNest()` method implemented
- [ ] `depth` input added and passed to nested components
- [ ] Fallback case for unknown types

---

### Task 2.2: Update MarkdownListComponent

**File**: `src/app/shared/components/streaming-markdown/blocks/list/list.component.ts`

**Changes**:
- Add `depth` and `canNest` inputs
- Render nested blocks recursively when `canNest` is true
- Fallback to simplified rendering when depth limit reached

```typescript
@Component({
  selector: 'app-markdown-list',
  standalone: true,
  imports: [CommonModule, MarkdownBlockRouterComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ul [class]="listClasses()" *ngIf="!ordered; else orderedList">
      @for (item of items; track item.id || $index) {
        <li [class]="getItemClass()">
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

    <ng-template #orderedList>
      <ol [class]="listClasses()">
        @for (item of items; track item.id || $index) {
          <li [class]="getItemClass()">
            @if (typeof item === 'string') {
              {{ item }}
            } @else if (canNest) {
              <app-block-router [block]="item" [depth]="depth + 1" />
            } @else {
              <span class="nested-fallback">[Nested content]</span>
            }
          </li>
        }
      </ol>
    </ng-template>
  `
})
export class MarkdownListComponent {
  @Input({ required: true }) block!: ListBlock;
  @Input() depth: number = 0;
  @Input() canNest: boolean = false;

  // ... existing code ...
}
```

**Acceptance Criteria**:
- [ ] `depth` and `canNest` inputs added
- [ ] Recursive `<app-block-router>` for nested blocks
- [ ] Fallback rendering when depth limit reached
- [ ] Type check `typeof item === 'string'` for mixed items

---

### Task 2.3: Update MarkdownBlockquoteComponent

**File**: `src/app/shared/components/streaming-markdown/blocks/blockquote/blockquote.component.ts`

**Changes**:
- Add `depth` and `canNest` inputs
- Render nested blocks recursively
- Fallback to plain text when depth limit reached

```typescript
@Component({
  selector: 'app-markdown-blockquote',
  standalone: true,
  imports: [CommonModule, MarkdownBlockRouterComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <blockquote [class]="blockquoteClasses()">
      @if (canNest && blocks.length > 0) {
        @for (childBlock of blocks; track childBlock.id) {
          <app-block-router [block]="childBlock" [depth]="depth + 1" />
        }
      } @else {
        {{ block.content }}
      }

      @if (!isComplete) {
        <span class="streaming-cursor"></span>
      }
    </blockquote>
  `
})
export class MarkdownBlockquoteComponent implements OnChanges {
  @Input({ required: true }) block!: BlockquoteBlock;
  @Input() isComplete: boolean = true;
  @Input() blockIndex: number = -1;
  @Input() enableLazyHighlight: boolean = false;
  @Input() allowHighlight: boolean = true;
  @Input() depth: number = 0;
  @Input() canNest: boolean = false;

  get blocks(): MarkdownBlock[] {
    return this.block.blocks || [];
  }

  // ... existing code ...
}
```

**Acceptance Criteria**:
- [ ] `depth` and `canNest` inputs added
- [ ] Recursive `<app-block-router>` for nested blocks
- [ ] Fallback to `block.content` when depth limit reached

---

## Phase 3: Parser Updates (Task 3.1)

### Task 3.1: Update BlockParser for Nested Structures

**File**: `src/app/shared/components/streaming-markdown/core/block-parser.ts`

**Changes**:
- Restore nested block creation in `tokenToBlock()`
- Create proper `ListBlock` with mixed items
- Create proper `BlockquoteBlock` with child blocks

```typescript
// In tokenToBlock(), case 'list':
case 'list': {
  const listToken = token as any;
  const items = listToken.items || [];
  const subtype = listToken.ordered ? 'ordered' : 'unordered';

  const parsedItems: (string | MarkdownBlock)[] = items.map((item: any, i: number) => {
    // Check for nested list
    if (item.tokens) {
      const nestedLists = item.tokens.filter((t: any) => t.type === 'list');
      if (nestedLists.length > 0) {
        // Create nested list block
        const nestedList = nestedLists[0];
        return {
          id: `${baseBlock.id}-nested-${i}`,
          type: BlockType.LIST,
          content: '',
          items: (nestedList.items || []).map((ni: any) => ni.text || ''),
          subtype: nestedList.ordered ? 'ordered' : 'unordered',
          isComplete: true,
          position: i
        } as ListBlock;
      }
    }
    // Plain text item
    return item.text || '';
  });

  return {
    ...baseBlock,
    type: BlockType.LIST,
    content: items.map((item: any) => item.text || '').join('\n'),
    subtype: subtype as 'ordered' | 'unordered',
    items: parsedItems
  };
}

// In tokenToBlock(), case 'blockquote':
case 'blockquote': {
  const bqToken = token as any;
  const nestedBlocks: MarkdownBlock[] = [];
  if (bqToken.tokens && Array.isArray(bqToken.tokens)) {
    let nestedPos = 0;
    for (const nestedToken of bqToken.tokens) {
      const nestedBlock = this.tokenToBlock(nestedToken, nestedPos);
      if (nestedBlock) {
        nestedBlocks.push(nestedBlock);
        nestedPos++;
      }
    }
  }
  return {
    ...baseBlock,
    type: BlockType.BLOCKQUOTE,
    content: this.extractText(token),
    blocks: nestedBlocks
  };
}
```

**Acceptance Criteria**:
- [ ] List parsing creates mixed `(string | MarkdownBlock)[]` items
- [ ] Nested lists properly created as `ListBlock`
- [ ] Blockquote parsing creates `MarkdownBlock[]` children
- [ ] No TypeScript errors from circular reference

---

## Phase 4: Testing (Tasks 4.1 - 4.3)

### Task 4.1: Unit Tests for DepthGuard

**File**: `src/app/shared/components/streaming-markdown/core/depth-guard.spec.ts`

```typescript
describe('DepthGuard', () => {
  it('should allow nesting at depth 0', () => {
    const listBlock: ListBlock = { /* ... */ };
    expect(DepthGuard.canNest(listBlock, 0)).toBe(true);
  });

  it('should block nesting at depth 1', () => {
    const listBlock: ListBlock = { /* ... */ };
    expect(DepthGuard.canNest(listBlock, 1)).toBe(false);
  });

  it('should not allow nesting for paragraph blocks', () => {
    const paraBlock: ParagraphBlock = { /* ... */ };
    expect(DepthGuard.canNest(paraBlock, 0)).toBe(false);
  });
});
```

**Acceptance Criteria**:
- [ ] DepthGuard unit tests created
- [ ] All boundary cases covered
- [ ] Tests pass

---

### Task 4.2: Integration Tests for Nested Rendering

**File**: `src/app/shared/components/streaming-markdown/blocks/block-router/block-router.component.integration.spec.ts`

```typescript
describe('BlockRouter Nested Rendering', () => {
  it('should render list with nested list', () => {
    const nestedList: ListBlock = {
      id: 'nested-1',
      type: BlockType.LIST,
      items: ['child 1', 'child 2'],
      subtype: 'unordered',
      isComplete: true,
      position: 0
    };

    const parentList: ListBlock = {
      id: 'parent-1',
      type: BlockType.LIST,
      items: ['parent 1', nestedList, 'parent 2'],
      subtype: 'unordered',
      isComplete: true,
      position: 0
    };

    // Render and verify nested list is present
  });

  it('should not render nested list beyond depth 1', () => {
    // Create triple-nested structure
    // Verify only 2 levels render
  });
});
```

**Acceptance Criteria**:
- [ ] Integration tests for List → List nesting
- [ ] Integration tests for Blockquote → any block
- [ ] Depth limit verification tests
- [ ] Tests pass

---

### Task 4.3: Visual Regression Tests

**File**: Manual testing checklist

| Test Case | Expected | Status |
|-----------|----------|--------|
| Simple list | Bulleted items rendered | |
| List with nested list | Nested list indented | |
| Triple-nested list | Only 2 levels rendered | |
| Blockquote with paragraph | Paragraph inside quote | |
| Blockquote with list | List inside quote | |
| Blockquote with code | Code block inside quote | |

**Acceptance Criteria**:
- [ ] All visual tests pass
- [ ] Screenshots captured for reference

---

## Phase 5: Documentation (Task 5.1)

### Task 5.1: Update Documentation

**Files**:
- `README.md` (if exists)
- Inline code comments

**Add**:
- Registry usage guide
- Nesting depth limit explanation
- Extension guide for plugins

**Acceptance Criteria**:
- [ ] README updated with registry info
- [ ] Code comments added for complex logic
- [ ] Examples provided

---

## Task Summary

| Phase | Tasks | Priority |
|-------|-------|----------|
| Phase 1: Core Registry | 1.1 - 1.4 | High |
| Phase 2: Component Updates | 2.1 - 2.3 | High |
| Phase 3: Parser Updates | 3.1 | High |
| Phase 4: Testing | 4.1 - 4.3 | Medium |
| Phase 5: Documentation | 5.1 | Low |

**Total**: 13 tasks

---

## Execution Order

1. **Phase 1** → Build foundation (Registry + Models)
2. **Phase 3** → Update parser (depends on Phase 1 model changes)
3. **Phase 2** → Update components (depends on Phase 1 & 3)
4. **Phase 4** → Test (depends on Phase 2 & 3)
5. **Phase 5** → Document

---

## Success Criteria

- [ ] Build passes with zero errors
- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] Manual visual tests pass
- [ ] No regressions in existing functionality
- [ ] Documentation complete

