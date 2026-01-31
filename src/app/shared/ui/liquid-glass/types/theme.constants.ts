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
  border: 'var(--accent)',              // 亮泥金
  hotspot: 'rgba(255, 255, 255, 0.18)',
  tint: 'rgba(0, 0, 0, 0.12)',          // Lighter for light mode
  aberration1: 'rgba(200, 80, 120, 0.15)',
  aberration2: 'rgba(80, 140, 200, 0.12)',
};

/**
 * Mineral Dark Theme - 深石青 + 浅石绿 (Deep Stone Blue + Light Stone Green)
 *
 * Dark mode configuration with more intense tint and higher opacity
 * for better visibility on dark backgrounds.
 */
export const MINERAL_DARK_THEME: LiquidGlassColorConfig = {
  border: 'var(--accent)',              // 亮泥金
  hotspot: 'rgba(255, 255, 255, 0.22)',
  tint: 'rgba(0, 0, 0, 0.32)',          // Darker for dark mode
  aberration1: 'rgba(255, 40, 120, 0.18)',
  aberration2: 'rgba(40, 160, 255, 0.16)',
};

/**
 * Default spacing - Ultra compact design system
 *
 * Matches the project's compact sizing approach with minimal padding
 * and small corner radius for a modern, efficient look.
 */
export const COMPACT_SPACING: LiquidGlassSpacingConfig = {
  cornerRadius: 'var(--radius-xl)',     // 6px - matches design system
  borderWidth: 1,
  padding: 12,                           // var(--spacing-lg) * 1.5
};

/**
 * Subtle filter defaults - Lower intensity for mineral aesthetic
 *
 * Reduced displacement and blur for a more subtle effect that doesn't
 * distract from content while still providing visual interest.
 */
export const SUBTLE_FILTER: LiquidGlassFilterConfig = {
  displacementScale: 60,                 // Reduced from 90 for subtlety
  blurAmount: 0.35,                      // Slightly less blur
  saturation: 105,                       // Lower saturation (was 140)
  aberrationIntensity: 1.5,              // Reduced chromatic effect
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
export const REFRACTION_MODE_TURBULENCE: Record<
  LiquidGlassRefractionMode,
  [number, number]
> = {
  standard: [0.014, 0.035],
  polar: [0.010, 0.060],
  prominent: [0.020, 0.020],
};
