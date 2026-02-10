# Streaming Markdown Engine Refactoring — Design Document

**Date**: 2025-02-10
**Status**: Approved for implementation
**Scope**: Refactor existing streaming-markdown architecture to fix structural problems while preserving all features

---

## Context

The current streaming-markdown implementation is a full-featured rendering engine with incremental parsing, virtual scrolling, plugin system, lazy highlighting, and self-healing preprocessor. However, it has accumulated structural problems:

1. **God Component** — `StreamingMarkdownComponent` (725 lines, 7 responsibilities)
2. **4 sources of truth for highlight state** — signals, maps, booleans, and scheduler state
3. **No type safety on MarkdownBlock** — 15+ optional fields, any field on any block type
4. **Angular Signals leak into domain models** — `Signal<HighlightResult>` on `MarkdownBlock`
5. **Preprocessor O(12n) per chunk** — code block ranges recalculated per handler

This refactoring addresses these problems without rewriting from scratch.

---

## 1. God Component Decomposition

### Current State

`StreamingMarkdownComponent` handles:
- Stream subscription + buffering
- Chunk processing (preprocessor → parser → state)
- Highlight signal management (4 separate stores)
- Virtual scroll coordination
- Auto-scroll logic (imperative DOM manipulation in `ngAfterViewChecked`)
- Clipboard operations
- Change detection management

### Target State

```
StreamingMarkdownComponent (~150 lines)
│  Template + Input/Output bindings + wiring
│
├── StreamingPipelineService (NEW)
│   │  Owns: preprocessor, parser, buffer logic
│   │  Exposes: state signal, status signal
│   │
│   │  API:
│   │  ├── start(stream$: Observable<string>): void
│   │  ├── reset(): void
│   │  ├── readonly state: Signal<StreamingState>
│   │  ├── readonly status: Signal<StreamingStatus>
│   │  └── readonly rawContent: Signal<string>
│   │
│   │  Internal pipeline:
│   │  stream$ → bufferTime(32) → filter → map(join)
│   │         → preprocess → parseIncremental → state.set()
│
├── HighlightCoordinator (NEW)
│   │  Owns: ShiniHighlighter, HighlightSchedulerService
│   │  Single source of truth for all highlight state
│   │
│   │  API:
│   │  ├── getResult(blockId: string): Signal<HighlightResult | null>
│   │  ├── queueBlock(block: CodeBlock, index: number): void
│   │  ├── queueVisibleBlocks(window: VirtualWindow, blocks: MarkdownBlock[]): void
│   │  ├── initializeAll(blocks: MarkdownBlock[]): void
│   │  └── reset(): void
│   │
│   │  Internal state:
│   │  └── results: WritableSignal<Map<string, HighlightResult>>
│
└── VirtualScrollService (UNCHANGED, already component-scoped)
    │  API unchanged
```

### StreamingPipelineService — Detailed Design

```
@Injectable()  // provided at component level
class StreamingPipelineService implements OnDestroy {

  // Dependencies (injected)
  private preprocessor = inject(MarkdownPreprocessor);
  private parser = inject(BlockParser);

  // State
  readonly state = signal<StreamingState>(createEmptyState());
  readonly status = signal<StreamingStatus>('idle');
  readonly rawContent = computed(() => this.state().rawContent);
  readonly blocks = computed(() => this.state().blocks);
  readonly currentBlock = computed(() => this.state().currentBlock);

  // Lifecycle
  private subscription: Subscription | null = null;
  private destroy$ = new Subject<void>();

  start(stream$: Observable<string>): void {
    this.reset();
    this.status.set('streaming');

    this.subscription = stream$.pipe(
      bufferTime(32),
      filter(chunks => chunks.length > 0),
      map(chunks => chunks.join('')),
      takeUntil(this.destroy$)
    ).subscribe({
      next: (chunk) => this.processChunk(chunk),
      error: (err) => this.handleError(err),
      complete: () => this.status.set('completed')
    });
  }

  reset(): void {
    this.subscription?.unsubscribe();
    this.subscription = null;
    this.parser.reset();
    this.status.set('idle');
    this.state.set(createEmptyState());
  }

  private processChunk(chunk: string): void {
    // Same logic as current processChunk, moved here
    const current = this.state();
    const updatedRaw = current.rawContent + chunk;
    const prevInput = this.preprocessor.process(current.rawContent);
    const nextInput = this.preprocessor.process(updatedRaw);
    const result = this.parser.parseIncremental(prevInput, nextInput);

    let currentBlock: MarkdownBlock | null = null;
    let blocks = result.blocks;

    if (result.hasIncompleteBlock && blocks.length > 0) {
      currentBlock = blocks[blocks.length - 1];
      blocks = blocks.slice(0, -1);
    }

    this.state.set({ blocks, currentBlock, rawContent: updatedRaw });
  }

  private handleError(error: Error): void {
    console.error('[StreamingPipeline] Stream error:', error);
    this.status.set('error');
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.subscription?.unsubscribe();
  }
}
```

