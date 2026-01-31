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
   * 获取图标 SVG 内容
   */
  getIconSvg(iconName: string): string {
    const icons: Record<string, string> = {
      info: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor">
        <path fill-rule="evenodd" d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zm.75 3.75a.75.75 0 00-1.5 0v4.5a.75.75 0 001.5 0v-4.5zm-.75 6a.75.75 0 100-1.5.75.75 0 000 1.5z" clip-rule="evenodd"/>
      </svg>`,
      success: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor">
        <circle cx="8" cy="8" r="8" fill="currentColor" opacity="0.2"/>
        <path d="M10.97 4.97a.75.75 0 011.07 1.05l-3.992 4.99a.75.75 0 01-1.08.02L4.324 8.384a.75.75 0 111.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 01.02-.022z"/>
      </svg>`,
      warning: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor">
        <path fill-rule="evenodd" d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zm.75 3.75a.75.75 0 00-1.5 0v4.5a.75.75 0 001.5 0v-4.5zm-.75 6a.75.75 0 100-1.5.75.75 0 000 1.5z" clip-rule="evenodd"/>
      </svg>`,
      error: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor">
        <circle cx="8" cy="8" r="8" fill="currentColor" opacity="0.2"/>
        <path d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zm.75 3.75a.75.75 0 00-1.5 0v4.5a.75.75 0 001.5 0v-4.5zm-.75 6a.75.75 0 100-1.5.75.75 0 000 1.5z"/>
      </svg>`
    };
    return icons[iconName] || '';
  }

  /**
   * 检查是否显示图标
   */
  shouldShowIcon(icon?: string): boolean {
    return !!(icon && icon !== 'none');
  }

  /**
   * 格式化描述文本（处理换行和列表）
   */
  formatDescription(text: string): string {
    return text;
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
