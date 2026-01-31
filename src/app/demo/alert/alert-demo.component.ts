import { Component } from '@angular/core';
import {
  AlertComponent,
  AlertTitleComponent,
  AlertDescriptionComponent
} from '@app/shared/ui/alert';
import { basicAlerts, iconAlerts, useCaseAlerts, simpleAlerts } from './examples/alert-examples';
import type { AlertTemplate, AlertUseCase } from './types/alert-demo.types';

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
export class AlertDemoComponent {
  // 示例配置
  readonly basicAlerts = basicAlerts;
  readonly iconAlerts = iconAlerts;
  readonly useCaseAlerts = useCaseAlerts;
  readonly simpleAlerts = simpleAlerts;

  /**
   * 检查是否显示图标
   */
  shouldShowIcon(icon?: string): boolean {
    return !!(icon && icon !== 'none');
  }

  /**
   * 检查是否有标题
   */
  hasTitle(alert: AlertTemplate): boolean {
    return !!(alert.title && alert.title.trim().length > 0);
  }

  /**
   * 检查是否有描述
   */
  hasDescription(alert: AlertTemplate): boolean {
    return !!(alert.description && alert.description.trim().length > 0);
  }
}
