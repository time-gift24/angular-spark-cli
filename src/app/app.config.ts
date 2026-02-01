import { ApplicationConfig, provideBrowserGlobalErrorListeners, inject, provideAppInitializer } from '@angular/core';
import { provideRouter } from '@angular/router';
import { ShiniHighlighter } from './shared/components/streaming-markdown/core/shini-highlighter';

import { routes } from './app.routes';

function initShiki() {
  const shini = inject(ShiniHighlighter);
  return shini.initialize();
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    // Initialize ShiniHighlighter for code highlighting
    provideAppInitializer(initShiki)
  ]
};
