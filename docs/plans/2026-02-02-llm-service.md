# LLM Service Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a flexible LLM service layer supporting OpenAI, Ollama, and Zhipu AI with streaming responses

**Architecture:** Adapter pattern with unified service interface. Each LLM provider has its own adapter implementing a common interface. Configuration via Angular DI allows easy provider switching.

**Tech Stack:** Angular 21, HttpClient, RxJS Observable, TypeScript 5.9, Server-Sent Events (SSE)

---

## Task 1: Create Data Models

**Files:**
- Create: `src/app/shared/services/llm/models/llm-config.model.ts`
- Create: `src/app/shared/services/llm/models/llm-message.model.ts`
- Create: `src/app/shared/services/llm/models/llm-response.model.ts`

**Step 1: Create LlmProviderConfig model**

```typescript
// src/app/shared/services/llm/models/llm-config.model.ts
export type LlmProviderType = 'openai' | 'ollama' | 'zhipu';

export interface LlmProviderConfig {
  type: LlmProviderType;
  baseUrl: string;
  model: string;
  apiKey?: string;
  temperature?: number;
}
```

**Step 2: Create LlmMessage model**

```typescript
// src/app/shared/services/llm/models/llm-message.model.ts
export type LlmMessageRole = 'system' | 'user' | 'assistant';

export interface LlmMessage {
  role: LlmMessageRole;
  content: string;
}
```

**Step 3: Create StreamChunk model**

```typescript
// src/app/shared/services/llm/models/llm-response.model.ts
export interface StreamChunk {
  content: string;
  done: boolean;
  error?: Error;
}
```

**Step 4: Create barrel export**

```typescript
// src/app/shared/services/llm/models/index.ts
export * from './llm-config.model';
export * from './llm-message.model';
export * from './llm-response.model';
```

**Step 5: Commit**

```bash
git add src/app/shared/services/llm/models/
git commit -m "feat(llm): add data models for LLM service

- Add LlmProviderConfig interface with provider types
- Add LlmMessage interface for chat messages
- Add StreamChunk interface for streaming responses
- Create barrel export for models

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 2: Create DI Token

**Files:**
- Create: `src/app/shared/services/llm/tokens/llm-config.token.ts`

**Step 1: Create injection token**

```typescript
// src/app/shared/services/llm/tokens/llm-config.token.ts
import { InjectionToken } from '@angular/core';
import { LlmProviderConfig } from '../models';

export const LLM_CONFIG = new InjectionToken<LlmProviderConfig>('LLM_CONFIG', {
  providedIn: 'root',
  factory: () => {
    throw new Error('LLM_CONFIG must be provided at app level');
  }
});
```

**Step 2: Commit**

```bash
git add src/app/shared/services/llm/tokens/
git commit -m "feat(llm): add DI token for LLM configuration

- Create LLM_CONFIG injection token
- Token requires app-level provider
- Prevents accidental undefined config

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 3: Create Base Adapter Interface

**Files:**
- Create: `src/app/shared/services/llm/providers/llm-provider.adapter.ts`

**Step 1: Create abstract adapter class**

```typescript
// src/app/shared/services/llm/providers/llm-provider.adapter.ts
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
```

**Step 2: Commit**

```bash
git add src/app/shared/services/llm/providers/llm-provider.adapter.ts
git commit -m "feat(llm): add base adapter abstract class

- Define abstract streamChat method
- Provide shared request payload builder
- Provide shared header builder with API key support
- Use Angular inject() for HttpClient

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 4: Implement OpenAI Adapter

**Files:**
- Create: `src/app/shared/services/llm/providers/openai.adapter.ts`
- Create: `src/app/shared/services/llm/providers/openai.adapter.spec.ts`

**Step 1: Write failing test for OpenAI adapter**

```typescript
// src/app/shared/services/llm/providers/openai.adapter.spec.ts
import { TestBed } from '@angular/core/testing';
import { HttpClient, HttpHandler } from '@angular/common/http';
import { of } from 'rxjs';
import { OpenAIAdapter } from './openai.adapter';
import { LlmMessage } from '../models';