### HighlightCoordinator — Detailed Design

```
@Injectable()  // provided at component level
class HighlightCoordinator implements OnDestroy {

  // Dependencies
  private shini = inject(ShiniHighlighter);
  private scheduler = inject(HighlightSchedulerService);

  // THE single source of truth
  private results = signal<Map<string, HighlightResult>>(new Map());

  // Per-block derived signals (cached)
  private blockSignals = new Map<string, Signal<HighlightResult | null>>();

  initialize(): Promise<void> {
    return this.shini.initialize();
  }

  getResult(blockId: string): Signal<HighlightResult | null> {
    let cached = this.blockSignals.get(blockId);
    if (cached) return cached;

    // Create a computed that reads from the single results map
    cached = computed(() => this.results().get(blockId) ?? null);
    this.blockSignals.set(blockId, cached);
    return cached;
  }

  queueBlock(block: CodeBlock, index: number): void {
    if (this.results().has(block.id)) return;  // already highlighted
    this.scheduler.queueBlock(block, index);
  }

  queueVisibleBlocks(window: VirtualWindow, blocks: MarkdownBlock[]): void {
    const start = Math.max(0, window.start - 5);
    const end = Math.min(blocks.length, window.end + 6);
    for (let i = start; i < end; i++) {
      const block = blocks[i];
      if (block.type === BlockType.CODE_BLOCK && !this.results().has(block.id)) {
        this.scheduler.queueBlock(block, i);
      }
    }
  }

  initializeAll(blocks: MarkdownBlock[]): void {
    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      if (block.type === BlockType.CODE_BLOCK && !this.results().has(block.id)) {
        this.scheduler.queueBlock(block, i);
      }
    }
  }

  reset(): void {
    this.scheduler.reset();
    this.results.set(new Map());
    this.blockSignals.clear();
  }

  ngOnDestroy(): void {
    this.reset();
  }
}
```

**Key insight**: `getResult()` returns a `computed` that derives from the single `results` map. When the map updates, all derived signals update automatically. No dual state, no manual `applyHighlightResult`.

### Slimmed Component — What Remains

```
@Component({
  selector: 'app-streaming-markdown',
  providers: [
    StreamingPipelineService,
    HighlightCoordinator,
    MarkdownPreprocessor,
    BlockParser,
    VirtualScrollService,
    HighlightSchedulerService
  ],
  // ... template unchanged
})
class StreamingMarkdownComponent implements OnInit, OnChanges, OnDestroy {
  // Inputs/Outputs (unchanged)
  // Template bindings delegate to services:
  //   pipeline.blocks(), pipeline.currentBlock(), pipeline.rawContent()
  //   highlightCoordinator.getResult(blockId)
  //   virtualScrollService.window()

  // Wiring:
  //   ngOnInit → pipeline.start(stream$), highlightCoordinator.initialize()
  //   ngOnChanges → pipeline.reset(), pipeline.start(newStream$)
  //   stream complete → highlightCoordinator.initializeAll(blocks)
  //   scroll event → virtualScrollService.setScrollTop()
  //   visible range change → highlightCoordinator.queueVisibleBlocks()

  // Clipboard stays here (simple, no extraction needed)
  // Auto-scroll stays here (DOM concern, belongs in component)
}
```

---

## 2. MarkdownBlock Discriminated Unions

### Current State

Single `MarkdownBlock` interface with 15+ optional fields. No compile-time safety.

### Target State

