import { LiquidGlassExample } from '../types/liquid-glass-demo.types';

/**
 * 动画示例 - 展示不同的弹性系数和动画配置
 */
export const animationExamples: readonly LiquidGlassExample[] = [
  {
    title: '慢速弹性 (Slow)',
    description: '低弹性系数 (0.15)，动画缓慢平滑，适合需要更柔和效果的场景。',
    theme: 'mineral-dark',
    mode: 'standard',
    displacementScale: 0,
    blurAmount: 0.15,
    saturation: 105,
    elasticity: 0.15,
    aberrationIntensity: 1.5,
    code: `<div liquidGlass [lgElasticity]="0.15">
  慢速弹性动画
</div>`,
  },
  {
    title: '标准弹性 (Default)',
    description: '默认弹性系数 (0.25)，平衡的响应速度和平滑度。',
    theme: 'mineral-dark',
    mode: 'standard',
    displacementScale: 0,
    blurAmount: 0.15,
    saturation: 105,
    elasticity: 0.25,
    aberrationIntensity: 1.5,
    code: `<div liquidGlass [lgElasticity]="0.25">
  标准弹性动画
</div>`,
  },
  {
    title: '快速响应 (Fast)',
    description: '高弹性系数 (0.4)，快速响应用户交互，适合需要即时反馈的场景。',
    theme: 'mineral-dark',
    mode: 'standard',
    displacementScale: 0,
    blurAmount: 0.15,
    saturation: 105,
    elasticity: 0.4,
    aberrationIntensity: 1.5,
    code: `<div liquidGlass [lgElasticity]="0.4">
  快速弹性动画
</div>`,
  },
  {
    title: '悬浮无动画 (No Motion)',
    description: '禁用位移和跟随动画，保留静态玻璃质感，适合希望减少动态干扰的场景。',
    theme: 'mineral-dark',
    mode: 'standard',
    displacementScale: 0,
    blurAmount: 0.15,
    saturation: 105,
    elasticity: 0.25,
    aberrationIntensity: 1.5,
    disableAnimation: true,
    code: `<div liquidGlass [lgDisableAnimation]="true">
  悬浮无动画效果
</div>`,
  },
] as const;
