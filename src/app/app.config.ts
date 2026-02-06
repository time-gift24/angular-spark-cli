import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { LLM_CONFIG } from './shared/services/llm';
import { provideStreamingMarkdown } from './shared/components/streaming-markdown/core/provide-streaming-markdown';
import { builtinPlugin } from './shared/components/streaming-markdown/plugins/builtin-plugin';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideStreamingMarkdown(builtinPlugin()),
    {
      provide: LLM_CONFIG,
      useValue: {
        type: 'zhipu',
        baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
        model: 'glm-4',
        apiKey: 'YOUR_ZHIPU_API_KEY_HERE',
      },
    },
  ],
};
