# Mira Parity Execution Spec (Angular)

## 1. Objective
将当前项目视觉与核心交互对齐到 shadcn 目标配置：

- Create URL: https://ui.shadcn.com/create?base=radix&style=mira&baseColor=neutral&theme=cyan&iconLibrary=lucide&font=nunito-sans&menuAccent=bold&menuColor=default&radius=medium&rtl=false
- Init URL (token source of truth): https://ui.shadcn.com/init?base=radix&style=mira&baseColor=neutral&theme=cyan&iconLibrary=lucide&font=nunito-sans&menuAccent=bold&menuColor=default&radius=medium&template=vite&rtl=false

## 2. Decisions (Locked)
这些决策已被确认，不需要二次讨论：

1. 对齐范围：完整对齐（token + 字体 + 核心组件行为/结构）。
2. 主题策略：保留现有主题，新增 `mira` 并设为默认主题。
3. 图标策略：迁移到 Lucide（核心组件优先）。

## 3. Ground Truth Inputs
执行时只参考下列来源，避免漂移：

1. Token 真值：上面的 `init` URL 返回 JSON。
2. React 参考实现：`/Users/wanyaozhong/Projects/angular-spark-cli/.vendor/aim`
3. 当前 Angular 代码：`/Users/wanyaozhong/Projects/angular-spark-cli/src`

## 4. Confirmed Gap Baseline
当前已确认差距：

1. Token 全量不一致：light `32/32` mismatch，dark `31/31` mismatch（对比现有默认 `:root` 与 `.dark`）。
2. 默认主题错误：`/Users/wanyaozhong/Projects/angular-spark-cli/src/index.html` 当前是 `theme-tiny3`。
3. 字体错误：当前默认字体是 Figtree，不是 Nunito Sans。
4. 基础链路缺失：`tw-animate-css`、`shadcn/tailwind.css`、`@custom-variant dark` 未接入。
5. 组件缺失：`combobox`、`dropdown-menu`、`input-group` 未实现。
6. 重合组件仍有行为差距：`button`、`card`、`input`、`select`。

## 5. Scope
### In Scope
1. 主题 token 与字体精确对齐。
2. 核心组件结构与交互对齐（button/card/input/select/dropdown-menu/combobox/input-group）。
3. 新组件 demo、路由、导航接入。
4. 新老主题共存（mira 为默认）。

### Out of Scope
1. Liquid glass 视觉重设计。
2. LLM 业务流程改造。

## 6. File-Level Execution Plan
## Phase 0 - Baseline Guard
1. 记录当前差距快照（token diff + 缺失组件清单）。
2. 确认 `.vendor/aim/components.json` 配置与目标 URL一致。
3. 将本次计划相关文档保存在 `docs/plans/`（本文件已完成）。

Done Criteria:
1. 执行前差距有明文记录。
2. 下游 agent 可直接用该记录做验收对比。

## Phase 1 - Theme Foundation
主要文件：

1. `/Users/wanyaozhong/Projects/angular-spark-cli/src/styles.css`
2. `/Users/wanyaozhong/Projects/angular-spark-cli/src/index.html`
3. `/Users/wanyaozhong/Projects/angular-spark-cli/package.json`

动作：

1. 在 `styles.css` 引入：
   - `@import "tw-animate-css";`
   - `@import "shadcn/tailwind.css";`
   - `@custom-variant dark (&:is(.dark *));`
2. 新增 `theme-mira` 与 `theme-mira.dark` 的变量块，值 1:1 使用 init 真值。
3. 保留现有 `theme-tiny3` 与矿物主题块，不删除。
4. 将 `index.html` 默认 class 改为 `theme-mira`。
5. 字体改为 Nunito Sans（`--font-sans` + font import）。
6. 安装依赖：
   - `tw-animate-css`
   - `@fontsource/nunito-sans`
   - `lucide-angular`

Done Criteria:
1. 默认页面为 mira light。
2. 加 `.dark` 后显示 mira dark。
3. token diff 脚本显示 `0 mismatch`。

## Phase 2 - Theme Runtime API
建议新增文件：

1. `/Users/wanyaozhong/Projects/angular-spark-cli/src/app/shared/theme/theme.types.ts`
2. `/Users/wanyaozhong/Projects/angular-spark-cli/src/app/shared/theme/theme.service.ts`
3. `/Users/wanyaozhong/Projects/angular-spark-cli/src/app/shared/theme/index.ts`

