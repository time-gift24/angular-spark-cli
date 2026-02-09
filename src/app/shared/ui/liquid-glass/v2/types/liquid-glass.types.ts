/**
 * Liquid Glass Types
 * Ported from liquid-glass-react
 */

export type Vec2 = { x: number; y: number };

export type LiquidGlassMode = 'standard' | 'polar' | 'prominent' | 'shader';

export interface LiquidGlassConfig {
  displacementScale: number;
  blurAmount: number;
  saturation: number;
  aberrationIntensity: number;
  elasticity: number;
  cornerRadius: number;
  overLight: boolean;
  mode: LiquidGlassMode;
  padding: string;
}

export interface MousePosition {
  x: number;
  y: number;
}

export interface GlassSize {
  width: number;
  height: number;
}
