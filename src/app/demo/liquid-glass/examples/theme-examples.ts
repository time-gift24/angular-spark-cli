import { LiquidGlassExample } from '../types/liquid-glass-demo.types';

/**
 * 主题示例 - 展示矿物主题的浅色和深色模式
 */
export const themeExamples: readonly LiquidGlassExample[] = [
  {
    title: '矿物深色 (Mineral Dark)',
    description: '深石青背景配合浅石绿高光，模拟夜空中山峦的深邃与玉石的光晕。',
    theme: 'mineral-dark',
    mode: 'standard',
    displacementScale: 0,
    blurAmount: 0.15,
    saturation: 105,
    elasticity: 0.25,
    aberrationIntensity: 1.5,
    code: `<div liquidGlass lgTheme="mineral-dark">
  深石青 + 浅石绿
</div>`,
  },
  {
    title: '矿物浅色 (Mineral Light)',
    description: '绢黄背景配合石绿点缀，模拟千年画卷的氧化底色与矿物颜料。',
    theme: 'mineral-light',
    mode: 'standard',
    displacementScale: 0,
    blurAmount: 0.15,
    saturation: 105,
    elasticity: 0.25,
    aberrationIntensity: 1.5,
    code: `<div liquidGlass lgTheme="mineral-light">
  绢黄 + 石绿
</div>`,
  },
] as const;
