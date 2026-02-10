# Topology Visualization Frontend Design (V2)

**Version:** 2.0  
**Date:** 2026-02-09  
**Status:** Ready for Implementation

---

## 1. Scope and Constraints

### 1.1 Goal (Current Phase)
构建一个仅用于**拓扑图渲染与检视**的前端页面，服务 DevOps/SRE 场景：
- 展示节点（service/database/repo/microservice）
- 展示关系边（depends_on/calls/...）
- 提供交互查看（缩放、平移、选中、详情）

### 1.2 Non-Goals (Must Exclude)
当前阶段明确不做：
- Chat UI
- LLM 相关功能
- 自然语言解析
- 前端发起拓扑编辑（CRUD）

> 结论：本阶段是**只读拓扑可视化**，不引入任何模型能力。

---

## 2. Backend API Contract (for Frontend Agent)

Base URL:

```text
http://localhost:9999/api/v1
```

### 2.1 Node APIs

- `GET /nodes?type=&cursor=&limit=`
  - Query:
    - `type` optional
    - `cursor` optional
    - `limit` optional (建议 100)
  - Response:

```json
{
  "items": [
    {
      "id": 1,
      "type": "service",
      "name": "api-gateway",
      "props": { "team": "backend" },
      "created_at": "2026-02-09T00:00:00Z",
      "updated_at": "2026-02-09T00:00:00Z"
    }
  ],
  "next_cursor": "..."
}
```

### 2.2 Edge APIs

- `GET /edges?src_type=&dst_type=&kind=&cursor=&limit=`
  - Query:
    - `src_type` optional
    - `dst_type` optional
    - `kind` optional
    - `cursor` optional
    - `limit` optional
  - Response:

```json
{
  "items": [
    {
      "id": 10,
      "src_type": "service",
      "src_name": "api-gateway",
      "kind": "depends_on",
      "dst_type": "database",
      "dst_name": "user-db",
      "props": {},
      "created_at": "2026-02-09T00:00:00Z",
      "updated_at": "2026-02-09T00:00:00Z"
    }
  ],
  "next_cursor": null
}
```

### 2.3 Important Note
- 后端没有 `GET /topology` 聚合接口。
- 前端必须分别拉 `nodes` + `edges`，然后本地组装图。

---

## 3. Data Loading Strategy

### 3.1 Cursor Pagination (Required)
前端必须循环拉取直到 `next_cursor` 为空。

Pseudo flow:

```text
fetchAllNodes(type?)
  cursor = ""
  loop:
    GET /nodes?cursor=...&limit=100
    append items
    if no next_cursor -> break
    cursor = next_cursor

fetchAllEdges(filters?)
  same logic
```

### 3.2 Graph Identity
- Node key: `${type}/${name}`
- Edge key: `${src_type}/${src_name}/${kind}/${dst_type}/${dst_name}`

### 3.3 Orphan Edge Handling
若 edge 引用的 src/dst 节点不在当前节点集：
- 不中断渲染
- 记录到 `orphanEdges`
- 在 UI 顶部提示数量（warning）

---

## 4. Frontend Architecture (Angular 20)

Target workspace:

```text
/Users/wanyaozhong/Projects/angular-spark-cli
```

Suggested structure:

```text
src/app/features/topology/
├── topology.routes.ts
├── pages/
│   └── topology-page.component.ts
├── services/
│   └── topology.service.ts
├── state/
│   └── topology.store.ts
├── components/
│   ├── topology-toolbar/
│   │   └── topology-toolbar.component.ts
│   ├── topology-canvas/
│   │   └── topology-canvas.component.ts
│   └── topology-inspector/
│       └── topology-inspector.component.ts
└── graph/
    ├── transform.ts
    ├── layout.config.ts
    └── styles.config.ts
```

