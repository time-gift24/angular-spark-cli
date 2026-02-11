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
 */
export const REFRACTION_MODE_TURBULENCE: Record<LiquidGlassRefractionMode, [number, number]> = {
  standard: [0.014, 0.035],
  polar: [0.01, 0.06],
  prominent: [0.02, 0.02],
};
