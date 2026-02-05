import { Routes } from '@angular/router';

export const routes: Routes = [
  // Root path - Landing Page
  {
    path: '',
    loadComponent: () =>
      import('./landing/landing-page.component').then((m) => m.LandingPageComponent),
  },
  // Multi-Session Chat Page
  {
    path: 'multi-session-chat',
    loadComponent: () =>
      import('./features/multi-session-chat/multi-session-chat-page.component').then(
        (m) => m.MultiSessionChatPageComponent
      ),
  },
  // Demo routes with MainLayout as parent
  {
    path: 'demo',
    loadComponent: () =>
      import('./shared/layout/main-layout.component').then((m) => m.MainLayoutComponent),
    children: [
      {
        path: 'button',
        loadComponent: () =>
          import('./demo/button/demo-button-page.component').then((m) => m.DemoButtonPageComponent),
      },
      {
        path: 'input',
        loadComponent: () =>
          import('./demo/input/input-demo.component').then((m) => m.InputDemoComponent),
      },
      {
        path: 'card',
        loadComponent: () =>
          import('./demo/card/card-demo.component').then((m) => m.CardDemoComponent),
      },
      {
        path: 'badge',
        loadComponent: () =>
          import('./demo/badge/badge-demo.component').then((m) => m.BadgeDemoComponent),
      },
      {
        path: 'separator',
        loadComponent: () =>
          import('./demo/separator/separator-demo.component').then((m) => m.SeparatorDemoComponent),
      },
      {
        path: 'switch',
        loadComponent: () =>
          import('./demo/switch/switch-demo.component').then((m) => m.SwitchDemoComponent),
      },
      {
        path: 'sheet',
        loadComponent: () =>
          import('./demo/sheet/sheet-demo.component').then((m) => m.SheetDemoComponent),
      },
      {
        path: 'checkbox',
        loadComponent: () =>
          import('./demo/checkbox/checkbox-demo.component').then((m) => m.CheckboxDemoComponent),
      },
      {
        path: 'tabs',
        loadComponent: () =>
          import('./demo/tabs/tabs-demo.component').then((m) => m.TabsDemoComponent),
      },
      {
        path: 'tooltip',
        loadComponent: () =>
          import('./demo/tooltip/tooltip-demo.component').then((m) => m.TooltipDemoComponent),
      },
      {
        path: 'avatar',
        loadComponent: () =>
          import('./demo/avatar/avatar-demo/avatar-demo').then((m) => m.AvatarDemoComponent),
      },
      {
        path: 'progress',
        loadComponent: () =>
          import('./demo/progress/progress-demo/progress-demo').then(
            (m) => m.ProgressDemoComponent,
          ),
      },
      {
        path: 'skeleton',
        loadComponent: () =>
          import('./demo/skeleton/skeleton-demo/skeleton-demo').then(
            (m) => m.SkeletonDemoComponent,
          ),
      },
      {
        path: 'table',
        loadComponent: () =>
          import('./demo/table/table-demo/table-demo').then((m) => m.TableDemoComponent),
      },
      {
        path: 'slider',
        loadComponent: () =>
          import('./demo/slider/slider-demo/slider-demo').then((m) => m.SliderDemoComponent),
      },
      {
        path: 'liquid-glass',
        loadComponent: () =>
          import('./demo/liquid-glass/liquid-glass-demo.component').then(
            (m) => m.LiquidGlassDemoComponent,
          ),
      },
      {
        path: 'context-menu',
        loadComponent: () =>
          import('./demo/context-menu/context-menu-demo.component').then(
            (m) => m.ContextMenuDemoComponent,
          ),
      },
      {
        path: 'session-tabs-bar',
        loadComponent: () =>
          import('./demo/session-tabs-bar/demo-session-tabs-bar.component').then(
            (m) => m.DemoSessionTabsBarComponent,
          ),
      },
      {
        path: 'ai-chat-messages-card',
        loadComponent: () =>
          import('./demo/ai-chat-messages-card/demo-ai-chat-messages-card.component').then(
            (m) => m.DemoAiChatMessagesCardComponent,
          ),
      },
      {
        path: 'session-tabs-and-input',
        loadComponent: () =>
          import('./demo/session-tabs-and-input/demo-session-tabs-and-input.component').then(
            (m) => m.DemoSessionTabsAndInputComponent,
          ),
      },
      {
        path: 'session-chat-container',
        loadComponent: () =>
          import('./demo/session-chat-container/demo-session-chat-container.component').then(
            (m) => m.DemoSessionChatContainerComponent,
          ),
      },
      {
        path: 'ai-chat-panel',
        loadComponent: () =>
          import('./demo/ai-chat-panel/demo-ai-chat-panel.component').then(
            (m) => m.DemoAiChatPanelComponent,
          ),
      },
      {
        path: 'streaming-markdown',
        loadComponent: () =>
          import('./demo/streaming-markdown/demo-streaming-markdown.component').then(
            (m) => m.DemoStreamingMarkdownComponent,
          ),
      },
      {
        path: 'multi-session-chat',
        loadComponent: () =>
          import('./demo/multi-session-chat/demo-multi-session-chat.component').then(
            (m) => m.DemoMultiSessionChatComponent,
          ),
      },
      {
        path: 'llm-chat',
        loadComponent: () =>
          import('./demo/llm-chat/llm-chat.component').then((m) => m.LlmChatComponent),
      },
    ],
  },
];
