import {
  Directive,
  ElementRef,
  Renderer2,
  inject,
  OnInit,
  OnDestroy,
  input,
  booleanAttribute,
} from '@angular/core';
import {
  LiquidGlassTheme,
  LiquidGlassRefractionMode,
} from '@app/shared/ui/liquid-glass/types/liquid-glass.types';
import { LiquidGlassThemeResolver } from '@app/shared/ui/liquid-glass/services/theme-resolver.service';
import { SvgFilterBuilderService } from '@app/shared/ui/liquid-glass/services/svg-filter-builder.service';
import { REFRACTION_MODE_TURBULENCE } from '@app/shared/ui/liquid-glass/types/theme.constants';

/**
 * Liquid Glass Directive - Phase 5: Core Implementation
 *
 * A headless directive that applies liquid glass distortion effects to any
 * element. Integrates theme resolution (P1), state machine (P2), SVG filter
 * builder (P3), and accessibility (P4).
 *
 * ## Features
 *
 * - **Dynamic Distortion**: Mouse-tracking liquid glass effect with SVG filters
 * - **Theme System**: Mineral-inspired themes with automatic color resolution
 * - **Performance**: GPU-accelerated animations with RAF-based smoothing
 * - **Accessibility**: ARIA labels and reduced motion support
 * - **Customizable**: Extensive input options for fine-tuned control
 *
 * ## Usage
 *
 * ```html
 * <!-- Basic usage with default theme -->
 * <div liquidGlass class="p-4">
 *   Content with liquid glass effect
 * </div>
 *
 * <!-- With theme and customization -->
 * <div
 *   liquidGlass
 *   lgTheme="mineral-light"
 *   lgMode="prominent"
 *   lgCornerRadius="var(--radius-2xl)"
 *   lgPadding="16"
 *   [lgDisableAnimation]="false">
 *   Customized liquid glass card
 * </div>
 * ```
 *
 * ## Design System Integration
 *
 * - **Colors**: Uses CSS variables (--accent, --background) from mineral theme
 * - **Spacing**: Integrates with --radius-* variables for consistency
 * - **Typography**: Preserves host element content without interference
 * - **Animation**: Subtle, natural motion with configurable elasticity
 *
 * @selector [liquidGlass]
 * @standalone true
 * @implements OnInit, OnDestroy
 */
@Directive({
  selector: '[liquidGlass]',
  host: {
    '(pointermove)': 'onPointerMove($event)',
    '(pointerenter)': 'onPointerEnter()',
    '(pointerleave)': 'onPointerLeave()',
    '(focus)': 'onFocus()',
    '(blur)': 'onBlur()',
  },
})
export class LiquidGlassDirective implements OnInit, OnDestroy {
  // ========== Dependency Injection ==========

  /** Native element reference */
  private el = inject(ElementRef<HTMLElement>);

  /** Renderer for DOM manipulation (Angular abstraction) */
  private r = inject(Renderer2);

  /** Theme resolver for color and mode resolution (P1) */
  private themeResolver = inject(LiquidGlassThemeResolver);

  /** SVG filter builder for distortion effects (P3) */
  private filterBuilder = inject(SvgFilterBuilderService);

  // ========== Input Properties ==========

  // ----- Theme & Mode -----

  /**
   * Theme variant for liquid glass effect
   *
   * Determines the color palette and intensity:
   * - 'mineral-dark': Dark mineral theme with subtle highlights
   * - 'mineral-light': Light mineral theme with soft gradients
   * - 'custom': Use custom color overrides via lgBorder/lgHotspot/lgTint
   *
   * @default 'mineral-dark'
   */
  readonly lgThemeInput = input<LiquidGlassTheme>('mineral-dark', { alias: 'lgTheme' });

  /**
   * Refraction mode for distortion intensity
   *
   * Controls the SVG turbulence frequency:
   * - 'standard': Balanced distortion, turbulence [0.014, 0.035]
   * - 'polar': Vertical distortion, turbulence [0.010, 0.060]
   * - 'prominent': Strong distortion, turbulence [0.020, 0.020]
   *
   * @default 'standard'
   */
  readonly lgModeInput = input<LiquidGlassRefractionMode>('standard', { alias: 'lgMode' });

