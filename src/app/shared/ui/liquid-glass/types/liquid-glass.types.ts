/**
 * Core type definitions for Liquid Glass Directive
 *
 * These types define the configuration, state, and behavior of the
 * liquid glass effect system, integrating with the "矿物与时光" design system.
 */

/**
 * Refraction mode determines the visual distortion pattern
 *
 * - `standard`: Balanced noise pattern for general use
 * - `polar`: Directional noise emphasizing vertical/horizontal distortion
 * - `prominent`: More intense, visible distortion effect
 */
export type LiquidGlassRefractionMode = 'standard' | 'polar' | 'prominent';

/**
 * Theme presets matching "矿物与时光" design system
 *
 * - `mineral-light`: Light mode - 绢黄 + 石绿 (Aged Silk + Malachite)
 * - `mineral-dark`: Dark mode - 深石青 + 浅石绿 (Deep Stone Blue + Light Stone Green)
 * - `custom`: User-defined colors
 */
export type LiquidGlassTheme = 'mineral-light' | 'mineral-dark' | 'custom';

/**
 * Animation state for the state machine
 *
 * - `idle`: No interaction, effect at rest
 * - `tracking`: Mouse moving, actively tracking cursor
 * - `resetting`: Returning to center after interaction ends
 */
export type LiquidGlassAnimationState = 'idle' | 'tracking' | 'resetting';

/**
 * Color configuration using OKLCH or CSS variables
 *
 * Supports both CSS variable references (var(--name)) and direct color values.
 * All colors should use low saturation to match the mineral aesthetic.
 */
export interface LiquidGlassColorConfig {
  /** Primary border/accent color (e.g., 'var(--accent)') */
  readonly border: string;
  /** Hotspot highlight color (RGBA) - follows cursor movement */
  readonly hotspot: string;
  /** Base tint overlay color (RGBA) - provides subtle tinting */
  readonly tint: string;
  /** Chromatic aberration color 1 (red/pink) - for dispersion effect */
  readonly aberration1: string;
  /** Chromatic aberration color 2 (blue/cyan) - for dispersion effect */
  readonly aberration2: string;
}

/**
 * Spacing configuration using design system tokens
 *
 * Uses CSS variables from the design system for consistency.
 */
export interface LiquidGlassSpacingConfig {
  /** Corner radius using CSS var (e.g., 'var(--radius-xl)') */
  readonly cornerRadius: string;
  /** Border width in pixels */
  readonly borderWidth: number;
  /** Internal padding in pixels */
  readonly padding: number;
}

/**
 * Animation configuration
 *
 * Controls the responsiveness and intensity of the interactive effects.
 */
export interface LiquidGlassAnimationConfig {
  /** Smoothing factor 0-0.6 (higher = faster response) */
  readonly elasticity: number;
  /** Maximum parallax offset in pixels */
  readonly parallaxIntensity: number;
  /** Enable/disable animations */
  readonly enabled: boolean;
}

/**
 * SVG Filter configuration
 *
 * Controls the refractive distortion effect parameters.
 */
export interface LiquidGlassFilterConfig {
  /** Displacement scale 0-140 - controls distortion intensity */
  readonly displacementScale: number;
  /** Blur amount 0-1 (maps to 0-18px) - softens the distortion */
  readonly blurAmount: number;
  /** Saturation boost 50-200% - enhances color intensity */
  readonly saturation: number;
  /** Chromatic aberration intensity 0-6px - RGB split effect */
  readonly aberrationIntensity: number;
  /** Turbulence frequency for noise pattern [x, y] */
  readonly turbulenceBaseFrequency: [number, number];
}

/**
 * Complete Liquid Glass configuration
 *
 * Combines all configuration aspects into a single interface.
 */
export interface LiquidGlassConfig {
  readonly theme: LiquidGlassTheme;
  readonly mode: LiquidGlassRefractionMode;
  readonly colors: LiquidGlassColorConfig;
  readonly spacing: LiquidGlassSpacingConfig;
  readonly animation: LiquidGlassAnimationConfig;
  readonly filter: LiquidGlassFilterConfig;
}

/**
 * Position for cursor tracking (normalized 0-1)
 *
 * Coordinates are normalized to the element bounds, where (0,0) is
 * top-left and (1,1) is bottom-right. Center is (0.5, 0.5).
 */
export interface LiquidGlassPosition {
  readonly x: number;
  readonly y: number;
}

/**
 * Accessibility configuration
 *
 * Ensures the directive is usable by all users.
 */
export interface LiquidGlassA11yConfig {
  readonly ariaLabel: string;
  readonly role: string;
  readonly respectReducedMotion: boolean;
}
