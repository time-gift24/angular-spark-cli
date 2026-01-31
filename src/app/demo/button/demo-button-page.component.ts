import { Component, signal, computed } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ButtonComponent } from '@app/shared/ui/button';
import { buttonVariants, buttonSizes, buttonStates, buttonWithIcons, iconPaths } from './examples/button-examples';
import type { ButtonClickStats } from './types/button-demo.types';

/**
 * Demo Button Page Component
 *
 * 展示 Button 组件的各种用法和样式
 */
@Component({
  selector: 'app-demo-button-page',
  standalone: true,
  imports: [ButtonComponent, DatePipe],
  templateUrl: './demo-button-page.component.html',
  styleUrl: './demo-button-page.component.css',
  host: {
    'style': 'display: block; width: 100%;'
  }
})
export class DemoButtonPageComponent {
  // 示例配置 - 从 examples 文件导入
  readonly buttonVariants = buttonVariants;
  readonly buttonSizes = buttonSizes;
  readonly buttonStates = buttonStates;
  readonly buttonWithIcons = buttonWithIcons;
  readonly iconPaths = iconPaths;

  // 点击统计
  private readonly stats = signal<ButtonClickStats>({
    count: 0,
    lastClickTime: null
  });

  /**
   * 获取点击次数
   */
  readonly clickCount = computed(() => this.stats().count);

  /**
   * 获取最后点击时间
   */
  readonly lastClickTime = computed(() => this.stats().lastClickTime);

  /**
   * 处理按钮点击事件
   */
  handleClick(): void {
    this.stats.update(current => ({
      count: current.count + 1,
      lastClickTime: new Date()
    }));
    console.log(`Button clicked! Total clicks: ${this.stats().count}`);
  }

  /**
   * 重置点击计数器
   */
  resetCount(): void {
    this.stats.set({ count: 0, lastClickTime: null });
    console.log('Counter reset!');
  }
}