```typescript
// Shared base for all block types
interface MarkdownBlockBase {
  id: string;
  type: BlockType;
  content: string;
  isComplete: boolean;
  position: number;
}

// --- Specific block types ---

interface ParagraphBlock extends MarkdownBlockBase {
  type: BlockType.PARAGRAPH;
  children?: MarkdownInline[];
}

interface HeadingBlock extends MarkdownBlockBase {
  type: BlockType.HEADING;
  level: 1 | 2 | 3 | 4 | 5 | 6;
  children?: MarkdownInline[];
}

interface CodeBlock extends MarkdownBlockBase {
  type: BlockType.CODE_BLOCK;
  language?: string;
  rawContent?: string;
  // NOTE: No highlightResult, isHighlighted, canLazyHighlight
  // Highlight state lives in HighlightCoordinator
}

interface ListBlock extends MarkdownBlockBase {
  type: BlockType.LIST;
  subtype: 'ordered' | 'unordered';
  items: MarkdownBlock[];
}

interface BlockquoteBlock extends MarkdownBlockBase {
  type: BlockType.BLOCKQUOTE;
  blocks: MarkdownBlock[];
}

interface TableBlock extends MarkdownBlockBase {
  type: BlockType.TABLE;
  tableData: {
    headers: string[];
    rows: string[][];
    align?: (string | null)[];
  };
}

interface ThematicBreakBlock extends MarkdownBlockBase {
  type: BlockType.THEMATIC_BREAK;
}

interface HtmlBlock extends MarkdownBlockBase {
  type: BlockType.HTML;
}

interface FootnoteDefBlock extends MarkdownBlockBase {
  type: BlockType.FOOTNOTE_DEF;
  footnoteId?: string;
  footnoteDefs: Map<string, string>;
}

interface UnknownBlock extends MarkdownBlockBase {
  type: BlockType.UNKNOWN;
}

interface RawBlock extends MarkdownBlockBase {
  type: BlockType.RAW;
}

// The union type
type MarkdownBlock =
  | ParagraphBlock
  | HeadingBlock
  | CodeBlock
  | ListBlock
  | BlockquoteBlock
  | TableBlock
  | ThematicBreakBlock
  | HtmlBlock
  | FootnoteDefBlock
  | UnknownBlock
  | RawBlock;
```

### Migration Strategy

1. Define the new types alongside the old interface
2. Update `BlockParser.tokenToBlock()` to return specific types
3. Update each block renderer to accept its specific type
4. Update `BlockRouter` to narrow the type before passing to renderers
5. Remove the old `MarkdownBlock` interface
6. Remove `streaming` field (redundant with `isComplete`)
7. Remove `highlightResult`, `isHighlighted`, `canLazyHighlight` from domain model

### Type Narrowing in Block Router

```typescript
// Block router narrows the type for each renderer:
@switch (block.type) {
  @case (BlockType.CODE_BLOCK) {
    <app-code-block
      [block]="asCodeBlock(block)"
      [highlightResult]="highlightCoordinator.getResult(block.id)"
      [isComplete]="isComplete" />
  }
  @case (BlockType.HEADING) {
    <app-heading [block]="asHeadingBlock(block)" [isComplete]="isComplete" />
  }
  // ...
}

// Type guard helpers:
function asCodeBlock(block: MarkdownBlock): CodeBlock {
  return block as CodeBlock;
}
```

---

## 3. Highlight State Consolidation

### Current State (4 sources of truth)

```
Source 1: highlightScheduler.highlightResults    → Signal<Map<string, CodeLine[]>>
Source 2: highlightScheduler.highlightedBlockIds → Signal<Set<string>>
Source 3: component.highlightSignals             → Map<string, WritableSignal<HighlightResult>>
Source 4: block.isHighlighted                    → boolean on domain model
```

### Target State (1 source of truth)

```
HighlightCoordinator.results → WritableSignal<Map<string, HighlightResult>>

Derived:
  getResult(blockId) → computed(() => results().get(blockId) ?? null)

Eliminated:
  - component.highlightSignals          → REMOVED
  - block.isHighlighted                 → REMOVED (query coordinator instead)
  - block.canLazyHighlight              → REMOVED (component-level config)
  - block.highlightResult               → REMOVED (query coordinator instead)
  - scheduler.highlightedBlockIds       → REMOVED (derive from results map)
```

### How Code Component Gets Highlights

Current:
```typescript
// Code component reads from block.highlightResult signal
const result = this.block.highlightResult?.();
```

Proposed:
```typescript
// Code component receives highlight signal as input
@Input() highlightResult!: Signal<HighlightResult | null>;

// Block router passes it:
[highlightResult]="highlightCoordinator.getResult(block.id)"
```

The code component no longer needs to know about the coordinator. It receives a signal and renders it.

---

## 4. Preprocessor Range Sharing

### Current State

```
process(text):
  for handler in handlers:
    text = handler.handle(text)
    // Each handler internally calls findCodeBlockRanges(text) → O(n) each
    // Total: O(12n) per chunk
```

### Target State

```
process(text):
  ranges = findCodeBlockRanges(text)    // O(n) once
  for handler in handlers:
    text = handler.handle(text, ranges)  // ranges passed in, no recalculation
  return text
```

### Handler Interface Change