### 4.1 State Model (Signals)
- `nodes: Signal<Node[]>`
- `edges: Signal<Edge[]>`
- `selectedNodeKey: Signal<string | null>`
- `selectedEdgeKey: Signal<string | null>`
- `loading: Signal<boolean>`
- `error: Signal<string | null>`
- `orphanEdges: Signal<Edge[]>`

---

## 5. Visualization Design

### 5.1 Graph Engine
- X6 + dagre
- Edge router: orthogonal (`orth`)

### 5.2 Layout Config

```typescript
{
  rankdir: 'TB',
  align: 'UL',
  nodesep: 50,
  ranksep: 80
}
```

### 5.3 Node Style
- Width: `180`
- Height: `60`
- Border: `var(--border)`
- Background: `var(--background)`
- Name text: `var(--foreground)`
- Type text: `var(--muted-foreground)`
- Selected: primary ring

### 5.4 Edge Style
- Stroke: `var(--border)`
- Width: `1.5`
- Selected: `var(--primary)` + width `2.5`
- Label: edge `kind`

---

## 6. Interaction Design (MVP)

### 6.1 Supported Interactions
- Pan: drag blank canvas
- Zoom: mouse wheel / toolbar +/-
- Reset zoom: toolbar
- Fit to viewport: toolbar
- Select node/edge: click
- Deselect: click blank area

### 6.2 Detail Panel
右侧 Inspector 显示：
- Node: type/name/props/timestamps
- Edge: src/kind/dst/props/timestamps

> 本阶段不做浮动弹层，统一右侧面板，降低复杂度。

---

## 7. Error and Empty States

### 7.1 Network / API Errors
- Request failure: error banner + retry button
- Timeout: error banner + retry button

### 7.2 Empty State
当 `nodes` 和 `edges` 都为空时显示：
- icon
- title: "No topology data"
- text: "No nodes or edges found for current query"

### 7.3 Large Dataset
- `>100` nodes: show performance warning
- `>500` nodes: allow render but default collapse labels and disable edge animations

---

## 8. API Mapping Examples

### 8.1 Service Function Contracts

```typescript
getAllNodes(params?: { type?: string }): Observable<Node[]>
getAllEdges(params?: { srcType?: string; dstType?: string; kind?: string }): Observable<Edge[]>
loadTopology(params): Observable<{ nodes: Node[]; edges: Edge[]; orphanEdges: Edge[] }>
```

### 8.2 Transform Function Contract

```typescript
transformToX6(nodes: Node[], edges: Edge[]): {
  nodes: X6Node[];
  edges: X6Edge[];
  orphanEdges: Edge[];
}
```

---

## 9. Implementation Plan (Executable)

### Phase 1: Foundation
- [ ] Add `/topology` standalone route and page shell
- [ ] Implement `TopologyService` for nodes/edges pagination
- [ ] Implement `TopologyStore` with signals

### Phase 2: Rendering
- [ ] Build `topology-canvas` and render nodes/edges
- [ ] Apply dagre + orth routing
- [ ] Add toolbar zoom/reset/fit

### Phase 3: Inspect
- [ ] Add selection logic (node/edge)
- [ ] Add right-side inspector panel
- [ ] Handle orphan edges warning

### Phase 4: Robustness
- [ ] Loading / error / empty state
- [ ] Large dataset behavior
- [ ] Basic unit tests for pagination + transform + store selection

---

## 10. Acceptance Criteria

- 页面可打开 `/topology` 并显示图
- 使用真实后端接口（`/nodes` + `/edges`），无假接口依赖
- 游标分页正确，数据完整
- 支持 pan/zoom/fit/select/inspect
- 无 chat/LLM 相关代码或文案
- 出现 API 错误时页面不崩溃

---

## 11. References

- topo-cli backend routes:
  - `/Users/wanyaozhong/Projects/topo-cli/internal/graph/node/handler.go`
  - `/Users/wanyaozhong/Projects/topo-cli/internal/graph/edge/handler.go`
- topo-cli shared model:
  - `/Users/wanyaozhong/Projects/topo-cli/internal/graph/model.go`
