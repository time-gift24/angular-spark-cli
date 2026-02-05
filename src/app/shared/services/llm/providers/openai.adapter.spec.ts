import { TestBed } from '@angular/core/testing';
import { HttpClient, HttpHandler } from '@angular/common/http';
import { OpenAIAdapter } from './openai.adapter';
import { LlmMessage } from '../models';

describe('OpenAIAdapter', () => {
  let adapter: OpenAIAdapter;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [HttpClient, HttpHandler]
    });

    adapter = new OpenAIAdapter({
      type: 'openai',
      baseUrl: 'https://api.openai.com/v1',
      model: 'gpt-4o',
      apiKey: 'test-key'
    });
  });

  it('should be created', () => {
    expect(adapter).toBeTruthy();
  });

  it('should use correct base URL and API key', () => {
    expect(adapter).toBeTruthy();
    expect((adapter as any).config.baseUrl).toBe('https://api.openai.com/v1');
    expect((adapter as any).config.model).toBe('gpt-4o');
    expect((adapter as any).config.apiKey).toBe('test-key');
  });
});
