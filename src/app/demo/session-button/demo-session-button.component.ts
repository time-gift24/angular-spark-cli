import { Component, signal, computed } from '@angular/core';
import { SessionButtonComponent } from '../../shared/ui/session-button/session-button.component';

/**
 * Demo Session Button Component
 *
 * 展示 Session Button 组件的各种状态和交互效果
 */
@Component({
  selector: 'app-demo-session-button',
  standalone: true,
  imports: [SessionButtonComponent],
  templateUrl: './demo-session-button.component.html',
  styleUrls: ['./demo-session-button.component.css'],
})
export class DemoSessionButtonComponent {
  /** 控制面板显示状态 */
  readonly showControls = signal<boolean>(true);

  /** 面板打开状态 */
  readonly isOpen = signal<boolean>(false);

  /** 是否显示通知徽章 */
  readonly hasBadge = signal<boolean>(true);

  /** 启用 Liquid Glass 效果 */
  readonly enableLiquidGlass = signal<boolean>(true);

  /** 切换 Liquid Glass 效果 */
  toggleLiquidGlass(): void {
    this.enableLiquidGlass.update(v => !v);
  }

  /** 切换面板状态 */
  onToggle(): void {
    this.isOpen.update(v => !v);
    console.log('[Demo] Panel toggled:', this.isOpen());
  }

  /** 切换通知徽章 */
  toggleBadge(): void {
    this.hasBadge.update(v => !v);
  }

  /** 重置状态 */
  resetState(): void {
    this.isOpen.set(false);
    this.hasBadge.set(true);
    this.enableLiquidGlass.set(true);
  }
}
