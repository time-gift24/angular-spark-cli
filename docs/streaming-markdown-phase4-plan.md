# Streaming Markdown - Phase 4 Implementation Plan
## Virtual Scrolling & Lazy Loading for Large Content

**Status**: Planning Phase
**Target**: Performance optimization for documents with 1000+ blocks
**Approach**: Hybrid virtual scrolling + progressive block rendering

---

## 1. Problem Analysis

### Current Architecture (Post Phase 3)

```
StreamingMarkdownComponent
│
├── State: Signal<StreamingState>
│   ├── blocks: MarkdownBlock[]      ← ALL blocks stored in memory
│   ├── currentBlock: MarkdownBlock  ← Currently streaming block
│   └── rawContent: string
│
└── Template: @for (block of blocks())
    └── <app-markdown-block-router [block]="block" />  ← ALL blocks rendered
```

### Performance Bottlenecks

| Scenario | Issue | Impact |
|----------|-------|--------|
| 1000+ blocks | All blocks in DOM | ~50-100MB memory, slow scroll |
| Large code blocks | Syntax highlighting on all blocks | Shiki blocking main thread |
| Image-heavy | All images load immediately | Network saturation |
| Nested blockquotes | Deep component trees | Slow change detection |

### Existing Optimizations (Keep These)

- ✅ `bufferTime(32)` - Reduces parse frequency
- ✅ Incremental parsing - Only re-tokenizes tail
- ✅ Stable IDs - Angular @for track reuses DOM
- ✅ OnPush change detection
- ✅ Signal-based state

---

## 2. Solution Design

### Hybrid Approach: Windowed Virtual Scrolling

```
┌─────────────────────────────────────────────┐
│              Viewport (visible)              │
│  ┌─────────────────────────────────────┐    │
│  │  Overscan Buffer (pre-rendered)     │    │
│  │  ├─ block N-2                       │    │
│  │  ├─ block N-1                       │    │
│  │  └─ block N                         │    │
│  │  ┌─────────────────────────────┐   │    │
│  │  │   Visible Blocks (rendered)  │   │    │
│  │  │   ├─ block N+1               │   │    │
│  │  │   ├─ block N+2               │   │    │
│  │  │   └─ ... (viewport height)   │   │    │
│  │  └─────────────────────────────┘   │    │
│  │  Overscan Buffer (pre-rendered)     │    │
│  │  ├─ block N+K                       │    │
│  │  ├─ block N+K+1                     │    │
│  │  └─ block N+K+2                     │    │
│  └─────────────────────────────────────┘    │
│           (Virtual: not rendered)            │
│           ├─ block N+K+3 ...                │
│           └─ ... (total 1000+ blocks)       │
└─────────────────────────────────────────────┘
```

### Key Decisions

| Decision | Rationale |
|----------|-----------|
| **Custom virtual scroller** (no library) | Full control over block rendering, Shiki async integration |
| **Window size: viewport + 50% overscan** | Smooth scroll, minimal jank |
| **Progressive highlighting** | Defer Shiki for off-screen blocks |
| **Lazy image loading** | Native `loading="lazy"` attribute |
| **Keep streaming behavior** | Virtual scroll only AFTER streaming completes |

---

## 3. Architecture Changes

### New Models

```typescript
// core/models.ts additions

export interface VirtualScrollConfig {
  /** Enable virtual scrolling (default: true for 100+ blocks) */
  enabled: boolean;

  /** Number of blocks to render outside viewport (default: 5) */
  overscan?: number;

  /** Estimated block height in pixels (default: 60) */
  estimatedBlockHeight?: number;

  /** Minimum block count to trigger virtual scrolling (default: 100) */
  minBlocksForVirtual?: number;
}

export interface VirtualWindow {
  /** Start index of visible window */
  start: number;

  /** End index of visible window */
  end: number;

  /** Total scrollable height */
  totalHeight: number;
}

export interface BlockRenderState {
  /** Block ID */
  id: string;

  /** Is block currently rendered in DOM? */
  isRendered: boolean;

  /** Has block been syntax-highlighted? (for code blocks) */
  isHighlighted: boolean;

  /** Estimated height */
  estimatedHeight: number;
}
```

### Component Structure

