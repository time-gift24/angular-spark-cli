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
  EventEmitter,
} from '@angular/core';
import { ShaderDisplacementService } from '../services/shader-displacement.service';
import { getDisplacementMap } from '../utils/displacement-maps';

type GlassFilterMode = 'standard' | 'polar' | 'prominent' | 'shader';

interface MousePosition {
  readonly x: number;
  readonly y: number;
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
  private readonly shaderService = inject(ShaderDisplacementService);

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

  readonly liquidGlassClick = new EventEmitter<void>();

  // ========== Private State ==========

  private host!: HTMLElement;
  private svgFilter: SVGSVGElement | null = null;
  private filterId = '';
  private animationFrameId = 0;
  private cleanup: (() => void)[] = [];
  private styleEl: HTMLStyleElement | null = null;

  // Mouse tracking state
  private targetX = 0.5;
  private targetY = 0.5;
  private curX = 0.5;
  private curY = 0.5;
  private isHovered = false;
  private isActive = false;
  private glassSize = { width: 270, height: 69 };
  private internalGlobalMousePos = { x: 0, y: 0 };
  private internalMouseOffset = { x: 0, y: 0 };

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
    if (!this.isEnabled) return;

    this.host = this.elementRef.nativeElement as HTMLElement;
    this.filterId = `lg-filter-${Math.random().toString(16).slice(2)}`;

    this.setupHostStyles();
    this.createPseudoElementStyles();
    this.createSvgFilter();
    this.createOverlay();
    this.createBorderLayer();
    this.startAnimationLoop();
    this.setupMouseTracking();
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.animationFrameId);
    this.cleanup.forEach(fn => fn());
    if (this.styleEl) {
      this.styleEl.remove();
    }
  }

  // ========== Setup Methods ==========

  private setupHostStyles(): void {
    this.renderer.setStyle(this.host, 'border-radius', `${this.liquidGlassCornerRadius()}px`);
    this.renderer.setStyle(this.host, 'transition', 'all ease-out 0.2s');
    this.renderer.setStyle(this.host, 'padding', this.liquidGlassPadding());
    this.renderer.setStyle(this.host, 'box-shadow', '0px 12px 40px rgba(0, 0, 0, 0.25)');
  }

  /**
   * Create CSS for ::before pseudo-element that handles backdrop-filter
   * This avoids DOM manipulation issues with content projection
   */
  private createPseudoElementStyles(): void {
    // Create unique class for this instance
    const uniqueClass = `lg-${this.filterId}`;
    this.renderer.addClass(this.host, uniqueClass);

    this.styleEl = this.renderer.createElement('style') as HTMLStyleElement;

    const blur = this.backdropBlur;
    const saturation = this.liquidGlassSaturation();

    const css = `
      .${uniqueClass}::before {
        content: '';
        position: absolute;
        inset: -50%;
        width: 200%;
        height: 200%;
        pointer-events: none;
        z-index: 0;
        border-radius: inherit;
        background: radial-gradient(
          140px 140px at 50% 50%,
          rgba(255,255,255,0.15),
          rgba(255,255,255,0.08) 35%,
          rgba(255,255,255,0) 70%
        ),
        linear-gradient(180deg, rgba(255,255,255,0.12), rgba(255,255,255,0) 65%),
        rgba(0,0,0,0.12);
        backdrop-filter: blur(${blur}px) saturate(${saturation}%);
        filter: url(#${this.filterId});
      }
      .${uniqueClass} > * {
        position: relative;
        z-index: 1;
      }
    `;

    this.styleEl.textContent = css;
    this.renderer.appendChild(document.head, this.styleEl);
  }

  private createOverlay(): void {
    // Overlay is now handled by ::before pseudo-element
    // This method is kept for compatibility but does nothing
  }

  private updateOverlayBackground(x: number, y: number): void {
    // Update the ::before pseudo-element background via CSS variable
    const xPct = (x * 100).toFixed(2);
    const yPct = (y * 100).toFixed(2);

    this.renderer.setStyle(
      this.host,
      '--lg-bg-pos',
      `${xPct}% ${yPct}%`
    );
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
    this.renderer.setAttribute(filter, 'x', '-20%');
    this.renderer.setAttribute(filter, 'y', '-20%');
    this.renderer.setAttribute(filter, 'width', '140%');
    this.renderer.setAttribute(filter, 'height', '140%');
    this.renderer.setAttribute(filter, 'color-interpolation-filters', 'sRGB');

    // Create displacement map image
    const displacementMapUrl = getDisplacementMap(this.liquidGlassMode());
    const feImage = this.renderer.createElement('feImage', 'svg');
    this.renderer.setAttribute(feImage, 'href', displacementMapUrl);
    this.renderer.setAttribute(feImage, 'x', '0');
    this.renderer.setAttribute(feImage, 'y', '0');
    this.renderer.setAttribute(feImage, 'width', '100%');
    this.renderer.setAttribute(feImage, 'height', '100%');
    this.renderer.setAttribute(feImage, 'result', 'DISPLACEMENT_MAP');

    // Create displacement map
    const displacement = this.renderer.createElement('feDisplacementMap', 'svg');
    this.renderer.setAttribute(displacement, 'in', 'SourceGraphic');
    this.renderer.setAttribute(displacement, 'in2', 'DISPLACEMENT_MAP');
    this.renderer.setAttribute(displacement, 'scale', String(this.liquidGlassDisplacementScale()));
    this.renderer.setAttribute(displacement, 'xChannelSelector', 'R');
    this.renderer.setAttribute(displacement, 'yChannelSelector', 'G');

    filter.appendChild(feImage);
    filter.appendChild(displacement);
    defs.appendChild(filter);
    this.svgFilter.appendChild(defs);
    this.renderer.appendChild(this.host, this.svgFilter);
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
  }

  // ========== Animation ==========

  private startAnimationLoop(): void {
    const k = 1 - Math.pow(1 - this.liquidGlassElasticity(), 2);

    const loop = () => {
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
        const rect = this.host.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        this.internalMouseOffset = {
          x: ((e.clientX - centerX) / rect.width) * 100,
          y: ((e.clientY - centerY) / rect.height) * 100,
        };

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
