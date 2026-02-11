import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { ChatMessage } from '@app/shared/models';
import { StaticMarkdownComponent } from '../static-markdown/static-markdown.component';

@Component({
  selector: 'ai-message-bubble',
  imports: [StaticMarkdownComponent],
  templateUrl: './message-bubble.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MessageBubbleComponent {
  readonly message = input.required<ChatMessage>();

  readonly isUser = computed(() => this.message().role === 'user');
  readonly isAI = computed(() => this.message().role === 'assistant');
}
