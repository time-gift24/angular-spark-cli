import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LlmService } from '@app/shared/services/llm';

@Component({
  selector: 'app-llm-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './llm-chat.component.html',
  styleUrls: ['./llm-chat.component.css'],
})
export class LlmChatComponent {
  private readonly llmService = inject(LlmService);

  readonly userInput = signal('');
  readonly response = signal('');
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);

  async sendMessage() {
    const message = this.userInput().trim();
    if (!message) return;

    this.isLoading.set(true);
    this.error.set(null);
    this.response.set('');

    try {
      let fullResponse = '';

      // Stream the response
      for await (const chunk of this.llmService.streamChat(message)) {
        if (chunk.content) {
          fullResponse += chunk.content;
          this.response.set(fullResponse);
        }
      }
    } catch (err) {
      console.error('LLM Service Error:', err);
      this.error.set(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      this.isLoading.set(false);
    }
  }

  clearChat() {
    this.userInput.set('');
    this.response.set('');
    this.error.set(null);
  }
}
