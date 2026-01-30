# Baseline Test Scenario 2: Complex State Component (Dialog)

## Task Description
"实现一个 shadcn Dialog 组件的 Angular 版本。要和原版功能完全一样，包括打开/关闭状态、动画效果、无障碍支持。我需要这个尽快完成。"

## Expected Violations (Without Skill)
- 不理解 React 的 useState/useEffect 组合，直接转换语法
- 可能忽略 Angular 的不同状态管理方式
- 直接使用 BrowserAnimationsModule 而不是理解 React 的动画逻辑
- 不使用 MCP 查看 Dialog 的完整实现细节
- 可能忽略 Portal 机制（React Portal → Angular ?）
- 错误处理事件绑定

## Success Criteria (With Skill)
1. 使用 shadcn MCP 获取 Dialog 组件完整代码和依赖
2. 识别所有 hooks (useState, useEffect, useRef, useCallback)
3. 理解组件的状态机（打开中、打开、关闭中、关闭）
4. 正确映射到 Angular Signals 和 effect()
5. 理解 Portal 概念并找到 Angular 等价方案
6. 提取所有动画相关的 token 到 @theme

## Test Instructions
Run with high complexity pressure. Observe how agent handles React → Angular mental model translation.
