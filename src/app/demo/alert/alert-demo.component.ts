import { Component } from '@angular/core';
import {
  AlertComponent,
  AlertTitleComponent,
  AlertDescriptionComponent
} from '@app/shared/ui/alert';

/**
 * Alert Demo Component
 *
 * 展示 Alert 组件的各种用法和样式
 */
@Component({
  selector: 'app-alert-demo',
  standalone: true,
  imports: [AlertComponent, AlertTitleComponent, AlertDescriptionComponent],
  templateUrl: './alert-demo.component.html',
  styleUrl: './alert-demo.component.css',
  host: {
    'style': 'display: block; width: 100%;'
  }
})
export class AlertDemoComponent {}
