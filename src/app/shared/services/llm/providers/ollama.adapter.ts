import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { LlmProviderAdapter } from './llm-provider.adapter';
import { LlmMessage, StreamChunk, LlmProviderConfig } from '../models';

/**
 * Ollama adapter for streaming chat completions.
 *
 * Ollama provides an OpenAI-compatible API format, so we can reuse the
 * same SSE streaming logic from OpenAIAdapter. Key differences:
 * - No API key required (local service)
 * - Default baseUrl is http://localhost:11434
 * - Response format uses message.content instead of choices[0].delta.content
 */
export class OllamaAdapter extends LlmProviderAdapter {
  constructor(config: LlmProviderConfig) {
    super(config);
  }
  /**
   * Initiates a streaming chat completion request using Ollama API format
   * Uses fetch API with ReadableStream for proper SSE streaming
   * @param messages Array of conversation messages
   * @returns Observable emitting stream chunks incrementally
   */
  streamChat(messages: LlmMessage[]): Observable<StreamChunk> {
    return new Observable<StreamChunk>(subscriber => {
      const payload = this.buildRequestPayload(messages);
      const headers = this.buildHeaders();

      fetch(`${this.config.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: headers as HeadersInit,
        body: JSON.stringify(payload)
      }).then(async (response) => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
          throw new Error('Response body is null');
        }

        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            subscriber.next({ content: '', done: true });
            subscriber.complete();
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const jsonStr = line.slice(6).trim();
              if (jsonStr === '[DONE]') {
                subscriber.next({ content: '', done: true });
                subscriber.complete();
                return;
              }

              try {
                const parsed = JSON.parse(jsonStr);
                // Ollama uses message.content format (OpenAI uses choices[0].delta.content)
                const content = parsed.choices?.[0]?.delta?.content || parsed.message?.content;
                if (content) {
                  subscriber.next({ content, done: false });
                }
              } catch (e) {
                console.warn('Failed to parse SSE:', jsonStr);
              }
            }
          }
        }
      }).catch((error) => {
        subscriber.next({ content: '', done: true, error });
        subscriber.complete();
      });
    });
  }
}