接口（必须）：

1. `type AppVisualTheme = 'mira' | 'mineral' | 'tiny3'`
2. `setVisualTheme(theme: AppVisualTheme): void`
3. `setMode(mode: 'light' | 'dark'): void`
4. `toggleMode(): void`
5. `theme(): Signal<AppVisualTheme>`
6. `mode(): Signal<'light' | 'dark'>`

Done Criteria:
1. 不刷新页面可切换主题和 dark/light。
2. `.dark` 机制保持兼容（streaming-markdown/liquid-glass 不回归）。

## Phase 3 - Core Component Parity
按顺序执行，禁止并行跳步。

1. Button  
   文件：`/Users/wanyaozhong/Projects/angular-spark-cli/src/app/shared/ui/button/button.component.ts`  
   要点：补齐 size（含 icon-xs/icon-sm/icon-lg），对齐 focus/invalid/disabled 语义。

2. Card  
   文件：`/Users/wanyaozhong/Projects/angular-spark-cli/src/app/shared/ui/card/card.component.ts`  
   要点：新增 `size: 'default' | 'sm'` 与 `CardAction`。

3. Input  
   文件：`/Users/wanyaozhong/Projects/angular-spark-cli/src/app/shared/ui/input/input.component.ts`  
   文件：`/Users/wanyaozhong/Projects/angular-spark-cli/src/app/shared/ui/input/input.component.css`  
   要点：对齐 h/padding/ring/invalid 状态。

4. Select  
   文件：`/Users/wanyaozhong/Projects/angular-spark-cli/src/app/shared/ui/select/select.component.ts`  
   要点：升级为与 mira 结构一致的 trigger/content/item 形态，保留旧入口兼容层一版。

5. Dropdown Menu（新增）  
   目录：`/Users/wanyaozhong/Projects/angular-spark-cli/src/app/shared/ui/dropdown-menu`

6. Combobox（新增）  
   目录：`/Users/wanyaozhong/Projects/angular-spark-cli/src/app/shared/ui/combobox`

7. Input Group（新增）  
   目录：`/Users/wanyaozhong/Projects/angular-spark-cli/src/app/shared/ui/input-group`

Done Criteria:
1. 所有核心组件都有 demo 且交互可用。
2. 与 `.vendor/aim/components/ui/*.tsx` 的变体与行为一致。

## Phase 4 - Demo/Route/Nav Integration
主要文件：

1. `/Users/wanyaozhong/Projects/angular-spark-cli/src/app/app.routes.ts`
2. `/Users/wanyaozhong/Projects/angular-spark-cli/src/app/shared/layout/nav.component.ts`
3. `/Users/wanyaozhong/Projects/angular-spark-cli/src/app/demo/*`

动作：

1. 新增 demo 页面：
   - `/demo/dropdown-menu`
   - `/demo/combobox`
   - `/demo/input-group`
2. 接入路由与导航。
3. 演示页面统一使用 mira token，不写硬编码视觉值。

Done Criteria:
1. 新路由可访问。
2. 导航无断链。

## Phase 5 - Test & Acceptance
最低验收命令：

1. `npm run build`
2. token diff 脚本（见 token 文档）
3. 组件单测（至少覆盖 button/card/input/select/dropdown-menu/combobox/input-group）

验收阈值：

1. token diff：light/dark mismatch 均为 `0`。
2. build 成功。
3. 旧主题仍可切换。

## 7. Recommended MCP Sync Commands
在 `/Users/wanyaozhong/Projects/angular-spark-cli/.vendor/aim` 下可用于补齐参考实现：

```bash
npx shadcn@latest add @shadcn/combobox @shadcn/dropdown-menu @shadcn/input-group @shadcn/sidebar @shadcn/button @shadcn/card @shadcn/input @shadcn/select
```

## 8. Handoff Checklist
交接给新 agent 前必须满足：

1. 已阅读本文件。
2. 已阅读 token 文档：`2026-02-13-mira-token-diff.md`
3. 已阅读组件矩阵：`2026-02-13-mira-component-parity-matrix.md`
4. 确认本次实施按 Phase 顺序执行，不跳阶段。
