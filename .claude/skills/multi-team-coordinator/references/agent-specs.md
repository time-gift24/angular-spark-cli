# Agent 规范说明

## Agent 目录结构

```
.claude/agents/
├── planner/
│   └── planner.md
├── coder/
│   └── coder.md
└── code-reviewer/
    └── code-reviewer.md
```

---

## Planner（规划专家）

**文件**: `.claude/agents/planner/planner.md`

**职责**:
- 分析需求并创建详细的实施计划
- 将复杂功能分解为可管理的步骤
- 识别依赖关系和潜在风险
- 建议最佳实施顺序

**可用工具**: Read, Grep, Glob

**输出**: 结构化的实施方案

---

## Coder（代码实现专家）

**文件**: `.claude/agents/coder/coder.md`

**职责**:
- Angular 组件和功能实现
- UI 组件、业务逻辑、路由和服务
- 严格遵循 STANDARDS.md

**可用工具**: Read, Grep, Glob, Edit, Write, Bash

**关键约束**:
- CSS 变量独占，禁止硬编码
- Angular 20+ 新式优先
- 完整工作流（组件→演示→路由→导航）

---

## Code-Reviewer（代码审查专家）

**文件**: `.claude/agents/code-reviewer/code-reviewer.md`

**职责**:
- 主动审查代码质量、安全性和可维护性
- 编写或修改代码后立即使用
- 关键、高、中优先级问题分类反馈

**可用工具**: Read, Grep, Glob, Bash

**审查维度**:
- 安全检查（关键）
- 代码质量（高）
- 性能（中）
- 最佳实践（中）

---

## Team 组成

每个 Team 包含三个 Agent，协调工作：

```
Team X (项目/任务名称)
├── planner      # 规划专家 - 制定实施计划
├── coder         # 代码实现专家 - 执行计划
└── code-reviewer # 代码审查专家 - 审查代码质量
```

---

## 工作流程

1. **Planner** 分析任务，输出实施计划
2. **Coder** 按照计划实施代码
3. **Code-Reviewer** 审查代码，反馈问题
4. **Coder** 修复问题，直到审查通过

---

## 模型使用

| 参数 | 默认值 | 说明 |
|-----|--------|------|
| model | opus | 所有 agent 默认使用 opus 模型 |