describe('OpenAIAdapter', () => {
  let adapter: OpenAIAdapter;
  let httpMock: jasmine.SpyObj<HttpClient>;

  beforeEach(() => {
    const httpSpy = jasmine.createSpyObj('HttpClient', ['post']);
    TestBed.configureTestingModule({
      providers: [{ provide: HttpClient, useValue: httpSpy }]
    });

    httpMock = TestBed.inject(HttpClient) as jasmine.SpyObj<HttpClient>;
    adapter = new OpenAIAdapter({
      type: 'openai',
      baseUrl: 'https://api.openai.com/v1',
      model: 'gpt-4o',
      apiKey: 'test-key'
    });

    // Replace injected HttpClient with spy
    (adapter as any).http = httpMock;
  });

  it('should be created', () => {
    expect(adapter).toBeTruthy();
  });

  it('should call OpenAI API with correct payload', (done) => {
    const messages: LlmMessage[] = [
      { role: 'user', content: 'Hello' }
    ];

    httpMock.post.and.returnValue(of({}));

    adapter.streamChat(messages).subscribe();

    expect(httpMock.post).toHaveBeenCalledWith(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o',
        messages: [{ role: 'user', content: 'Hello' }],
        stream: true
      },
      {
        headers: jasmine.objectContaining({
          'Authorization': 'Bearer test-key'
        }),
        responseType: 'text',
        observe: 'body'
      }
    );
    done();
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm test -- openai.adapter.spec.ts
```
Expected: FAIL - "OpenAIAdapter not defined"

**Step 3: Implement OpenAI adapter**

```typescript
// src/app/shared/services/llm/providers/openai.adapter.ts
import { Observable } from 'rxjs';
import { LlmProviderAdapter } from './llm-provider.adapter';
import { LlmMessage, StreamChunk } from '../models';

export class OpenAIAdapter extends LlmProviderAdapter {
  streamChat(messages: LlmMessage[]): Observable<StreamChunk> {
    return new Observable<StreamChunk>(subscriber => {
      const payload = this.buildRequestPayload(messages);
      const headers = this.buildHeaders();

      this.http.post(
        `${this.config.baseUrl}/chat/completions`,
        payload,
        {
          headers,
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

  private parseSSE(data: string, subscriber: any): void {
    const lines = data.split('\n');
    let buffer = '';

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
            buffer += content;
            subscriber.next({ content, done: false });
          }
        } catch (e) {
          // Skip invalid JSON
        }
      }
    }

    subscriber.next({ content: '', done: true });
    subscriber.complete();
  }
}
```

**Step 4: Run test to verify it passes**

```bash
npm test -- openai.adapter.spec.ts
```
Expected: PASS

**Step 5: Commit**

```bash
git add src/app/shared/services/llm/providers/openai.adapter.ts src/app/shared/services/llm/providers/openai.adapter.spec.ts
git commit -m "feat(llm): implement OpenAI adapter with streaming

- Extend base adapter class
- Implement streamChat with SSE parsing
- Handle [DONE] signal for stream completion
- Add basic unit tests

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 5: Implement Ollama Adapter

**Files:**
- Create: `src/app/shared/services/llm/providers/ollama.adapter.ts`
- Create: `src/app/shared/services/llm/providers/ollama.adapter.spec.ts`

**Step 1: Write test for Ollama adapter**

```typescript
// src/app/shared/services/llm/providers/ollama.adapter.spec.ts
import { TestBed } from '@angular/core/testing';
import { HttpClient, HttpHandler } from '@angular/common/http';
import { OllamaAdapter } from './ollama.adapter';
import { LlmMessage } from '../models';

describe('OllamaAdapter', () => {
  let adapter: OllamaAdapter;
  let httpMock: jasmine.SpyObj<HttpClient>;

  beforeEach(() => {
    const httpSpy = jasmine.createSpyObj('HttpClient', ['post']);
    TestBed.configureTestingModule({
      providers: [{ provide: HttpClient, useValue: httpSpy }]
    });

    httpMock = TestBed.inject(HttpClient) as jasmine.SpyObj<HttpClient>;
    adapter = new OllamaAdapter({
      type: 'ollama',
      baseUrl: 'http://localhost:11434',
      model: 'llama3.2'
    });

    (adapter as any).http = httpMock;
  });

  it('should be created', () => {
    expect(adapter).toBeTruthy();
  });

  it('should call Ollama API without auth header', (done) => {
    const messages: LlmMessage[] = [{ role: 'user', content: 'Test' }];
    httpMock.post.and.returnValue(new EventEmitter());

    adapter.streamChat(messages).subscribe();

    expect(httpMock.post).toHaveBeenCalled();
    const callArgs = httpMock.post.calls.argsFor(0)[2];
    expect(callArgs.headers['Authorization']).toBeUndefined();
    done();
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm test -- ollama.adapter.spec.ts
```
Expected: FAIL

**Step 3: Implement Ollama adapter**

```typescript
// src/app/shared/services/llm/providers/ollama.adapter.ts
import { Observable } from 'rxjs';
import { LlmProviderAdapter } from './llm-provider.adapter';
import { LlmMessage, StreamChunk } from '../models';

export class OllamaAdapter extends LlmProviderAdapter {
  streamChat(messages: LlmMessage[]): Observable<StreamChunk> {
    return new Observable<StreamChunk>(subscriber => {
      const payload = this.buildRequestPayload(messages);
      const headers = this.buildHeaders();

      this.http.post(
        `${this.config.baseUrl}/chat/completions`,
        payload,
        {
          headers,
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

  private parseSSE(data: string, subscriber: any): void {
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
          const content = parsed.choices?.[0]?.delta?.content || parsed.message?.content;
          if (content) {
            subscriber.next({ content, done: false });
          }
        } catch (e) {
          // Skip invalid JSON
        }
      }
    }

    subscriber.next({ content: '', done: true });
    subscriber.complete();
  }
}
```

**Step 4: Run test to verify it passes**

```bash
npm test -- ollama.adapter.spec.ts
```
Expected: PASS

**Step 5: Commit**

```bash
git add src/app/shared/services/llm/providers/ollama.adapter.ts src/app/shared/services/llm/providers/ollama.adapter.spec.ts
git commit -m "feat(llm): implement Ollama adapter

- Reuse SSE parsing logic from OpenAI adapter
- Support Ollama-specific response format
- No authentication required
- Add unit tests

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 6: Implement Zhipu Adapter

**Files:**
- Create: `src/app/shared/services/llm/providers/zhipu.adapter.ts`
- Create: `src/app/shared/services/llm/providers/zhipu.adapter.spec.ts`

**Step 1: Write test for Zhipu adapter**

```typescript
// src/app/shared/services/llm/providers/zhipu.adapter.spec.ts
import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { ZhipuAdapter } from './zhipu.adapter';
import { LlmMessage } from '../models';

describe('ZhipuAdapter', () => {
  let adapter: ZhipuAdapter;
  let httpMock: jasmine.SpyObj<HttpClient>;

  beforeEach(() => {
    const httpSpy = jasmine.createSpyObj('HttpClient', ['post']);
    TestBed.configureTestingModule({
      providers: [{ provide: HttpClient, useValue: httpSpy }]
    });

    httpMock = TestBed.inject(HttpClient) as jasmine.SpyObj<HttpClient>;
    adapter = new ZhipuAdapter({
      type: 'zhipu',
      baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
      model: 'glm-4',
      apiKey: 'zhipu-test-key'
    });

    (adapter as any).http = httpMock;
  });

  it('should be created', () => {
    expect(adapter).toBeTruthy();
  });

  it('should use correct base URL', () => {
    const messages: LlmMessage[] = [{ role: 'user', content: '你好' }];
    httpMock.post.and.returnValue(new EventEmitter());

    adapter.streamChat(messages).subscribe();

    expect(httpMock.post).toHaveBeenCalledWith(
      'https://open.bigmodel.cn/api/paas/v4/chat/completions',
      jasmine.any(Object),
      jasmine.any(Object)
    );
  });
});
```

**Step 2: Run test**

```bash
npm test -- zhipu.adapter.spec.ts
```
Expected: FAIL

**Step 3: Implement Zhipu adapter**

```typescript
// src/app/shared/services/llm/providers/zhipu.adapter.ts
import { Observable } from 'rxjs';
import { LlmProviderAdapter } from './llm-provider.adapter';
import { LlmMessage, StreamChunk } from '../models';

export class ZhipuAdapter extends LlmProviderAdapter {
  streamChat(messages: LlmMessage[]): Observable<StreamChunk> {
    return new Observable<StreamChunk>(subscriber => {
      const payload = this.buildRequestPayload(messages);
      const headers = this.buildHeaders();

      this.http.post(
        `${this.config.baseUrl}/chat/completions`,
        payload,
        {
          headers,
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

  private parseSSE(data: string, subscriber: any): void {
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
          // Skip invalid JSON
        }
      }
    }

    subscriber.next({ content: '', done: true });
    subscriber.complete();
  }
}
```

**Step 4: Run test**

```bash
npm test -- zhipu.adapter.spec.ts
```
Expected: PASS

**Step 5: Commit**

```bash
git add src/app/shared/services/llm/providers/zhipu.adapter.ts src/app/shared/services/llm/providers/zhipu.adapter.spec.ts
git commit -m "feat(llm): implement Zhipu AI adapter

- Zhipu API fully compatible with OpenAI format
- Use glm-4 model by default
- Add authentication support
- Add unit tests

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 7: Create Provider Barrel Export

**Files:**
- Create: `src/app/shared/services/llm/providers/index.ts`

**Step 1: Create barrel export**

```typescript
// src/app/shared/services/llm/providers/index.ts
export * from './llm-provider.adapter';
export * from './openai.adapter';
export * from './ollama.adapter';
export * from './zhipu.adapter';
```

**Step 2: Commit**

```bash
git add src/app/shared/services/llm/providers/index.ts
git commit -m "feat(llm): add barrel export for providers

- Export all adapters and base class
- Simplify imports for service layer

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 8: Implement Main LlmService

**Files:**
- Create: `src/app/shared/services/llm/llm.service.ts`
- Create: `src/app/shared/services/llm/llm.service.spec.ts`

**Step 1: Write failing test for service**

```typescript
// src/app/shared/services/llm/llm.service.spec.ts
import { TestBed } from '@angular/core/testing';
import { LlmService } from './llm.service';
import { LLM_CONFIG } from './tokens/llm-config.token';
import { LlmMessage } from './models';
import { of } from 'rxjs';
import { OpenAIAdapter } from './providers';

describe('LlmService', () => {
  let service: LlmService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: LLM_CONFIG,
          useValue: {
            type: 'openai',
            baseUrl: 'https://api.openai.com/v1',
            model: 'gpt-4o',
            apiKey: 'test-key'
          }
        }
      ]
    });
    service = TestBed.inject(LlmService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should create OpenAI adapter for openai type', () => {
    const config = TestBed.inject(LLM_CONFIG);
    expect(config.type).toBe('openai');
  });
});
```

**Step 2: Run test**

```bash
npm test -- llm.service.spec.ts
```
Expected: FAIL

**Step 3: Implement LlmService**

```typescript
// src/app/shared/services/llm/llm.service.ts
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
```

**Step 4: Run test**

```bash
npm test -- llm.service.spec.ts
```
Expected: PASS

**Step 5: Commit**

```bash
git add src/app/shared/services/llm/llm.service.ts src/app/shared/services/llm/llm.service.spec.ts
git commit -m "feat(llm): implement main LlmService

- Create service with adapter factory
- Support dynamic adapter selection
- Provide unified streamChat interface
- Add unit tests

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 9: Create Public API Barrel Export

**Files:**
- Create: `src/app/shared/services/llm/index.ts`

**Step 1: Create public API**

```typescript
// src/app/shared/services/llm/index.ts
export * from './llm.service';
export * from './models';
export * from './tokens/llm-config.token';
```

**Step 2: Commit**

```bash
git add src/app/shared/services/llm/index.ts
git commit -m "feat(llm): add public API barrel export

- Export service, models, and tokens
- Provide clean import path for consumers

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 10: Add Demo Configuration for Testing

**Files:**
- Modify: `src/app/app.config.ts`

**Step 1: Add provider configuration to app config**

```typescript
// Add Zhipu AI config (using provided API key for testing)
{
  provide: LLM_CONFIG,
  useValue: {
    type: 'zhipu',
    baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
    model: 'glm-4',
    apiKey: 'YOUR_ZHIPU_API_KEY_HERE'  // Replace with actual key
  }
}
```

**Step 2: Commit**

```bash
git add src/app/app.config.ts
git commit -m "feat(llm): configure Zhipu AI for testing

- Add LLM_CONFIG provider to app config
- Use Zhipu AI for initial testing
- TODO: Move to environment config

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 11: Create Simple Demo Component

**Files:**
- Create: `src/app/demo/llm-chat/llm-chat.component.ts`
- Create: `src/app/demo/llm-chat/llm-chat.component.html`
- Create: `src/app/demo/llm-chat/llm-chat.component.css`

**Step 1: Create component**

```typescript
// src/app/demo/llm-chat/llm-chat.component.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LlmService, LlmMessage } from '@app/shared/services/llm';

@Component({
  selector: 'app-llm-chat',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './llm-chat.component.html',
  styleUrls: ['./llm-chat.component.css']
})
export class LlmChatComponent {
  private llmService = inject(LlmService);

  userInput = '';
  response = '';
  isStreaming = false;

  sendMessage() {
    if (!this.userInput.trim() || this.isStreaming) {
      return;
    }

    this.isStreaming = true;
    this.response = '';

    const messages: LlmMessage[] = [
      { role: 'user', content: this.userInput }
    ];

    this.llmService.streamChat(messages).subscribe({
      next: (chunk) => {
        if (chunk.error) {
          console.error('LLM Error:', chunk.error);
          this.response = `Error: ${chunk.error.message}`;
        } else if (!chunk.done) {
          this.response += chunk.content;
        } else {
          this.isStreaming = false;
        }
      },
      error: (err) => {
        console.error('Stream error:', err);
        this.response = `Error: ${err.message}`;
        this.isStreaming = false;
      }
    });

    this.userInput = '';
  }
}
```

**Step 2: Create template**

```html
<!-- src/app/demo/llm-chat/llm-chat.component.html -->
<div class="llm-chat-container">
  <h2>LLM Chat Demo</h2>

  <div class="chat-output">
    <p [innerHTML]="response || 'Waiting for input...'"></p>
  </div>

  <div class="chat-input">
    <input
      type="text"
      [(ngModel)]="userInput"
      (keyup.enter)="sendMessage()"
      [disabled]="isStreaming"
      placeholder="Type a message..."
      class="input-field"
    />
    <button
      (click)="sendMessage()"
      [disabled]="isStreaming || !userInput.trim()"
      class="send-button"
    >
      {{ isStreaming ? 'Streaming...' : 'Send' }}
    </button>
  </div>
</div>
```

**Step 3: Create styles**

```css
/* src/app/demo/llm-chat/llm-chat.component.css */
.llm-chat-container {
  max-width: 800px;
  margin: 2rem auto;
  padding: 1.5rem;
  border-radius: var(--radius-lg);
  background: var(--card);
}

.chat-output {
  min-height: 200px;
  padding: 1rem;
  margin-bottom: 1rem;
  border-radius: var(--radius-md);
  background: var(--muted);
  white-space: pre-wrap;
}

.chat-input {
  display: flex;
  gap: var(--spacing-md);
}

.input-field {
  flex: 1;
  padding: var(--spacing-md);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--background);
  font-family: 'Figtree', sans-serif;
}

.send-button {
  padding: var(--spacing-md) var(--spacing-xl);
  border: none;
  border-radius: var(--radius-md);
  background: var(--primary);
  color: var(--primary-foreground);
  cursor: pointer;
}

.send-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

**Step 4: Add FormsModule import**

```typescript
// Add to imports in component
import { FormsModule } from '@angular/forms';

// Update imports array
imports: [CommonModule, FormsModule]
```

**Step 5: Add route**

```typescript
// src/app/app.routes.ts
{
  path: 'demo/llm-chat',
  loadComponent: () => import('./demo/llm-chat/llm-chat.component')
    .then(m => m.LlmChatComponent)
}
```

**Step 6: Commit**

```bash
git add src/app/demo/llm-chat/ src/app/app.routes.ts
git commit -m "feat(llm): add demo chat component

- Create simple chat UI component
- Implement streaming message display
- Add demo route
- Use design system CSS variables

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 12: Manual Testing

**Files:**
- No code changes

**Step 1: Start dev server**

```bash
npm start
```

**Step 2: Navigate to demo**

Open browser: `http://localhost:4200/demo/llm-chat`

**Step 3: Test streaming**

1. Type a message (e.g., "Tell me a short joke")
2. Click Send
3. Verify streaming response appears
4. Check console for errors

**Step 4: Test error handling**

1. Temporarily use invalid API key in config
2. Send message
3. Verify error message displays

**Step 5: Document test results**

Create manual test notes in `docs/llm-testing-notes.md`

**Step 6: Commit**

```bash
git add docs/llm-testing-notes.md
git commit -m "docs(llm): add manual testing notes

- Document successful streaming test
- Document error handling test
- Note any issues found

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 13: Cleanup and Documentation

**Files:**
- Create: `src/app/shared/services/llm/README.md`

**Step 1: Create service documentation**

```markdown
# LLM Service

Angular service for integrating with multiple LLM providers (OpenAI, Ollama, Zhipu AI).

## Usage

### 1. Configure Provider

Add to `app.config.ts`:

\`\`\`typescript
{
  provide: LLM_CONFIG,
  useValue: {
    type: 'zhipu',  // or 'openai' | 'ollama'
    baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
    model: 'glm-4',
    apiKey: 'your-api-key'
  }
}
\`\`\`

### 2. Inject and Use

\`\`\`typescript
constructor(private llmService: LlmService) {}

sendMessage(text: string) {
  const messages: LlmMessage[] = [
    { role: 'user', content: text }
  ];

  this.llmService.streamChat(messages).subscribe(chunk => {
    if (chunk.error) {
      // Handle error
    } else if (!chunk.done) {
      // Append chunk.content to UI
    }
  });
}
\`\`\`

## Supported Providers

- **OpenAI**: GPT-4o, GPT-4.1, etc.
- **Ollama**: Local models (Llama, Mistral, etc.)
- **Zhipu AI**: GLM-4, GLM-4-Air, etc.
```

**Step 2: Final commit**

```bash
git add src/app/shared/services/llm/README.md
git commit -m "docs(llm): add service usage documentation

- Document configuration steps
- Document streaming usage
- List supported providers
- Provide code examples

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Final Notes

### Testing Strategy
- Unit tests for each adapter with mocked HttpClient
- Integration test with real Zhipu AI API
- Manual testing via demo component

### Future Enhancements
- Multi-turn conversation history
- Retry logic with exponential backoff
- Request deduplication
- Token usage tracking
- Rate limiting

### Troubleshooting
- **CORS issues**: Use proxy server or configure provider headers
- **Streaming not working**: Check API returns `text/event-stream`
- **Auth errors**: Verify API key format and permissions
