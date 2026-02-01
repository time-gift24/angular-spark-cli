# AI Chat Panel Design Summary

## 项目概述
设计一个类 Claude 的浮动 AI 聊天界面，采用"矿物与时光"岩彩主题。

---

## ✅ 已完成的设计

### 1. 整体架构
**三个独立悬浮组件（从上到下）：**
1. **聊天消息卡片** (`chat-messages-card`) - 可展开/收起
2. **状态徽章容器** (`status-badges-container`) - 显示 AI 状态
3. **输入框** (`input-container`) - 持久显示

### 2. 视觉设计

#### 配色方案（矿物与时光主题）
```css
/* 基础颜色 */
背景: oklch(0.91 0.015 85)        /* 绢黄 - 氧化纸张质感 */
主色: oklch(0.48 0.07 195)         /* 石绿 - 沉稳通透 */
文字: oklch(0.28 0.03 185)         /* 深灰 */
边框: oklch(0.48 0.07 195 / 25%)   /* 半透明石绿 */
```

#### Glass Morphism 效果
- 背景模糊：`backdrop-filter: blur(20px)`
- 半透明背景：`opacity: 95%`
- 柔和阴影：多层 box-shadow

### 3. 组件详细设计

#### A. 聊天消息卡片
```css
position: relative
background: oklch(0.91 0.015 85 / 95%)
border-radius: 12px
border: 1px solid oklch(0.48 0.07 195 / 30%)
overflow: visible  /* 允许拖拽手柄显示在外部 */
```

**特点：**
- 用户消息：右侧，石绿背景
- AI 消息：左侧，浅色背景 + 行动按钮
- 可展开/收起：点击 badge 触发 `togglePanel()`

#### B. 状态徽章
```css
位置：聊天卡片和输入框之间
左对齐：justify-content: flex-start
无背景容器：完全悬浮

四种状态：
- Thinking: 脉动圆点动画
- Typing: 三点跳动动画
- Done: ✓ 对勾
- Error: ⚠ 警告
```

#### C. 矩形输入框
```css
/* 上下结构 */
上部：输入区域（textarea，自动扩展高度）
下部：工具栏

左下角：工具按钮（📎 文件、🖼️ 图片、🎤 语音）
右下角：发送按钮（Send + ↑）
```

**交互：**
- Enter 发送，Shift+Enter 换行
- 自动调整高度（最大 120px）
- 空输入时禁用发送按钮

### 4. 拖拽和调整大小

#### 拖拽手柄
```css
位置：聊天卡片顶部上方（top: -20px）
样式：横向三道线（20px × 2px，间距 3px）
背景：无背景，无边框，完全透明
颜色：oklch(0.48 0.07 195) 石绿
```

**预期功能：**
- 拖拽手柄可移动整个聊天卡片
- 不触发任何其他点击事件
- 支持鼠标和触摸操作

#### 调整大小手柄
```css
位置：聊天卡片右下角
样式：斜角指示器（两条斜线）
最小尺寸：300px × 200px
```

### 5. 交互设计

| 操作 | 效果 |
|------|------|
| 点击 Badge | 展开/收起聊天卡片 |
| 右击任意位置 | 隐藏整个面板（3秒后恢复） |
| 拖拽顶部手柄 | 移动聊天卡片 |
| 拖拽右下角 | 调整聊天卡片大小 |
| Enter | 发送消息 |
| Shift+Enter | 换行 |

---

## ❌ 遗留问题

### 🐛 问题 1：点击拖拽手柄导致聊天卡片消失

**现象：**
点击拖拽手柄（三道横线）时，聊天卡片会收起（添加 `collapsed` 类）

**预期行为：**
点击拖拽手柄不应触发任何状态变化，只能用于拖拽

**已尝试的解决方案：**
1. ✗ 添加 `e.stopPropagation()` - 无效
2. ✗ 添加 `e.stopImmediatePropagation()` - 无效
3. ✗ 使用事件捕获阶段 `{ capture: true }` - 无效
4. ✗ 在 click 事件返回 `false` - 无效
5. ✗ 提高 z-index 到 1000 - 无效
6. ✗ 移除容器的 `onclick="togglePanel()"` - 部分解决，但仍有问题

**可能原因：**
- 事件冒泡路径复杂
- 某个父元素或全局事件监听器未被发现
- CSS 布局导致的点击区域重叠
- JavaScript 事件监听器注册顺序问题

**建议调试方法：**
1. 在 `togglePanel()` 函数中添加 `console.trace()` 查看调用栈
2. 使用浏览器开发者工具的事件监听器断点
3. 检查是否有全局点击事件监听器
4. 临时移除所有 onclick 属性，使用纯 addEventListener

### 🐛 问题 2：拖拽手柄可见性

**现象：**
拖拽手柄在某些背景下可能不够明显

**当前状态：**
- 横向三道线，半透明（opacity: 0.25）
- 悬停时变为 0.5
- 无背景和边框

**可能的改进：**
- 增加默认透明度到 0.35
- 悬停时添加微弱背景色
- 添加工具提示 "Drag to move"

---

## 📁 文件位置

**HTML 预览：** `/tmp/ai-chat-preview.html`

**使用方法：**
```bash
# 在浏览器中打开
open /tmp/ai-chat-preview.html

# 或使用默认浏览器
xdg-open /tmp/ai-chat-preview.html  # Linux
start /tmp/ai-chat-preview.html     # Windows
```

---

## 🎨 设计系统参考

### 颜色变量（OKLCH）
```css
--bg-aged-silk: oklch(0.91 0.015 85);
--fg-deep-gray: oklch(0.28 0.03 185);
--primary-malachite: oklch(0.48 0.07 195);
--border-gold: oklch(0.48 0.07 195 / 25%);
```

### 间距系统
```css
--spacing-xs: 2px;
--spacing-sm: 4px;
--spacing-md: 8px;
--spacing-lg: 12px;
--spacing-xl: 16px;
```

### 圆角系统
```css
--radius-sm: 4px;
--radius-md: 8px;
--radius-lg: 12px;
--radius-xl: 16px;
```

---

## 🔄 后续工作

### 立即需要
1. **修复拖拽手柄点击事件** - 最高优先级
2. **测试所有交互** - 确保没有其他意外行为

### 未来改进
1. 创建 Angular 组件文件
2. 添加动画过渡效果
3. 实现真实的 AI 对话功能
4. 添加文件上传功能
5. 支持多语言
6. 添加主题切换（深色模式）

---

## 📝 技术栈

- **HTML5** - 语义化标签
- **CSS3** - OKLCH 颜色、backdrop-filter、flexbox
- **JavaScript (ES6+)** - 原生 JS，无框架
- **OKLCH 颜色空间** - 感知均匀的颜色系统

---

**最后更新：** 2026-01-31
**状态：** 设计完成，存在已知 BUG
**优先级：** 修复点击事件 BUG
