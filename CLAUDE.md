# Angular Spark CLI - Design System

## 🎨 矿物与时光 (Mineral & Time) 岩彩主题

### 核心理念

本设计系统采用"矿物与时光"主题，灵感来源于中国传统岩彩画和千年古画卷轴。配色模拟矿物颜料（石绿、石青）和氧化纸张（绢黄）的自然质感，创造沉稳、通透、历久弥新的视觉体验。

### 设计原则

1. **低饱和度** - 所有颜色保持低饱和度，避免刺眼的纯色
2. **自然质感** - 使用 OKLCH 颜色空间实现感知均匀的渐变
3. **紧凑轻盈** - Ultra compact 尺寸系统，节省空间，提升信息密度
4. **层次分明** - 通过细微的明度和色相变化营造视觉层次
5. **可访问性** - 保持 WCAG AA 对比度标准

---

## 🎨 配色方案

### Light Mode (浅色模式)

| 用途 | 颜色名 | OKLCH 值 | 说明 |
|------|--------|----------|------|
| **背景** | 绢黄 Aged Silk | `oklch(0.91 0.015 85)` | 模拟千年画卷的氧化底色 |
| **前景** | 深灰 | `oklch(0.28 0.03 185)` | 主要文本颜色 |
| **主色** | 石绿 Malachite | `oklch(0.48 0.07 195)` | 沉稳通透，核心视觉元素 |
| **次要** | 浅绢黄 | `oklch(0.92 0.02 85)` | 柔和对比，次要背景 |
| **强调** | 泥金 Gold | `oklch(0.70 0.12 75)` | 极少使用，边框/icon/悬停效果 |
| **警告** | 深红 | `oklch(0.50 0.20 25)` | 破坏性操作，保持对比度 |
| **边框** | 深绢黄 | `oklch(0.85 0.015 85)` | 低饱和度边框 |

### Dark Mode (深色模式)

| 用途 | 颜色名 | OKLCH 值 | 说明 |
|------|--------|----------|------|
| **背景** | 深石青 | `oklch(0.20 0.04 230)` | 夜晚山峦的深邃 |
| **前景** | 浅绢黄 | `oklch(0.94 0.015 85)` | 主要文本颜色 |
| **主色** | 浅石绿 | `oklch(0.62 0.08 195)` | 暗夜中的玉石光晕 |
| **次要** | 深绢黄 | `oklch(0.30 0.035 85)` | 微暖对比 |
| **强调** | 亮泥金 | `oklch(0.75 0.14 75)` | 暗夜中的金色点缀 |
| **警告** | 亮红 | `oklch(0.65 0.20 25)` | 暗色模式对比度 |
| **边框** | 半透明石青 | `oklch(0.35 0.04 230 / 50%)` | 柔和边框 |

### 图表配色 - 矿物色谱

```css
--chart-1: oklch(0.48 0.07 195);  /* 石绿 */
--chart-2: oklch(0.42 0.08 225);  /* 石青深 */
--chart-3: oklch(0.55 0.06 195);  /* 石绿浅 */
--chart-4: oklch(0.70 0.12 75);   /* 泥金 */
--chart-5: oklch(0.60 0.05 210);  /* 石青浅 */
```

---

## 🔤 字体系统

### 字体族

**主字体**: Figtree (几何无衬线字体)
- 安装: `npm install @fontsource/figtree`
- 引入字重: 300 (Light), 400 (Regular), 500 (Medium), 600 (SemiBold)
- 备用字体: system-ui, sans-serif

```css
font-family: 'Figtree', ui-sans-serif, system-ui, sans-serif;
```

### 字体大小与权重

| 元素 | 大小 | 权重 | 行高 | 说明 |
|------|------|------|------|------|
| **h1** | `text-xl` (20px) | 600 | tight | 页面主标题 |
| **h2** | `text-lg` (18px) | 500 | normal | 区块标题 |
| **h3** | `text-base` (16px) | 500 | normal | 子区块标题 |
| **h4** | `text-sm` (14px) | 500 | normal | 小标题 |
| **p** | `text-sm` (14px) | 400 | snuge | 正文 |
| **small** | `text-xs` (12px) | 400 | normal | 辅助文本 |
| **按钮** | `text-xs` (12px) | 400 | - | 紧凑按钮 |

### 字体特点

- ✅ 更轻的视觉重量，适合紧凑设计
- ✅ 几何感强，现代简洁
- ✅ 可读性好，即使在 lighter weights
- ✅ 与矿物主题配色协调

---

## 📐 尺寸与间距

### 全局间距系统

```css
--spacing-xs: 0.125rem;  /* 2px */
--spacing-sm: 0.25rem;   /* 4px */
--spacing-md: 0.5rem;    /* 8px */
--spacing-lg: 0.75rem;   /* 12px */
--spacing-xl: 1rem;      /* 16px */
```

### 圆角系统

Ultra compact 设计，更小的圆角：

```css
--radius: 0.25rem;        /* 4px - 基础圆角 */
--radius-sm: 3px;         /* 用于小元素 */
--radius-md: 4px;         /* 标准圆角 */
--radius-lg: 5px;         /* 大元素 */
--radius-xl: 6px;         /* 卡片等 */
```

### 按钮尺寸

| 尺寸 | 高度 | 横向内边距 | 纵向内边距 | 图标 |
|------|------|-----------|-----------|------|
| **sm** | 26px | 8px | 4px | 12px |
| **md** (默认) | 30px | 10px | 6px | 12px |
| **lg** | 34px | 12px | 8px | 12px |
| **icon** | 30px × 30px | - | - | 12px |

