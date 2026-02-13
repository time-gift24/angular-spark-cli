# Mira Component Parity Matrix

## 1. Purpose
这份矩阵让新 agent 在 1 分钟内知道：

1. 哪些组件已覆盖。
2. 哪些组件缺失。
3. 每个组件的整改动作与验收标准。
4. 实施顺序（防止返工）。

参考实现目录：

`/Users/wanyaozhong/Projects/angular-spark-cli/.vendor/aim/components/ui`

## 2. Current Coverage Snapshot
Vendor 侧目标组件：

1. `alert-dialog`
2. `badge`
3. `button`
4. `card`
5. `combobox`
6. `dropdown-menu`
7. `field`
8. `input`
9. `input-group`
10. `label`
11. `select`
12. `separator`
13. `textarea`

Angular 当前缺失：

1. `combobox`
2. `dropdown-menu`
3. `input-group`

## 3. Matrix
| Component | Angular Status | Gap Type | Target Ref | Required Changes | Acceptance |
|---|---|---|---|---|---|
| button | Exists | Variant/size mismatch | `.vendor/aim/components/ui/button.tsx` | 扩展 size 到 `xs/sm/default/lg/icon/icon-xs/icon-sm/icon-lg`；对齐 focus/invalid/destructive 状态 | 所有 size 与 variant 在 demo 可见，class 输出符合目标语义 |
| card | Exists | Structure mismatch | `.vendor/aim/components/ui/card.tsx` | 新增 `size` 输入；新增 `CardAction`；调整 header/content/footer 间距逻辑 | 支持 default/sm；CardAction 布局正确 |
| input | Exists | Visual/interaction mismatch | `.vendor/aim/components/ui/input.tsx` | 对齐高度、padding、bg-input、ring、aria-invalid 行为 | hover/focus/invalid/disabled 状态与目标一致 |
| select | Exists | Architecture mismatch | `.vendor/aim/components/ui/select.tsx` | 升级为 trigger/content/item 拆分结构；补齐键盘导航与 item indicator | 键盘可用，打开/关闭/选择稳定 |
| dropdown-menu | Missing | Missing component | `.vendor/aim/components/ui/dropdown-menu.tsx` | 新建完整组件族（trigger/content/item/sub/checkbox/radio/shortcut） | demo 覆盖普通项、子菜单、checkbox、radio |
| combobox | Missing | Missing component | `.vendor/aim/components/ui/combobox.tsx` | 新建组合组件（input/list/item/empty/content）并支持筛选 | 可搜索、可选中、可清空 |
| input-group | Missing | Missing component | `.vendor/aim/components/ui/input-group.tsx` | 新建 group/addon/button/text/input/textarea 组合组件 | addon 对齐、按钮布局对齐、textarea 场景可用 |
| badge | Exists | Minor visual tune | `.vendor/aim/components/ui/badge.tsx` | 校正 destructive/secondary 在 mira token 下表现 | 所有变体可读性通过 |
| alert-dialog | Exists | Visual tune | `.vendor/aim/components/ui/alert-dialog.tsx` | 调整间距、字体层级、按钮风格贴近 mira | 打开/关闭/焦点陷阱正常 |
| field | Exists | Minor parity gap | `.vendor/aim/components/ui/field.tsx` | 对齐 label/help/error 间距与语义类 | 表单示例状态完整 |
| label | Exists | Minor parity gap | `.vendor/aim/components/ui/label.tsx` | 对齐字体和状态 class（disabled/required） | 语义属性齐全 |
| separator | Exists | Minor parity gap | `.vendor/aim/components/ui/separator.tsx` | 对齐透明度、厚度与方向表现 | 横纵分割一致 |
| textarea | Exists | Minor parity gap | `.vendor/aim/components/ui/textarea.tsx` | 对齐 min-height/padding/ring/invalid | 与 input 行为统一 |

## 4. Execution Order (Locked)
禁止调整顺序，避免 style 返工：

1. `button`
2. `card`
3. `input`
4. `select`
5. `dropdown-menu`（新）
6. `combobox`（新）
7. `input-group`（新）
8. 其余轻量收口：badge/field/label/separator/textarea/alert-dialog

## 5. API Contract Changes
## Button
1. `size` 扩展：
   - `'xs' | 'sm' | 'default' | 'lg' | 'icon' | 'icon-xs' | 'icon-sm' | 'icon-lg'`

## Card
1. `size` 输入：
   - `'default' | 'sm'`
2. 新增 `spark-card-action` 语义节点。

## Select
1. 引入拆分 API（trigger/content/item）。
2. 保留当前 `spark-select` 入口一版兼容（过渡期）。

## New Components
1. `spark-dropdown-menu-*` 组件族。
2. `spark-combobox-*` 组件族。
3. `spark-input-group-*` 组件族。

## 6. Demo & Route Integration Checklist
必须新增并注册：

1. `demo/dropdown-menu`
2. `demo/combobox`
3. `demo/input-group`

必须更新：

1. `/Users/wanyaozhong/Projects/angular-spark-cli/src/app/app.routes.ts`
2. `/Users/wanyaozhong/Projects/angular-spark-cli/src/app/shared/layout/nav.component.ts`

## 7. Testing Matrix
每个组件至少包含以下测试点：

1. render（基础渲染）
2. variant/size（变体或尺寸）
3. keyboard（有键盘交互的组件）
4. aria（可访问性属性）
5. disabled/invalid（状态切换）

建议最小测试集合：

1. `button`: variant + size + disabled
2. `card`: size + action slot
3. `input`: focus + invalid
4. `select`: keyboard + select + close
5. `dropdown-menu`: sub + checkbox + radio
6. `combobox`: filter + pick + reset
7. `input-group`: addon alignment + interactive addon

## 8. Definition of Done
组件整改完成需同时满足：

1. 矩阵中所有 `Missing` 项变为 `Exists`。
2. 重合组件关键差距关闭（行为/结构/视觉达到对照实现）。
3. 新增 demo 路由全部可访问。
4. `npm run build` 通过。
5. token 校验通过（见 token 文档）。
