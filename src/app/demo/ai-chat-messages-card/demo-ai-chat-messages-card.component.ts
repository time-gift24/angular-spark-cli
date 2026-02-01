import { Component, signal } from '@angular/core';
import { ChatMessagesCardComponent } from '../../shared/ui/ai-chat/chat-messages-card/chat-messages-card.component';
import { ChatMessage } from '../../shared/ui/ai-chat/types/chat.types';

/**
 * AI Chat Messages Card Demo Component
 */
@Component({
  selector: 'app-demo-ai-chat-messages-card',
  standalone: true,
  imports: [ChatMessagesCardComponent],
  templateUrl: './demo-ai-chat-messages-card.component.html',
  styleUrls: ['./demo-ai-chat-messages-card.component.css'],
})
export class DemoAiChatMessagesCardComponent {
  readonly messages = signal<ChatMessage[]>(this.getDefaultMessages());

  addMessage(): void {
    const count = this.messages().length;
    const newMessage: ChatMessage = {
      id: String(count + 1),
      role: count % 2 === 0 ? 'user' : 'assistant',
      content: count % 2 === 0 ? '这是新的用户消息' : '这是 AI 的回复',
      timestamp: Date.now(),
      actions: count % 2 === 0 ? [] : [
        {
          id: `action-${count}`,
          label: '复制',
          icon: '📋',
          action: () => console.log('Copy clicked'),
        },
      ],
    };
    this.messages.update(msgs => [...msgs, newMessage]);
  }

  resetMessages(): void {
    this.messages.set(this.getDefaultMessages());
  }

  clearMessages(): void {
    this.messages.set([]);
  }

  private getDefaultMessages(): ChatMessage[] {
    const now = Date.now();
    return [
      {
        id: '1',
        role: 'user',
        content: 'Angular Signals 是什么？',
        timestamp: now - 10000,
      },
      {
        id: '2',
        role: 'assistant',
        content: 'Angular Signals 是一个响应式系统，用于管理应用状态。它提供了简单而强大的方式来处理数据流和组件更新。',
        timestamp: now - 8000,
        actions: [
          {
            id: 'copy-1',
            label: '复制',
            icon: '📋',
            action: () => console.log('Copy'),
          },
          {
            id: 'like-1',
            label: '有帮助',
            icon: '👍',
            action: () => console.log('Like'),
          },
        ],
      },
      {
        id: '3',
        role: 'user',
        content: '能举个例子吗？',
        timestamp: now - 5000,
      },
      {
        id: '4',
        role: 'assistant',
        content: '```typescript\nconst count = signal(0);\nconst doubleCount = computed(() => count() * 2);\n```',
        timestamp: now - 2000,
        actions: [
          {
            id: 'copy-2',
            label: '复制代码',
            icon: '📋',
            action: () => console.log('Copy code'),
          },
        ],
      },
    ];
  }
}
