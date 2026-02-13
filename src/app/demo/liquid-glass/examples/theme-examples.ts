import { LiquidGlassExample } from '../types/liquid-glass-demo.types';

/**
 * 主题示例 - 展示更多矿物主题变体
 */
export const themeExamples: readonly LiquidGlassExample[] = [
  {
    title: '矿物深色 (Mineral Dark)',
    description: '深石青基底与浅石绿高光，适合夜间界面和高对比内容。',
    theme: 'mineral-dark',
    mode: 'standard',
    displacementScale: 8,
    blurAmount: 0.15,
    saturation: 108,
    elasticity: 0.25,
    aberrationIntensity: 1.5,
    code: `<div liquidGlass lgTheme="mineral-dark">
  深石青 + 浅石绿
</div>`,
  },
  {
    title: '石板灰 (Mineral Slate)',
    description: '偏中性的冷灰色玻璃，降低视觉噪音，适合信息密集型布局。',
    theme: 'mineral-slate',
    mode: 'standard',
    displacementScale: 10,
    blurAmount: 0.16,
    saturation: 102,
    elasticity: 0.22,
    aberrationIntensity: 1.2,
    code: `<div liquidGlass lgTheme="mineral-slate">
  石板灰 + 冷青高光
</div>`,
  },
  {
    title: '海蓝 (Mineral Ocean)',
    description: '海蓝主色和冰蓝高光，层次清晰，适合强调交互区域。',
    theme: 'mineral-ocean',
    mode: 'polar',
    displacementScale: 12,
    blurAmount: 0.16,
    saturation: 110,
    elasticity: 0.25,
    aberrationIntensity: 1.6,
    code: `<div liquidGlass lgTheme="mineral-ocean" lgMode="polar">
  海蓝 + 冰蓝高光
</div>`,
  },
  {
    title: '翡翠 (Mineral Jade)',
    description: '翡翠绿与青玉高光的冷暖平衡，适合内容卡片与控制面板。',
    theme: 'mineral-jade',
    mode: 'standard',
    displacementScale: 10,
    blurAmount: 0.15,
    saturation: 108,
    elasticity: 0.24,
    aberrationIntensity: 1.4,
    code: `<div liquidGlass lgTheme="mineral-jade">
  翡翠绿 + 青玉光
</div>`,
  },
  {
    title: '琥珀 (Mineral Amber)',
    description: '暖琥珀与绢黄叠层，适合浅背景中的重点信息块。',
    theme: 'mineral-amber',
    mode: 'prominent',
    displacementScale: 6,
    blurAmount: 0.14,
    saturation: 104,
    elasticity: 0.22,
    aberrationIntensity: 1.1,
    code: `<div liquidGlass lgTheme="mineral-amber" lgMode="prominent">
  琥珀金 + 暖绢黄
</div>`,
  },
  {
    title: '矿物浅色 (Mineral Light)',
    description: '明亮绢黄底与低饱和石绿点缀，适合阅读型和文档型界面。',
    theme: 'mineral-light',
    mode: 'standard',
    displacementScale: 6,
    blurAmount: 0.15,
    saturation: 102,
    elasticity: 0.22,
    aberrationIntensity: 1.1,
    code: `<div liquidGlass lgTheme="mineral-light">
  绢黄 + 石绿
</div>`,
  },
] as const;
