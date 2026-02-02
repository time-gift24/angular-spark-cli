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
