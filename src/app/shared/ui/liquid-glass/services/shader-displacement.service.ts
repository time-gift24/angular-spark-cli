/**
 * Liquid Glass Directive - Shader Displacement Service
 *
 * Angular service for generating shader-based displacement maps.
 * Ported from the reference React implementation with Angular Signals integration.
 *
 * Provides CPU-based shader execution to generate displacement maps
 * for the liquid glass refraction effect.
 *
 * @see https://github.com/shuding/liquid-glass
 */

import { Injectable, signal } from '@angular/core';

/**
 * 2D vector type for shader operations
 */
export interface Vec2 {
  readonly x: number;
  readonly y: number;
}

/**
 * Result of displacement map generation
 */
export interface DisplacementResult {
  readonly dataUrl: string;
  readonly width: number;
  readonly height: number;
  readonly maxScale: number;
}

/**
 * Cache entry for generated displacement maps
 */
interface CacheEntry {
  readonly dataUrl: string;
  readonly timestamp: number;
}

/**
 * Service for generating shader-based displacement maps
 *
 * Uses CPU-based per-pixel shader execution to create displacement
 * maps that drive the liquid glass refraction effect. Results are
 * cached by size key for performance.
 *
 * Provided in 'root' for tree-shakability and singleton behavior.
 *
 * @example
 * ```ts
 * const service = inject(ShaderDisplacementService);
 * const displacement = service.generateShaderDisplacementMap(256, 256);
 * // Returns: 'data:image/png;base64,...'
 * ```
 */
@Injectable({ providedIn: 'root' })
export class ShaderDisplacementService {
  /** Cache for generated displacement maps */
  private readonly cache = signal<Map<string, CacheEntry>>(new Map());

  /** Maximum cache size (number of entries) */
  private readonly maxCacheSize = 50;

  /** Canvas DPI scaling factor */
  private readonly canvasDPI = 1;

  /** Whether running in browser environment */
  private readonly isBrowser: boolean;

  constructor() {
    this.isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';
  }

  /**
   * Generate a shader displacement map using the liquid glass fragment shader
   *
   * Creates an offscreen canvas, executes the liquidGlass fragment shader
   * per-pixel on CPU, and returns a base64 data URL of the resulting image.
   * Results are cached by size key for performance.
   *
   * @param width - Width of the displacement map in pixels
   * @param height - Height of the displacement map in pixels
   * @returns Base64 data URL of the generated displacement map
   *
   * @example
   * ```ts
   * const service = inject(ShaderDisplacementService);
   * const map = service.generateShaderDisplacementMap(256, 256);
   * // Use map as SVG feDisplacementMap input
   * ```
   */
  generateShaderDisplacementMap(width: number, height: number): string {
    const cacheKey = `${width}x${height}`;

    // Check cache first
    const cached = this.getCached(cacheKey);
    if (cached) {
      return cached;
    }

    // SSR safety check
    if (!this.isBrowser) {
      // Return empty data URL for SSR
      return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==';
    }

    const result = this.executeLiquidGlassShader(width, height);

    // Cache the result
    this.setCached(cacheKey, result.dataUrl);

    return result.dataUrl;
  }

  /**
   * Clear the displacement map cache
   *
   * Removes all cached displacement maps. Useful for memory management
   * or when testing with different parameters.
   *
   * @example
   * ```ts
   * service.clearCache();
   * ```
   */
  clearCache(): void {
    this.cache.set(new Map());
  }

  /**
   * Get current cache size
   *
   * @returns Number of cached displacement maps
   */
  getCacheSize(): number {
    return this.cache().size;
  }

  /**
   * Execute the liquid glass fragment shader per-pixel
   *
   * Creates an offscreen canvas and executes the shader for each pixel,
   * then converts the result to a base64 data URL.
   *
   * @param width - Canvas width
   * @param height - Canvas height
   * @returns Displacement result with data URL and metadata
   */
  private executeLiquidGlassShader(width: number, height: number): DisplacementResult {
    const w = width * this.canvasDPI;
    const h = height * this.canvasDPI;

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    canvas.style.display = 'none';

    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) {
      throw new Error('Could not get 2D context for displacement map generation');
    }

    let maxScale = 0;
    const rawValues: number[] = [];

    // Calculate displacement values for each pixel
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const uv: Vec2 = { x: x / w, y: y / h };

        const pos = this.liquidGlass(uv);
        const dx = pos.x * w - x;
        const dy = pos.y * h - y;

