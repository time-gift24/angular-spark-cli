import { Component, signal, computed } from '@angular/core';
import { ChatInputComponent } from '../../shared/ui/chat-input';

/**
 * AI Chat Input Demo Component
 *
 * 展示和调试 AI 聊天输入框的各种配置
 */
@Component({
  selector: 'app-demo-ai-chat-input',
  standalone: true,
  imports: [ChatInputComponent],
  templateUrl: './demo-ai-chat-input.component.html',
  styleUrls: ['./demo-ai-chat-input.component.css'],
})
export class DemoAiChatInputComponent {
  // 输入状态
  readonly inputValue = signal<string>('');
  readonly canSend = computed(() => this.inputValue().trim().length > 0);

  // 性能配置
  readonly enableLiquidGlass = signal<boolean>(true);

  // 控制面板状态
  readonly showControls = signal<boolean>(true);

  // 事件处理
  onInputChange(value: string): void {
    this.inputValue.set(value);
  }

  sendMessage(): void {
    const message = this.inputValue();
    console.log('[Demo] Sending message:', message);
    this.inputValue.set('');
  }

  // 切换控制面板
  toggleControls(): void {
    this.showControls.update(v => !v);
  }

  // 切换 liquid glass 效果
  toggleLiquidGlass(): void {
    this.enableLiquidGlass.update(v => !v);
  }

  // 清空输入
  clearInput(): void {
    this.inputValue.set('');
  }

  // 快捷键说明
  readonly shortcuts = [
    { key: 'Enter', value: '发送消息' },
    { key: 'Shift + Enter', value: '换行' },
    { key: '自动调整高度', value: '1-5 行' },
  ];
}
