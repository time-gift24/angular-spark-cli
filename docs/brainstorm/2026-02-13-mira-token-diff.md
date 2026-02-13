# Mira Token Diff & Source of Truth

## 1. Purpose
该文档用于让新 agent 直接拿到：

1. 目标 token 真值（来自 shadcn init URL）。
2. 当前项目的已知差距结论。
3. 可复用的验收脚本。

## 2. Source of Truth
目标 URL：

https://ui.shadcn.com/init?base=radix&style=mira&baseColor=neutral&theme=cyan&iconLibrary=lucide&font=nunito-sans&menuAccent=bold&menuColor=default&radius=medium&template=vite&rtl=false

已验证 `.vendor/aim` 与该 URL 一致：

1. `/Users/wanyaozhong/Projects/angular-spark-cli/.vendor/aim/components.json` 配置项一致。
2. `/Users/wanyaozhong/Projects/angular-spark-cli/.vendor/aim/app/globals.css` 与 init token 全量一致。

## 3. Confirmed Current Gap
当前默认主题（`src/styles.css` 的 `:root` 与 `.dark`）对比目标结果：

1. light: `32/32` mismatch
2. dark: `31/31` mismatch

结论：当前默认视觉并非 mira-neutral-cyan，需要新增并切换 `theme-mira` 作为默认。

## 4. Target Tokens (Copy Ready)
将以下变量定义为 `theme-mira` 的 token 真值（可直接复制到 `styles.css`）。

```css
.theme-mira {
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.145 0 0);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.145 0 0);
  --primary: oklch(0.61 0.11 222);
  --primary-foreground: oklch(0.98 0.02 201);
  --secondary: oklch(0.967 0.001 286.375);
  --secondary-foreground: oklch(0.21 0.006 285.885);
  --muted: oklch(0.97 0 0);
  --muted-foreground: oklch(0.556 0 0);
  --accent: oklch(0.61 0.11 222);
  --accent-foreground: oklch(0.98 0.02 201);
  --destructive: oklch(0.58 0.22 27);
  --border: oklch(0.922 0 0);
  --input: oklch(0.922 0 0);
  --ring: oklch(0.708 0 0);
  --chart-1: oklch(0.87 0.12 207);
  --chart-2: oklch(0.80 0.13 212);
  --chart-3: oklch(0.71 0.13 215);
  --chart-4: oklch(0.61 0.11 222);
  --chart-5: oklch(0.52 0.09 223);
  --radius: 0.625rem;
  --sidebar: oklch(0.985 0 0);
  --sidebar-foreground: oklch(0.145 0 0);
  --sidebar-primary: oklch(0.61 0.11 222);
  --sidebar-primary-foreground: oklch(0.98 0.02 201);
  --sidebar-accent: oklch(0.61 0.11 222);
  --sidebar-accent-foreground: oklch(0.98 0.02 201);
  --sidebar-border: oklch(0.922 0 0);
  --sidebar-ring: oklch(0.708 0 0);
}

.theme-mira.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  --card: oklch(0.205 0 0);
  --card-foreground: oklch(0.985 0 0);
  --popover: oklch(0.205 0 0);
  --popover-foreground: oklch(0.985 0 0);
  --primary: oklch(0.71 0.13 215);
  --primary-foreground: oklch(0.30 0.05 230);
  --secondary: oklch(0.274 0.006 286.033);
  --secondary-foreground: oklch(0.985 0 0);
  --muted: oklch(0.269 0 0);
  --muted-foreground: oklch(0.708 0 0);
  --accent: oklch(0.71 0.13 215);
  --accent-foreground: oklch(0.30 0.05 230);
  --destructive: oklch(0.704 0.191 22.216);
  --border: oklch(1 0 0 / 10%);
  --input: oklch(1 0 0 / 15%);
  --ring: oklch(0.556 0 0);
  --chart-1: oklch(0.87 0.12 207);
  --chart-2: oklch(0.80 0.13 212);
  --chart-3: oklch(0.71 0.13 215);
  --chart-4: oklch(0.61 0.11 222);
  --chart-5: oklch(0.52 0.09 223);
  --sidebar: oklch(0.205 0 0);
  --sidebar-foreground: oklch(0.985 0 0);
  --sidebar-primary: oklch(0.80 0.13 212);
  --sidebar-primary-foreground: oklch(0.30 0.05 230);
  --sidebar-accent: oklch(0.71 0.13 215);
  --sidebar-accent-foreground: oklch(0.30 0.05 230);
  --sidebar-border: oklch(1 0 0 / 10%);
  --sidebar-ring: oklch(0.556 0 0);
}
```

## 5. Required Base Imports for Mira Stack
在 `src/styles.css` 顶部保证存在：

```css
@import "tailwindcss";
@import "tw-animate-css";
@import "shadcn/tailwind.css";
@custom-variant dark (&:is(.dark *));
```

并确保默认字体链路指向 Nunito Sans。

## 6. Validation Script (Copy Ready)
用于验证本地 `theme-mira` 是否与目标 token 完全一致：

```bash
node - <<'NODE'
const fs = require('fs');
const { execSync } = require('child_process');

const init = JSON.parse(execSync('curl -s "https://ui.shadcn.com/init?base=radix&style=mira&baseColor=neutral&theme=cyan&iconLibrary=lucide&font=nunito-sans&menuAccent=bold&menuColor=default&radius=medium&template=vite&rtl=false"', { encoding: 'utf8' }));
const css = fs.readFileSync('src/styles.css', 'utf8');

function parseVars(block) {
  const vars = {};
  const re = /--([a-z0-9-]+)\s*:\s*([^;]+);/gi;
  let m;
  while ((m = re.exec(block))) vars[m[1]] = m[2].trim();
  return vars;
}

const lightMatch = css.match(/\.theme-mira\s*\{([\s\S]*?)\n\}/);
const darkMatch = css.match(/\.theme-mira\.dark\s*\{([\s\S]*?)\n\}/);

if (!lightMatch || !darkMatch) {
  console.error('Missing .theme-mira or .theme-mira.dark block');
  process.exit(1);
}

const lightVars = parseVars(lightMatch[1]);
const darkVars = parseVars(darkMatch[1]);

function diff(target, current) {
  let missing = 0;
  let mismatch = 0;
  for (const [k, v] of Object.entries(target)) {
    if (!(k in current)) missing++;
    else if (current[k] !== v) mismatch++;
  }
  return { total: Object.keys(target).length, missing, mismatch };
}

console.log('LIGHT', diff(init.cssVars.light, lightVars));
console.log('DARK ', diff(init.cssVars.dark, darkVars));
NODE
```

Pass 条件：

1. `LIGHT` 中 `missing=0` 且 `mismatch=0`
2. `DARK` 中 `missing=0` 且 `mismatch=0`

## 7. Default Theme Switch Rule
必须将 `/Users/wanyaozhong/Projects/angular-spark-cli/src/index.html` 默认 html class 切换为：

```html
<html lang="en" class="theme-mira">
```

并保留 `dark` class 机制用于暗黑模式。