        maxScale = Math.max(maxScale, Math.abs(dx), Math.abs(dy));
        rawValues.push(dx, dy);
      }
    }

    // Normalize to prevent artifacts while maintaining intensity
    if (maxScale > 0) {
      maxScale = Math.max(maxScale, 1);
    } else {
      maxScale = 1;
    }

    // Create and fill ImageData
    const imageData = context.createImageData(w, h);
    const data = imageData.data;

    let rawIndex = 0;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const dx = rawValues[rawIndex++];
        const dy = rawValues[rawIndex++];

        // Smooth displacement at edges to prevent hard transitions
        const edgeDistance = Math.min(x, y, w - x - 1, h - y - 1);
        const edgeFactor = Math.min(1, edgeDistance / 2);

        const smoothedDx = dx * edgeFactor;
        const smoothedDy = dy * edgeFactor;

        const r = smoothedDx / maxScale + 0.5;
        const g = smoothedDy / maxScale + 0.5;

        const pixelIndex = (y * w + x) * 4;
        data[pixelIndex] = Math.max(0, Math.min(255, r * 255));     // Red (X displacement)
        data[pixelIndex + 1] = Math.max(0, Math.min(255, g * 255)); // Green (Y displacement)
        data[pixelIndex + 2] = data[pixelIndex + 1];                // Blue (same as green for SVG filter)
        data[pixelIndex + 3] = 255;                                  // Alpha
      }
    }

    context.putImageData(imageData, 0, 0);
    const dataUrl = canvas.toDataURL('image/png');

    // Cleanup
    canvas.remove();

    return { dataUrl, width, height, maxScale };
  }

  /**
   * Liquid glass fragment shader
   *
   * Core shader function that creates the liquid glass distortion effect.
   * Uses signed distance fields (SDF) for rounded rectangle edge detection,
   * then applies smoothstep interpolation for soft, liquid-like edges.
   *
   * @param uv - Normalized UV coordinates (0-1)
   * @returns Displacement vector
   */
  private liquidGlass(uv: Vec2): Vec2 {
    const ix = uv.x - 0.5;
    const iy = uv.y - 0.5;

    // Calculate distance to rounded rectangle edge
    const distanceToEdge = this.roundedRectSDF(ix, iy, 0.3, 0.2, 0.6);

    // Create smooth displacement at edges
    const displacement = this.smoothStep(0.8, 0, distanceToEdge - 0.15);
    const scaled = this.smoothStep(0, 1, displacement);

    return { x: ix * scaled + 0.5, y: iy * scaled + 0.5 };
  }

  /**
   * Smooth step interpolation function
   *
   * Hermite interpolation between two values using a cubic curve.
   * Provides smooth, organic transitions essential for liquid effects.
   *
   * Formula: t²(3 - 2t) where t is clamped and normalized between a and b
   *
   * @param a - Lower edge
   * @param b - Upper edge
   * @param t - Input value to interpolate
   * @returns Interpolated value
   */
  private smoothStep(a: number, b: number, t: number): number {
    const normalized = Math.max(0, Math.min(1, (t - a) / (b - a)));
    return normalized * normalized * (3 - 2 * normalized);
  }

  /**
   * Vector length (magnitude) calculation
   *
   * Standard Euclidean distance formula: sqrt(x² + y²)
   *
   * @param x - X component
   * @param y - Y component
   * @returns Vector magnitude
   */
  private length(x: number, y: number): number {
    return Math.sqrt(x * x + y * y);
  }

  /**
   * Signed distance field for rounded rectangle
   *
   * Computes the signed distance from a point to a rounded rectangle.
   * Returns negative values inside the rectangle, positive outside.
   *
   * Uses the analytic SDF formula for rounded rectangles with
   * quadrants treated separately for corner radius calculation.
   *
   * @param x - X coordinate relative to center
   * @param y - Y coordinate relative to center
   * @param width - Half-width of rectangle
   * @param height - Half-height of rectangle
   * @param radius - Corner radius
   * @returns Signed distance to the rounded rectangle
   */
  private roundedRectSDF(
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
  ): number {
    const qx = Math.abs(x) - width + radius;
    const qy = Math.abs(y) - height + radius;

    return (
      Math.min(Math.max(qx, qy), 0) +
      this.length(Math.max(qx, 0), Math.max(qy, 0)) -
      radius
    );
  }

  /**
   * Get cached displacement map
   *
   * @param key - Cache key (format: "WIDTHxHEIGHT")
   * @returns Cached data URL or undefined
   */
  private getCached(key: string): string | undefined {
    const entry = this.cache().get(key);
    return entry?.dataUrl;
  }

  /**
   * Cache a displacement map
   *
   * Implements LRU-style cache management by removing oldest entries
   * when the cache exceeds maxCacheSize.
   *
   * @param key - Cache key
   * @param dataUrl - Data URL to cache
   */
  private setCached(key: string, dataUrl: string): void {
    const current = this.cache();
    const updated = new Map(current);

    // Remove oldest entry if cache is full
    if (updated.size >= this.maxCacheSize) {
      const firstKey = updated.keys().next().value;
      if (firstKey) {
        updated.delete(firstKey);
      }
    }

    updated.set(key, { dataUrl, timestamp: Date.now() });
    this.cache.set(updated);
  }
}
