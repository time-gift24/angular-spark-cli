import { Observable } from 'rxjs';
import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { LlmMessage, StreamChunk, LlmProviderConfig } from '../models';

@Injectable()
export abstract class LlmProviderAdapter {
  protected http = inject(HttpClient);
  protected config: LlmProviderConfig;

  constructor(config: LlmProviderConfig) {
    this.config = config;
  }

  abstract streamChat(messages: LlmMessage[]): Observable<StreamChunk>;

  protected buildRequestPayload(messages: LlmMessage[]): object {
    return {
      model: this.config.model,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
      stream: true,
      ...(this.config.temperature !== undefined && { temperature: this.config.temperature })
    };
  }

  protected buildHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    if (this.config.apiKey) {
      headers['Authorization'] = `Bearer ${this.config.apiKey}`;
    }

    return headers;
  }
}
