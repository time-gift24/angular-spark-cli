import { Component, inject } from '@angular/core';
import { SessionStateService } from '@app/shared/services';

@Component({
  selector: 'app-demo-ai-chat-panel',
  standalone: true,
  template: `
    <div class="p-8 space-y-6">
      <div class="space-y-2">
        <h1 class="text-2xl font-semibold">AI Chat Panel Demo</h1>
        <p class="text-muted-foreground">
          这是一个全局 AI 对话面板的演示页面。点击底部的"新建会话"按钮开始使用。
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        @for (card of demoCards; track card.title) {
          <div
            class="p-4 rounded-lg border border-border bg-card/50 hover:bg-card transition-colors cursor-pointer"
            (click)="fillDemoContent(card.type)">
            <h3 class="font-medium">{{ card.title }}</h3>
            <p class="text-sm text-muted-foreground mt-1">{{ card.description }}</p>
          </div>
        }
      </div>

      <div class="p-4 rounded-lg border border-border bg-muted/20">
        <h3 class="font-medium mb-2">当前状态</h3>
        <div class="text-sm space-y-1 text-muted-foreground">
          <p>会话数量: {{ sessions().size }}</p>
          <p>活动会话: {{ activeSessionId() || '无' }}</p>
        </div>
      </div>
    </div>
  `,
})
export class DemoAiChatPanelComponent {
  private sessionState = inject(SessionStateService);

  readonly sessions = this.sessionState.sessions;
  readonly activeSessionId = this.sessionState.activeSessionId;
  readonly activeInputValue = this.sessionState.activeInputValue;

  readonly demoCards = [
    { title: '代码生成', description: '让 AI 生成 Angular 组件代码', type: 'code' },
    { title: '问题解答', description: '询问技术问题获得解答', type: 'qa' },
    { title: '创意写作', description: '让 AI 帮助创作内容', type: 'creative' },
    { title: '数据分析', description: '分析和解释数据', type: 'data' },
    { title: '翻译', description: '多语言翻译服务', type: 'translate' },
    { title: '总结', description: '总结长文本内容', type: 'summary' },
  ];

  fillDemoContent(type: string): void {
    const sessionId = this.activeSessionId();
    if (!sessionId) {
      this.sessionState.createSession();
      return;
    }

    const prompts: Record<string, string> = {
      code: '帮我创建一个 Angular 组件，实现一个带搜索功能的下拉选择框',
      qa: '什么是 Angular 的 Signal？它和 RxJS Observable 有什么区别？',
      creative: '写一段关于"未来城市"的创意描述',
      data: '解释一下 TypeScript 的泛型是什么，以及何时使用它们',
      translate: '将以下句子翻译成英文：Angular 是一个用于构建移动端和桌面端 Web 应用的平台',
      summary: '总结一下 Angular 17 的新特性',
    };

    const prompt = prompts[type] || '你好！';
    this.sessionState.updateInputValue(prompt);
  }
}
