# Baseline Test Scenario 3: Multi-Variant Component (Input)

## Task Description
"实现 shadcn Input 组件，支持 default, small, large 三种尺寸，default 和 error 两种变体。样式要和 shadcn 完全一致。"

## Expected Violations (Without Skill)
- 为每个 variant 写重复的 Tailwind 类（如 `h-10 px-3` vs `h-8 px-2`）
- 不提取 spacing scale 到 @theme
- 硬编码颜色（如 `border-red-500` for error state）
- 可能使用 ngSwitch 而不是动态类绑定
- 不分析 shadcn 的 variants 是如何定义的

## Success Criteria (With Skill)
1. 使用 MCP 查看 Input 组件的 variants 定义
2. 识别可复用的 token（spacing, colors, border-radius）
3. 在 @theme 中定义 token 变体
4. 使用 computed() 动态生成类名
5. 避免重复代码，使用 token 组合

## Test Instructions
Focus on token extraction pattern. Does agent recognize tokenization opportunities?
