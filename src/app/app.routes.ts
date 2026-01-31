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
      }
    ]
  }
];
