# Topology Visualization - Design Document

**Date:** 2025-02-09
**Status:** MVP Design Complete
**Related Project:** topo-cli (https://github.com/wanyaozhong/topo-cli)

---

## Executive Summary

Design a frontend topology visualization component for Angular Spark CLI that displays infrastructure topology data from the topo-cli backend. The visualization targets DevOps/SRE users for monitoring and debugging microservices and their dependencies.

### Goals
- Display nodes (services, databases, repos) and their relationships
- Support interactive exploration (pan, zoom, click for details)
- Use orthogonal (grid) layout for clean infrastructure maps
- Integrate with Angular Spark's existing theme system

---

## 1. Understanding & Requirements

### 1.1 Use Case
**Infrastructure Dashboard** - DevOps/SRE view of microservices, databases, and their dependencies for monitoring and debugging.

### 1.2 Scope (MVP)

| Feature | Included |
|---------|----------|
| View + Inspect | ✅ Click node/edge for details, hover for quick info, pan/zoom |
| View + Inspect + Path Tracing | ❌ (Future) |
| Actions from UI | ❌ (Future) |
| Filtering | ❌ Handled by backend |

### 1.3 Backend Analysis (topo-cli)

#### Data Models

**Node:**
```go
{
  id: int64              // Technical key (internal)
  type: string          // Business key: "service", "database", "repo", etc.
  name: string          // Business key: unique within type
  props: JSONB          // Flexible properties
  created_at, updated_at: timestamps
}
```

**Edge:**
```go
{
  id: int64
  src_type, src_name: string  // Source node reference
  kind: string                // Relationship type
  dst_type, dst_name: string  // Destination node reference
  props: JSONB
  created_at, updated_at: timestamps
}
```

**Discovered Node Types:**
- `service` - API, web, cache services
- `database` - Database nodes
- `repo` - Code repositories
- `microservice` - Microservice instances

#### API Endpoints
- `GET /api/v1/nodes` - List nodes
- `GET /api/v1/edges` - List edges
- Backend handles all filtering logic

---

## 2. Architecture Design

### 2.1 Page Structure

```
/topology (独立路由)
├── 顶部工具栏 (Toolbar)
│   ├── 标题: "Topology Map"
│   ├── 缩放控制: [-] [+] [Reset]
│   └── 适配按钮: [Fit]
│
├── 主画布区域 (X6 Graph Canvas)
│   ├── 节点渲染 (矩形 + 文本)
│   ├── 边渲染 (正交连线 + 箭头 + 标签)
│   └── 交互 (拖拽平移、滚轮缩放、点击选中)
│
└── 浮动详情卡片 (NodeDetailCardComponent)
    ├── 节点类型
    ├── 节点名称
    ├── 属性表格 (props key-value)
    └── 关闭按钮
```

### 2.2 Data Flow

```
TopologyComponent
    ↓
TopoService.getTopology(params)
    ↓
HTTP GET /api/v1/topology
    ↓
{ nodes: [...], edges: [...] }
    ↓
Transform to X6 format
    ↓
X6 Graph.fromJSON()
    ↓
Apply dagre layout
```

### 2.3 Component Architecture

```
src/app/features/topology/
├── topology.routes.ts           # 路由配置
├── pages/
│   └── topology-page.component.ts   # 主页面容器
├── services/
│   └── topology.service.ts          # HTTP 服务
├── components/
│   ├── topology-canvas/
│   │   └── topology-canvas.component.ts    # X6 画布封装
│   ├── topology-toolbar/
│   │   └── topology-toolbar.component.ts   # 工具栏
│   └── node-detail-card/
│       └── node-detail-card.component.ts   # 浮动详情卡片
└── graph/
    ├── node-renderer.ts          # 节点渲染配置
    ├── edge-renderer.ts          # 边渲染配置
    └── layout.config.ts          # 布局配置
```

---

## 3. Visual Design

### 3.1 Node Rendering

**Structure:**
```
┌─────────────────────────────────────┐
│  ┌─┐                               │
│  │●│  {type}                       │  ← Type (muted color)
│  │ │                               │
│  └─┘  {name}                       │  ← Name (primary color)
└─────────────────────────────────────┘
   ↑                    ↑
   width: 180px         height: 60px
```

**Style Specification (Tailwind + CSS Variables):**

| Element | Value |
|---------|-------|
| Background | `bg-background` |
| Border | `border border-border` |
| Radius | `rounded-md` |
| Shadow | `shadow-sm` |
| Type text | `text-muted-foreground text-xs` |
| Name text | `text-foreground text-sm font-medium` |
| Selected | `ring-2 ring-primary ring-offset-2` |

**Icons (MVP):** All nodes use the same circle icon (●)

### 3.2 Edge Rendering

**Structure:**
```
       {kind}
   ╔═══════════════════════════╗
   ║                           ║
   ║                           ║
   └─ → ─ ─ ─ ─ ─ ─ ─ ─ ─ → ─┘
   ↑                   ↑
   Orthogonal lines   Arrow
```

**Style Specification:**

| Element | Value |
|---------|-------|
| Line color | `stroke: var(--border)` |
| Line width | `1.5px` (selected: `2.5px`) |
| Selected color | `var(--primary)` |
| Label background | `bg-muted rounded px-1` |
| Label text | `text-xs text-muted-foreground` |

### 3.3 Detail Card (Floating)

**Position:** Near clicked node, auto-adjusts to avoid overflow

**Style Specification:**

| Element | Value |
|---------|-------|
| Background | `bg-background` |
| Border | `border border-border` |
| Radius | `rounded-lg` |
| Shadow | `shadow-lg` |
| Padding | `p-4` |
| Max width | `w-80` (320px) |

**Content Display:**
```
┌────────────────────────────────┐
│  ×                             │ ← Close button
│                                │
│  Type: service                 │
│  Name: api-gateway             │
│                                │
│  ┌──────────────────────────┐  │
│  │ Properties               │  │
│  ├──────────┬───────────────┤  │
│  │ port     │ 8080          │  │
│  │ env      │ production    │  │
│  │ team     │ backend       │  │
│  └──────────┴───────────────┘  │
└────────────────────────────────┘
```

---

## 4. Interactions

### 4.1 Canvas Operations

| Operation | Trigger | Behavior |
|-----------|---------|----------|
| Pan | Drag empty area | Move canvas |
| Zoom | Mouse wheel | Zoom at cursor position |
| Zoom | +/- buttons | Zoom at center |
| Select | Click node/edge | Highlight + show detail card |
| Deselect | Click empty area | Remove highlight + hide card |
| Fit | Fit button | Auto-zoom to show all |

### 4.2 Zoom Configuration

```
min: 0.1 (10%)
max: 2.0 (200%)
default: 1.0 (100%)
```

### 4.3 Selection States

**Node Selected:**
- Add `ring-2 ring-primary ring-offset-2`
- Show detail card

**Edge Selected:**
- Line color changes to `var(--primary)`
- Line width increases to `2.5px`
- Show detail card with edge info

### 4.4 Keyboard Shortcuts (Optional, Post-MVP)

| Key | Action |
|-----|--------|
| ESC | Deselect + hide card |
| +/- | Zoom |
| 0 | Reset zoom to 100% |

---

## 5. Layout

### 5.1 Layout Algorithm

Use **X6 with dagre layout** configured for orthogonal routing:

```typescript
const layoutConfig = {
  type: 'dagre',
  rankdir: 'TB',        // Top-Bottom direction
  align: 'UL',          // Upper-Left alignment
  nodesep: 50,          // Horizontal spacing between nodes
  ranksep: 80,          // Vertical spacing between ranks
}

const edgeRouter = {
  name: 'orth',         // Orthogonal routing
  args: {
    padding: 20,
  }
}
```

### 5.2 Layout Trigger

1. **Initial load** → Auto apply layout
2. **User drags node** → Keep user position (no re-layout)
3. **Fit button** → Re-apply layout + auto-zoom

### 5.3 Data Transformation

```typescript
// Backend format → X6 format
function transformToX6(data: { nodes: Node[], edges: Edge[] }) {
  return {
    nodes: data.nodes.map(n => ({
      id: `${n.type}/${n.name}`,
      shape: 'custom-node',
      data: n,
    })),
    edges: data.edges.map(e => ({
      source: `${e.src_type}/${e.src_name}`,
      target: `${e.dst_type}/${e.dst_name}`,
      label: e.kind,
      data: e,
    })),
  };
}
```

---

## 6. Error Handling & Edge Cases

### 6.1 Network Errors

| Scenario | Handling |
|----------|----------|
| Request failed | Toast + empty state |
| Timeout | Toast + empty state |
| Empty data | "No topology data" message |

### 6.2 Empty State Design

```
┌─────────────────────────────────────────────┐
│                                             │
│              📊                              │
│                                             │
│          暂无拓扑数据                        │
│                                             │
│     当前条件下没有找到任何节点或边            │
│                                             │
└─────────────────────────────────────────────┘
```

### 6.3 Detail Card Boundary Detection

- If card overflows right edge → Flip to left of node
- If card overflows bottom edge → Flip to top of node

### 6.4 Props Display

| Scenario | Handling |
|----------|----------|
| Empty props `{}` | Display "No properties" |
| Object/Array value | JSON.stringify + truncate |
| Long value (>50 chars) | Truncate with `...` |

### 6.5 Large Data Handling

| Node Count | Action |
|------------|--------|
| > 100 | Warning toast: "Large dataset, rendering may be slow" |
| > 500 | Block render, error: "Dataset too large, please narrow your query" |

---

## 7. UI/UX Design System Integration

Based on UI/UX Pro Max recommendations for infrastructure dashboards:

### 7.1 Color System (using Angular Spark theme)

| Purpose | CSS Variable |
|---------|--------------|
| Status: Critical | `var(--destructive)` |
| Status: Warning | `var(--accent)` |
| Status: Healthy | `var(--primary)` |
| Status: Inactive | `var(--muted-foreground)` |
| Background | `var(--background)` |
| Border | `var(--border)` |

### 7.2 Animation Guidelines

| Transition | Duration |
|------------|----------|
| Hover effects | 150ms |
| Modal/Card open | 200ms |
| Node position | 200ms |

### 7.3 Accessibility

- Keyboard navigation support
- Focus indicators on interactive elements
- ARIA labels for nodes and edges
- Color contrast WCAG AA compliant

---

## 8. Technology Stack

| Category | Selection |
|----------|----------|
| **Graph Engine** | X6 (AntV) |
| **Layout Algorithm** | dagre (X6 built-in) |
| **Styling** | Tailwind CSS + CSS Variables |
| **State Management** | Angular Signals |
| **HTTP Client** | Angular HttpClient |

### Why X6?

- Professional graph editor engine
- Built-in orthogonal routing
- Comprehensive interaction support
- Good documentation
- Framework-agnostic (works with Angular)

---

## 9. Implementation Checklist

### Phase 1: Foundation
- [ ] Set up `/topology` route
- [ ] Install and configure X6
- [ ] Create TopologyService with HTTP client
- [ ] Create basic page layout (toolbar + canvas container)

### Phase 2: Core Visualization
- [ ] Implement node renderer with Angular Spark theme
- [ ] Implement edge renderer with labels
- [ ] Configure dagre layout with orthogonal routing
- [ ] Connect to backend API

### Phase 3: Interactions
- [ ] Implement pan and zoom
- [ ] Implement node/edge selection
- [ ] Create floating detail card component
- [ ] Add toolbar controls (+, -, Reset, Fit)

### Phase 4: Polish
- [ ] Add loading states
- [ ] Add empty state
- [ ] Add error handling
- [ ] Add boundary detection for detail card
- [ ] Test with real data

---

## 10. Future Ideas (Parking Lot)

Features intentionally excluded from MVP:

| Feature | Rationale |
|---------|-----------|
| **Node type icons** | MVP uses unified rendering; can add per-type icons later |
| **Path tracing** | Advanced feature; not needed for basic inspection |
| **UI-based CRUD** | MVP is read-only; edit operations can be added later |
| **Real-time updates** | Requires WebSocket backend integration |
| **Performance optimization** | Only needed if data scales beyond MVP scope |
| **Export (PNG/SVG)** | Nice-to-have, not critical for dashboard use |
| **Minimap** | Only needed for very large topologies |
| **Search within graph** | Backend handles filtering; search is redundant for MVP |

---

## 11. References

- **Backend Project:** https://github.com/wanyaozhong/topo-cli
- **X6 Documentation:** https://x6.antv.antgroup.com/
- **Angular Spark CLI:** Current project
- **UI/UX Pro Max:** Infrastructure dashboard design patterns

---

**Design Status:** ✅ Ready for Implementation

**Next Steps:**
1. Review and approve this design
2. Create git worktree for isolated development
3. Generate detailed implementation plan
4. Begin Phase 1 implementation
