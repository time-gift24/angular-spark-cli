# Shadcn 官网对齐 PR 模板

## 1. 目标
- 对齐真源（官方 preset）：
  `https://ui.shadcn.com/create?base=radix&style=mira&baseColor=neutral&theme=cyan&iconLibrary=lucide&font=nunito-sans&menuAccent=bold&menuColor=default&radius=medium&template=vite&rtl=false`
- 本 PR 范围：`<组件列表/slug 列表>`
- 非目标：`<不在本 PR 处理的项>`

## 2. 对照环境
- 视口：`1920x1080`（全屏，左侧导航可见）
- 官方基线采集时间：`<YYYY-MM-DD HH:mm>`
- 本地基线采集时间：`<YYYY-MM-DD HH:mm>`
- Playwright 脚本/命令：`<命令或脚本路径>`

## 3. 组件对照记录（逐组件）

| slug | 官方页面 | 本地页面 | 信息一致 | 样式一致 | 交互一致 | 结论 |
|---|---|---|---|---|---|---|
| `<slug>` | `<official url>` | `<local url>` | ✅/❌ | ✅/❌ | ✅/❌ | `<通过/待修复>` |

## 4. 差异与修复说明（逐组件）

### `<slug>`
- 信息差异：`<标题/描述/示例顺序/示例数量>`
- 样式差异：`<字体/颜色/圆角/边框/间距/阴影>`
- 交互差异：`<hover/focus/disabled/open/keyboard>`
- 修复动作：`<改了什么>`
- 证据：`<official.png>`，`<local.png>`，`<diff.png>`

## 5. 路由与导航一致性
- slug 唯一且一致（目录、路由、导航同名）：`✅/❌`
- 无“有导航无路由”项：`✅/❌`
- 无“有路由无导航”项：`✅/❌`
- 排序与官网一致：`✅/❌`

## 6. 样式规范检查
- 组件样式仅使用 CSS Variables（无硬编码尺寸/颜色）：`✅/❌`
- Token 变更文件：`/Users/wanyaozhong/Projects/angular-spark-cli/src/styles.css`
- Demo 布局变更文件：`/Users/wanyaozhong/Projects/angular-spark-cli/src/app/demo/shared/demo-page-styles.css`

## 7. 代码变更清单
- `/Users/wanyaozhong/Projects/angular-spark-cli/src/app/app.routes.ts`
- `/Users/wanyaozhong/Projects/angular-spark-cli/src/app/shared/layout/nav.component.ts`
- `<其他文件绝对路径...>`

## 8. 验收结果
- `npm run build`：`✅/❌`
- 单测：`✅/❌`
- Playwright parity：`✅/❌`
- 视觉回归阈值：`<例如 <= 0.5%>`

## 9. 风险与后续
- 风险：`<仍存在的问题>`
- 后续 PR：`<下一批组件 slug>`

---

## 单组件快速卡片模板

### Component Parity Card: `<slug>`
- 官方：`<url>`
- 本地：`<url>`
- 信息：`✅/❌`（说明：`...`）
- 样式：`✅/❌`（说明：`...`）
- 交互：`✅/❌`（说明：`...`）
- A11y：`✅/❌`（说明：`...`）
- 截图：`<official.png>` | `<local.png>` | `<diff.png>`
- 状态：`PASS` / `BLOCKED`
