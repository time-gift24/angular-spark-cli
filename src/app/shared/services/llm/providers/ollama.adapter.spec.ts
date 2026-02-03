import { TestBed } from '@angular/core/testing';
import { HttpClient, HttpHandler } from '@angular/common/http';
import { OllamaAdapter } from './ollama.adapter';
import { LlmMessage } from '../models';

describe('OllamaAdapter', () => {
  let adapter: OllamaAdapter;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [HttpClient, HttpHandler]
    });

    adapter = new OllamaAdapter({
      type: 'ollama',
      baseUrl: 'http://localhost:11434',
      model: 'llama3.2'
    });
  });

  it('should be created', () => {
    expect(adapter).toBeTruthy();
  });

  it('should use correct base URL', () => {
    expect(adapter).toBeTruthy();
    expect((adapter as any).config.baseUrl).toBe('http://localhost:11434');
    expect((adapter as any).config.model).toBe('llama3.2');
  });

  it('should not require API key', () => {
    expect((adapter as any).config.apiKey).toBeUndefined();
  });
});
