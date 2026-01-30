import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'button-demo',
    loadComponent: () => import('./demo-button-page/demo-button-page.component')
      .then(m => m.DemoButtonPageComponent)
  }
];
