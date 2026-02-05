import { TestBed } from '@angular/core/testing';
import { HttpClient, HttpHandler } from '@angular/common/http';
import { ZhipuAdapter } from './zhipu.adapter';
import { LlmMessage } from '../models';

describe('ZhipuAdapter', () => {
  let adapter: ZhipuAdapter;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [HttpClient, HttpHandler]
    });

    adapter = new ZhipuAdapter({
      type: 'zhipu',
      baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
      model: 'glm-4',
      apiKey: 'zhipu-test-key'
    });
  });

  it('should be created', () => {
    expect(adapter).toBeTruthy();
  });

  it('should use correct base URL', () => {
    expect((adapter as any).config.baseUrl).toBe('https://open.bigmodel.cn/api/paas/v4');
  });

  it('should use glm-4 model', () => {
    expect((adapter as any).config.model).toBe('glm-4');
  });

  it('should use correct API key', () => {
    expect((adapter as any).config.apiKey).toBe('zhipu-test-key');
  });
});
