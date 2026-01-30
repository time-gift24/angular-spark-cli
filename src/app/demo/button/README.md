# Demo Button Page - 代码结构说明

## 📁 文件结构

```
src/app/demo/button/
├── demo-button-page.component.ts    # 主组件逻辑 (62 行)
├── demo-button-page.component.html   # 模板文件 (139 行)
├── demo-button-page.component.css    # 样式文件 (81 行)
├── types/
│   └── button-demo.types.ts          # 类型定义 (42 行)
├── examples/
│   └── button-examples.ts            # 示例配置 (98 行)
└── README.md                          # 本文件
```

## 🌐 路由

访问路径：`/demo/button`

路由配置位于 `src/app/app.routes.ts`：
```typescript
{
  path: 'demo/button',
  loadComponent: () => import('./demo/button/demo-button-page.component')
    .then(m => m.DemoButtonPageComponent)
}
```

## 🎯 设计原则

### 1. 分离关注点 (Separation of Concerns)

- **Component (.ts)**: 业务逻辑和状态管理
- **Template (.html)**: 视图结构
- **Styles (.css)**: 样式定义
- **Types**: 类型定义
- **Examples**: 数据配置

### 2. 模块化 (Modularity)

每个文件都有明确的职责，易于维护和测试。

### 3. 可扩展性 (Extensibility)

- 添加新的按钮示例：在 `examples/button-examples.ts` 中添加配置
- 添加新的类型：在 `types/button-demo.types.ts` 中定义
- 修改样式：在 `.css` 文件中调整

## 📝 文件说明

### `demo-button-page.component.ts`

主组件文件，包含：
- 组件定义和配置
- 信号状态管理 (Signals)
- 事件处理方法
- 依赖导入

**关键代码：**
```typescript
export class DemoButtonPageComponent {
  readonly buttonVariants = buttonVariants;  // 从 examples 导入
  readonly stats = signal<ButtonClickStats>({...});  // 类型安全
}
```

### `demo-button-page.component.html`

模板文件，使用 Angular 20+ 语法：
- `@for` 控制流
- `@if` 条件渲染
- 事件绑定 `(click)`
- 属性绑定 `[variant]`

### `demo-button-page.component.css`

样式文件，使用 Tailwind CSS v4：
- `@apply` 指令
- 响应式设计
- 组件作用域样式

### `types/button-demo.types.ts`

TypeScript 类型定义：
- `ComponentTemplate`: 示例配置类型
- `ButtonClickStats`: 统计数据类型
- `ExampleGroup`: 示例分组类型

### `examples/button-examples.ts`

示例数据配置：
- `buttonVariants`: 按钮变体示例
- `buttonSizes`: 按钮尺寸示例
- `buttonStates`: 按钮状态示例
- `buttonWithIcons`: 带图标的按钮示例
- `iconPaths`: 图标 SVG 路径
- `getIconSvg()`: 获取图标 SVG

## 🚀 使用示例

### 添加新的按钮示例

1. 在 `examples/button-examples.ts` 中添加：

```typescript
export const customExamples: ComponentTemplate[] = [
  {
    label: 'Custom Button',
    variant: 'default',
    size: 'lg',
    description: '自定义按钮'
  },
];
```

2. 在组件中导入并使用：

```typescript
import { customExamples } from './examples/button-examples';

export class DemoButtonPageComponent {
  readonly customExamples = customExamples;
}
```

3. 在模板中渲染：

```html
@for (example of customExamples; track example.label) {
  <button spark-button [variant]="example.variant">
    {{ example.label }}
  </button>
}
```

## 🎨 样式自定义

### 修改组件样式

在 `demo-button-page.component.css` 中修改：

```css
.demo-section {
  @apply space-y-4 rounded-lg border-2 bg-card p-6;
}
```

### 添加新的样式类

```css
.custom-button-group {
  @apply flex gap-4;
}
```

## 🔧 类型安全

所有数据都使用 TypeScript 类型定义：

```typescript
const example: ComponentTemplate = {
  label: 'Button',
  variant: 'default',  // IDE 自动补全
  size: 'lg',          // 类型检查
};
```

## 📊 优势对比

### 重构前 (单文件)
- ❌ 6000+ 行单一文件
- ❌ 模板、逻辑、样式混杂
- ❌ 难以维护和扩展
- ❌ 代码复用困难

### 重构后 (多文件)
- ✅ 清晰的文件结构
- ✅ 关注点分离
- ✅ 易于维护和测试
- ✅ 代码复用简单
- ✅ 类型安全
- ✅ 模块化设计

## 🧪 测试建议

### 单元测试

```typescript
describe('DemoButtonPageComponent', () => {
  it('should increment click count', () => {
    const component = new DemoButtonPageComponent();
    component.handleClick();
    expect(component.clickCount()).toBe(1);
  });
});
```

### 集成测试

测试示例数据的正确性和渲染结果。

## 📚 相关资源

- [Angular Components Guide](https://angular.dev/guide/components)
- [Tailwind CSS v4](https://tailwindcss.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
