import {
  Directive,
  ElementRef,
  Renderer2,
  inject,
  OnInit,
  OnDestroy,
  input,
  output,
  booleanAttribute,
  PLATFORM_ID,
  NgZone,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import {
  LiquidGlassTheme,
  LiquidGlassRefractionMode,
  LiquidGlassColorConfig,
} from '@app/shared/ui/liquid-glass/types/liquid-glass.types';
import { LiquidGlassThemeResolver } from '@app/shared/ui/liquid-glass/services/theme-resolver.service';
import { ShaderDisplacementService } from '@app/shared/ui/liquid-glass/services/shader-displacement.service';
import { displacementMap } from '@app/shared/ui/liquid-glass/constants/displacement-map';
import { polarDisplacementMap } from '@app/shared/ui/liquid-glass/constants/polar-displacement-map';
import { prominentDisplacementMap } from '@app/shared/ui/liquid-glass/constants/prominent-displacement-map';

/**
 * Returns the displacement map for a given refraction mode.
 */
function getDisplacementMapUrl(
  mode: LiquidGlassRefractionMode,
  shaderMapUrl?: string,
): string {
  switch (mode) {
    case 'standard':
      return displacementMap;
    case 'polar':
      return polarDisplacementMap;
    case 'prominent':
      return prominentDisplacementMap;
    case 'shader':
      return shaderMapUrl || displacementMap;
    default:
      return displacementMap;
  }
}

/**
 * Liquid glass directive that applies vendor-equivalent edge-only refraction.
 */
@Directive({
  selector: '[liquidGlass]',
  host: {
    '[class.liquid-glass]': 'isEnabled',
    '[class.lg-host]': 'isEnabled',
    '(mouseenter)': 'onPointerEnter()',
    '(mouseleave)': 'onPointerLeave()',
    '(mousedown)': 'onMouseDown()',
    '(mouseup)': 'onMouseUp()',
    '(focus)': 'onFocus()',
    '(blur)': 'onBlur()',
    '(click)': 'onClick()',
  },
})
export class LiquidGlassDirective implements OnInit, OnDestroy {
  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly renderer = inject(Renderer2);
  private readonly ngZone = inject(NgZone);
  private readonly platformId = inject(PLATFORM_ID);

  private readonly themeResolver = inject(LiquidGlassThemeResolver);
  private readonly shaderDisplacementService = inject(ShaderDisplacementService);

  private readonly isBrowser = isPlatformBrowser(this.platformId);

  // Compatibility with `[liquidGlass]="false"`
  readonly liquidGlassInput = input(true, {
    alias: 'liquidGlass',
    transform: booleanAttribute,
  });

  readonly lgThemeInput = input<LiquidGlassTheme>('mineral-dark', { alias: 'lgTheme' });
  readonly lgModeInput = input<LiquidGlassRefractionMode>('standard', { alias: 'lgMode' });

  readonly lgBorderInput = input<string | undefined>(undefined, { alias: 'lgBorder' });
  readonly lgHotspotInput = input<string | undefined>(undefined, { alias: 'lgHotspot' });
  readonly lgTintInput = input<string | undefined>(undefined, { alias: 'lgTint' });

  readonly lgAriaLabelInput = input('Liquid glass card', { alias: 'lgAriaLabel' });
  readonly lgRoleInput = input('region', { alias: 'lgRole' });

  readonly lgCornerRadiusInput = input('999px', { alias: 'lgCornerRadius' });
  readonly lgBorderWidthInput = input(1, { alias: 'lgBorderWidth' });
  readonly lgBorderWidthActiveInput = input(2, { alias: 'lgBorderWidthActive' });

  readonly lgDisableFiltersInput = input(false, {
    alias: 'lgDisableFilters',
    transform: booleanAttribute,
  });
  readonly lgDisplacementScaleInput = input(70, { alias: 'lgDisplacementScale' });
  readonly lgBlurAmountInput = input(0.0625, { alias: 'lgBlurAmount' });
  readonly lgSaturationInput = input(140, { alias: 'lgSaturation' });
  readonly lgAberrationIntensityInput = input(2, { alias: 'lgAberrationIntensity' });

  readonly lgDisableAnimationInput = input(false, {
    alias: 'lgDisableAnimation',
    transform: booleanAttribute,
  });
  readonly lgElasticityInput = input(0.15, { alias: 'lgElasticity' });
  readonly lgParallaxIntensityInput = input(2, { alias: 'lgParallaxIntensity' });
  readonly lgRespectReducedMotionInput = input(true, {
    alias: 'lgRespectReducedMotion',
    transform: booleanAttribute,
  });

  // Vendor parity options
  readonly lgOverLightInput = input(false, {
    alias: 'lgOverLight',
    transform: booleanAttribute,
  });
  readonly lgMouseContainerInput = input<HTMLElement | Window | null>(null, {
    alias: 'lgMouseContainer',
  });

  readonly liquidGlassClick = output<void>();

  private get isEnabled(): boolean {
    return this.liquidGlassInput();
  }

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

  private get lgOverLight(): boolean {
    return this.lgOverLightInput();
  }

  private host!: HTMLElement;
  private warpLayer: HTMLSpanElement | null = null;
  private borderLayer: HTMLDivElement | null = null;
  private svgFilter: SVGSVGElement | null = null;

  private filterId = '';
  private animationFrameId = 0;
  private readonly cleanupFns: Array<() => void> = [];

  private isHovered = false;
  private isFocused = false;
  private isActive = false;

  private internalGlobalMousePos = { x: 0, y: 0 };
  private glassSize = { width: 270, height: 69 };

  private reduceMotionDisabledAnimation = false;
  private generatedShaderMapUrl: string | undefined;
  private lastFrameWasIdle = false;

  ngOnInit(): void {
    if (!this.isBrowser || !this.isEnabled) {
      return;
    }

    this.host = this.el.nativeElement;

    if (this.lgRespectReducedMotion && this.prefersReducedMotion()) {
      this.reduceMotionDisabledAnimation = true;
    }

    this.filterId = `lg-filter-${Math.random().toString(16).slice(2)}`;

    this.setupHostStyles();
    this.updateGlassSize();
    this.createWarpLayer();

    if (!this.lgDisableFilters) {
      this.createSvgFilter();
    }

    this.createBorderLayer();
    this.setupAccessibility();
    this.setupMouseTracking();

    const resizeHandler = () => {
      this.updateGlassSize();
      if (!this.lgDisableFilters && this.lgMode === 'shader') {
        this.rebuildSvgFilter();
      }
    };

    window.addEventListener('resize', resizeHandler);
    this.cleanupFns.push(() => window.removeEventListener('resize', resizeHandler));

    if (!this.lgDisableAnimation) {
      this.startAnimationLoop();
    }
  }

  ngOnDestroy(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }

    for (const fn of this.cleanupFns) {
      fn();
    }

    this.cleanupDom();
  }

  onPointerEnter(): void {
    if (!this.isEnabled) return;
    this.isHovered = true;
    this.updateBorderStyle();
  }

  onPointerLeave(): void {
    if (!this.isEnabled) return;
    this.isHovered = false;
    this.updateBorderStyle();
  }

  onMouseDown(): void {
    if (!this.isEnabled) return;
    this.isActive = true;
    this.updateBorderStyle();
  }

  onMouseUp(): void {
    if (!this.isEnabled) return;
    this.isActive = false;
    this.updateBorderStyle();
  }

  onFocus(): void {
    if (!this.isEnabled) return;
    this.isFocused = true;
    this.updateBorderStyle();
  }

  onBlur(): void {
    if (!this.isEnabled) return;
    this.isFocused = false;
    this.updateBorderStyle();
  }

  onClick(): void {
    if (!this.isEnabled) return;
    this.liquidGlassClick.emit();
  }

  private setupHostStyles(): void {
    this.renderer.setStyle(this.host, 'position', 'relative');
    this.renderer.setStyle(this.host, 'isolation', 'isolate');
    this.renderer.setStyle(this.host, 'overflow', 'hidden');
    this.renderer.setStyle(this.host, 'border-radius', this.lgCornerRadius);
    this.renderer.setStyle(this.host, 'box-shadow', 'var(--shadow-control-hover)');
  }

  private createWarpLayer(): void {
    this.warpLayer = this.renderer.createElement('span');
    this.renderer.addClass(this.warpLayer, 'lg-warp');

    this.renderer.setStyle(this.warpLayer, 'position', 'absolute');
    this.renderer.setStyle(this.warpLayer, 'inset', '-50%');
    this.renderer.setStyle(this.warpLayer, 'width', '200%');
    this.renderer.setStyle(this.warpLayer, 'height', '200%');
    this.renderer.setStyle(this.warpLayer, 'pointer-events', 'none');
    this.renderer.setStyle(this.warpLayer, 'z-index', '0');
    this.renderer.setStyle(this.warpLayer, 'border-radius', 'inherit');

    const baseBlur = this.lgOverLight ? 12 : 4;
    const blurPx = baseBlur + this.lgBlurAmount * 32;
    this.renderer.setStyle(
      this.warpLayer,
      'backdrop-filter',
      `blur(${blurPx}px) saturate(${this.lgSaturation}%)`,
    );

    if (!this.lgDisableFilters && !this.isFirefox()) {
      this.renderer.setStyle(this.warpLayer, 'filter', `url(#${this.filterId})`);
    }

    this.updateWarpBackground(0.5, 0.5);

    if (this.host.firstChild) {
      this.renderer.insertBefore(this.host, this.warpLayer, this.host.firstChild);
    } else {
      this.renderer.appendChild(this.host, this.warpLayer);
    }

    this.promoteHostChildren();
  }

  private createBorderLayer(): void {
    this.borderLayer = this.renderer.createElement('div');

    this.renderer.setStyle(this.borderLayer, 'pointer-events', 'none');
    this.renderer.setStyle(this.borderLayer, 'position', 'absolute');
    this.renderer.setStyle(this.borderLayer, 'inset', '0');
    this.renderer.setStyle(this.borderLayer, 'border-radius', 'inherit');
    this.renderer.setStyle(this.borderLayer, 'z-index', '2');
    this.renderer.setStyle(
      this.borderLayer,
      'transition',
      'box-shadow 0.2s ease-out, border-color 0.2s ease-out, border-width 0.2s ease-out',
    );

    this.renderer.appendChild(this.host, this.borderLayer);
    this.updateBorderStyle();
  }

  private createSvgFilter(): void {
    if (!this.warpLayer || this.isFirefox()) {
      return;
    }

    const mode = this.lgMode;
    if (mode === 'shader') {
      this.generatedShaderMapUrl = this.shaderDisplacementService.generateShaderDisplacementMap(
        this.glassSize.width,
        this.glassSize.height,
      );
    } else {
      this.generatedShaderMapUrl = undefined;
    }

    const displacementMapUrl = getDisplacementMapUrl(mode, this.generatedShaderMapUrl);

    this.svgFilter = this.renderer.createElement('svg', 'svg') as SVGSVGElement;
    this.renderer.setAttribute(this.svgFilter, 'width', '0');
    this.renderer.setAttribute(this.svgFilter, 'height', '0');
    this.renderer.setAttribute(
      this.svgFilter,
      'style',
      'position:absolute; width:0; height:0; overflow:hidden;',
    );

    const defs = this.renderer.createElement('defs', 'svg');
    const filter = this.renderer.createElement('filter', 'svg');

    this.renderer.setAttribute(filter, 'id', this.filterId);
    this.renderer.setAttribute(filter, 'x', '-35%');
    this.renderer.setAttribute(filter, 'y', '-35%');
    this.renderer.setAttribute(filter, 'width', '170%');
    this.renderer.setAttribute(filter, 'height', '170%');
    this.renderer.setAttribute(filter, 'color-interpolation-filters', 'sRGB');

    const feImage = this.renderer.createElement('feImage', 'svg');
    this.renderer.setAttribute(feImage, 'id', 'feimage');
    this.renderer.setAttribute(feImage, 'x', '0');
    this.renderer.setAttribute(feImage, 'y', '0');
    this.renderer.setAttribute(feImage, 'width', '100%');
    this.renderer.setAttribute(feImage, 'height', '100%');
    this.renderer.setAttribute(feImage, 'result', 'DISPLACEMENT_MAP');
    this.renderer.setAttribute(feImage, 'href', displacementMapUrl);
    this.renderer.setAttribute(feImage, 'preserveAspectRatio', 'xMidYMid slice');

    const feColorMatrix = this.renderer.createElement('feColorMatrix', 'svg');
    this.renderer.setAttribute(feColorMatrix, 'in', 'DISPLACEMENT_MAP');
    this.renderer.setAttribute(feColorMatrix, 'type', 'matrix');
    this.renderer.setAttribute(
      feColorMatrix,
      'values',
      '0.3 0.3 0.3 0 0 0.3 0.3 0.3 0 0 0.3 0.3 0.3 0 0 0 0 0 1 0',
    );
    this.renderer.setAttribute(feColorMatrix, 'result', 'EDGE_INTENSITY');

    const feComponentTransfer = this.renderer.createElement('feComponentTransfer', 'svg');
    this.renderer.setAttribute(feComponentTransfer, 'in', 'EDGE_INTENSITY');
    this.renderer.setAttribute(feComponentTransfer, 'result', 'EDGE_MASK');

    const feFuncA = this.renderer.createElement('feFuncA', 'svg');
    this.renderer.setAttribute(feFuncA, 'type', 'discrete');
    this.renderer.setAttribute(
      feFuncA,
      'tableValues',
      `0 ${this.lgAberrationIntensity * 0.05} 1`,
    );
    feComponentTransfer.appendChild(feFuncA);

    const feOffset = this.renderer.createElement('feOffset', 'svg');
    this.renderer.setAttribute(feOffset, 'in', 'SourceGraphic');
    this.renderer.setAttribute(feOffset, 'dx', '0');
    this.renderer.setAttribute(feOffset, 'dy', '0');
    this.renderer.setAttribute(feOffset, 'result', 'CENTER_ORIGINAL');

    const modeMultiplier = mode === 'shader' ? 1 : -1;
    const baseScale = this.lgDisplacementScale;
    const redScale = baseScale * modeMultiplier;
    const greenScale = baseScale * (modeMultiplier - this.lgAberrationIntensity * 0.05);
    const blueScale = baseScale * (modeMultiplier - this.lgAberrationIntensity * 0.1);

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

    const feGaussianBlur = this.renderer.createElement('feGaussianBlur', 'svg');
    this.renderer.setAttribute(feGaussianBlur, 'in', 'RGB_COMBINED');
    this.renderer.setAttribute(
      feGaussianBlur,
      'stdDeviation',
      String(Math.max(0.1, 0.5 - this.lgAberrationIntensity * 0.1)),
    );
    this.renderer.setAttribute(feGaussianBlur, 'result', 'ABERRATED_BLURRED');

    const composite1 = this.renderer.createElement('feComposite', 'svg');
    this.renderer.setAttribute(composite1, 'in', 'ABERRATED_BLURRED');
    this.renderer.setAttribute(composite1, 'in2', 'EDGE_MASK');
    this.renderer.setAttribute(composite1, 'operator', 'in');
    this.renderer.setAttribute(composite1, 'result', 'EDGE_ABERRATION');

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

    const composite3 = this.renderer.createElement('feComposite', 'svg');
    this.renderer.setAttribute(composite3, 'in', 'EDGE_ABERRATION');
    this.renderer.setAttribute(composite3, 'in2', 'CENTER_CLEAN');
    this.renderer.setAttribute(composite3, 'operator', 'over');

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

    if (this.warpLayer) {
      this.renderer.setStyle(this.warpLayer, 'filter', `url(#${this.filterId})`);
    }
  }

  private rebuildSvgFilter(): void {
    if (this.svgFilter) {
      this.renderer.removeChild(this.host, this.svgFilter);
      this.svgFilter = null;
    }
    this.createSvgFilter();
  }

  private setupMouseTracking(): void {
    const target = this.lgMouseContainerInput() || window;

    this.ngZone.runOutsideAngular(() => {
      const handler: EventListener = (event) => {
        if (!(event instanceof MouseEvent)) {
          return;
        }

        this.internalGlobalMousePos = { x: event.clientX, y: event.clientY };
      };

      target.addEventListener('mousemove', handler, { passive: true });
      this.cleanupFns.push(() => target.removeEventListener('mousemove', handler));
    });
  }

  private startAnimationLoop(): void {
    const loop = () => {
      const isInteracting =
        this.host.classList.contains('is-interacting') ||
        this.host.classList.contains('cdk-drag-dragging');

      if (isInteracting) {
        this.renderer.removeStyle(this.host, 'transform');
        this.animationFrameId = requestAnimationFrame(loop);
        return;
      }

      const fadeIn = this.calculateFadeInFactor();
      if (!this.isHovered && !this.isActive && !this.isFocused && fadeIn === 0) {
        if (!this.lastFrameWasIdle) {
          this.renderer.setStyle(this.host, 'transform', 'translate(0px, 0px) scale(1)');
          this.updateWarpBackground(0.5, 0.5);
          this.lastFrameWasIdle = true;
        }
        this.animationFrameId = requestAnimationFrame(loop);
        return;
      }

      this.lastFrameWasIdle = false;
      this.updateTransform(fadeIn);
      this.animationFrameId = requestAnimationFrame(loop);
    };

    this.animationFrameId = requestAnimationFrame(loop);
  }

  private updateTransform(fadeInFactor: number): void {
    const translation = this.calculateElasticTranslation(fadeInFactor);
    const scale = this.isActive ? 'scale(0.96)' : this.calculateDirectionalScale(fadeInFactor);

    this.renderer.setStyle(
      this.host,
      'transform',
      `translate(${translation.x}px, ${translation.y}px) ${scale}`,
    );

    const rect = this.host.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
      return;
    }

    const x = this.clamp01((this.internalGlobalMousePos.x - rect.left) / rect.width);
    const y = this.clamp01((this.internalGlobalMousePos.y - rect.top) / rect.height);
    this.updateWarpBackground(x, y);
  }

  private calculateDirectionalScale(fadeInFactor: number): string {
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

    if (edgeDistance > 200) {
      return 'scale(1)';
    }

    const centerDistance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    if (centerDistance === 0) {
      return 'scale(1)';
    }

    const normalizedX = deltaX / centerDistance;
    const normalizedY = deltaY / centerDistance;

    const stretchIntensity =
      Math.min(centerDistance / 300, 1) * this.clamp01(this.lgElasticity) * fadeInFactor;

    const scaleX =
      1 +
      Math.abs(normalizedX) * stretchIntensity * 0.3 -
      Math.abs(normalizedY) * stretchIntensity * 0.15;

    const scaleY =
      1 +
      Math.abs(normalizedY) * stretchIntensity * 0.3 -
      Math.abs(normalizedX) * stretchIntensity * 0.15;

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

    return edgeDistance > 200 ? 0 : 1 - edgeDistance / 200;
  }

  private calculateElasticTranslation(fadeInFactor: number): { x: number; y: number } {
    if (!this.internalGlobalMousePos.x || !this.internalGlobalMousePos.y) {
      return { x: 0, y: 0 };
    }

    const rect = this.host.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const baseX = (this.internalGlobalMousePos.x - centerX) * this.clamp01(this.lgElasticity) * 0.1;
    const baseY = (this.internalGlobalMousePos.y - centerY) * this.clamp01(this.lgElasticity) * 0.1;

    return {
      x: baseX * fadeInFactor,
      y: baseY * fadeInFactor,
    };
  }

  private updateWarpBackground(x: number, y: number): void {
    if (!this.warpLayer) {
      return;
    }

    const colors = this.getResolvedColors();
    const xPct = (x * 100).toFixed(2);
    const yPct = (y * 100).toFixed(2);

    const hotspotAlpha = this.lgOverLight ? 26 : 15;
    const cardAlpha = this.lgOverLight ? 14 : 8;
    const topAlpha = this.lgOverLight ? 20 : 12;

    const gradient = `
      radial-gradient(
        140px 140px at ${xPct}% ${yPct}%,
        ${colors.hotspot},
        color-mix(in oklch, var(--card) ${cardAlpha}%, transparent) 35%,
        transparent 70%
      ),
      linear-gradient(
        180deg,
        color-mix(in oklch, var(--card) ${topAlpha}%, transparent),
        transparent 65%
      ),
      ${colors.tint}
    `
      .replace(/\s+/g, ' ')
      .trim();

    this.renderer.setStyle(this.warpLayer, 'background', gradient);

    const dx = (x - 0.5) * 2;
    const dy = (y - 0.5) * 2;
    this.renderer.setStyle(
      this.warpLayer,
      'transform',
      `translate3d(${(-dx * this.lgParallaxIntensity).toFixed(2)}px, ${(-dy * this.lgParallaxIntensity).toFixed(2)}px, 0)`,
    );

    // Keep subtle chromatic tinting in sync with theme colors.
    const aberration = Math.max(0, this.lgAberrationIntensity);
    if (this.warpLayer && !this.lgDisableFilters && !this.isFirefox()) {
      this.renderer.setStyle(
        this.warpLayer,
        'filter',
        `url(#${this.filterId}) drop-shadow(${aberration}px 0 ${colors.aberration1}) drop-shadow(${-aberration}px 0 ${colors.aberration2})`,
      );
    }
  }

  private updateBorderStyle(): void {
    if (!this.borderLayer) {
      return;
    }

    const colors = this.getResolvedColors();
    const active = this.isHovered || this.isFocused || this.isActive;

    this.renderer.setStyle(this.borderLayer, 'border-style', 'solid');
    this.renderer.setStyle(this.borderLayer, 'border-color', colors.border);
    this.renderer.setStyle(
      this.borderLayer,
      'border-width',
      `${active ? this.lgBorderWidthActive : this.lgBorderWidth}px`,
    );

    const baseShadow =
      'var(--shadow-control-active), inset 0 1px 0 color-mix(in oklch, var(--card) 15%, transparent)';
    const activeShadow = 'var(--shadow-control-hover), var(--shadow-focus-ring)';

    this.renderer.setStyle(this.borderLayer, 'box-shadow', active ? activeShadow : baseShadow);
  }

  private setupAccessibility(): void {
    if (!this.host.hasAttribute('role') && this.lgRole.trim()) {
      this.renderer.setAttribute(this.host, 'role', this.lgRole);
    }

    if (!this.host.hasAttribute('aria-label') && this.lgAriaLabel.trim()) {
      this.renderer.setAttribute(this.host, 'aria-label', this.lgAriaLabel);
    }
  }

  private updateGlassSize(): void {
    const rect = this.host.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      this.glassSize = {
        width: rect.width,
        height: rect.height,
      };
    }
  }

  private promoteHostChildren(): void {
    const children = Array.from(this.host.children);
    for (const child of children) {
      if (child === this.warpLayer || child === this.borderLayer) {
        continue;
      }

      this.renderer.setStyle(child, 'position', 'relative');
      this.renderer.setStyle(child, 'z-index', '1');
    }
  }

  private cleanupDom(): void {
    if (this.svgFilter?.parentNode) {
      this.svgFilter.parentNode.removeChild(this.svgFilter);
    }

    if (this.borderLayer?.parentNode) {
      this.borderLayer.parentNode.removeChild(this.borderLayer);
    }

    if (this.warpLayer?.parentNode) {
      this.warpLayer.parentNode.removeChild(this.warpLayer);
    }

    this.svgFilter = null;
    this.borderLayer = null;
    this.warpLayer = null;
  }

  private prefersReducedMotion(): boolean {
    return (
      this.isBrowser &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    );
  }

  private isFirefox(): boolean {
    return (
      this.isBrowser &&
      typeof navigator !== 'undefined' &&
      navigator.userAgent.toLowerCase().includes('firefox')
    );
  }

  private clamp01(v: number): number {
    return Math.max(0, Math.min(1, v));
  }

  private getResolvedColors(): LiquidGlassColorConfig {
    const preset = this.themeResolver.getColorConfig(this.lgTheme);

    return {
      border: this.lgBorder || preset.border || 'var(--primary)',
      hotspot:
        this.lgHotspot ||
        preset.hotspot ||
        `color-mix(in oklch, var(--card) ${this.lgOverLight ? 22 : 15}%, transparent)`,
      tint:
        this.lgTint ||
        preset.tint ||
        `color-mix(in oklch, var(--foreground) ${this.lgOverLight ? 22 : 12}%, transparent)`,
      aberration1:
        preset.aberration1 || 'color-mix(in oklch, var(--accent) 18%, transparent)',
      aberration2:
        preset.aberration2 || 'color-mix(in oklch, var(--primary) 16%, transparent)',
    };
  }
}