### 设计哲学

- **更小的尺寸** = 更高的信息密度
- **统一的间距** = 视觉一致性
- **紧凑但不拥挤** = 良好的可读性

---

## 🧩 组件设计原则

### 1. 按钮组件 (Button)

```typescript
// 尺寸：Ultra compact
sm:      h-[26px] px-2 py-1
default: h-[30px] px-2.5 py-1.5
lg:      h-[34px] px-3 py-2
icon:    30px × 30px

// 样式特点
- 字重: 400 (font-normal)
- 图标: 12px (size-3)
- 间距: 4px (gap-1)
- 圆角: 4px (rounded-md)
```

**变体**:
- `default`: 石绿主色
- `destructive`: 深红警告色
- `outline`: 边框样式
- `secondary`: 浅绢黄
- `ghost`: 仅悬停效果
- `link`: 下划线链接

### 2. 通用组件规范

所有组件应遵循：

1. **使用 CSS 变量** - 从 `styles.css` 读取，确保一致性
2. **紧凑设计** - 使用 `--spacing-*` 和 `--radius-*`
3. **轻盈字重** - 优先使用 400/500，避免 600+
4. **低饱和度** - 使用主题色，避免纯色
5. **圆角统一** - 使用 `--radius` 系列

---

## 🏗️ 架构模式

### 目录结构

```
src/
├── app/
│   ├── shared/
│   │   └── ui/              # 通用 UI 组件
│   │       └── button/
│   ├── demo/                # 组件展示页面
│   │   └── button/
│   │       ├── types/       # 类型定义
│   │       ├── examples/    # 示例配置
│   │       └── *.component.{ts,html,css}
│   ├── app.routes.ts        # 路由配置
│   └── app.html             # 主页
└── styles.css               # 全局样式与主题
```

### 组件开发模式

#### 1. 分离关注点

每个组件页面分为：
- **Component (.ts)**: 业务逻辑和状态管理
- **Template (.html)**: 视图结构
- **Styles (.css)**: 组件样式
- **Types**: TypeScript 类型定义
- **Examples**: 数据配置

#### 2. 使用 Angular Signals

```typescript
export class DemoPageComponent {
  readonly examples = examples;  // 只读数据
  readonly state = signal<State>({...});  // 响应式状态
}
```

#### 3. 路由规范

```
/demo/{component-name}
```

示例：`/demo/button` 按向到 `src/app/demo/button/`

#### 4. 类型安全

所有配置使用 TypeScript 接口：

```typescript
export interface ComponentTemplate {
  label: string;
  variant?: ButtonVariant | undefined;
  size?: ButtonSize | undefined;
  // ...
}
```

---

## 🎯 开发指南

### 添加新组件

1. **创建组件文件**：
```bash
src/app/shared/ui/{component-name}/
└── {component-name}.component.ts
```

2. **创建展示页面**：
```bash
src/app/demo/{component-name}/
├── types/           # 类型定义
├── examples/        # 示例配置
└── *.component.{ts,html,css}
```

3. **添加路由**：
```typescript
// src/app/app.routes.ts
{
  path: 'demo/{component-name}',
  loadComponent: () => import('./demo/{component-name}/...')
    .then(m => m.DemoComponentNameComponent)
}
```

4. **使用主题变量**：
```css
.component {
  background: var(--background);
  color: var(--foreground);
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
}
```

### 样式指南

- ✅ 使用 CSS 变量而非硬编码值
- ✅ 使用 `@apply` 组合 Tailwind 类
- ✅ 使用 `var(--spacing-*)` 统一间距
- ✅ 使用 `var(--radius-*)` 统一圆角
- ❌ 避免直接使用颜色值
- ❌ 避免使用大号字体 (text-2xl+)
- ❌ 避免使用粗字重 (font-bold+)

### 颜色使用指南

| 场景 | 使用颜色 |
|------|---------|
| 主操作 | `--primary` |
| 次要操作 | `--secondary` |
| 危险操作 | `--destructive` |
| 悬停/聚焦 | `--accent` (谨慎使用) |
| 背景层次 | `--card`, `--muted` |
| 文本层次 | `--muted-foreground` |

---

## 📦 技术栈

- **框架**: Angular 20+
- **样式**: Tailwind CSS v4
- **颜色空间**: OKLCH (感知均匀)
- **字体**: Figtree (via @fontsource)
- **状态管理**: Angular Signals
- **类型检查**: TypeScript 5.9

---

## 🔧 配置文件

### styles.css 关键部分

1. **主题变量** (`:root` / `.dark`) - 定义所有颜色
2. **@theme inline** - 定义 Tailwind 映射和自定义变量
3. **@layer base** - 基础样式重置和排版
4. **全局间距** - `--spacing-*` 系列
5. **组件尺寸** - `--button-*` 系列

### 扩展主题

如需添加新的组件尺寸变量：

```css
/* @theme inline */
--my-component-height-sm: 1.5rem;
--my-component-height-md: 2rem;
--my-component-height-lg: 2.5rem;
```

然后在组件中使用：

```typescript
style['height'] = 'var(--my-component-height-md)';
```

---

## 🎨 设计理念总结

> **"矿物与时光"** - 像千年岩彩画一样，沉稳、通透、历久弥新。

我们的设计语言：
- **低饱和度** - 柔和的矿物色调
- **紧凑轻盈** - Ultra compact 尺寸 + Figtree 字体
- **层次分明** - 微妙的明度和色相变化
- **可访问性** - WCAG AA 对比度
- **一致性** - CSS 变量驱动的全局系统
