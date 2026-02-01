import { Injectable, Renderer2 } from '@angular/core';
import {
  LiquidGlassFilterConfig,
  LiquidGlassRefractionMode,
} from '@app/shared/ui/liquid-glass/types/liquid-glass.types';
import { REFRACTION_MODE_TURBULENCE } from '@app/shared/ui/liquid-glass/types/theme.constants';

/**
 * Service for building SVG filters that create refractive distortion effects
 *
 * This service constructs SVG filter elements with turbulence, displacement,
 * and blur primitives to simulate the light-bending properties of liquid glass.
 * The filters are applied using CSS filter property with url(#filterId).
 *
 * @example
 * ```typescript
 * const builder = inject(SvgFilterBuilderService);
 * const filterId = builder.generateFilterId();
 * const svg = builder.createFilterElement(renderer, config, mode, filterId);
 * document.body.appendChild(svg);
 * element.style.filter = `url(#${filterId})`;
 * ```
 */
@Injectable({ providedIn: 'root' })
export class SvgFilterBuilderService {
  /**
   * Generate a unique filter ID for SVG filter references
   *
   * Creates a random ID string prefixed with 'lg-filter-' to avoid
   * collisions with other SVG filters in the DOM.
   *
   * @returns Unique filter ID string
   */
  generateFilterId(): string {
    return `lg-filter-${Math.random().toString(16).slice(2)}`;
  }

  /**
   * Create complete SVG filter element with all child primitives
   *
   * Constructs an SVG element containing a filter with three primitives:
   * 1. feTurbulence - generates fractal noise pattern
   * 2. feDisplacementMap - distorts the source graphic using noise
   * 3. feGaussianBlur - softens the displaced result
   *
   * The SVG is sized to 0x0 pixels and hidden to avoid affecting layout,
   * while the filter extends beyond the element bounds (-20% to +140%)
   * to ensure edge pixels are properly processed.
   *
   * @param renderer Angular Renderer2 for DOM manipulation
   * @param config Filter configuration parameters
   * @param mode Refraction mode affecting turbulence pattern
   * @param filterId Unique ID for the filter element
   * @returns Complete SVG element ready to be inserted into DOM
   */
  createFilterElement(
    renderer: Renderer2,
    config: LiquidGlassFilterConfig,
    mode: LiquidGlassRefractionMode,
    filterId: string,
  ): SVGSVGElement {
    // Create SVG container (hidden, zero-size)
    const svg = renderer.createElement('svg', 'svg') as SVGSVGElement;
    renderer.setAttribute(svg, 'width', '0');
    renderer.setAttribute(svg, 'height', '0');
    renderer.setAttribute(svg, 'style', 'position:absolute; width:0; height:0; overflow:hidden;');

    // Create defs container for filter definition
    const defs = renderer.createElement('defs', 'svg');

    // Create filter element with expanded bounds
    const filter = renderer.createElement('filter', 'svg');

    // Configure filter attributes
    // Extend bounds by 20% on all sides to handle edge displacement
    renderer.setAttribute(filter, 'id', filterId);
    renderer.setAttribute(filter, 'x', '-20%');
    renderer.setAttribute(filter, 'y', '-20%');
    renderer.setAttribute(filter, 'width', '140%');
    renderer.setAttribute(filter, 'height', '140%');

    // Use sRGB color space for consistent color interpolation
    renderer.setAttribute(filter, 'color-interpolation-filters', 'sRGB');

    // Build filter primitives in sequence
    const turbulence = this.createTurbulence(renderer, config, mode);
    const displacement = this.createDisplacementMap(renderer, config);
    const blur = this.createGaussianBlur(renderer, config);

    // Assemble SVG tree structure: svg > defs > filter > [primitives]
    filter.appendChild(turbulence);
    filter.appendChild(displacement);
    filter.appendChild(blur);
    defs.appendChild(filter);
    svg.appendChild(defs);

    return svg;
  }

