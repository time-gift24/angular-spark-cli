import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'demo/button',
    loadComponent: () => import('./demo/button/demo-button-page.component')
      .then(m => m.DemoButtonPageComponent)
  }
];
