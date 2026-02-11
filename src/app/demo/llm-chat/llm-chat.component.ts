import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LlmService, LlmMessage } from '@app/shared/services/llm';

@Component({
  selector: 'app-llm-chat',
  imports: [CommonModule, FormsModule],
  templateUrl: './llm-chat.component.html',
  styleUrls: ['./llm-chat.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LlmChatComponent {
  private readonly llmService = inject(LlmService);

  readonly userInput = signal('');
  readonly response = signal('');
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);

  sendMessage() {
    const message = this.userInput().trim();
    if (!message || this.isLoading()) return;

    this.isLoading.set(true);
    this.error.set(null);
    this.response.set('');
    this.userInput.set('');

    const messages: LlmMessage[] = [
      { role: 'user', content: message }
    ];

    let fullResponse = '';

    this.llmService.streamChat(messages).subscribe({
      next: (chunk) => {
        if (chunk.error) {
          console.error('LLM Error:', chunk.error);
          this.error.set(chunk.error.message);
          this.isLoading.set(false);
        } else if (chunk.content) {
          fullResponse += chunk.content;
          this.response.set(fullResponse);
        }

        if (chunk.done) {
          this.isLoading.set(false);
        }
      },
      error: (err) => {
        console.error('LLM Service Error:', err);
        this.error.set(err instanceof Error ? err.message : 'Unknown error occurred');
        this.isLoading.set(false);
      }
    });
  }

  clearChat() {
    this.userInput.set('');
    this.response.set('');
    this.error.set(null);
  }
}
