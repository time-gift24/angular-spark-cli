# Streaming Markdown V3 设计文档（批判审查版）

## 文档元信息

- 日期：2026-02-10
- 基线代码：当前工作区（含最近重构，未提交部分）
- 目标：针对“流式完成后嵌套列表未正确更新（static=2, streaming=1）”给出可证伪、可实施的修复方案

---

## 1. 问题陈述

现象：

- 同一份 markdown 在左侧静态渲染中，嵌套列表正常（`items.length = 2`）。
- 右侧流式渲染完成后，列表仍错误（`items.length = 1`）。

输入样例中关键段：

```md
- 父项 1
    - 子项 1.1
    - 子项 1.2
- 父项 2
    1. 子项 2.1
    2. 子项 2.2
```

---

## 2. 对既有总结的批判审查

> 以下逐条评估“是否成立”“证据在哪里”“对修复价值有多大”。

### 2.1 “ngOnChanges 无法检测 Observable 引用变化”

**结论：不准确（过度归因）**。

- Angular 的 `ngOnChanges` 只要 `@Input` 引用变化就会触发，这本身并非不可靠机制。
- 当前 Demo 中 `stream$` 每次 `startStreaming()` 都创建了新的 cold observable，理论上具备引用变化。
- 代码中还显式调用了 `cdr.detectChanges()` 强行推进变更检测。

证据：

- `/Users/wanyaozhong/Projects/angular-spark-cli/src/app/demo/streaming-markdown/demo-streaming-markdown.component.ts`
- `/Users/wanyaozhong/Projects/angular-spark-cli/src/app/shared/components/streaming-markdown/streaming-markdown.component.ts:273`

**批判点**：这条最多解释“时序复杂”，不能直接解释“列表项最终数量错误”。

### 2.2 “ngOnInit 过早订阅导致错过新流”

**结论：部分成立，但不是主因**。

- 当前 `ngOnInit` 会先订阅一次默认 `EMPTY`，确实制造了多余生命周期。
- 但后续 `ngOnChanges` 里也会重新订阅新 `stream$`，并不必然“错过新流”。
- 对 cold observable 来说，晚订阅通常不会丢历史（每次订阅都会重放生产过程）。

证据：

- `/Users/wanyaozhong/Projects/angular-spark-cli/src/app/shared/components/streaming-markdown/streaming-markdown.component.ts:263`
- `/Users/wanyaozhong/Projects/angular-spark-cli/src/app/shared/components/streaming-markdown/streaming-markdown.component.ts:300`

**批判点**：该问题应被定义为“订阅策略复杂且脆弱”，而非“必然丢 complete”。

### 2.3 “bufferTime + takeUntil 导致 complete 丢失”

**结论：证据不足**。

- `bufferTime` 在源流 complete 时会 flush 最后一批并完成（标准行为）。
- `takeUntil(this.destroy$)` 只在组件销毁时中断，当前问题发生在正常页面中，缺少 destroy 证据。

证据：

- `/Users/wanyaozhong/Projects/angular-spark-cli/src/app/shared/components/streaming-markdown/streaming-markdown.component.ts:306-344`

**批判点**：该结论属于猜测，不能作为核心改造依据。

---

## 3. 更可能的根因（按优先级）

### 3.1 根因 A：解析模型与渲染模型仍在重构中，状态不稳定

当前 `ListBlock.items` 类型已改为 `(string | MarkdownBlock)[]`，并尝试支持深层嵌套，但实现仍有“临时调试态”特征：

- 列表组件包含大量 debug UI 与日志；
- 嵌套 item 既可能是 string，也可能是 block，渲染分支复杂；
- `track` 逻辑与 item 形态变化耦合（string 走 index，block 走 id），易出现复用判断偏差。

证据：

- `/Users/wanyaozhong/Projects/angular-spark-cli/src/app/shared/components/streaming-markdown/blocks/list/list.component.ts:20-70`
- `/Users/wanyaozhong/Projects/angular-spark-cli/src/app/shared/components/streaming-markdown/blocks/list/list.component.ts:83-141`

### 3.2 根因 B：`hasIncompleteBlock` 驱动“最后块弹出”为 `currentBlock`，对列表末尾块敏感

当前构建状态逻辑：只要 parser 判断有 incomplete，就把最后一个 block 从 `blocks` 弹到 `currentBlock`。若最后块恰好是 list，可能出现“完成后未及时收敛/视觉滞后”。

证据：

- `/Users/wanyaozhong/Projects/angular-spark-cli/src/app/shared/components/streaming-markdown/streaming-markdown.component.ts:376-395`

### 3.3 根因 C：订阅路径重复（`ngOnInit + ngOnChanges + Demo强制detectChanges`）放大不确定性

- 现有方式可工作，但时序复杂，容易造成“诊断错觉”（看起来像 complete 丢失）。
- 该问题是“架构健康度”问题，不是唯一 bug 根因。

证据：

