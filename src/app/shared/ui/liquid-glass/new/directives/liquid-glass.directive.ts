/**
 * Liquid Glass Directive
 *
 * Makes any component "liquid" by applying the liquid glass effect directly to the host element.
 * This is the directive form for easy adoption - just add [liquidGlass] to any element.
 *
 * @selector [liquidGlass]
 * @standalone true
 *
 * @example
 * ```html
 * <div [liquidGlass]="true" [liquidGlassMode]="'standard'" [liquidGlassElasticity]="0.2">
 *   <h1>Liquid Content</h1>
 * </div>
 * ```
 */

import {
  Directive,
  input,
  output,
  inject,
  OnInit,
  OnDestroy,
  ElementRef,
  Renderer2,
  NgZone,
  HostListener,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { displacementMap as standardMap } from '../constants/displacement-map';
import { polarDisplacementMap as polarMap } from '../constants/polar-displacement-map';
import { prominentDisplacementMap as prominentMap } from '../constants/prominent-displacement-map';

type GlassFilterMode = 'standard' | 'polar' | 'prominent' | 'shader';

/**
 * Get the displacement map URL based on mode
 * Returns raw data URLs (not CSS url() format) for use in SVG feImage href
 */
function getDisplacementMapUrl(mode: GlassFilterMode): string {
  switch (mode) {
    case 'standard':
      return standardMap;
    case 'polar':
      return polarMap;
    case 'prominent':
      return prominentMap;
    case 'shader':
      // For shader mode, we'd use a dynamically generated map
      // For now, fall back to standard
      return standardMap;
    default:
      return standardMap;
  }
}

/**
 * Liquid Glass Directive
 *
 * Applies the liquid glass effect to any element using CSS backdrop-filter,
 * SVG filters, and elastic mouse tracking.
 */
@Directive({
  selector: '[liquidGlass]',
  standalone: true,
  host: {
    '[style.position]': "'relative'",
    '[style.isolation]': "'isolate'",
    '[class.liquid-glass]': 'isEnabled',
  },
})
export class LiquidGlassDirective implements OnInit, OnDestroy {
  private readonly elementRef = inject(ElementRef);
  private readonly renderer = inject(Renderer2);
  private readonly ngZone = inject(NgZone);
  private readonly platformId = inject(PLATFORM_ID);

  // ========== Inputs ==========

  /** Whether liquid glass effect is enabled */
  readonly liquidGlass = input<boolean, boolean>(false, { transform: (v) => v !== false });

  /** Refraction mode */
  readonly liquidGlassMode = input<GlassFilterMode>('standard');

  /** Displacement scale (default: 70) */
  readonly liquidGlassDisplacementScale = input(70);

  /** Blur amount (default: 0.0625) */
  readonly liquidGlassBlurAmount = input(0.0625);

  /** Saturation (default: 140) */
  readonly liquidGlassSaturation = input(140);

  /** Aberration intensity (default: 2) */
  readonly liquidGlassAberrationIntensity = input(2);

  /** Elasticity (default: 0.15) */
  readonly liquidGlassElasticity = input(0.15);

  /** Corner radius (default: 999) */
  readonly liquidGlassCornerRadius = input(999);

  /** Over light mode (default: false) */
  readonly liquidGlassOverLight = input(false);

  /** Padding (default: '24px 32px') */
  readonly liquidGlassPadding = input('24px 32px');

  // ========== Outputs ==========

  readonly liquidGlassClick = output<void>();

  // ========== Private State ==========

  private host!: HTMLElement;
  private svgFilter: SVGSVGElement | null = null;
  private filterId = '';
  private animationFrameId = 0;
  private cleanup: (() => void)[] = [];
  private warpLayer: HTMLElement | null = null;

  // Mouse tracking state
  private curX = 0.5;
  private curY = 0.5;
  private isHovered = false;
  private isActive = false;
  private glassSize = { width: 270, height: 69 };
  private internalGlobalMousePos = { x: 0, y: 0 };
  private targetX = 0.5;
  private targetY = 0.5;

  // ========== Computed Values ==========

  private get isEnabled(): boolean {
    return this.liquidGlass();
  }

  private get backdropBlur(): number {
    const baseBlur = this.liquidGlassOverLight() ? 12 : 4;
    return Math.round(baseBlur + this.liquidGlassBlurAmount() * 18);
  }

  // ========== Lifecycle ==========

  ngOnInit(): void {
    if (!this.isEnabled || !isPlatformBrowser(this.platformId)) return;

    this.host = this.elementRef.nativeElement as HTMLElement;
    this.filterId = `lg-filter-${Math.random().toString(16).slice(2)}`;

    this.setupHostStyles();
    this.createWarpLayer();
    this.createSvgFilter();
    this.createBorderLayer();
    this.startAnimationLoop();
    this.setupMouseTracking();
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.animationFrameId);
    this.cleanup.forEach(fn => fn());
  }

  // ========== Setup Methods ==========

  private setupHostStyles(): void {
    this.renderer.setStyle(this.host, 'border-radius', `${this.liquidGlassCornerRadius()}px`);
    this.renderer.setStyle(this.host, 'transition', 'all ease-out 0.2s');
    this.renderer.setStyle(this.host, 'padding', this.liquidGlassPadding());
    this.renderer.setStyle(this.host, 'box-shadow', '0px 12px 40px rgba(0, 0, 0, 0.25)');
    this.renderer.setStyle(this.host, 'overflow', 'hidden');
  }

  /**
   * Create a warp layer element (real DOM) that handles backdrop-filter
   * This matches the component's approach and avoids pseudo-element filter issues
   */
  private createWarpLayer(): void {
    this.warpLayer = this.renderer.createElement('span');

    // Add class for styling
    this.renderer.addClass(this.warpLayer, 'lg-warp');

    // Position and size - match the component's warp layer behavior exactly
    this.renderer.setStyle(this.warpLayer, 'position', 'absolute');
    this.renderer.setStyle(this.warpLayer, 'inset', '-50%');
    this.renderer.setStyle(this.warpLayer, 'width', '200%');
    this.renderer.setStyle(this.warpLayer, 'height', '200%');
    this.renderer.setStyle(this.warpLayer, 'pointer-events', 'none');
    this.renderer.setStyle(this.warpLayer, 'z-index', '0');
    this.renderer.setStyle(this.warpLayer, 'border-radius', 'inherit');

    // Background gradients (same as before)
    this.renderer.setStyle(
      this.warpLayer,
      'background',
      `radial-gradient(
        140px 140px at 50% 50%,
        rgba(255,255,255,0.15),
        rgba(255,255,255,0.08) 35%,
        rgba(255,255,255,0) 70%
      ),
      linear-gradient(180deg, rgba(255,255,255,0.12), rgba(255,255,255,0) 65%),
      rgba(0,0,0,0.12)`
    );

    // Backdrop filter and SVG filter
    const blur = this.backdropBlur;
    const saturation = this.liquidGlassSaturation();
    this.renderer.setStyle(this.warpLayer, 'backdrop-filter', `blur(${blur}px) saturate(${saturation}%)`);
    this.renderer.setStyle(this.warpLayer, 'filter', `url(#${this.filterId})`);

    // Insert at the beginning so it's behind the content
    this.renderer.insertBefore(this.host, this.warpLayer, this.host.firstChild);

    // Ensure all direct children have higher z-index
    const children = this.host.children;
    for (let i = 0; i < children.length; i++) {
      const child = children[i] as HTMLElement;
      if (child !== this.warpLayer) {
        this.renderer.setStyle(child, 'position', 'relative');
        this.renderer.setStyle(child, 'z-index', '1');
      }
    }

    // Track for cleanup
    this.cleanup.push(() => {
      if (this.warpLayer) {
        this.renderer.removeChild(this.host, this.warpLayer);
        this.warpLayer = null;
      }
    });
  }

  private createSvgFilter(): void {
    const isFirefox = typeof navigator !== 'undefined' && navigator.userAgent.toLowerCase().includes('firefox');
    if (isFirefox) return;

    this.svgFilter = this.renderer.createElement('svg', 'svg') as SVGSVGElement;
    this.renderer.setAttribute(this.svgFilter, 'width', '0');
    this.renderer.setAttribute(this.svgFilter, 'height', '0');
    this.renderer.setAttribute(this.svgFilter, 'style', 'position:absolute; width:0; height:0; overflow:hidden;');

    const defs = this.renderer.createElement('defs', 'svg');
    const filter = this.renderer.createElement('filter', 'svg');

    this.renderer.setAttribute(filter, 'id', this.filterId);
    // Match component's filter region
    this.renderer.setAttribute(filter, 'x', '-35%');
    this.renderer.setAttribute(filter, 'y', '-35%');
    this.renderer.setAttribute(filter, 'width', '170%');
    this.renderer.setAttribute(filter, 'height', '170%');
    this.renderer.setAttribute(filter, 'color-interpolation-filters', 'sRGB');

    // Create displacement map image
    const displacementMapUrl = getDisplacementMapUrl(this.liquidGlassMode());
    const feImage = this.renderer.createElement('feImage', 'svg');
    this.renderer.setAttribute(feImage, 'id', 'feimage');
    this.renderer.setAttribute(feImage, 'x', '0');
    this.renderer.setAttribute(feImage, 'y', '0');
    this.renderer.setAttribute(feImage, 'width', '100%');
    this.renderer.setAttribute(feImage, 'height', '100%');
    this.renderer.setAttribute(feImage, 'result', 'DISPLACEMENT_MAP');
    this.renderer.setAttribute(feImage, 'href', displacementMapUrl);
    this.renderer.setAttribute(feImage, 'preserveAspectRatio', 'xMidYMid slice');

    // Create edge mask using the displacement map itself
    const feColorMatrix = this.renderer.createElement('feColorMatrix', 'svg');
    this.renderer.setAttribute(feColorMatrix, 'in', 'DISPLACEMENT_MAP');
    this.renderer.setAttribute(feColorMatrix, 'type', 'matrix');
    this.renderer.setAttribute(feColorMatrix, 'values', '0.3 0.3 0.3 0 0 0.3 0.3 0.3 0 0 0.3 0.3 0.3 0 0 0 0 0 1 0');
    this.renderer.setAttribute(feColorMatrix, 'result', 'EDGE_INTENSITY');

    const feComponentTransfer = this.renderer.createElement('feComponentTransfer', 'svg');
    this.renderer.setAttribute(feComponentTransfer, 'in', 'EDGE_INTENSITY');
    this.renderer.setAttribute(feComponentTransfer, 'result', 'EDGE_MASK');

    const feFuncA = this.renderer.createElement('feFuncA', 'svg');
    this.renderer.setAttribute(feFuncA, 'type', 'discrete');
    this.renderer.setAttribute(feFuncA, 'tableValues', '0 0.1 1');
    feComponentTransfer.appendChild(feFuncA);

    // Original undisplaced image for center
    const feOffset = this.renderer.createElement('feOffset', 'svg');
    this.renderer.setAttribute(feOffset, 'in', 'SourceGraphic');
    this.renderer.setAttribute(feOffset, 'dx', '0');
    this.renderer.setAttribute(feOffset, 'dy', '0');
    this.renderer.setAttribute(feOffset, 'result', 'CENTER_ORIGINAL');

    // Calculate displacement scales for chromatic aberration
    const aberrationIntensity = this.liquidGlassAberrationIntensity();
    const baseScale = -this.liquidGlassDisplacementScale();
    const redScale = baseScale;
    const greenScale = baseScale * (1 - aberrationIntensity * 0.05);
    const blueScale = baseScale * (1 - aberrationIntensity * 0.1);

    // Red channel displacement
    const redDisplacement = this.renderer.createElement('feDisplacementMap', 'svg');
    this.renderer.setAttribute(redDisplacement, 'in', 'SourceGraphic');
    this.renderer.setAttribute(redDisplacement, 'in2', 'DISPLACEMENT_MAP');
    this.renderer.setAttribute(redDisplacement, 'scale', String(redScale));
    this.renderer.setAttribute(redDisplacement, 'xChannelSelector', 'R');
    this.renderer.setAttribute(redDisplacement, 'yChannelSelector', 'B');
    this.renderer.setAttribute(redDisplacement, 'result', 'RED_DISPLACED');

    const redMatrix = this.renderer.createElement('feColorMatrix', 'svg');
    this.renderer.setAttribute(redMatrix, 'in', 'RED_DISPLACED');
    this.renderer.setAttribute(redMatrix, 'type', 'matrix');
    this.renderer.setAttribute(redMatrix, 'values', '1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0');
    this.renderer.setAttribute(redMatrix, 'result', 'RED_CHANNEL');

    // Green channel displacement
    const greenDisplacement = this.renderer.createElement('feDisplacementMap', 'svg');
    this.renderer.setAttribute(greenDisplacement, 'in', 'SourceGraphic');
    this.renderer.setAttribute(greenDisplacement, 'in2', 'DISPLACEMENT_MAP');
    this.renderer.setAttribute(greenDisplacement, 'scale', String(greenScale));
    this.renderer.setAttribute(greenDisplacement, 'xChannelSelector', 'R');
    this.renderer.setAttribute(greenDisplacement, 'yChannelSelector', 'B');
    this.renderer.setAttribute(greenDisplacement, 'result', 'GREEN_DISPLACED');

    const greenMatrix = this.renderer.createElement('feColorMatrix', 'svg');
    this.renderer.setAttribute(greenMatrix, 'in', 'GREEN_DISPLACED');
    this.renderer.setAttribute(greenMatrix, 'type', 'matrix');
    this.renderer.setAttribute(greenMatrix, 'values', '0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 1 0');
    this.renderer.setAttribute(greenMatrix, 'result', 'GREEN_CHANNEL');

    // Blue channel displacement
    const blueDisplacement = this.renderer.createElement('feDisplacementMap', 'svg');
    this.renderer.setAttribute(blueDisplacement, 'in', 'SourceGraphic');
    this.renderer.setAttribute(blueDisplacement, 'in2', 'DISPLACEMENT_MAP');
    this.renderer.setAttribute(blueDisplacement, 'scale', String(blueScale));
    this.renderer.setAttribute(blueDisplacement, 'xChannelSelector', 'R');
    this.renderer.setAttribute(blueDisplacement, 'yChannelSelector', 'B');
    this.renderer.setAttribute(blueDisplacement, 'result', 'BLUE_DISPLACED');

    const blueMatrix = this.renderer.createElement('feColorMatrix', 'svg');
    this.renderer.setAttribute(blueMatrix, 'in', 'BLUE_DISPLACED');
    this.renderer.setAttribute(blueMatrix, 'type', 'matrix');
    this.renderer.setAttribute(blueMatrix, 'values', '0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 1 0');
    this.renderer.setAttribute(blueMatrix, 'result', 'BLUE_CHANNEL');

    // Combine all channels with screen blend mode for chromatic aberration
    const blend1 = this.renderer.createElement('feBlend', 'svg');
    this.renderer.setAttribute(blend1, 'in', 'GREEN_CHANNEL');
    this.renderer.setAttribute(blend1, 'in2', 'BLUE_CHANNEL');
    this.renderer.setAttribute(blend1, 'mode', 'screen');
    this.renderer.setAttribute(blend1, 'result', 'GB_COMBINED');

    const blend2 = this.renderer.createElement('feBlend', 'svg');
    this.renderer.setAttribute(blend2, 'in', 'RED_CHANNEL');
    this.renderer.setAttribute(blend2, 'in2', 'GB_COMBINED');
    this.renderer.setAttribute(blend2, 'mode', 'screen');
    this.renderer.setAttribute(blend2, 'result', 'RGB_COMBINED');

    // Add slight blur to soften the aberration effect
    const blurStdDeviation = Math.max(0.1, 0.5 - aberrationIntensity * 0.1);
    const feGaussianBlur = this.renderer.createElement('feGaussianBlur', 'svg');
    this.renderer.setAttribute(feGaussianBlur, 'in', 'RGB_COMBINED');
    this.renderer.setAttribute(feGaussianBlur, 'stdDeviation', String(blurStdDeviation));
    this.renderer.setAttribute(feGaussianBlur, 'result', 'ABERRATED_BLURRED');

    // Apply edge mask to aberration effect
    const composite1 = this.renderer.createElement('feComposite', 'svg');
    this.renderer.setAttribute(composite1, 'in', 'ABERRATED_BLURRED');
    this.renderer.setAttribute(composite1, 'in2', 'EDGE_MASK');
    this.renderer.setAttribute(composite1, 'operator', 'in');
    this.renderer.setAttribute(composite1, 'result', 'EDGE_ABERRATION');

    // Create inverted mask for center
    const feComponentTransfer2 = this.renderer.createElement('feComponentTransfer', 'svg');
    this.renderer.setAttribute(feComponentTransfer2, 'in', 'EDGE_MASK');
    this.renderer.setAttribute(feComponentTransfer2, 'result', 'INVERTED_MASK');

    const feFuncA2 = this.renderer.createElement('feFuncA', 'svg');
    this.renderer.setAttribute(feFuncA2, 'type', 'table');
    this.renderer.setAttribute(feFuncA2, 'tableValues', '1 0');
    feComponentTransfer2.appendChild(feFuncA2);

    const composite2 = this.renderer.createElement('feComposite', 'svg');
    this.renderer.setAttribute(composite2, 'in', 'CENTER_ORIGINAL');
    this.renderer.setAttribute(composite2, 'in2', 'INVERTED_MASK');
    this.renderer.setAttribute(composite2, 'operator', 'in');
    this.renderer.setAttribute(composite2, 'result', 'CENTER_CLEAN');

    // Combine edge aberration with clean center
    const composite3 = this.renderer.createElement('feComposite', 'svg');
    this.renderer.setAttribute(composite3, 'in', 'EDGE_ABERRATION');
    this.renderer.setAttribute(composite3, 'in2', 'CENTER_CLEAN');
    this.renderer.setAttribute(composite3, 'operator', 'over');

    // Append all elements in correct order
    filter.appendChild(feImage);
    filter.appendChild(feColorMatrix);
    filter.appendChild(feComponentTransfer);
    filter.appendChild(feOffset);
    filter.appendChild(redDisplacement);
    filter.appendChild(redMatrix);
    filter.appendChild(greenDisplacement);
    filter.appendChild(greenMatrix);
    filter.appendChild(blueDisplacement);
    filter.appendChild(blueMatrix);
    filter.appendChild(blend1);
    filter.appendChild(blend2);
    filter.appendChild(feGaussianBlur);
    filter.appendChild(composite1);
    filter.appendChild(feComponentTransfer2);
    filter.appendChild(composite2);
    filter.appendChild(composite3);

    defs.appendChild(filter);
    this.svgFilter.appendChild(defs);
    this.renderer.appendChild(this.host, this.svgFilter);

    // Track for cleanup
    this.cleanup.push(() => {
      if (this.svgFilter) {
        this.renderer.removeChild(this.host, this.svgFilter);
        this.svgFilter = null;
      }
    });
  }

  private createBorderLayer(): void {
    const borderLayer = this.renderer.createElement('div');
    this.renderer.setStyle(borderLayer, 'pointer-events', 'none');
    this.renderer.setStyle(borderLayer, 'position', 'absolute');
    this.renderer.setStyle(borderLayer, 'inset', '0');
    this.renderer.setStyle(borderLayer, 'border-radius', 'inherit');
    this.renderer.setStyle(borderLayer, 'z-index', '2');
    this.renderer.setStyle(borderLayer, 'transition', 'box-shadow 0.2s ease-out');
    this.renderer.setStyle(
      borderLayer,
      'box-shadow',
      '0 4px 12px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.15)'
    );
    this.renderer.setStyle(borderLayer, 'border', '1px solid rgba(255,255,255,0.2)');

    this.renderer.appendChild(this.host, borderLayer);

    // Track for cleanup
    this.cleanup.push(() => {
      this.renderer.removeChild(this.host, borderLayer);
    });
  }

  // ========== Animation ==========

  private startAnimationLoop(): void {
    const k = 1 - Math.pow(1 - this.liquidGlassElasticity(), 2);

    const loop = () => {
      // Only animate when hovered, active, or mouse is near to avoid wasting CPU
      if (!this.isHovered && !this.isActive) {
        // Check if mouse is within activation zone
        const fadeIn = this.calculateFadeInFactor();
        if (fadeIn === 0) {
          // Idle - continue loop but skip heavy calculations
          this.animationFrameId = requestAnimationFrame(loop);
          return;
        }
      }

      this.curX += (this.targetX - this.curX) * k;
      this.curY += (this.targetY - this.curY) * k;

      this.updateTransform();

      this.animationFrameId = requestAnimationFrame(loop);
    };

    this.animationFrameId = requestAnimationFrame(loop);
  }

  private updateTransform(): void {
    const translation = this.calculateElasticTranslation();
    const scale = this.isActive ? 'scale(0.96)' : this.calculateDirectionalScale();

    const transform = `translate(${translation.x}px, ${translation.y}px) ${scale}`;
    this.renderer.setStyle(this.host, 'transform', transform);
  }

  // ========== Algorithms ==========

  private calculateDirectionalScale(): string {
    if (!this.internalGlobalMousePos.x || !this.internalGlobalMousePos.y) {
      return 'scale(1)';
    }

    const rect = this.host.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const deltaX = this.internalGlobalMousePos.x - centerX;
    const deltaY = this.internalGlobalMousePos.y - centerY;

    const edgeDistanceX = Math.max(0, Math.abs(deltaX) - this.glassSize.width / 2);
    const edgeDistanceY = Math.max(0, Math.abs(deltaY) - this.glassSize.height / 2);
    const edgeDistance = Math.sqrt(edgeDistanceX * edgeDistanceX + edgeDistanceY * edgeDistanceY);

    const activationZone = 200;
    if (edgeDistance > activationZone) {
      return 'scale(1)';
    }

    const fadeInFactor = 1 - edgeDistance / activationZone;
    const centerDistance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    if (centerDistance === 0) {
      return 'scale(1)';
    }

    const normalizedX = deltaX / centerDistance;
    const normalizedY = deltaY / centerDistance;

    const stretchIntensity = Math.min(centerDistance / 300, 1) * this.liquidGlassElasticity() * fadeInFactor;

    const scaleX = 1 + Math.abs(normalizedX) * stretchIntensity * 0.3 - Math.abs(normalizedY) * stretchIntensity * 0.15;
    const scaleY = 1 + Math.abs(normalizedY) * stretchIntensity * 0.3 - Math.abs(normalizedX) * stretchIntensity * 0.15;

    return `scaleX(${Math.max(0.8, scaleX)}) scaleY(${Math.max(0.8, scaleY)})`;
  }

  private calculateFadeInFactor(): number {
    if (!this.internalGlobalMousePos.x || !this.internalGlobalMousePos.y) {
      return 0;
    }

    const rect = this.host.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const edgeDistanceX = Math.max(0, Math.abs(this.internalGlobalMousePos.x - centerX) - this.glassSize.width / 2);
    const edgeDistanceY = Math.max(0, Math.abs(this.internalGlobalMousePos.y - centerY) - this.glassSize.height / 2);
    const edgeDistance = Math.sqrt(edgeDistanceX * edgeDistanceX + edgeDistanceY * edgeDistanceY);

    const activationZone = 200;
    return edgeDistance > activationZone ? 0 : 1 - edgeDistance / activationZone;
  }

  private calculateElasticTranslation(): { x: number; y: number } {
    if (!this.internalGlobalMousePos.x || !this.internalGlobalMousePos.y) {
      return { x: 0, y: 0 };
    }

    const fadeInFactor = this.calculateFadeInFactor();
    const rect = this.host.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    return {
      x: (this.internalGlobalMousePos.x - centerX) * this.liquidGlassElasticity() * 0.1 * fadeInFactor,
      y: (this.internalGlobalMousePos.y - centerY) * this.liquidGlassElasticity() * 0.1 * fadeInFactor,
    };
  }

  // ========== Mouse Tracking ==========

  private setupMouseTracking(): void {
    this.ngZone.runOutsideAngular(() => {
      const unlisten = this.renderer.listen(this.host, 'mousemove', (e: MouseEvent) => {
        this.internalGlobalMousePos = {
          x: e.clientX,
          y: e.clientY,
        };
      });

      this.cleanup.push(unlisten);
    });
  }

  // ========== Event Handlers ==========

  @HostListener('mouseenter')
  onMouseEnter(): void {
    this.isHovered = true;
  }

  @HostListener('mouseleave')
  onMouseLeave(): void {
    this.isHovered = false;
    this.targetX = 0.5;
    this.targetY = 0.5;
  }

  @HostListener('mousedown')
  onMouseDown(): void {
    this.isActive = true;
  }

  @HostListener('mouseup')
  onMouseUp(): void {
    this.isActive = false;
  }

  @HostListener('click')
  onClick(): void {
    this.liquidGlassClick.emit();
  }
}
