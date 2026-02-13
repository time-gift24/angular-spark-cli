import {
  LiquidGlassColorConfig,
  LiquidGlassFilterConfig,
  LiquidGlassRefractionMode,
  LiquidGlassSpacingConfig,
} from './liquid-glass.types';

/**
 * Mineral Light Theme - 绢黄 + 石绿 (Aged Silk + Malachite)
 *
 * Light mode configuration with softer tint and lower opacity overlays
 * to maintain readability on bright backgrounds.
 */
export const MINERAL_LIGHT_THEME: LiquidGlassColorConfig = {
  border: 'var(--accent)', // 亮泥金
  hotspot: 'color-mix(in oklch, var(--card) 18%, transparent)',
  tint: 'color-mix(in oklch, var(--foreground) 12%, transparent)', // Lighter for light mode
  aberration1: 'color-mix(in oklch, var(--accent) 15%, transparent)',
  aberration2: 'color-mix(in oklch, var(--primary) 12%, transparent)',
};

/**
 * Mineral Dark Theme - 深石青 + 浅石绿 (Deep Stone Blue + Light Stone Green)
 *
 * Dark mode configuration with more intense tint and higher opacity
 * for better visibility on dark backgrounds.
 */
export const MINERAL_DARK_THEME: LiquidGlassColorConfig = {
  border: 'var(--accent)', // 亮泥金
  hotspot: 'color-mix(in oklch, var(--card) 22%, transparent)',
  tint: 'color-mix(in oklch, var(--foreground) 32%, transparent)', // Darker for dark mode
  aberration1: 'color-mix(in oklch, var(--accent) 18%, transparent)',
  aberration2: 'color-mix(in oklch, var(--primary) 16%, transparent)',
};

/**
 * Mineral Jade Theme - 翡翠绿 + 青玉光
 *
 * Balanced cool green palette for cleaner mid-contrast surfaces.
 */
export const MINERAL_JADE_THEME: LiquidGlassColorConfig = {
  border: 'oklch(0.74 0.07 172)',
  hotspot: 'color-mix(in oklch, oklch(0.86 0.05 168) 24%, transparent)',
  tint: 'color-mix(in oklch, oklch(0.58 0.05 178) 28%, transparent)',
  aberration1: 'color-mix(in oklch, oklch(0.72 0.07 170) 18%, transparent)',
  aberration2: 'color-mix(in oklch, oklch(0.66 0.06 208) 16%, transparent)',
};

/**
 * Mineral Ocean Theme - 深海蓝 + 冰蓝高光
 *
 * Cooler blue palette with restrained saturation for dashboard cards.
 */
export const MINERAL_OCEAN_THEME: LiquidGlassColorConfig = {
  border: 'oklch(0.72 0.06 228)',
  hotspot: 'color-mix(in oklch, oklch(0.88 0.04 220) 24%, transparent)',
  tint: 'color-mix(in oklch, oklch(0.54 0.05 230) 30%, transparent)',
  aberration1: 'color-mix(in oklch, oklch(0.70 0.06 214) 18%, transparent)',
  aberration2: 'color-mix(in oklch, oklch(0.64 0.06 250) 16%, transparent)',
};

/**
 * Mineral Amber Theme - 琥珀金 + 暖绢黄
 *
 * Warm light palette for content blocks that need softer emphasis.
 */
export const MINERAL_AMBER_THEME: LiquidGlassColorConfig = {
  border: 'oklch(0.8 0.08 84)',
  hotspot: 'color-mix(in oklch, oklch(0.93 0.03 96) 28%, transparent)',
  tint: 'color-mix(in oklch, oklch(0.7 0.04 90) 24%, transparent)',
  aberration1: 'color-mix(in oklch, oklch(0.78 0.07 78) 16%, transparent)',
  aberration2: 'color-mix(in oklch, oklch(0.72 0.05 128) 15%, transparent)',
};

/**
 * Mineral Slate Theme - 石板灰 + 冷青高光
 *
 * Neutral cool palette for subdued, low-distraction glass surfaces.
 */
export const MINERAL_SLATE_THEME: LiquidGlassColorConfig = {
  border: 'oklch(0.69 0.03 232)',
  hotspot: 'color-mix(in oklch, oklch(0.82 0.02 228) 22%, transparent)',
  tint: 'color-mix(in oklch, oklch(0.48 0.03 235) 32%, transparent)',
  aberration1: 'color-mix(in oklch, oklch(0.64 0.03 246) 16%, transparent)',
  aberration2: 'color-mix(in oklch, oklch(0.6 0.04 206) 14%, transparent)',
};

/**
 * Default spacing - Ultra compact design system
 *
 * Matches the project's compact sizing approach with minimal padding
 * and small corner radius for a modern, efficient look.
 */
export const COMPACT_SPACING: LiquidGlassSpacingConfig = {
  cornerRadius: 'var(--radius-xl)', // 6px - matches design system
  borderWidth: 1,
  padding: 12, // var(--spacing-lg) * 1.5
};

/**
 * Subtle filter defaults - Lower intensity for mineral aesthetic
 *
 * Reduced displacement and blur for a more subtle effect that doesn't
 * distract from content while still providing visual interest.
 */
export const SUBTLE_FILTER: LiquidGlassFilterConfig = {
  displacementScale: 60, // Reduced from 90 for subtlety
  blurAmount: 0.35, // Slightly less blur
  saturation: 105, // Lower saturation (was 140)
  aberrationIntensity: 1.5, // Reduced chromatic effect
  turbulenceBaseFrequency: [0.014, 0.035],
};

/**
 * Refraction mode turbulence presets
 *
 * Different noise frequency patterns for each refraction mode:
 * - `standard`: Balanced noise for general use
 * - `polar`: Higher Y frequency for directional distortion
 * - `prominent`: Higher X/Y frequencies for more visible effect
 * - `shader`: Fallback frequency used by turbulence-based builders
 */
export const REFRACTION_MODE_TURBULENCE: Record<LiquidGlassRefractionMode, [number, number]> = {
  standard: [0.014, 0.035],
  polar: [0.01, 0.06],
  prominent: [0.02, 0.02],
  shader: [0.014, 0.035],
};
