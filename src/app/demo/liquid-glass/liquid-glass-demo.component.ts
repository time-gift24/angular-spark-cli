import { ChangeDetectionStrategy, Component } from '@angular/core';
import { LiquidGlassDirective } from '@app/shared/ui/liquid-glass';
import { basicExamples } from './examples/basic-examples';
import { themeExamples } from './examples/theme-examples';
import { animationExamples } from './examples/animation-examples';
import { shapeExamples } from './examples/shape-examples';

/**
 * Liquid Glass 指令演示页面
 *
 * 展示液态玻璃效果的多种配置和用法
 */
@Component({
  selector: 'app-liquid-glass-demo',
  imports: [LiquidGlassDirective],
  templateUrl: './liquid-glass-demo.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LiquidGlassDemoComponent {
  readonly basicExamples = basicExamples;
  readonly themeExamples = themeExamples;
  readonly animationExamples = animationExamples;
  readonly shapeExamples = shapeExamples;

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

  // Theme Examples - 多主题配色映射
  getThemeCardBackground(index: number): string {
    const gradients = [
      'linear-gradient(135deg, oklch(0.22 0.04 232), oklch(0.3 0.05 198))', // dark
      'linear-gradient(135deg, oklch(0.3 0.02 236), oklch(0.38 0.03 218))', // slate
      'linear-gradient(135deg, oklch(0.28 0.04 238), oklch(0.4 0.05 215))', // ocean
      'linear-gradient(135deg, oklch(0.3 0.05 182), oklch(0.42 0.05 168))', // jade
      'linear-gradient(135deg, oklch(0.76 0.04 92), oklch(0.86 0.03 102))', // amber
      'linear-gradient(135deg, oklch(0.88 0.02 85), oklch(0.92 0.025 95))', // light
    ];
    return gradients[index % gradients.length];
  }

  getThemeCardGlow(index: number): string {
    const glows = [
      'radial-gradient(circle at 30% 30%, oklch(0.46 0.06 195), transparent 52%)', // dark
      'radial-gradient(circle at 70% 30%, oklch(0.5 0.03 224), transparent 56%)', // slate
      'radial-gradient(circle at 60% 35%, oklch(0.56 0.05 220), transparent 56%)', // ocean
      'radial-gradient(circle at 30% 65%, oklch(0.58 0.05 176), transparent 56%)', // jade
      'radial-gradient(circle at 70% 40%, oklch(0.82 0.05 92), transparent 58%)', // amber
      'radial-gradient(circle at 50% 35%, oklch(0.65 0.04 112), transparent 58%)', // light
    ];
    return glows[index % glows.length];
  }

  // Animation Examples - 三种不同的色调
  getAnimationCardBackground(index: number): string {
    const gradients = [
      'linear-gradient(135deg, oklch(0.48 0.07 195), oklch(0.35 0.05 210))', // 慢速 - 石绿到中石青
      'linear-gradient(135deg, oklch(0.42 0.08 225), oklch(0.50 0.07 195))', // 标准 - 石青深到石绿
      'linear-gradient(135deg, oklch(0.55 0.06 195), oklch(0.60 0.05 200))', // 快速 - 石绿浅到亮石青
      'linear-gradient(135deg, oklch(0.30 0.04 220), oklch(0.42 0.05 190))', // 无动画 - 深石青到石绿
    ];
    return gradients[index % gradients.length];
  }

  getAnimationCardGlow(index: number): string {
    const glows = [
      'radial-gradient(circle at 40% 40%, oklch(0.55 0.06 210), transparent 55%)',
      'radial-gradient(circle at 60% 60%, oklch(0.50 0.07 195), transparent 55%)',
      'radial-gradient(circle at 50% 30%, oklch(0.60 0.05 200), transparent 55%)',
      'radial-gradient(circle at 35% 65%, oklch(0.45 0.05 205), transparent 58%)',
    ];
    return glows[index % glows.length];
  }

  // Shape Examples - 长方型卡片色调
  getShapeCardBackground(index: number): string {
    const gradients = [
      'linear-gradient(135deg, oklch(0.34 0.05 220), oklch(0.46 0.06 195))',
      'linear-gradient(135deg, oklch(0.40 0.06 205), oklch(0.52 0.05 190))',
      'linear-gradient(135deg, oklch(0.28 0.04 225), oklch(0.40 0.05 200))',
    ];
    return gradients[index % gradients.length];
  }

  getShapeCardGlow(index: number): string {
    const glows = [
      'radial-gradient(circle at 25% 45%, oklch(0.52 0.06 200), transparent 58%)',
      'radial-gradient(circle at 70% 35%, oklch(0.56 0.05 195), transparent 60%)',
      'radial-gradient(circle at 60% 70%, oklch(0.45 0.05 210), transparent 60%)',
    ];
    return glows[index % glows.length];
  }
}