  // ----- Color Overrides -----

  /**
   * Border color override
   *
   * If not provided, uses theme-resolved --accent color
   *
   * @example lgBorder="oklch(0.70 0.12 75)"
   */
  readonly lgBorderInput = input<string | undefined>(undefined, { alias: 'lgBorder' });

  /**
   * Hotspot color for radial gradient highlight
   *
   * Creates the glowing hotspot that follows mouse movement
   *
   * @example lgHotspot="color-mix(in oklch, var(--card) 30%, transparent)"
   */
  readonly lgHotspotInput = input<string | undefined>(undefined, { alias: 'lgHotspot' });

  /**
   * Tint overlay color for base fill
   *
   * Provides the base color layer beneath gradients
   *
   * @example lgTint="color-mix(in oklch, var(--foreground) 40%, transparent)"
   */
  readonly lgTintInput = input<string | undefined>(undefined, { alias: 'lgTint' });

  /**
   * ARIA label for screen readers
   *
   * @default 'Liquid glass card'
   */
  readonly lgAriaLabelInput = input('Liquid glass card', { alias: 'lgAriaLabel' });

  /**
   * ARIA role for accessibility
   *
   * @default 'region'
   */
  readonly lgRoleInput = input('region', { alias: 'lgRole' });

  // ----- Spacing & Layout -----

  /**
   * Border radius using CSS variable or explicit value
   *
   * Integrates with design system radius tokens
   *
   * @default 'var(--radius-xl)'
   * @example 'var(--radius-2xl)' or '16px'
   */
  readonly lgCornerRadiusInput = input('var(--radius-xl)', { alias: 'lgCornerRadius' });

  /**
   * Border width in pixels
   *
   * @default 1
   */
  readonly lgBorderWidthInput = input(1, { alias: 'lgBorderWidth' });

  /**
   * Border width in pixels when activated (hovered or focused)
   *
   * @default 2
   */
  readonly lgBorderWidthActiveInput = input(2, { alias: 'lgBorderWidthActive' });

  /**
   * Internal padding in pixels
   *
   * Note: This is for the overlay only, not the host content
   *
   * @default 12
   */
  readonly lgPaddingInput = input(12, { alias: 'lgPadding' });

  // ----- Filter Configuration -----

  /**
   * Disable SVG filters (backdrop blur only)
   *
   * Use this for better performance on lower-end devices
   *
   * @default false
   */
  readonly lgDisableFiltersInput = input(false, {
    alias: 'lgDisableFilters',
    transform: booleanAttribute,
  });

  /**
   * Displacement scale for SVG turbulence
   *
   * Higher values create more pronounced distortion
   *
   * @default 0 (no distortion, clean edges)
   * @example Set to 20-60 for liquid glass distortion effect
   */
  readonly lgDisplacementScaleInput = input(0, { alias: 'lgDisplacementScale' });

  /**
   * Backdrop blur amount multiplier
   *
   * Final blur = blurAmount * 18 pixels
   *
   * @default 0.15 (results in ~2.7px blur - subtle effect)
   */
  readonly lgBlurAmountInput = input(0.15, { alias: 'lgBlurAmount' });

  /**
   * Saturation adjustment percentage
   *
   * Values > 100 increase color vibrance
   *
   * @default 105 (subtle vibrance boost)
   */
  readonly lgSaturationInput = input(105, { alias: 'lgSaturation' });

  /**
   * Chromatic aberration intensity
   *
   * Creates RGB split effect at edges
   *
   * @default 1.5 (subtle effect)
   */
  readonly lgAberrationIntensityInput = input(1.5, { alias: 'lgAberrationIntensity' });

  // ----- Animation Configuration -----

  /**
   * Disable all animation (static effect)
   *
   * Useful for accessibility or performance
   *
   * @default false
   */
  readonly lgDisableAnimationInput = input(false, {
    alias: 'lgDisableAnimation',
    transform: booleanAttribute,
  });

  /**
   * Animation elasticity (0-1)
   *
   * Higher values = faster, snappier motion
   * Lower values = smoother, more gradual motion
   *
   * @default 0.25 (smooth, natural feel)
   */
  readonly lgElasticityInput = input(0.25, { alias: 'lgElasticity' });

