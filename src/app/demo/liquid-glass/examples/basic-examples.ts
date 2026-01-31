import { LiquidGlassExample } from '../types/liquid-glass-demo.types';

/**
 * 基础示例 - 展示三种折射模式
 */
export const basicExamples: readonly LiquidGlassExample[] = [
  {
    title: '标准模式 (Standard)',
    description: '经典的液态玻璃效果，清晰的边框和柔和的背景模糊。适合大多数场景。',
    theme: 'mineral-dark',
    mode: 'standard',
    displacementScale: 0,
    blurAmount: 0.15,
    saturation: 105,
    elasticity: 0.25,
    aberrationIntensity: 1.5,
    code: `<div liquidGlass lgTheme="mineral-dark" lgMode="standard">
  标准液态玻璃效果
</div>`,
  },
  {
    title: '极向模式 (Polar)',
    description: '径向的扭曲模式，产生类似极光的效果。更适合圆形或放射状设计。',
    theme: 'mineral-dark',
    mode: 'polar',
    displacementScale: 0,
    blurAmount: 0.15,
    saturation: 105,
    elasticity: 0.25,
    aberrationIntensity: 1.5,
    code: `<div liquidGlass lgTheme="mineral-dark" lgMode="polar">
  极向液态玻璃效果
</div>`,
  },
  {
    title: '启用扭曲 (With Distortion)',
    description: '添加 SVG 扭曲滤镜，产生液态折射效果。通过 lgDisplacementScale 控制强度。',
    theme: 'mineral-dark',
    mode: 'prominent',
    displacementScale: 40,
    blurAmount: 0.25,
    saturation: 115,
    elasticity: 0.3,
    aberrationIntensity: 2,
    code: `<div liquidGlass [lgDisplacementScale]="40">
  启用扭曲效果
</div>`,
  },
] as const;
