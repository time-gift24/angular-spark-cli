import { LiquidGlassExample } from '../types/liquid-glass-demo.types';

/**
 * 形状示例 - 展示长方型液态玻璃卡片
 */
export const shapeExamples: readonly LiquidGlassExample[] = [
  {
    title: '经典长方卡 (16px)',
    description: '紧凑圆角的横向卡片，适合工具条、信息摘要和状态面板。',
    theme: 'mineral-dark',
    mode: 'standard',
    displacementScale: 0,
    blurAmount: 0.15,
    saturation: 105,
    elasticity: 0.25,
    aberrationIntensity: 1.5,
    cornerRadius: '16px',
    code: `<div liquidGlass lgCornerRadius="16px">
  长方型液态玻璃卡片
</div>`,
  },
  {
    title: '柔和长方卡 (20px)',
    description: '更柔和的圆角与轻微折射，适合内容块和设置项分组。',
    theme: 'mineral-dark',
    mode: 'polar',
    displacementScale: 10,
    blurAmount: 0.15,
    saturation: 105,
    elasticity: 0.25,
    aberrationIntensity: 1.5,
    cornerRadius: '20px',
    code: `<div liquidGlass lgMode="polar" lgCornerRadius="20px">
  柔和长方型效果
</div>`,
  },
  {
    title: '静态长方卡 (12px)',
    description: '关闭悬浮动画，保留稳定玻璃质感，适合需要低动态干扰的展示。',
    theme: 'mineral-dark',
    mode: 'standard',
    displacementScale: 0,
    blurAmount: 0.15,
    saturation: 105,
    elasticity: 0.25,
    aberrationIntensity: 1.5,
    disableAnimation: true,
    cornerRadius: '12px',
    code: `<div liquidGlass lgCornerRadius="12px" [lgDisableAnimation]="true">
  静态长方型效果
</div>`,
  },
] as const;