```
streaming-markdown/
├── streaming-markdown.component.ts       (orchestrator)
├── core/
│   ├── models.ts                          (+ VirtualScrollConfig, VirtualWindow)
│   └── virtual-scroll.service.ts          (NEW: scroll state manager)
└── blocks/
    ├── virtual-scroll-viewport.component.ts  (NEW: scroll container)
    └── block-height-tracker.directive.ts      (NEW: measure actual heights)
```

---

## 4. Implementation Phases

### Phase 4.1: Virtual Scroll Foundation (Week 1)

**Goal**: Basic virtual scrolling without Shiki optimization

| Task | Description | Files |
|------|-------------|-------|
| 4.1.1 | Create `VirtualScrollService` | `core/virtual-scroll.service.ts` |
| 4.1.2 | Create `VirtualScrollViewportComponent` | `blocks/virtual-scroll-viewport.component.ts` |
| 4.1.3 | Create `BlockHeightTrackerDirective` | `blocks/block-height-tracker.directive.ts` |
| 4.1.4 | Update `StreamingMarkdownComponent` to use virtual viewport | `streaming-markdown.component.ts` |
| 4.1.5 | Add virtual scroll config to component inputs | `streaming-markdown.component.ts` |

**Acceptance Criteria**:
- 1000 blocks renders ~50 blocks in DOM
- Scroll position is restored on re-renders
- Streaming phase works (all blocks visible during stream)

---

### Phase 4.2: Progressive Code Highlighting (Week 2)

**Goal**: Defer Shiki highlighting to visible blocks only

| Task | Description | Files |
|------|-------------|-------|
| 4.2.1 | Add `isHighlighted` flag to `MarkdownBlock` | `core/models.ts` |
| 4.2.2 | Create `HighlightSchedulerService` | `core/highlight-scheduler.service.ts` |
| 4.2.3 | Update `CodeBlockComponent` to support lazy highlighting | `blocks/code/code.component.ts` |
| 4.2.4 | Connect scheduler to virtual scroll events | `virtual-scroll.service.ts` |
| 4.2.5 | Throttle highlighting (max 4 blocks per frame) | `highlight-scheduler.service.ts` |

**Acceptance Criteria**:
- Only visible blocks are highlighted
- Highlighting doesn't block scroll
- Off-screen blocks are queued for highlight

---

### Phase 4.3: Lazy Loading for Images & Tables (Week 3)

**Goal**: Defer expensive rendering for images and large tables

| Task | Description | Files |
|------|-------------|-------|
| 4.3.1 | Add native `loading="lazy"` to images | `blocks/paragraph/paragraph.component.ts` |
| 4.3.2 | Create `TableLazyRenderDirective` | `blocks/table/table-lazy-render.directive.ts` |
| 4.3.3 | Add render priority to block types | `core/models.ts` (BlockPriority enum) |
| 4.3.4 | Defer low-priority blocks in virtual window | `virtual-scroll.service.ts` |

**Acceptance Criteria**:
- Images load only when approaching viewport
- Large tables render skeleton first, content on scroll

---

### Phase 4.4: Height Estimation & Dynamic Adjustment (Week 4)

**Goal**: Accurate scroll height with minimal measurement overhead

| Task | Description | Files |
|------|-------------|-------|
| 4.4.1 | Implement block height cache | `core/block-height-cache.service.ts` |
| 4.4.2 | Add height estimation by block type | `core/block-height-estimator.ts` |
| 4.4.3 | Dynamic cache invalidation on resize | `virtual-scroll.service.ts` |
| 4.4.4 | Smooth scroll to anchor/hash navigation | `streaming-markdown.component.ts` |

**Acceptance Criteria**:
- Scroll bar reflects actual content height
- Cache命中率 > 90%
- Anchor navigation works with virtual scroll

---

### Phase 4.5: Streaming Integration (Week 5)

**Goal**: Seamless transition from streaming to virtual scroll

| Task | Description | Files |
|------|-------------|-------|
| 4.5.1 | Auto-switch modes on stream completion | `streaming-markdown.component.ts` |
| 4.5.2 | Preserve scroll position during stream | `streaming-markdown.component.ts` |
| 4.5.3 | Animate transition to virtual mode | `virtual-scroll-viewport.component.ts` |

**Acceptance Criteria**:
- No visual jump when switching modes
- Auto-scroll during streaming works
- Final scroll position is natural

---

## 5. API Design

### Component Usage

