# Streaming Markdown 架构重构 - 实施提示词

## 📍 当前状态

**项目**: Angular Spark CLI - Streaming Markdown 组件架构重构
**分支**: `feature/streaming-markdown`
**工作目录**: `/Users/wanyaozhong/Projects/angular-spark-cli/.worktrees/streaming-markdown`
**日期**: 2026-02-01

## ✅ 已完成的工作

### 1. 设计阶段 ✅
- **架构设计文档**: `docs/brainstorm/2026-02-01-streaming-markdown-architecture-refactoring-brainstorm.md`
  - MVP 范围定义（5种核心块类型）
  - 完整架构设计（BlockRouter + 专用组件）
  - 错误处理策略（三层降级机制）
  - 测试策略（单元/集成/E2E/性能）

### 2. 实施计划 ✅
- **详细实施计划**: `docs/plans/2026-02-01-streaming-markdown-refactoring-architecture.md`
  - 6 个阶段，28 个任务
  - 每个任务 10-20 分钟可完成
  - 清晰的依赖关系和并行化策略
  - Mermaid 图表可视化

### 3. 验证阶段 ✅
- **验证报告**: `docs/verification/2026-02-01-pre-implementation-verification.md`
  - ✅ 代码结构验证通过
  - ✅ 依赖管理验证通过（Angular 21, RxJS 7.8）
  - ✅ 数据模型验证通过（可向后兼容扩展）
  - ✅ 测试框架验证通过
  - ✅ 构建状态验证通过（无编译错误）

### 4. Git 提交历史
```
71c22ee docs: add streaming markdown architecture refactoring design
953f1ed docs: add streaming markdown refactoring implementation plan
553c0c3 docs: add pre-implementation verification report
```

## 🎯 当前目标

**Phase 1: Core Domain Models** (30-40 分钟)

### Task 1.1: 增强 MarkdownBlock 接口
- **文件**: `src/app/shared/components/streaming-markdown/core/models.ts`
- **操作**: 添加新字段，保持向后兼容
- **验证标准**: `ng build` 无类型错误

### Task 1.2: 更新 BlockType 枚举
- **文件**: `src/app/shared/components/streaming-markdown/core/models.ts`
- **操作**: 添加 UNKNOWN 和 RAW 类型
- **验证标准**: 枚举值完整

### Task 1.3: 创建 BlockFactory 接口
- **文件**: `src/app/shared/components/streaming-markdown/core/block-factory.ts`
- **操作**: 定义工厂接口和 ID 生成器接口
- **验证标准**: 接口定义清晰

## 📋 实施原则

1. **每个任务结束后**:
   - 运行 `ng build` 验证编译
   - 运行 `ng test` 验证测试（如果相关）
   - Git commit 小步提交

2. **遇到问题时**:
   - 查看实施计划的 "Risk Mitigation" 章节
   - 查看验证报告的 "架构兼容性分析"
   - 保持向后兼容，不破坏现有功能

3. **完成 Phase 后**:
   - Git commit: `feat: implement Phase X - [description]`
   - 更新 Master Status Tracker
   - 准备下一阶段

## 🚀 开始指令

### 选项 1: 从 Phase 1 Task 1.1 开始

```
请根据 docs/plans/2026-02-01-streaming-markdown-refactoring-architecture.md
执行 Phase 1 Task 1.1: 增强 MarkdownBlock 接口

要求：
1. 保持向后兼容
2. 添加新字段：children, items, highlightedHTML 等
3. 运行 ng build 验证
4. Git commit
```

### 选项 2: 查看当前状态

```
请查看当前代码状态并确认：
1. 核心模型文件位置
2. 现有的 MarkdownBlock 接口定义
3. 准备开始实施 Phase 1
```

### 选项 3: 并行启动多个组件骨架

```
请同时创建 Phase 3 的 5 个组件骨架文件：
- MarkdownHeadingComponent
- MarkdownParagraphComponent
- MarkdownCodeComponent
- MarkdownListComponent
- MarkdownBlockquoteComponent

要求：
1. 仅创建组件文件和基本 @Component 装饰器
2. 不实现具体逻辑
3. 确保编译通过
```

## 📚 关键文档位置

- **实施计划**: `docs/plans/2026-02-01-streaming-markdown-refactoring-architecture.md`
- **架构设计**: `docs/brainstorm/2026-02-01-streaming-markdown-architecture-refactoring-brainstorm.md`
- **验证报告**: `docs/verification/2026-02-01-pre-implementation-verification.md`
- **现有模型**: `src/app/shared/components/streaming-markdown/core/models.ts`
- **实施计划查看**:
  ```bash
  cat docs/plans/2026-02-01-streaming-markdown-refactoring-architecture.md
  ```

## 🎯 成功标准

### Phase 1 完成标准
- ✅ MarkdownBlock 接口增强完成
- ✅ BlockType 枚举更新完成
- ✅ BlockFactory 接口创建完成
- ✅ `ng build` 无错误
- ✅ 所有测试通过
- ✅ Git commit 完成

### 最终目标（所有 Phase 完成）
- 样式管理: ⭐⭐☆☆☆ → ⭐⭐⭐⭐⭐
- 可维护性: ⭐⭐⭐☆☆ → ⭐⭐⭐⭐⭐
- 综合评分: 3.5/5 → 4.5/5

---

**复制以上内容到新 session 开始执行！**
