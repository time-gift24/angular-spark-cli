/**
 * Liquid Glass Directive - Color Utilities
 *
 * Utility functions for resolving CSS variables, detecting OKLCH colors,
 * and building gradient strings for the glass effect.
 *
 * Part of Phase 2: Theme Integration Layer
 */

import {
  LiquidGlassColorConfig,
  LiquidGlassPosition,
} from '@app/shared/ui/liquid-glass/types/liquid-glass.types';

/**
 * Resolve CSS variable to actual color value
 *
 * Handles both CSS variable references (e.g., 'var(--accent)') and direct
 * color values (e.g., 'rgba(255, 255, 255, 0.5)', 'oklch(...)').
 *
 * @param color - Color string or CSS variable reference
 * @param element - HTMLElement to compute styles from
 * @returns Resolved color value, or original if not a CSS variable
 *
 * @example
 * ```ts
 * const color = 'var(--accent)';
 * const resolved = resolveColorValue(color, element);
 * // Returns: 'oklch(0.75 0.14 75)' or similar
 * ```
 */
export function resolveColorValue(color: string, element: HTMLElement): string {
  if (color.startsWith('var(')) {
    // Extract variable name: var(--name) -> --name
    const varName = color.match(/var\(([^)]+)\)/)?.[1];
    if (!varName) {
      return color;
    }

    // Get computed value from element's styles
    const computed = getComputedStyle(element).getPropertyValue(varName);
    return computed.trim() || color;
  }
  return color;
}

/**
 * Check if color uses OKLCH format
 *
 * OKLCH is the perceptual color space used in the "矿物与时光" design system.
 *
 * @param color - Color string to check
 * @returns true if color contains OKLCH format
 *
 * @example
 * ```ts
 * isOKLCHColor('oklch(0.48 0.07 195)'); // true
 * isOKLCHColor('#ffffff'); // false
 * isOKLCHColor('rgba(255, 255, 255, 0.5)'); // false
 * ```
 */
export function isOKLCHColor(color: string): boolean {
  return color.includes('oklch(');
}

/**
 * Build CSS gradient string from color config and cursor position
 *
 * Creates a layered gradient effect for the liquid glass appearance:
 * 1. Radial hotspot gradient following cursor position
 * 2. Linear gradient for top highlight
 * 3. Base tint overlay
 *
 * @param position - Normalized cursor position (0-1)
 * @param colors - Color configuration
 * @returns CSS gradient string for background property
 *
 * @example
 * ```ts
 * const gradient = buildGlassGradient(
 *   { x: 0.5, y: 0.5 },
 *   { hotspot: 'rgba(255, 255, 255, 0.22)', tint: 'rgba(0, 0, 0, 0.32)' }
 * );
 * // Returns: 'radial-gradient(...), linear-gradient(...), rgba(0, 0, 0, 0.32)'
 * ```
 */
export function buildGlassGradient(
  position: LiquidGlassPosition,
  colors: LiquidGlassColorConfig,
): string {
  // Convert normalized position to percentages
  const xPct = (position.x * 100).toFixed(2);
  const yPct = (position.y * 100).toFixed(2);

  // Extract hotspot base color for gradient stops
  const hotspotColor = colors.hotspot;
  const hotspotFade = hotspotColor.replace(/[\d.]+\)$/, '0.08)');

  return `
    radial-gradient(
      140px 140px at ${xPct}% ${yPct}%,
      ${hotspotColor},
      ${hotspotFade} 35%,
      rgba(255,255,255,0) 70%
    ),
    linear-gradient(180deg, rgba(255,255,255,0.12), rgba(255,255,255,0) 65%),
    ${colors.tint}
  `
    .replace(/\s+/g, ' ') // Collapse multiple spaces
    .trim();
}

/**
 * Validate color string format
 *
 * Checks if a string is a valid CSS color value.
 *
 * @param color - Color string to validate
 * @returns true if color appears valid
 */
export function isValidColor(color: string): boolean {
  if (!color || color.trim().length === 0) {
    return false;
  }

  // Check for CSS variables
  if (color.startsWith('var(')) {
    return true;
  }

  // Check for OKLCH
  if (isOKLCHColor(color)) {
    return true;
  }

  // Check for RGBA/RGB
  if (/^rgba?\(/.test(color)) {
    return true;
  }

  // Check for HEX
  if (/^#([0-9A-Fa-f]{3,4}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/.test(color)) {
    return true;
  }

  return false;
}
