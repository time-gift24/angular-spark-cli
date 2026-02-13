import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { LLM_CONFIG } from './shared/services/llm';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
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
