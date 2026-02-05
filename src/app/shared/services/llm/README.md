# LLM Service

A flexible, provider-agnostic Angular service for integrating Large Language Model (LLM) APIs with streaming support.

## Features

- **Multiple Provider Support**: OpenAI, Zhipu AI, Ollama
- **Streaming Responses**: Real-time token streaming for better UX
- **Type-Safe**: Full TypeScript support with strict typing
- **Angular Signals**: Modern reactive state management
- **Dependency Injection**: Easy configuration and testing
- **Error Handling**: Comprehensive error handling and validation
- **Extensible**: Simple adapter pattern for adding new providers

## Installation

The service is already included in this Angular application. No additional installation required.

## Quick Start

### 1. Configure the Service

Add the LLM configuration to your `app.config.ts`:

```typescript
import { ApplicationConfig } from '@angular/core';
import { LLM_CONFIG } from './shared/services/llm';

export const appConfig: ApplicationConfig = {
  providers: [
    {
      provide: LLM_CONFIG,
      useValue: {
        type: 'zhipu',  // or 'openai' or 'ollama'
        baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
        model: 'glm-4',
        apiKey: 'your-api-key-here'
      }
    }
  ]
};
```

### 2. Inject and Use

```typescript
import { Component, inject } from '@angular/core';
import { LlmService } from '@app/shared/services/llm';

@Component({
  selector: 'app-my-component',
  standalone: true
})
export class MyComponent {
  private readonly llmService = inject(LlmService);

  async sendMessage(message: string) {
    try {
      for await (const chunk of this.llmService.streamChat(message)) {
        console.log('Received:', chunk.content);
        // Update UI with streamed content
      }
    } catch (error) {
      console.error('Error:', error);
    }
  }
}
```

## Configuration

### Provider Types

#### Zhipu AI (智谱AI)

```typescript
{
  type: 'zhipu',
  baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
  model: 'glm-4',
  apiKey: 'your-zhipu-api-key'
}
```

Available models: `glm-4`, `glm-3-turbo`, etc.

#### OpenAI

```typescript
{
  type: 'openai',
  baseUrl: 'https://api.openai.com/v1',
  model: 'gpt-4',
  apiKey: 'your-openai-api-key'
}
```

Available models: `gpt-4`, `gpt-3.5-turbo`, etc.

#### Ollama (Local)

```typescript
{
  type: 'ollama',
  baseUrl: 'http://localhost:11434',
  model: 'llama2',
  apiKey: ''  // Not required for Ollama
}
```

Available models: Any model installed via Ollama (e.g., `llama2`, `mistral`, etc.)

## API Reference

### LlmService

The main service for interacting with LLM providers.

#### Methods

##### `streamChat(userMessage: string, systemPrompt?: string): AsyncIterableIterator<LlmResponseChunk>`

Streams chat responses from the LLM provider.

**Parameters:**
- `userMessage`: The user's message content
- `systemPrompt`: Optional system prompt to guide the AI's behavior

**Returns:** Async iterable iterator yielding response chunks

**Example:**

```typescript
for await (const chunk of this.llmService.streamChat('Hello!')) {
  if (chunk.content) {
    this.responseText += chunk.content;
  }
}
```

### Types

#### LlmConfig

Configuration for the LLM service.

```typescript
interface LlmConfig {
  type: 'openai' | 'zhipu' | 'ollama';
  baseUrl: string;
  model: string;
  apiKey: string;
}
```

#### LlmMessage

Represents a message in the conversation.

```typescript
interface LlmMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}
```

#### LlmResponseChunk

Represents a chunk of the streaming response.

```typescript
interface LlmResponseChunk {
  content: string;
  done: boolean;
}
```

## Usage Examples

### Basic Chat

```typescript
import { Component, inject, signal } from '@angular/core';
import { LlmService } from '@app/shared/services/llm';

@Component({
  selector: 'app-chat',
  standalone: true,
  template: `
    <textarea [(ngModel)]="userInput"></textarea>
    <button (click)="send()">Send</button>
    <div>{{ response() }}</div>
  `
})
export class ChatComponent {
  private readonly llmService = inject(LlmService);
  readonly response = signal('');
  readonly userInput = signal('');

  async send() {
    const message = this.userInput();
    this.response.set('');

    for await (const chunk of this.llmService.streamChat(message)) {
      this.response.update(r => r + chunk.content);
    }
  }
}
```