- `/Users/wanyaozhong/Projects/angular-spark-cli/src/app/demo/streaming-markdown/demo-streaming-markdown.component.ts:74-93`
- `/Users/wanyaozhong/Projects/angular-spark-cli/src/app/shared/components/streaming-markdown/streaming-markdown.component.ts:263-344`

---

## 4. 设计决策（针对当前问题）

## D1. 不改成 `Subject` 入参，保留 `Observable` 输入契约

原因：

- 把组件输入改成 `Subject` 会泄露生产者语义给消费者，破坏 API 抽象。
- 正确做法是：组件内部使用 `streamInput$` 统一接管输入，`switchMap` 到最新流。

## D2. 用“单订阅管线”替换 `ngOnInit + ngOnChanges` 双路径

核心策略：

- `@Input() set stream$(value)` 只负责 `this.streamInput$.next(value ?? EMPTY)`。
- 组件内部仅在 `ngOnInit` 建立一次订阅：`streamInput$.pipe(switchMap(...))`。
- 每次新流自动取消旧流，避免手写 unsubscribe 分支。

## D3. 强化 completion 收敛的可验证性

- complete 后必须进入统一收敛步骤：`finalizeCompletedState()`。
- 引入 `streamVersion`，确保仅最新流可写状态。

## D4. 列表数据结构从“混合 union”过渡到显式 AST Item 结构

将 `ListBlock.items` 设计为：

```ts
interface ListItemNode {
  id: string;
  text: string;
  children?: MarkdownBlock[];
  marker: 'unordered' | 'ordered';
}
```

理由：

- 可避免 `string | MarkdownBlock` 分支复杂与 track 不稳定。
- 便于在模板中明确渲染 item text + nested children。

## D5. 继续保持“流式保守 parse + 完成态修复 parse”

该策略已在现有代码生效，应保留，并在此基础上改进提交模型（committed/provisional）。

---

## 5. 新的架构草案

```mermaid
flowchart LR
  A[Input stream$ setter] --> B[streamInput$]
  B --> C[switchMap active stream]
  C --> D[bufferTime/filter/map]
  D --> E[processChunk(raw parse)]
  E --> F[buildStreamingState]
  C --> G[complete]
  G --> H[finalizeCompletedState(preprocessor+parse)]
  H --> F
  F --> I[state signal]
  I --> J[BlockRouter]
  J --> K[List/Blockquote/Code render]
```

关键点：

1. 只保留一个“活跃流”。
2. 任何 state 写入都挂在 streamVersion 上。
3. 渲染层不再依赖调试 side-effect（console/debug UI）。

---

## 6. 实施计划（与当前重构衔接）

## Phase 0（当下热修）

目标：先修“streaming 完成后 items 仍为 1”。

1. 移除 Demo 中 `EMPTY -> detectChanges -> new stream -> detectChanges` 的双切换 hack。
2. Streaming 组件改为 Input setter + `streamInput$ + switchMap` 单订阅。 
3. 在 complete 路径打版本号断言日志（仅开发环境）。
4. 去掉列表组件中的调试模板块，恢复纯渲染模板。

验收：

- 在 demo 中，嵌套列表最终渲染与静态一致（父项 2 个，子项完整）。

## Phase 1（结构稳定）

1. ListBlock 改为显式 `ListItemNode[]`。
2. blockquote/list 统一递归渲染协议（children block 数组）。
3. `track` 统一使用稳定 id，禁止 index 作为长期 key。

## Phase 2（组件注入能力）

1. 新增 inline renderer registry。
2. 以 image 为第一阶段样例：抽离 paragraph/heading 中硬编码 `<img>`。

---

## 7. 验证矩阵（最小可执行）

### 7.1 功能回归

1. 顶层 fenced code（lazy on/off）
2. blockquote fenced code（lazy on/off）
3. 嵌套列表（流式完成后）与静态一致
4. table + list + code 混合场景（尾部 chunk 边界）

### 7.2 生命周期回归

1. 开始 streaming -> 完成 -> 重播（三轮）
2. streaming 中途 stop -> restart
3. 快速连续 start 两次（只保留最新流）

### 7.3 诊断指标

- active stream version
- completion count
- finalize execution count
- latest list block item count

---

## 8. 对“是否改成 Subject 输入”的最终结论

- **不建议**把 `@Input() stream$` 改成 `Subject`。
- **建议**保持 `Observable` 契约，同时在组件内部“收口”为 `streamInput$ + switchMap`。

这能解决你总结里真正有价值的部分（订阅时序复杂）而不牺牲 API 设计。

---

## 9. 与我们既定方向的衔接

本方案与既定 V2 方向一致：

1. 先稳住流式生命周期（本次热修重点）。
2. 再恢复结构化 AST（list/blockquote children）。
3. 最后推进 inline mapper（image 作为 Phase 1 样例）。

也就是说：

- 你这次总结不是“全错”，但根因排序需要调整。
- 真正要优先修的是“单订阅生命周期 + 列表结构建模稳定性”。

