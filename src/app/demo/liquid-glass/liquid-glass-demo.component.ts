import { Component } from '@angular/core';
import { LiquidGlassDirective } from '@app/shared/ui/liquid-glass';
import { basicExamples } from './examples/basic-examples';
import { themeExamples } from './examples/theme-examples';
import { animationExamples } from './examples/animation-examples';

/**
 * Liquid Glass 指令演示页面
 *
 * 展示液态玻璃效果的多种配置和用法
 */
@Component({
  selector: 'app-liquid-glass-demo',
  standalone: true,
  imports: [LiquidGlassDirective],
  templateUrl: './liquid-glass-demo.component.html',
})
export class LiquidGlassDemoComponent {
  readonly basicExamples = basicExamples;
  readonly themeExamples = themeExamples;
  readonly animationExamples = animationExamples;

  // Basic Examples - 三种不同的矿物色渐变
  getCardBackground(index: number): string {
    const gradients = [
      'linear-gradient(135deg, oklch(0.48 0.07 195), oklch(0.42 0.08 225))', // 石绿到石青深
      'linear-gradient(135deg, oklch(0.42 0.08 225), oklch(0.55 0.06 195))', // 石青深到石绿浅
      'linear-gradient(135deg, oklch(0.55 0.06 195), oklch(0.60 0.05 210))', // 石绿浅到石青浅
    ];
    return gradients[index % gradients.length];
  }

  getCardGlow(index: number): string {
    const glows = [
      'radial-gradient(circle at 30% 30%, oklch(0.55 0.07 195), transparent 60%)',
      'radial-gradient(circle at 70% 70%, oklch(0.50 0.08 225), transparent 60%)',
      'radial-gradient(circle at 50% 50%, oklch(0.60 0.06 195), transparent 60%)',
    ];
    return glows[index % glows.length];
  }

  // Theme Examples - 深色和浅色主题
  getThemeCardBackground(index: number): string {
    const gradients = [
      'linear-gradient(135deg, oklch(0.20 0.04 230), oklch(0.28 0.05 200))', // 深石青到石绿（深色主题）
      'linear-gradient(135deg, oklch(0.88 0.02 85), oklch(0.92 0.025 95))', // 绢黄到浅绢黄（浅色主题）
    ];
    return gradients[index % gradients.length];
  }

  getThemeCardGlow(index: number): string {
    const glows = [
      'radial-gradient(circle at 30% 30%, oklch(0.45 0.07 195), transparent 50%)', // 深色主题光晕
      'radial-gradient(circle at 70% 30%, oklch(0.50 0.08 195), transparent 50%)', // 浅色主题光晕
    ];
    return glows[index % glows.length];
  }

  // Animation Examples - 三种不同的色调
  getAnimationCardBackground(index: number): string {
    const gradients = [
      'linear-gradient(135deg, oklch(0.48 0.07 195), oklch(0.35 0.05 210))', // 慢速 - 石绿到中石青
      'linear-gradient(135deg, oklch(0.42 0.08 225), oklch(0.50 0.07 195))', // 标准 - 石青深到石绿
      'linear-gradient(135deg, oklch(0.55 0.06 195), oklch(0.60 0.05 200))', // 快速 - 石绿浅到亮石青
    ];
    return gradients[index % gradients.length];
  }

  getAnimationCardGlow(index: number): string {
    const glows = [
      'radial-gradient(circle at 40% 40%, oklch(0.55 0.06 210), transparent 55%)',
      'radial-gradient(circle at 60% 60%, oklch(0.50 0.07 195), transparent 55%)',
      'radial-gradient(circle at 50% 30%, oklch(0.60 0.05 200), transparent 55%)',
    ];
    return glows[index % glows.length];
  }
}