### With Custom System Prompt

```typescript
async sendWithSystemPrompt() {
  const systemPrompt = 'You are a helpful assistant specializing in Angular development.';
  const userMessage = 'How do I use Angular Signals?';

  for await (const chunk of this.llmService.streamChat(userMessage, systemPrompt)) {
    console.log(chunk.content);
  }
}
```

### With Error Handling

```typescript
async sendWithErrorHandling() {
  try {
    for await (const chunk of this.llmService.streamChat('Hello')) {
      if (chunk.content) {
        this.updateUI(chunk.content);
      }
    }
  } catch (error) {
    if (error instanceof Error) {
      this.showError(error.message);
    } else {
      this.showError('Unknown error occurred');
    }
  }
}
```

### In a Service

```typescript
import { inject, Injectable } from '@angular/core';
import { LlmService } from '@app/shared/services/llm';

@Injectable({ providedIn: 'root' })
export class ChatbotService {
  private readonly llmService = inject(LlmService);

  async getResponse(message: string): Promise<string> {
    let fullResponse = '';

    for await (const chunk of this.llmService.streamChat(message)) {
      fullResponse += chunk.content;
    }

    return fullResponse;
  }
}
```

## Testing

### Mock Configuration

For testing, you can provide a mock configuration:

```typescript
TestBed.configureTestingModule({
  providers: [
    {
      provide: LLM_CONFIG,
      useValue: {
        type: 'openai',
        baseUrl: 'https://api.openai.com/v1',
        model: 'gpt-4',
        apiKey: 'test-api-key'
      }
    }
  ]
});
```

### Unit Test Example

```typescript
import { TestBed } from '@angular/core/testing';
import { LlmService } from './llm.service';
import { LLM_CONFIG } from './tokens/llm-config.token';

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
            model: 'gpt-4',
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
});
```

## Architecture

### Adapter Pattern

The service uses an adapter pattern to support multiple LLM providers:

```
LlmService (Interface)
    ├── OpenAIAdapter
    ├── ZhipuAdapter
    └── OllamaAdapter
```

Each adapter implements the `LlmProviderAdapter` interface, making it easy to add new providers.

### Adding a New Provider

1. Create a new adapter in `providers/`:

```typescript
// providers/custom.adapter.ts
export class CustomAdapter implements LlmProviderAdapter {
  constructor(private readonly config: LlmConfig) {}

  async *streamChat(
    messages: LlmMessage[],
    signal: AbortSignal
  ): AsyncIterableIterator<LlmResponseChunk> {
    // Implementation
  }
}
```

2. Register it in `llm.service.ts`:

```typescript
private createAdapter(): LlmProviderAdapter {
  switch (this.config.type) {
    case 'custom':
      return new CustomAdapter(this.config);
    // ...
  }
}
```

## Error Handling

The service throws errors for:

- Missing or invalid configuration
- Network failures
- API authentication errors
- Rate limiting
- Invalid responses

Always wrap service calls in try-catch blocks:

```typescript
try {
  for await (const chunk of this.llmService.streamChat(message)) {
    // Handle chunk
  }
} catch (error) {
  // Handle error
}
```

## Best Practices

1. **API Key Security**: Never commit API keys to version control. Use environment variables or secure configuration management.

2. **Error Handling**: Always implement proper error handling and user feedback.

3. **Rate Limiting**: Be aware of your provider's rate limits and implement retry logic if needed.

4. **Streaming**: Use streaming for better UX, especially for longer responses.

5. **System Prompts**: Use system prompts to guide the AI's behavior for your use case.

6. **Conversation History**: Implement conversation history management for context-aware conversations.

7. **Abort Controllers**: The service supports abort signals for cancelling requests (future feature).

## Demo

A demo component is available at `/demo/llm-chat` to test the service integration.

See `docs/llm-testing-notes.md` for detailed testing instructions.

## Additional Resources

- [Testing Notes](../../../../docs/llm-testing-notes.md)
- [OpenAI API Documentation](https://platform.openai.com/docs/api-reference)
- [Zhipu AI Documentation](https://open.bigmodel.cn/dev/api)
- [Ollama Documentation](https://github.com/ollama/ollama)

## License

This service is part of the Angular Spark CLI project.
