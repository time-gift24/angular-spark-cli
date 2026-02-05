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

  it('should have streamChat method', () => {
    expect(service.streamChat).toBeTruthy();
  });
});
