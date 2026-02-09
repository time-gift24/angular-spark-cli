import { Component, Input, computed } from '@angular/core';
import { ChatMessage } from '@app/shared/models';
import { StaticMarkdownComponent } from '../static-markdown/static-markdown.component';

@Component({
  selector: 'ai-message-bubble',
  standalone: true,
  imports: [StaticMarkdownComponent],
  templateUrl: './message-bubble.component.html',
})
export class MessageBubbleComponent {
  @Input({ required: true }) message!: ChatMessage;

  readonly isUser = computed(() => this.message.role === 'user');
  readonly isAI = computed(() => this.message.role === 'assistant');
}