  /**
   * Create turbulence primitive for noise generation
   *
   * The feTurbulence element generates fractal noise that creates
   * the organic, irregular distortion pattern. Different modes use
   * different frequencies and seeds to create visual variety.
   *
   * - `prominent`: More octaves (3) for detail, higher frequency
   * - `polar`: Higher Y frequency for vertical stretching, seed 9
   * - `standard`: Balanced noise, seed 2
   *
   * @param renderer Angular Renderer2 for DOM manipulation
   * @param config Filter configuration for base frequency
   * @param mode Refraction mode affecting noise parameters
   * @returns Turbulence primitive element
   */
  private createTurbulence(
    renderer: Renderer2,
    config: LiquidGlassFilterConfig,
    mode: LiquidGlassRefractionMode,
  ): SVGFETurbulenceElement {
    const turbulence = renderer.createElement('feTurbulence', 'svg') as SVGFETurbulenceElement;

    // Use fractal noise for more organic, cloud-like patterns
    renderer.setAttribute(turbulence, 'type', 'fractalNoise');

    // More octaves = more detail, but higher performance cost
    // Prominent mode gets extra detail for stronger effect
    renderer.setAttribute(turbulence, 'numOctaves', mode === 'prominent' ? '3' : '2');

    // Different seeds create different noise patterns
    // This allows each mode to have a distinct visual character
    renderer.setAttribute(
      turbulence,
      'seed',
      mode === 'polar' ? '9' : mode === 'prominent' ? '4' : '2',
    );

    // Base frequency determines noise scale (higher = finer details)
    // Use config value if provided, otherwise fall back to mode preset
    const freq = config.turbulenceBaseFrequency || REFRACTION_MODE_TURBULENCE[mode];
    renderer.setAttribute(turbulence, 'baseFrequency', freq.join(' '));
    renderer.setAttribute(turbulence, 'result', 'noise');

    return turbulence;
  }

  /**
   * Create displacement map primitive for distortion
   *
   * The feDisplacementMap uses the turbulence noise to displace
   * pixels from the source graphic, creating the refractive effect.
   * The red and green channels of the noise control X and Y displacement.
   *
   * @param renderer Angular Renderer2 for DOM manipulation
   * @param config Filter configuration for displacement scale
   * @returns Displacement map primitive element
   */
  private createDisplacementMap(
    renderer: Renderer2,
    config: LiquidGlassFilterConfig,
  ): SVGFEDisplacementMapElement {
    const disp = renderer.createElement('feDisplacementMap', 'svg') as SVGFEDisplacementMapElement;

    // SourceGraphic = the element being filtered
    renderer.setAttribute(disp, 'in', 'SourceGraphic');

    // noise = output from feTurbulence primitive
    renderer.setAttribute(disp, 'in2', 'noise');

    // Scale controls distortion intensity (0-140 recommended range)
    renderer.setAttribute(disp, 'scale', String(config.displacementScale));

    // Use red channel for X displacement, green for Y
    // This allows the noise to create 2D distortion
    renderer.setAttribute(disp, 'xChannelSelector', 'R');
    renderer.setAttribute(disp, 'yChannelSelector', 'G');

    renderer.setAttribute(disp, 'result', 'displaced');

    return disp;
  }

  /**
   * Create Gaussian blur primitive for softening
   *
   * The feGaussianBlur softens the displaced result, making the
   * distortion less harsh and more like refracted light.
   * The blur amount is scaled down (0.8x) to avoid excessive softening.
   *
   * @param renderer Angular Renderer2 for DOM manipulation
   * @param config Filter configuration for blur amount
   * @returns Gaussian blur primitive element
   */
  private createGaussianBlur(
    renderer: Renderer2,
    config: LiquidGlassFilterConfig,
  ): SVGFEGaussianBlurElement {
    const blur = renderer.createElement('feGaussianBlur', 'svg') as SVGFEGaussianBlurElement;

    // Blur the displaced result, not the original
    renderer.setAttribute(blur, 'in', 'displaced');

    // Scale blur amount by 0.8 to prevent excessive softening
    // Config value 0-1 maps to approximately 0-0.8px stdDeviation
    const stdDeviation = Math.max(0, config.blurAmount * 0.8);
    renderer.setAttribute(blur, 'stdDeviation', String(stdDeviation));

    // Final result is what gets applied to the element
    renderer.setAttribute(blur, 'result', 'out');

    return blur;
  }
}
