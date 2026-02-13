import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import type { AlertVariant, AlertExample } from './types/alert-demo.types';
import { alertVariants, alertWithTitle, dismissibleAlerts } from './examples/alert-examples';
import { SparkAlertComponent } from '@app/shared/ui/alert';
import { ButtonComponent } from '@app/shared/ui/button';

/**
 * Demo Alert Page Component
 *
 * 展示 Alert 组件的各种用法和样式
 */
@Component({
  selector: 'app-alert-demo',
  imports: [SparkAlertComponent, ButtonComponent],
  templateUrl: './alert-demo.component.html',
  styleUrl: './alert-demo.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    style: 'display: block; width: 100%;',
  },
})
export class AlertDemoComponent {
  // 示例配置 - 从 examples 文件导入
  readonly alertVariants = alertVariants;
  readonly alertWithTitle = alertWithTitle;
  readonly dismissibleAlerts = dismissibleAlerts;

  // Dismissed alerts tracking
  readonly dismissedAlerts = signal<Set<string>>(new Set());

  /**
   * Check if an alert has been dismissed
   */
  isDismissed(id: string): boolean {
    return this.dismissedAlerts().has(id);
  }

  /**
   * Handle alert dismiss action
   */
  onDismiss(id: string): void {
    this.dismissedAlerts.update((set) => new Set(set).add(id));
    console.log(`Alert "${id}" dismissed`);
  }

  /**
   * Reset all dismissed alerts
   */
  resetAlerts(): void {
    this.dismissedAlerts.set(new Set());
    console.log('All alerts reset');
  }

  /**
   * Track dismiss event for all alerts
   */
  onAlertDismiss(example: AlertExample): void {
    const id = example.label + '-' + example.variant;
    this.onDismiss(id);
  }
}
