import { Component, input, output, signal, booleanAttribute } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Session Button Component - 矿物与时光主题
 *
 * 浮动操作按钮，用于切换 AI 聊天面板。
 *
 * 特性：
 * - Liquid glass 视觉效果（可选）
 * - 展开/收起图标切换
 * - 通知徽章支持
 * - 悬停动画效果
 *
 * @example
 * ```html
 * <app-session-button
 *   [isOpen]="isOpenSignal"
 *   [hasBadge]="hasBadgeSignal"
 *   (toggle)="onToggle()"
 * />
 * ```
 */
@Component({
  selector: 'app-session-button',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './session-button.component.html',
  styleUrls: ['./session-button.component.css'],
})
export class SessionButtonComponent {
  /**
   * 面板是否打开
   */
  readonly isOpen = input<boolean>(false);

  /**
   * 是否显示通知徽章
   */
  readonly hasBadge = input<boolean>(false);

  /**
   * 启用或禁用 liquid glass 视觉效果
   *
   * @default true
   */
  readonly enableLiquidGlass = input<boolean, boolean>(true, {
    transform: booleanAttribute,
  });

  /**
   * 切换事件
   */
  readonly toggle = output<void>();

  /**
   * 内部状态：鼠标悬停
   */
  readonly isHovered = signal(false);

  /**
   * 鼠标进入处理
   */
  onMouseEnter(): void {
    this.isHovered.set(true);
  }

  /**
   * 鼠标离开处理
   */
  onMouseLeave(): void {
    this.isHovered.set(false);
  }

  /**
   * 点击处理
   */
  onClick(): void {
    this.toggle.emit();
  }
}
