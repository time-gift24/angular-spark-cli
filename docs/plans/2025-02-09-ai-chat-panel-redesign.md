# AI Chat Panel 重新设计

> **创建日期**: 2025-02-09
> **状态**: 待实施

## 目标

重新设计从右侧弹出的 AI 对话面板，解决当前设计的视觉问题：
- 背景半透明效果显得"轻"，缺乏质感
- 头部 liquid-glass 效果不够精致
- 整体缺乏视觉层次

## 设计决策

### 整体风格

| 元素 | 设计方案 | 理由 |
|------|----------|------|
| 背景风格 | 纯色渐变 | 与 Mineral & Time 主题协调，性能好 |
| 左边缘 | 细微阴影分隔 | `shadow-[-4px_0_16px_rgba(0,0,0,0.1)]`，营造浮动感 |
| 颜色主题 | 与主题一致 | 使用 CSS 变量，自动适配明暗模式 |

### 头部 (PanelHeader)

| 元素 | 设计方案 |
|------|----------|
| 背景 | 纯色深色，比消息区深 1-2 个色阶 |
| 分隔 | 底部边框 `border-b border-border/50` |
| 按钮 | 圆形图标按钮 `p-2 rounded-full hover:bg-muted` |

### 消息区

| 元素 | 设计方案 |
|------|----------|
| AI 消息容器 | 去掉 liquid-glass，改用 `bg-muted/50` + 边框 |
| 滚动条 | 细线滚动条，4-6px 宽，hover 加宽 |
| 空状态 | 极简文字，居中灰色 |

### 交互

| 元素 | 设计方案 |
|------|----------|
| 拖拽手柄 | 隐形触发区，默认细线，hover 扩展高亮 |
| 动画 | width + opacity 组合，去掉 scale |
| 宽度范围 | 300-800px |

## 技术实现要点

### 1. 面板背景渐变

```css
.ai-chat-panel {
  background: linear-gradient(to bottom, var(--card), var(--card) 95%, var(--muted)/20);
  box-shadow: -4px 0 16px rgba(0, 0, 0, 0.1);
}
```

### 2. 头部背景

```css
.ai-panel-header {
  background: oklch(from var(--card) calc(l - 0.03) c h);
  border-bottom: 1px solid var(--border);
}
```

### 3. AI 消息容器

```html
<div class="ai-message bg-muted/50 border border-border/50 rounded-lg">
  <app-streaming-markdown [stream$]="..." />
</div>
```

### 4. 滚动条样式

```css
.ai-messages::-webkit-scrollbar {
  width: 6px;
}
.ai-messages::-webkit-scrollbar-thumb {
  background: var(--border);
  border-radius: 3px;
}
.ai-messages::-webkit-scrollbar-thumb:hover {
  background: var(--muted-foreground);
}
```

### 5. 动画

```css
.ai-chat-panel-enter {
  animation: panel-slide-in 0.3s var(--ease-spring-smooth);
}
@keyframes panel-slide-in {
  from {
    opacity: 0;
    width: 0;
  }
  to {
    opacity: 1;
    /* width 由内联样式控制 */
  }
}
```

## 需要修改的组件

1. **AiChatPanelComponent** - 更新模板和样式类
2. **PanelHeaderComponent** - 简化设计，圆形按钮
3. **MessageListComponent** - AI 消息容器改用纯色背景
4. **ResizeHandleComponent** - 确保隐形触发区风格
5. **styles.css** - 添加面板动画和滚动条样式