  /**
   * Parallax intensity in pixels
   *
   * Creates depth effect by moving overlay opposite to mouse
   *
   * @default 2
   */
  readonly lgParallaxIntensityInput = input(2, { alias: 'lgParallaxIntensity' });

  /**
   * Respect user's reduced motion preference
   *
   * When true, disables animation if user prefers reduced motion
   *
   * @default true
   */
  readonly lgRespectReducedMotionInput = input(true, {
    alias: 'lgRespectReducedMotion',
    transform: booleanAttribute,
  });

  private get lgTheme(): LiquidGlassTheme {
    return this.lgThemeInput();
  }

  private get lgMode(): LiquidGlassRefractionMode {
    return this.lgModeInput();
  }

  private get lgBorder(): string | undefined {
    return this.lgBorderInput();
  }

  private get lgHotspot(): string | undefined {
    return this.lgHotspotInput();
  }

  private get lgTint(): string | undefined {
    return this.lgTintInput();
  }

  private get lgAriaLabel(): string {
    return this.lgAriaLabelInput();
  }

  private get lgRole(): string {
    return this.lgRoleInput();
  }

  private get lgCornerRadius(): string {
    return this.lgCornerRadiusInput();
  }

  private get lgBorderWidth(): number {
    return this.lgBorderWidthInput();
  }

  private get lgBorderWidthActive(): number {
    return this.lgBorderWidthActiveInput();
  }

  private get lgPadding(): number {
    return this.lgPaddingInput();
  }

  private get lgDisableFilters(): boolean {
    return this.lgDisableFiltersInput();
  }

  private get lgDisplacementScale(): number {
    return this.lgDisplacementScaleInput();
  }

  private get lgBlurAmount(): number {
    return this.lgBlurAmountInput();
  }

  private get lgSaturation(): number {
    return this.lgSaturationInput();
  }

  private get lgAberrationIntensity(): number {
    return this.lgAberrationIntensityInput();
  }

  private get lgDisableAnimation(): boolean {
    return this.reduceMotionDisabledAnimation || this.lgDisableAnimationInput();
  }

  private get lgElasticity(): number {
    return this.lgElasticityInput();
  }

  private get lgParallaxIntensity(): number {
    return this.lgParallaxIntensityInput();
  }

  private get lgRespectReducedMotion(): boolean {
    return this.lgRespectReducedMotionInput();
  }

  // ========== Private Properties ==========

  /** Host element being decorated */
  private host!: HTMLElement;

  /** Overlay div containing backdrop blur and background effects */
  private overlay!: HTMLDivElement;

  /** Border layer - separate from overlay to avoid blur effect */
  private borderLayer!: HTMLDivElement;

  /** SVG filter element (if filters enabled) */
  private svgFilter?: SVGSVGElement;

  /** RequestAnimationFrame ID for cleanup */
  private animationFrameId = 0;

  /** Unique ID for SVG filter reference */
  private filterId = '';

  /** Runtime override when prefers-reduced-motion is enabled */
  private reduceMotionDisabledAnimation = false;

  // ----- Animation State -----

  /** Target X position (mouse position normalized 0-1) */
  private targetX = 0.5;

  /** Target Y position (mouse position normalized 0-1) */
  private targetY = 0.5;

  /** Current interpolated X position */
  private curX = 0.5;

  /** Current interpolated Y position */
  private curY = 0.5;

  // ----- Hover State -----

  /** Whether the mouse is hovering over the element */
  private isHovered = false;

  /** Whether the element has keyboard focus */
  private isFocused = false;

  /**
   * Check if element is in activated state
   *
   * Element is activated when EITHER hovered OR focused
   *
   * @returns true if element should show activation styling
   */
  private isActivated(): boolean {
    return this.isHovered || this.isFocused;
  }

  // ========== Lifecycle Hooks ==========

