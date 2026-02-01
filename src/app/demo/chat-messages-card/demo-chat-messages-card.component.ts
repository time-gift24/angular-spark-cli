import { Component, signal, computed } from '@angular/core';
import { ChatMessagesCardComponent } from '../../shared/ui/chat-messages-card';
import { ChatMessage, PanelPosition, PanelSize } from '../../shared/models';
import { sampleMessages, emptyMessages, singleMessage, longConversation } from './examples/message-examples';
import { positionExamples, sizeExamples } from './examples/position-examples';

/**
 * Chat Messages Card Demo Component
 *
 * 调试和展示 AI 消息卡片的各种配置
 */
@Component({
  selector: 'app-demo-chat-messages-card',
  standalone: true,
  imports: [ChatMessagesCardComponent],
  templateUrl: './demo-chat-messages-card.component.html',
  styleUrls: ['./demo-chat-messages-card.component.css'],
})
export class DemoChatMessagesCardComponent {
  // 消息数据集
  readonly sampleMessages = sampleMessages;
  readonly emptyMessages = emptyMessages;
  readonly singleMessage = singleMessage;
  readonly longConversation = longConversation;

  // 位置和尺寸示例
  readonly positionExamples = positionExamples;
  readonly sizeExamples = sizeExamples;

  // 当前选择的配置
  readonly selectedMessages = signal<ChatMessage[]>(sampleMessages);
  readonly selectedPosition = signal<PanelPosition>(positionExamples['centered']);
  readonly selectedSize = signal<PanelSize>(sizeExamples['medium']);
  readonly isVisible = signal<boolean>(true);

  // 控制面板状态
  readonly showControls = signal<boolean>(true);

  // 统计信息
  readonly messageCount = computed(() => this.selectedMessages().length);
  readonly userMessageCount = computed(() =>
    this.selectedMessages().filter(m => m.role === 'user').length
  );
  readonly assistantMessageCount = computed(() =>
    this.selectedMessages().filter(m => m.role === 'assistant').length
  );
  readonly systemMessageCount = computed(() =>
    this.selectedMessages().filter(m => m.role === 'system').length
  );

  // 事件处理
  onPositionChange(position: PanelPosition): void {
    this.selectedPosition.set(position);
    console.log('[Demo] Position changed:', position);
  }

  onSizeChange(size: PanelSize): void {
    this.selectedSize.set(size);
    console.log('[Demo] Size changed:', size);
  }

  // 切换可见性
  toggleVisibility(): void {
    this.isVisible.update(v => !v);
  }

  // 切换控制面板
  toggleControls(): void {
    this.showControls.update(v => !v);
  }

  // 重置位置
  resetPosition(): void {
    this.selectedPosition.set(positionExamples['centered']);
  }

  // 重置尺寸
  resetSize(): void {
    this.selectedSize.set(sizeExamples['medium']);
  }

  // 添加新消息
  addMessage(): void {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'assistant',
      content: `这是一条自动生成的消息 - ${new Date().toLocaleTimeString()}`,
      timestamp: Date.now(),
    };
    this.selectedMessages.update(messages => [...messages, newMessage]);
  }

  // 清空消息
  clearMessages(): void {
    this.selectedMessages.set([]);
  }

  // 恢复默认消息
  restoreDefaultMessages(): void {
    this.selectedMessages.set(sampleMessages);
  }

  // 选择消息集
  selectMessageSet(type: 'sample' | 'empty' | 'single' | 'long'): void {
    switch (type) {
      case 'sample':
        this.selectedMessages.set(sampleMessages);
        break;
      case 'empty':
        this.selectedMessages.set(emptyMessages);
        break;
      case 'single':
        this.selectedMessages.set(singleMessage);
        break;
      case 'long':
        this.selectedMessages.set(longConversation);
        break;
    }
  }

  // 选择位置
  selectPosition(type: keyof typeof positionExamples): void {
    this.selectedPosition.set(positionExamples[type]);
  }

  // 选择尺寸
  selectSize(type: keyof typeof sizeExamples): void {
    this.selectedSize.set(sizeExamples[type]);
  }

  // 获取当前位置名称
  getCurrentPositionName(): string {
    const current = this.selectedPosition();
    for (const [name, pos] of Object.entries(positionExamples)) {
      if (pos.x === current.x && pos.y === current.y) {
        return name;
      }
    }
    return 'custom';
  }

  // 获取当前尺寸名称
  getCurrentSizeName(): string {
    const current = this.selectedSize();
    for (const [name, size] of Object.entries(sizeExamples)) {
      if (size.width === current.width && size.height === current.height) {
        return name;
      }
    }
    return 'custom';
  }

  // 工具方法：四舍五入
  round(value: number): number {
    return Math.round(value);
  }
}