```typescript
// Current:
interface PreprocessorHandler {
  priority: number;
  name: string;
  handle(text: string): string;
}

// Proposed:
interface PreprocessorHandler {
  priority: number;
  name: string;
  handle(text: string, codeBlockRanges: [number, number][]): string;
}
```

**Caveat**: When a handler modifies the text (e.g., appends closing markers), the ranges may shift for subsequent handlers. Two options:

- **Option A**: Recalculate ranges after each handler that modifies text length (still better than 12x)
- **Option B**: Only append to end of text (current behavior for most handlers), so ranges don't shift

Most handlers only append closing markers at the end of the text, so Option B works for the common case. For handlers that insert mid-text (if any exist), we recalculate.

---

## 5. Dead Code Removal

### Remove

| Item | Location | Reason |
|------|----------|--------|
| `streaming` field | `MarkdownBlock` | Redundant with `isComplete` |
| `highlightedHTML` field | `MarkdownBlock` | Unused (token-based highlighting replaced it) |
| `BlockRenderState` interface | `models.ts` | Unused |
| `StreamingMarkdownError` | `error-handling.types.ts` | Elaborate but never populated |
| `IErrorHandler` interface | `error-handling.types.ts` | Overloaded, unused in practice |
| `DefaultErrorHandler` | `default-error-handler.ts` | Only logs to console, no recovery |
| `PipelineConfig` interface | `streaming-markdown.component.ts` | Absorbed into `StreamingPipelineService` |
| `StreamingPipeline` interface | `streaming-markdown.component.ts` | Replaced by actual service |
| `BlockDiff` interface | `streaming-markdown.component.ts` | Defined but never used |
| `IChangeDetector` interface | `streaming-markdown.component.ts` | Defined but never used |

### Keep

| Item | Reason |
|------|--------|
| `ComponentErrorType` enum | Used in block components for error boundaries |
| `ErrorCategory`, `ErrorSeverity` | May be useful if error handling is improved later |

---

## Implementation Order

1. **Define discriminated union types** in `models.ts` (additive, no breaking changes yet)
2. **Create `StreamingPipelineService`** — extract stream/parse logic from component
3. **Create `HighlightCoordinator`** — extract highlight logic, establish single source of truth
4. **Slim down `StreamingMarkdownComponent`** — wire to new services
5. **Update `BlockParser`** to return specific block types
6. **Update block renderers** to accept specific types + highlight signal input
7. **Update `BlockRouter`** to narrow types and pass highlight signals
8. **Optimize preprocessor** with shared code block ranges
9. **Remove dead code** (old interfaces, unused fields, error handling scaffolding)
10. **Update tests** — unit tests for new services, update integration tests

### Dependency Graph

```
Step 1 (types) ← Step 5 (parser) ← Step 6 (renderers) ← Step 7 (router)
Step 2 (pipeline) ← Step 4 (slim component)
Step 3 (highlight) ← Step 4 (slim component) ← Step 7 (router)
Step 8 (preprocessor) — independent
Step 9 (cleanup) — after all others
Step 10 (tests) — after all others
```

Parallelizable: Steps 1, 2, 3, 8 can proceed independently.

---

## Testing Strategy

### New Unit Tests

- `StreamingPipelineService`: stream subscription, buffering, incremental parsing, reset, error handling
- `HighlightCoordinator`: single source of truth, getResult reactivity, queue/initialize, reset

### Updated Tests

- `StreamingMarkdownComponent`: slim down to test wiring only (services are tested separately)
- `BlockRouter`: test type narrowing and highlight signal passing
- Block renderers: test with specific block types instead of generic `MarkdownBlock`

### Integration Tests

- Full pipeline: stream$ → rendered blocks with highlights (existing tests, updated for new service boundaries)

---

## Future/Divergent Ideas

These are parked for future consideration:

1. **Binary search for virtual scroll window** — O(n) → O(log n) per scroll event. Profile first to confirm it's a bottleneck.
2. **Dynamic plugin registration** — Allow adding plugins after app startup. No current use case.
3. **Error recovery system** — Implement actual fallback rendering on parse/highlight failures. Current console.error is sufficient.
4. **Discriminated union for `MarkdownInline`** — Same pattern as blocks but lower impact.
5. **`StreamingMarkdownTestHelper`** — Utility for creating mock streams in tests.
6. **Segment tree for height cache** — O(log n) prefix sum queries for virtual scroll. Only needed at scale.
7. **Sliding window for highlight scheduler stats** — Replace running average with exponential moving average.
8. **Shiki initialization lock** — Prevent double-initialization race condition with proper mutex.
