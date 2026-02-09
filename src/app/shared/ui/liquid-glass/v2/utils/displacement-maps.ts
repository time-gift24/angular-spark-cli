/**
 * Liquid Glass - Displacement Map Constants
 *
 * Base64-encoded displacement maps for different refraction modes.
 * These are converted from the SVG filters in the reference implementation.
 *
 * Reference: .vendor/liquid-glass-react/src/utils.ts
 */

/**
 * Standard displacement map - Balanced noise pattern for general use
 *
 * Creates a uniform, organic distortion effect across all edges.
 * The gradient goes from gray (neutral) at edges to colored (distortion) in center.
 */
export const DISPLACEMENT_MAP_STANDARD = `url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMjgiIGhlaWdodD0iMTI4Ij48ZGVmcz48ZmlsdGVyIGlkPSJkaXNwbGFjZW1lbnQiPjxmZVR1cmJ1bGVuY2UgdHlwZT0iZnJhY3RhbE5vaXNlIiBiYXNlRnJlcXVlbmN5PSIwLjAxNCAwLjAzNSIgbnVtT2N0YXZlcz0iMiIgc2VlZD0iMiIvPjwvZmlsdGVyPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWx0ZXI9InVybCgjZGlzcGxhY2VtZW50KSIgb3BhY2l0eT0iMC41Ii8+PC9zdmc+')`;

/**
 * Polar displacement map - Directional noise emphasizing vertical/horizontal distortion
 *
 * Creates anisotropic distortion with more pronounced effects along cardinal directions.
 * Useful for elements that should appear to stretch toward/away from mouse movement.
 */
export const DISPLACEMENT_MAP_POLAR = `url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMjgiIGhlaWdodD0iMTI4Ij48ZGVmcz48ZmlsdGVyIGlkPSJkaXNwbGFjZW1lbnQiPjxmZVR1cmJ1bGVuY2UgdHlwZT0iZnJhY3RhbE5vaXNlIiBiYXNlRnJlcXVlbmN5PSIwLjAxIDAuMDYiIG51bU9jdGF2ZXM9IjIiIHNlZWQ9IjkiLz48L2ZpbHRlcj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsdGVyPSJ1cmwoI2Rpc3BsYWNlbWVudCkiIG9wYWNpdHk9IjAuNSIvPjwvc3ZnPg==')`;

/**
 * Prominent displacement map - More intense, visible distortion effect
 *
 * Creates stronger, more visible refraction with higher frequency noise.
 * Best for interactive elements that need strong visual feedback.
 */
export const DISPLACEMENT_MAP_PROMINENT = `url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMjgiIGhlaWdodD0iMTI4Ij48ZGVmcz48ZmlsdGVyIGlkPSJkaXNwbGFjZW1lbnQiPjxmZVR1cmJ1bGVuY2UgdHlwZT0iZnJhY3RhbE5vaXNlIiBiYXNlRnJlcXVlbmN5PSIwLjAyIDAuMDIiIG51bU9jdGF2ZXM9IjMiIHNlZWQ9IjQiLz48L2ZpbHRlcj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsdGVyPSJ1cmwoI2Rpc3BsYWNlbWVudCkiIG9wYWNpdHk9IjAuNSIvPjwvc3ZnPg==')`;

/**
 * Get displacement map URL for a given refraction mode
 *
 * @param mode - Refraction mode (standard, polar, prominent, shader)
 * @param shaderMapUrl - Optional shader-generated map URL for 'shader' mode
 * @returns CSS url() string for the displacement map
 *
 * @example
 * ```ts
 * const map = getDisplacementMap('polar');
 * // Returns: url('data:image/svg+xml;base64,...')
 * ```
 */
export function getDisplacementMap(
  mode: 'standard' | 'polar' | 'prominent' | 'shader',
  shaderMapUrl?: string
): string {
  switch (mode) {
    case 'standard':
      return DISPLACEMENT_MAP_STANDARD;
    case 'polar':
      return DISPLACEMENT_MAP_POLAR;
    case 'prominent':
      return DISPLACEMENT_MAP_PROMINENT;
    case 'shader':
      return shaderMapUrl || DISPLACEMENT_MAP_STANDARD;
    default:
      return DISPLACEMENT_MAP_STANDARD;
  }
}
