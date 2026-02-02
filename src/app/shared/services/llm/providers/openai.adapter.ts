import { Observable } from 'rxjs';
import { LlmProviderAdapter } from './llm-provider.adapter';
import { LlmMessage, StreamChunk } from '../models';

/**
 * OpenAI API adapter for streaming chat completions.
 *
 * Implements OpenAI-compatible API with Server-Sent Events (SSE) streaming.
 */
export class OpenAIAdapter extends LlmProviderAdapter {
  /**
   * Initiates a streaming chat completion request using OpenAI API format
   * @param messages Array of conversation messages
   * @returns Observable emitting stream chunks
   */
  streamChat(messages: LlmMessage[]): Observable<StreamChunk> {
    return new Observable<StreamChunk>(subscriber => {
      const payload = this.buildRequestPayload(messages);

      this.http.post(
        `${this.config.baseUrl}/chat/completions`,
        payload,
        {
          headers: this.buildHeaders(),
          responseType: 'text',
          observe: 'body'
        }
      ).subscribe({
        next: (response: string) => {
          this.parseSSE(response, subscriber);
        },
        error: (error) => {
          subscriber.next({ content: '', done: true, error });
          subscriber.complete();
        }
      });
    });
  }

  /**
   * Parses Server-Sent Events (SSE) format from OpenAI streaming response
   * @param data Raw SSE response string
   * @param subscriber Observable subscriber to emit chunks
   * @protected
   */
  protected parseSSE(data: string, subscriber: any): void {
    const lines = data.split('\n');

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const jsonStr = line.slice(6);
        if (jsonStr.trim() === '[DONE]') {
          subscriber.next({ content: '', done: true });
          subscriber.complete();
          return;
        }

        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) {
            subscriber.next({ content, done: false });
          }
        } catch (e) {
          // Skip invalid JSON lines
        }
      }
    }

    subscriber.next({ content: '', done: true });
    subscriber.complete();
  }
}
