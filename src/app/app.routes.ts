import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'demo/button',
    loadComponent: () => import('./demo/button/demo-button-page.component')
      .then(m => m.DemoButtonPageComponent)
  },
  {
    path: 'demo/input',
    loadComponent: () => import('./demo/input/input-demo.component')
      .then(m => m.InputDemoComponent)
  },
  {
    path: 'demo/card',
    loadComponent: () => import('./demo/card/card-demo.component')
      .then(m => m.CardDemoComponent)
  },
  {
    path: 'demo/badge',
    loadComponent: () => import('./demo/badge/badge-demo.component')
      .then(m => m.BadgeDemoComponent)
  },
  {
    path: 'demo/separator',
    loadComponent: () => import('./demo/separator/separator-demo.component')
      .then(m => m.SeparatorDemoComponent)
  },
  {
    path: 'demo/switch',
    loadComponent: () => import('./demo/switch/switch-demo.component')
      .then(m => m.SwitchDemoComponent)
  },
  {
    path: 'demo/sheet',
    loadComponent: () => import('./demo/sheet/sheet-demo.component')
      .then(m => m.SheetDemoComponent)
  }
];
