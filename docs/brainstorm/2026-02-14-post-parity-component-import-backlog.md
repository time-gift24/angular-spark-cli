# Post-Parity Component Import Backlog

## 1. Purpose
Mira parity 主线已完成后，继续扩展 Angular 组件库的下一批候选组件清单。
本清单覆盖此前讨论的 10 个组件，并明确参考来源与落地顺序。

参考目录：
- `.vendor/aim/components/ui`（唯一主对照，应优先使用）
- `.vendor/streamdown/apps/website/components/ui`（仅在本地 aim 缺失时作为临时补充参考）

## 2. Source Verification
按项目约束，“上述所有组件”应在 `.vendor/aim/components/ui` 中提供对照实现。
当前本地仓库核对结果如下：

| Component | Should Be In `.vendor/aim` | Currently In `.vendor/aim` | Fallback In `.vendor/streamdown` |
|---|---|---|---|
| `command` | Yes | No | Yes |
| `dialog` | Yes | No | Yes |
| `popover` | Yes | No | Yes |
| `scroll-area` | Yes | No | Yes |
| `hover-card` | Yes | No | Yes |
| `collapsible` | Yes | No | Yes |
| `navigation-menu` | Yes | No | Yes |
| `sonner` | Yes | No | Yes |
| `button-group` | Yes | No | Yes |
| `drawer` | Yes | No | Yes |

结论：
1. 这 10 个组件按目标应归属 `.vendor/aim/components/ui`。
2. 当前本地 `.vendor/aim/components/ui` 尚未包含这 10 个文件。
3. 在 aim 同步前，可临时参照 `.vendor/streamdown/apps/website/components/ui` 进行方案预研。

## 2.1 Precondition
在正式导入 Angular 组件前，建议先完成以下前置：

1. 同步 `.vendor/aim/components/ui`，补齐上述 10 个组件对照文件。
2. 同步后重新基于 aim 做一次 class/token 差异核对。
3. 仅在 aim 未及时同步时，才使用 streamdown 作为临时 fallback。

## 3. Recommended Import Order
建议按交互价值与实现依赖顺序执行：

1. `dialog`
2. `popover`
3. `command`
4. `scroll-area`
5. `hover-card`
6. `collapsible`
7. `navigation-menu`
8. `sonner`
9. `button-group`
10. `drawer`（与现有 `sheet` 存在语义重叠，放最后评估）

## 4. Integration Checklist
每个组件导入时必须同步完成：

1. 在 `src/app/shared/ui/<component>/` 新增组件族与 `index.ts` 导出。
2. 在 `src/app/shared/ui/index.ts` 增加顶层 re-export。
3. 在 `src/app/demo/<component>/` 新增 demo 页面（至少 3 个场景）。
4. 在 `src/app/app.routes.ts` 注册 demo 路由。
5. 在 `src/app/shared/layout/nav.component.ts` 增加导航入口。
6. 执行 `npm run build`，确保无新增编译错误。

## 5. Acceptance
每个组件最低验收：

1. 基础渲染可用（render）。
2. 键盘交互可用（如适用）。
3. ARIA 属性与语义正确。
4. `disabled` / `open` / `selected` 等关键状态可控。
5. Demo 页面在 `mira/mineral/tiny3` 三主题下可正常显示。