```typescript
// Basic usage (auto-enables for 100+ blocks)
<app-streaming-markdown [stream$]="aiResponse$" />

// Manual control
<app-streaming-markdown
  [stream$]="aiResponse$"
  [virtualScroll]="{
    enabled: true,
    overscan: 10,
    estimatedBlockHeight: 80,
    minBlocksForVirtual: 50
  }" />

// Disable virtual scroll
<app-streaming-markdown
  [stream$]="aiResponse$"
  [virtualScroll]="{ enabled: false }" />
```

### Events

```typescript
@Output() virtualScrollChange = new EventEmitter<VirtualWindow>();
@Output() blockVisible = new EventEmitter<MarkdownBlock>();
@Output() blockHidden = new EventEmitter<MarkdownBlock>();
```

---

## 6. Testing Strategy

### Unit Tests

| Component | Tests |
|-----------|-------|
| `VirtualScrollService` | Window calculation, overscan, bounds |
| `HighlightSchedulerService` | Queue management, throttling, priority |
| `BlockHeightCache` | Cache hit/miss, LRU eviction |

### Integration Tests

| Scenario | Test |
|----------|------|
| 1000 blocks render | Measure DOM node count |
| Scroll performance | FPS meter during scroll |
| Streaming transition | No layout shift |
| Memory usage | Heap snapshot comparison |

### Benchmark Targets

| Metric | Before | After |
|--------|--------|-------|
| DOM nodes (1000 blocks) | ~3000 | ~150 |
| Initial render | ~500ms | ~50ms |
| Scroll FPS (60fps target) | ~30fps | ~55fps |
| Memory (1000 blocks) | ~80MB | ~25MB |

---

## 7. Dependencies

### Required (None)

All virtual scrolling will be custom implementation.

### Optional (Future)

| Library | Purpose | Status |
|---------|---------|--------|
| `@tanstack/virtual-core` | Reference for algorithms | TBD |
| `virtua` | React virtual scroll reference | TBD |

---

## 8. Open Questions

| Question | Options | Recommendation |
|----------|---------|----------------|
| Should we use IntersectionObserver? | Native API vs scroll events | Use scroll events + RAF for better control |
| How to handle dynamic height blocks (code expand)? | Re-measure vs reserve space | Re-measure on toggle |
| Should we pool block components? | Component recycling vs destroy/create | Destroy/create (Angular OnPush is efficient) |
| How to handle nested blocks (blockquote)? | Flatten vs nested virtual | Flatten for Phase 4, revisit later |

---

## 9. Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Shiki blocking main thread | Defer to idle callback or Web Worker |
| Scroll jank | RequestAnimationFrame batching |
| Height misestimation | Progressive refinement with actual measurements |
| Streaming interaction | Disable virtual scroll during active streaming |
| Accessibility (screen readers) | Render all blocks for a11y mode, add toggle |

---

## 10. Success Criteria

- [ ] 1000-block document renders in <100ms
- [ ] Scroll maintains 55+ FPS
- [ ] Memory usage reduced by >60%
- [ ] Streaming behavior unchanged
- [ ] All existing tests pass
- [ ] New test coverage >80%
- [ ] No regression in Phase 1-3 features

---

## 11. Timeline Summary

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| 4.1: Foundation | 1 week | - |
| 4.2: Code Highlighting | 1 week | 4.1 |
| 4.3: Lazy Loading | 1 week | 4.1 |
| 4.4: Height Estimation | 1 week | 4.1 |
| 4.5: Streaming Integration | 1 week | 4.1, 4.2, 4.3, 4.4 |

**Total**: 5 weeks

---

## Appendix: File Tree (Post-Implementation)

```
src/app/shared/components/streaming-markdown/
├── streaming-markdown.component.ts          (updated)
├── core/
│   ├── models.ts                            (updated)
│   ├── virtual-scroll.service.ts            (NEW)
│   ├── highlight-scheduler.service.ts       (NEW)
│   ├── block-height-cache.service.ts        (NEW)
│   └── block-height-estimator.ts            (NEW)
├── blocks/
│   ├── virtual-scroll-viewport.component.ts (NEW)
│   ├── block-height-tracker.directive.ts    (NEW)
│   ├── block-router/
│   ├── code/                                (updated)
│   ├── table/
│   │   └── table-lazy-render.directive.ts   (NEW)
│   └── paragraph/                           (updated for lazy images)
└── streaming-markdown.component.spec.ts     (updated)
```
