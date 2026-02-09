import { Component, Input, computed } from '@angular/core';
import { ChatMessage } from '@app/shared/models';
import { LiquidGlassDirective } from '@app/shared/ui/liquid-glass';
import { MessageBubbleComponent as Self } from './message-bubble.component';

@Component({
  selector: 'ai-message-bubble',
  standalone: true,
  imports: [LiquidGlassDirective],
  templateUrl: './message-bubble.component.html',
})
export class MessageBubbleComponent {
  @Input({ required: true }) message!: ChatMessage;

  readonly isUser = computed(() => this.message.role === 'user');
  readonly isAI = computed(() => this.message.role === 'assistant');
}
