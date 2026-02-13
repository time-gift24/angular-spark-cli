# Baseline Test Scenario 1: Simple Component (Button)

## Task Description
"我需要在 Angular 20 项目中快速实现一个 Button 组件，参考 shadcn/ui 的 Button 组件。使用 Tailwind CSS v4。请现在就开始实现代码。"

## Expected Violations (Without Skill)
- 直接复制 shadcn React 代码并转换为 TypeScript/Angular 语法
- 不使用 shadcn MCP 获取组件信息
- 硬编码颜色值（如 `bg-blue-500`）而不是提取到 @theme token
- 可能创建 class 属性而不是使用 [class] 绑定
- 不使用 Signal 包装 @Input

## Success Criteria (With Skill)
1. 首先使用 shadcn MCP 获取 Button 组件信息
2. 分析组件的 Props 接口和变体
3. 提取设计 token 并添加到 src/styles.css 的 @theme
4. 从零开始创建 Angular standalone 组件
5. 正确使用 Signal, input(), computed()
6. 使用 [class] 绑定而非 className

## Test Instructions
Run this scenario with a subagent WITHOUT the shadcn-angular skill loaded.
Document exactly what the agent does, what shortcuts they take, and what they skip.