  /**
   * Initialize directive
   *
   * Sets up host styles, creates overlay and filters, starts animation loop
   */
  ngOnInit(): void {
    this.host = this.el.nativeElement;

    // Check reduced motion preference
    if (this.lgRespectReducedMotion && this.prefersReducedMotion()) {
      this.reduceMotionDisabledAnimation = true;
    }

    // Generate unique filter ID
    this.filterId = this.filterBuilder.generateFilterId();

    // Initialize visual elements
    this.setupHostStyles();
    this.createOverlay();

    // Create SVG filter if not disabled
    if (!this.lgDisableFilters) {
      this.createSvgFilter();
    }

    // Start animation loop if not disabled
    if (!this.lgDisableAnimation) {
      this.startAnimationLoop();
    }

    // Setup accessibility attributes
    this.setupAccessibility();
  }

  /**
   * Clean up resources
   *
   * Cancels animation frame and removes DOM elements
   */
  ngOnDestroy(): void {
    cancelAnimationFrame(this.animationFrameId);
    this.cleanup();
  }

  // ========== Initialization Methods ==========

  /**
   * Check if user prefers reduced motion
   *
   * Reads the prefers-reduced-motion media query
   *
   * @returns true if reduced motion is preferred
   */
  private prefersReducedMotion(): boolean {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  /**
   * Clean up created DOM elements
   *
   * Removes SVG filter, overlay, and border layer from host
   */
  private cleanup(): void {
    if (this.svgFilter?.parentNode) {
      this.svgFilter.parentNode.removeChild(this.svgFilter);
    }
    if (this.overlay?.parentNode) {
      this.overlay.parentNode.removeChild(this.overlay);
    }
    if (this.borderLayer?.parentNode) {
      this.borderLayer.parentNode.removeChild(this.borderLayer);
    }
  }

  /**
   * Apply base styles to host element
   *
   * Sets up positioning and containment for the overlay
   */
  private setupHostStyles(): void {
    this.r.setStyle(this.host, 'position', 'relative');
    this.r.setStyle(this.host, 'isolation', 'isolate');
    this.r.setStyle(this.host, 'overflow', 'hidden');
    this.r.setStyle(this.host, 'border-radius', this.lgCornerRadius);
  }

  /**
   * Create overlay div with all visual effects
   *
   * Creates two layers:
   * 1. overlay: Backdrop blur, saturation, and background gradients
   * 2. borderLayer: Sharp border on top (not affected by blur)
   */
  private createOverlay(): void {
    // Create background overlay (backdrop blur + gradients)
    this.overlay = this.r.createElement('div');
    // Insert overlay as FIRST child so content stays on top
    if (this.host.firstChild) {
      this.r.insertBefore(this.host, this.overlay, this.host.firstChild);
    } else {
      this.r.appendChild(this.host, this.overlay);
    }

    // ----- Overlay Base Styles -----
    this.r.setStyle(this.overlay, 'pointer-events', 'none');
    this.r.setStyle(this.overlay, 'position', 'absolute');
    this.r.setStyle(this.overlay, 'inset', '0');
    this.r.setStyle(this.overlay, 'border-radius', 'inherit');
    this.r.setStyle(this.overlay, 'z-index', '-1');
    this.r.setStyle(this.overlay, 'will-change', 'transform, filter, background');
    this.r.setStyle(this.overlay, 'transform', 'translateZ(0)');

    // ----- Backdrop Filter -----
    const blurPx = Math.round(this.lgBlurAmount * 18);
    this.r.setStyle(
      this.overlay,
      'backdrop-filter',
      `blur(${blurPx}px) saturate(${this.lgSaturation}%)`,
    );
    this.r.setStyle(
      this.overlay,
      '-webkit-backdrop-filter',
      `blur(${blurPx}px) saturate(${this.lgSaturation}%)`,
    );

    // ----- Initial Background -----
    this.updateOverlayBackground(0.5, 0.5);

    // Create border layer (separate to avoid blur)
    this.createBorderLayer();
  }

  /**
   * Create border layer on top of overlay
   *
   * This layer contains only the border and shadow, not affected by backdrop-filter
   */
  private createBorderLayer(): void {
    this.borderLayer = this.r.createElement('div');
    // Insert border layer after overlay
    if (this.overlay.nextSibling) {
      this.r.insertBefore(this.host, this.borderLayer, this.overlay.nextSibling);
    } else {
      this.r.appendChild(this.host, this.borderLayer);
    }

    // ----- Border Layer Base Styles -----
    this.r.setStyle(this.borderLayer, 'pointer-events', 'none');
    this.r.setStyle(this.borderLayer, 'position', 'absolute');
    this.r.setStyle(this.borderLayer, 'inset', '0');
    this.r.setStyle(this.borderLayer, 'border-radius', 'inherit');
    this.r.setStyle(this.borderLayer, 'z-index', '0'); // Above overlay (-1)
    this.r.setStyle(this.borderLayer, 'transition', 'box-shadow 0.2s ease-out, border-color 0.2s ease-out, border-width 0.2s ease-out');

    // ----- Initial Border Styles -----
    const borderColor = this.lgBorder || 'var(--primary)';
    this.r.setStyle(this.borderLayer, 'border-width', `${this.lgBorderWidth}px`);
    this.r.setStyle(this.borderLayer, 'border-style', 'solid');
    this.r.setStyle(this.borderLayer, 'border-color', borderColor);
    this.r.setStyle(
      this.borderLayer,
      'box-shadow',
      'var(--shadow-control-active), inset 0 1px 0 color-mix(in oklch, var(--card) 15%, transparent)',
    );
  }

  /**
   * Update overlay background with radial gradient hotspot
   *
   * Creates a multi-layer background:
   * 1. Radial gradient hotspot (follows mouse)
   * 2. Top-down fade gradient (ambient light)
   * 3. Base tint (provides opacity)
   *
   * @param x Normalized X position (0-1)
   * @param y Normalized Y position (0-1)
   */
  private updateOverlayBackground(x: number, y: number): void {
    const xPct = (x * 100).toFixed(2);
    const yPct = (y * 100).toFixed(2);
    const hotspot = this.lgHotspot || 'color-mix(in oklch, var(--card) 15%, transparent)';
    const tint = this.lgTint || 'color-mix(in oklch, var(--foreground) 12%, transparent)';

    const gradient = `
      radial-gradient(140px 140px at ${xPct}% ${yPct}%, ${hotspot},
        color-mix(in oklch, var(--card) 8%, transparent) 35%, transparent 70%),
      linear-gradient(180deg, color-mix(in oklch, var(--card) 12%, transparent), transparent 65%),
      ${tint}
    `
      .replace(/\s+/g, ' ')
      .trim();

    this.r.setStyle(this.overlay, 'background', gradient);
  }

  /**
   * Create SVG filter element for distortion effects
   *
   * Uses SvgFilterBuilderService (P3) to generate:
   * - FeTurbulence for distortion pattern
   * - FeDisplacementMap for image distortion
   * - FeColorMatrix for saturation
   *
   * Applies chromatic aberration via CSS drop-shadow
   */
  private createSvgFilter(): void {
    const config = {
      displacementScale: this.lgDisplacementScale,
      blurAmount: this.lgBlurAmount,
      saturation: this.lgSaturation,
      aberrationIntensity: this.lgAberrationIntensity,
      turbulenceBaseFrequency: REFRACTION_MODE_TURBULENCE[this.lgMode],
    };

    this.svgFilter = this.filterBuilder.createFilterElement(
      this.r,
      config,
      this.lgMode,
      this.filterId,
    );

    this.r.appendChild(this.host, this.svgFilter);

    // Apply filter to overlay with chromatic aberration
    const aberration = Math.max(0, this.lgAberrationIntensity);
    this.r.setStyle(
      this.overlay,
      'filter',
      `url(#${this.filterId}) drop-shadow(${aberration}px 0 color-mix(in oklch, var(--accent) 18%, transparent)) ` +
        `drop-shadow(${-aberration}px 0 color-mix(in oklch, var(--primary) 16%, transparent))`,
    );
  }

  /**
   * Setup accessibility attributes
   *
   * Adds role and aria-label for screen reader support
   */
  private setupAccessibility(): void {
    this.r.setAttribute(this.host, 'role', this.lgRole);
    this.r.setAttribute(this.host, 'aria-label', this.lgAriaLabel);
  }

  // ========== Animation Methods ==========

  /**
   * Handle pointer movement over host element
   *
   * Updates target position for animation smoothing
   *
   * @param event Pointer event with client coordinates
   */
  onPointerMove(event: PointerEvent): void {
    if (this.lgDisableAnimation) return;

    const rect = this.host.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;

    this.targetX = this.clamp01(x);
    this.targetY = this.clamp01(y);
  }

  /**
   * Handle pointer enter event (hover activation)
   *
   * Sets hovered state and updates border to be brighter/deeper
   */
  onPointerEnter(): void {
    this.isHovered = true;
    this.updateBorderColor();
  }

  /**
   * Handle pointer leave event
   *
   * Resets hotspot to center position and restores normal border
   */
  onPointerLeave(): void {
    this.isHovered = false;
    this.targetX = 0.5;
    this.targetY = 0.5;
    this.updateBorderColor();
  }

  /**
   * Handle focus event (keyboard navigation)
   *
   * Sets focused state and updates border to show activation
   */
  onFocus(): void {
    this.isFocused = true;
    this.updateBorderColor();
  }

  /**
   * Handle blur event (loss of keyboard focus)
   *
   * Clears focused state and restores normal border if not hovered
   */
  onBlur(): void {
    this.isFocused = false;
    this.updateBorderColor();
  }

  /**
   * Start animation loop with exponential smoothing
   *
   * Uses RequestAnimationFrame for smooth 60fps animation.
   * Implements exponential moving average for natural motion.
   */
  private startAnimationLoop(): void {
    const loop = () => {
      // Exponential smoothing coefficient
      // Higher k = faster tracking, lower k = smoother motion
      const k = 1 - Math.pow(1 - this.lgElasticity, 2);

      // Interpolate current position toward target
      this.curX += (this.targetX - this.curX) * k;
      this.curY += (this.targetY - this.curY) * k;

      // Update CSS custom properties for potential external use
      this.host.style.setProperty('--lg-x', `${(this.curX * 100).toFixed(2)}%`);
      this.host.style.setProperty('--lg-y', `${(this.curY * 100).toFixed(2)}%`);

      // Update background gradient hotspot
      this.updateOverlayBackground(this.curX, this.curY);

      // Parallax effect (move overlay opposite to mouse)
      const dx = (this.curX - 0.5) * 2;
      const dy = (this.curY - 0.5) * 2;
      this.r.setStyle(
        this.overlay,
        'transform',
        `translate3d(${(-dx * this.lgParallaxIntensity).toFixed(2)}px, ` +
          `${(-dy * this.lgParallaxIntensity).toFixed(2)}px, 0)`,
      );

      // Schedule next frame
      this.animationFrameId = requestAnimationFrame(loop);
    };

    this.animationFrameId = requestAnimationFrame(loop);
  }

  /**
   * Clamp value to [0, 1] range
   *
   * @param v Value to clamp
   * @returns Clamped value
   */
  private clamp01(v: number): number {
    return Math.max(0, Math.min(1, v));
  }

  /**
   * Update border color based on hover/focus state
   *
   * When activated (hovered OR focused): uses primary color with external focus ring
   * When not activated: uses normal border color from theme or custom input
   */
  private updateBorderColor(): void {
    if (!this.borderLayer) return;

    const baseColor = this.lgBorder || 'var(--primary)';

    // Shadow constants
    const baseShadow = 'var(--shadow-control-active)';
    const focusRing = 'var(--shadow-focus-ring)';
    const activatedShadow = `var(--shadow-control-hover), ${focusRing}`;

    if (this.isActivated()) {
      // Activated state: keep border color, add focus ring
      this.r.setStyle(this.borderLayer, 'border-color', baseColor);
      this.r.setStyle(this.borderLayer, 'border-width', `${this.lgBorderWidthActive}px`);
      this.r.setStyle(this.borderLayer, 'box-shadow', activatedShadow);
    } else {
      // Normal state: use primary/base color
      this.r.setStyle(this.borderLayer, 'border-color', baseColor);
      this.r.setStyle(this.borderLayer, 'border-width', `${this.lgBorderWidth}px`);
      this.r.setStyle(this.borderLayer, 'box-shadow', baseShadow);
    }
  }
}
