/**
 * Demo AI Chat Panel Component
 *
 * 展示完整的 AI Chat Panel 功能
 * - 会话管理（切换、新建、关闭、重命名、颜色）
 * - 消息显示与交互
 * - AI 状态指示（思考、输入、完成、错误）
 * - 输入框功能（发送、文件、图片、语音）
 */

import { Component } from "@angular/core";
import { AiChatPanelComponent } from "@app/shared/ui/ai-chat";

@Component({
  selector: "app-demo-ai-chat-panel",
  standalone: true,
  imports: [AiChatPanelComponent],
  templateUrl: "./demo-ai-chat-panel.component.html",
  styleUrls: ["./demo-ai-chat-panel.component.css"],
  host: {
    style: "display: block; width: 100%; height: 100vh;",
  },
})
export class DemoAiChatPanelComponent {
  /**
   * 功能说明列表
   */
  readonly features = [
    {
      icon: "💬",
      title: "多会话管理",
      desc: "支持创建多个独立对话，通过标签页快速切换",
    },
    {
      icon: "🎨",
      title: "会话个性化",
      desc: "右键点击标签可重命名、更改颜色或关闭会话",
    },
    {
      icon: "✨",
      title: "智能状态指示",
      desc: "实时显示 AI 思考、输入、完成等状态",
    },
    {
      icon: "📎",
      title: "多媒体支持",
      desc: "支持文件、图片上传和语音输入（功能待实现）",
    },
    {
      icon: "💾",
      title: "自动保存",
      desc: "会话数据自动保存到本地存储，刷新不丢失",
    },
    {
      icon: "🎯",
      title: "流畅交互",
      desc: "采用 Angular Signals 响应式设计，性能优异",
    },
  ];

  /**
   * 快捷键说明
   */
  readonly shortcuts = [
    { key: "点击浮动按钮", value: "打开/关闭 AI 面板" },
    { key: "点击会话标签", value: "切换到该会话" },
    { key: "点击激活标签", value: "折叠/展开消息区域" },
    { key: "Enter", value: "发送消息" },
    { key: "Shift + Enter", value: "输入换行" },
    { key: "右键标签", value: "打开上下文菜单" },
  ];

  /**
   * 使用示例代码
   */
  readonly usageExample = `
import { AiChatPanelComponent } from '@app/shared/ui/ai-chat';

@Component({
  selector: 'app-your-component',
  standalone: true,
  imports: [AiChatPanelComponent],
  template: \`
    <ai-chat-panel />
  \`
})
export class YourComponent {}
`.trim();

  /**
   * API 说明
   */
  readonly apiInfo = [
    {
      property: "selector",
      type: "'ai-chat-panel'",
      description: "组件选择器",
    },
    {
      property: "standalone",
      type: "true",
      description: "独立组件，无需模块",
    },
    {
      property: "imports",
      type: "[CommonModule, ...]",
      description: "导入的依赖组件",
    },
  ];
}
