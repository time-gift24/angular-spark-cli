import { Routes } from '@angular/router';

export const routes: Routes = [
  // Root path - Landing Page
  {
    path: '',
    loadComponent: () => import('./landing/landing-page.component')
      .then(m => m.LandingPageComponent)
  },
  // Demo routes with MainLayout as parent
  {
    path: 'demo',
    loadComponent: () => import('./shared/layout/main-layout.component')
      .then(m => m.MainLayoutComponent),
    children: [
      {
        path: 'button',
        loadComponent: () => import('./demo/button/demo-button-page.component')
          .then(m => m.DemoButtonPageComponent)
      },
      {
        path: 'input',
        loadComponent: () => import('./demo/input/input-demo.component')
          .then(m => m.InputDemoComponent)
      },
      {
        path: 'card',
        loadComponent: () => import('./demo/card/card-demo.component')
          .then(m => m.CardDemoComponent)
      },
      {
        path: 'badge',
        loadComponent: () => import('./demo/badge/badge-demo.component')
          .then(m => m.BadgeDemoComponent)
      },
      {
        path: 'separator',
        loadComponent: () => import('./demo/separator/separator-demo.component')
          .then(m => m.SeparatorDemoComponent)
      },
      {
        path: 'switch',
        loadComponent: () => import('./demo/switch/switch-demo.component')
          .then(m => m.SwitchDemoComponent)
      },
      {
        path: 'sheet',
        loadComponent: () => import('./demo/sheet/sheet-demo.component')
          .then(m => m.SheetDemoComponent)
      },
      {
        path: 'checkbox',
        loadComponent: () => import('./demo/checkbox/checkbox-demo.component')
          .then(m => m.CheckboxDemoComponent)
      },
      {
        path: 'alert',
        loadComponent: () => import('./demo/alert/alert-demo.component')
          .then(m => m.AlertDemoComponent)
      },
      {
        path: 'tabs',
        loadComponent: () => import('./demo/tabs/tabs-demo.component')
          .then(m => m.TabsDemoComponent)
      },
      {
        path: 'tooltip',
        loadComponent: () => import('./demo/tooltip/tooltip-demo.component')
          .then(m => m.TooltipDemoComponent)
      },
      {
        path: 'avatar',
        loadComponent: () => import('./demo/avatar/avatar-demo/avatar-demo')
          .then(m => m.AvatarDemoComponent)
      },
      {
        path: 'progress',
        loadComponent: () => import('./demo/progress/progress-demo/progress-demo')
          .then(m => m.ProgressDemoComponent)
      },
      {
        path: 'skeleton',
        loadComponent: () => import('./demo/skeleton/skeleton-demo/skeleton-demo')
          .then(m => m.SkeletonDemoComponent)
      },
      {
        path: 'table',
        loadComponent: () => import('./demo/table/table-demo/table-demo')
          .then(m => m.TableDemoComponent)
      },
      {
        path: 'slider',
        loadComponent: () => import('./demo/slider/slider-demo/slider-demo')
          .then(m => m.SliderDemoComponent)
      },
      {
        path: 'liquid-glass',
        loadComponent: () => import('./demo/liquid-glass/liquid-glass-demo.component')
          .then(m => m.LiquidGlassDemoComponent)
      }
    ]
  }
];
