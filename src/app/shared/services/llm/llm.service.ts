import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { LLM_CONFIG } from './tokens/llm-config.token';
import { LlmMessage, StreamChunk } from './models';
import {
  OpenAIAdapter,
  OllamaAdapter,
  ZhipuAdapter,
  LlmProviderAdapter
} from './providers';

@Injectable({
  providedIn: 'root'
})
export class LlmService {
  private config = inject(LLM_CONFIG);
  private adapter: LlmProviderAdapter;

  constructor() {
    this.adapter = this.createAdapter();
  }

  streamChat(messages: LlmMessage[]): Observable<StreamChunk> {
    return this.adapter.streamChat(messages);
  }

  private createAdapter(): LlmProviderAdapter {
    switch (this.config.type) {
      case 'openai':
        return new OpenAIAdapter(this.config);
      case 'ollama':
        return new OllamaAdapter(this.config);
      case 'zhipu':
        return new ZhipuAdapter(this.config);
      default:
        throw new Error(`Unsupported provider type: ${this.config.type}`);
    }
  }
}
