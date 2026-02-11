/**
 * Liquid Glass - Main Component
 *
 * Orchestrates the entire liquid glass effect including:
 * - Directional scaling based on mouse position
 * - Elastic translation toward/away from cursor
 * - Over-light overlay effects
 * - Border layers with gradient animations
 * - Hover effects with radial gradients
 *
 * Reference: .vendor/liquid-glass-react/src/index.tsx (LiquidGlass, lines 249-612)
 */

import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  computed,
  signal,
  inject,
  ElementRef,
  Renderer2,
  AfterViewInit,
  OnDestroy,
  NgZone,
  PLATFORM_ID,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { GlassContainerComponent } from './glass-container.component';
import type { GlassFilterMode } from './glass-filter.component';
import { isPlatformBrowser } from '@angular/common';

/**
 * Mouse position coordinates
 */
interface MousePosition {
  readonly x: number;
  readonly y: number;
}

/**
 * Main Liquid Glass Component
 *
 * A high-performance, reactive liquid glass effect component using Angular Signals.
 * Features edge-based chromatic aberration, elastic mouse tracking, and
 * directional scaling that responds to cursor proximity.
 *
 * @selector spk-liquid-glass
 * @standalone true
 *
 * @example
 * ```html
 * <spk-liquid-glass
 *   [mode]="'standard'"
 *   [displacementScale]="70"
 *   [elasticity]="0.15"
 *   [overLight]="false"
 *   (click)="handleClick()">
 *   <span>Liquid Glass Button</span>
 * </spk-liquid-glass>
 * ```
 */
@Component({
  selector: 'spk-liquid-glass',
  imports: [CommonModule, GlassContainerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': '"spk-liquid-glass-host"',
    '[style.transform]': 'hostTransform()',
    '[style.transition]': '"all 0.2s ease-out"',
  },
  template: `
    @if (overLight()) {
      <!-- Over light effect layer 1 -->
      <div
        class="spk-over-light-layer-1 pointer-events-none transition-all duration-150 ease-in-out"
        [style.opacity]="overLight() ? 0.2 : 0"
      ></div>

      <!-- Over light effect layer 2 (mix-blend-overlay) -->
      <div
        class="spk-over-light-layer-2 pointer-events-none transition-all duration-150 ease-in-out mix-blend-overlay"
        [style.opacity]="overLight() ? 1 : 0"
      ></div>
    }

    <!-- Main glass container -->
    <spk-glass-container
      [class]="glassClass()"
      [style]="containerStyle()"
      [displacementScale]="containerDisplacementScale()"
      [blurAmount]="blurAmount()"
      [saturation]="saturation()"
      [aberrationIntensity]="aberrationIntensity()"
      [cornerRadius]="cornerRadius()"
      [padding]="padding()"
      [glassSize]="glassSize()"
      [overLight]="overLight()"
      [active]="isActive()"
      [hasClick]="true"
      [mode]="mode()"
      (mouseEnter)="onMouseEnter()"
      (mouseLeave)="onMouseLeave()"
      (mouseDown)="onMouseDown()"
      (mouseUp)="onMouseUp()"
      (click)="handleClick()"
    >
      <ng-content />
    </spk-glass-container>

    @if (overLight()) {
      <!-- Border layer 1 - screen blend mode -->
      <span
        class="spk-border-layer-1 pointer-events-none"
        [style.border-radius.px]="cornerRadius()"
      ></span>

      <!-- Border layer 2 - overlay blend mode -->
      <span
        class="spk-border-layer-2 pointer-events-none"
        [style.border-radius.px]="cornerRadius()"
      ></span>
    }

    <!-- Hover effects -->
    @if (hasClick()) {
      <div
        class="spk-hover-effect pointer-events-none"
        [style.opacity]="(isHovered() || isActive()) ? 0.5 : 0"
      ></div>
      <div
        class="spk-active-effect pointer-events-none"
        [style.opacity]="isActive() ? 0.5 : 0"
      ></div>
    }
  `,
  styles: [
    `
      :host {
        display: inline-block;
        position: relative;
      }
      .spk-liquid-glass-host {
        display: inline-block;
      }
      .pointer-events-none {
        pointer-events: none;
      }
      .transition-all {
        transition-property: all;
      }
      .duration-150 {
        transition-duration: 150ms;
      }
      .ease-in-out {
        transition-timing-function: ease-in-out;
      }
      .mix-blend-overlay {
        mix-blend-mode: overlay;
      }
      .spk-over-light-layer-1,
      .spk-over-light-layer-2 {
        position: absolute;
        inset: 0;
        background-color: var(--background);
        transition: all 150ms ease-in-out;
      }
      .spk-border-layer-1 {
        position: absolute;
        inset: 0;
        mix-blend-mode: screen;
        opacity: 0.2;
        padding: 1.5px;
        -webkit-mask: linear-gradient(var(--mask-solid) 0 0) content-box,
          linear-gradient(var(--mask-solid) 0 0);
        -webkit-mask-composite: xor;
        mask-composite: exclude;
        box-shadow: inset 0 0 0 0.5px color-mix(in oklch, var(--card) 50%, transparent),
                    inset 0 1px 3px color-mix(in oklch, var(--card) 25%, transparent),
                    0 1px 4px color-mix(in oklch, var(--foreground) 35%, transparent);
      }
      .spk-border-layer-2 {
        position: absolute;
        inset: 0;
        mix-blend-mode: overlay;
        padding: 1.5px;
        -webkit-mask: linear-gradient(var(--mask-solid) 0 0) content-box,
          linear-gradient(var(--mask-solid) 0 0);
        -webkit-mask-composite: xor;
        mask-composite: exclude;
        box-shadow: inset 0 0 0 0.5px color-mix(in oklch, var(--card) 50%, transparent),
                    inset 0 1px 3px color-mix(in oklch, var(--card) 25%, transparent),
                    0 1px 4px color-mix(in oklch, var(--foreground) 35%, transparent);
      }
      .spk-hover-effect,
      .spk-active-effect {
        position: absolute;
        inset: -1px;
        border-radius: inherit;
        transition: all 0.2s ease-out;
        mix-blend-mode: overlay;
      }
      .spk-hover-effect {
        background-image: radial-gradient(circle at 50% 0%, color-mix(in oklch, var(--card) 50%, transparent) 0%, transparent 50%);
      }
      .spk-active-effect {
        background-image: radial-gradient(circle at 50% 0%, color-mix(in oklch, var(--card) 90%, transparent) 0%, transparent 80%);
      }
    `,
  ],
})
export class LiquidGlassComponent implements AfterViewInit, OnDestroy {
  private readonly elementRef = inject(ElementRef);
  private readonly renderer = inject(Renderer2);
  private readonly ngZone = inject(NgZone);
  private readonly platformId = inject(PLATFORM_ID);

  // ========== Inputs ==========

  /** Displacement scale for refraction intensity (default: 70) */
  readonly displacementScale = input(70);

  /** Blur amount for backdrop filter (default: 0.0625) */
  readonly blurAmount = input(0.0625);

  /** Saturation boost percentage (default: 140) */
  readonly saturation = input(140);

  /** Chromatic aberration intensity (default: 2) */
  readonly aberrationIntensity = input(2);

  /** Elasticity factor for mouse tracking (default: 0.15) */
  readonly elasticity = input(0.15);

  /** Corner radius in pixels (default: 999) */
  readonly cornerRadius = input(999);

  /** Over-light mode increases blur and shadow intensity (default: false) */
  readonly overLight = input(false);

  /** Refraction mode - determines displacement pattern (default: 'standard') */
  readonly mode = input<GlassFilterMode>('standard');

  /** Internal padding (default: '24px 32px') */
  readonly padding = input('24px 32px');

  /** External global mouse position (if null, uses internal tracking) */
  readonly globalMousePos = input<MousePosition | null>(null);

  /** External mouse offset (if null, uses internal tracking) */
  readonly mouseOffset = input<MousePosition | null>(null);

  // ========== Outputs ==========

  /** Emitted when component is clicked */
  readonly click = output<void>();

  /** Track if click output has observers (manual flag) */
  hasClickHandler = false;

  // ========== Internal State ==========

  /** Hover state signal */
  readonly isHovered = signal(false);

  /** Active/pressed state signal */
  readonly isActive = signal(false);

  /** Glass dimensions signal */
  readonly glassSize = signal({ width: 270, height: 69 });

  /** Internal global mouse position (when external not provided) */
  readonly internalGlobalMousePos = signal({ x: 0, y: 0 });

  /** Internal mouse offset (when external not provided) */
  readonly internalMouseOffset = signal({ x: 0, y: 0 });

  /** Stores cleanup functions for event listeners */
  private readonly cleanupFunctions: (() => void)[] = [];

  // ========== Computed Values ==========

  /** Effective global mouse position (external or internal) */
  readonly effectiveGlobalMousePos = computed(() => {
    return this.globalMousePos() || this.internalGlobalMousePos();
  });

  /** Effective mouse offset (external or internal) */
  readonly effectiveMouseOffset = computed(() => {
    return this.mouseOffset() || this.internalMouseOffset();
  });

  /** Whether this component has click handling */
  readonly hasClick = computed(() => this.hasClickHandler);

  /** CSS class for glass container */
  readonly glassClass = computed(() => {
    return '';
  });

  /** Container style (empty for now) */
  readonly containerStyle = computed(() => {
    return {};
  });

  /** Displacement scale for container (reduced in over-light mode) */
  readonly containerDisplacementScale = computed(() => {
    return this.overLight() ? this.displacementScale() * 0.5 : this.displacementScale();
  });

  /** Host transform with elastic effects */
  readonly hostTransform = computed(() => {
    const translation = this.elasticTranslation();
    const scale = this.isActive()
      ? 'scale(0.96)'
      : this.directionalScale();

    return `translate(${translation.x}px, ${translation.y}px) ${scale}`;
  });

  // ========== Core Algorithms ==========

  /**
   * Calculate directional scaling based on mouse position
   *
   * Ported from reference lines 342-391
   * Creates stretch/squash effect based on cursor direction and distance
   */
  readonly directionalScale = computed(() => {
    const mousePos = this.effectiveGlobalMousePos();
    const size = this.glassSize();
    const hostEl = this.elementRef.nativeElement as HTMLElement;

    if (!mousePos.x || !mousePos.y || !hostEl) {
      return 'scale(1)';
    }

    const rect = hostEl.getBoundingClientRect();
    const pillCenterX = rect.left + rect.width / 2;
    const pillCenterY = rect.top + rect.height / 2;
    const pillWidth = size.width;
    const pillHeight = size.height;

    const deltaX = mousePos.x - pillCenterX;
    const deltaY = mousePos.y - pillCenterY;

    // Calculate distance from mouse to pill edges (not center)
    const edgeDistanceX = Math.max(0, Math.abs(deltaX) - pillWidth / 2);
    const edgeDistanceY = Math.max(0, Math.abs(deltaY) - pillHeight / 2);
    const edgeDistance = Math.sqrt(edgeDistanceX * edgeDistanceX + edgeDistanceY * edgeDistanceY);

    // Activation zone: 200px from edges
    const activationZone = 200;

    // If outside activation zone, no effect
    if (edgeDistance > activationZone) {
      return 'scale(1)';
    }

    // Calculate fade-in factor (1 at edge, 0 at activation zone boundary)
    const fadeInFactor = 1 - edgeDistance / activationZone;

    // Normalize the deltas for direction
    const centerDistance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    if (centerDistance === 0) {
      return 'scale(1)';
    }

    const normalizedX = deltaX / centerDistance;
    const normalizedY = deltaY / centerDistance;

    // Calculate stretch factors with fade-in
    const stretchIntensity = Math.min(centerDistance / 300, 1) * this.elasticity() * fadeInFactor;

    // X-axis scaling: stretch horizontally when moving left/right, compress when moving up/down
    const scaleX = 1 + Math.abs(normalizedX) * stretchIntensity * 0.3 - Math.abs(normalizedY) * stretchIntensity * 0.15;

    // Y-axis scaling: stretch vertically when moving up/down, compress when moving left/right
    const scaleY = 1 + Math.abs(normalizedY) * stretchIntensity * 0.3 - Math.abs(normalizedX) * stretchIntensity * 0.15;

    return `scaleX(${Math.max(0.8, scaleX)}) scaleY(${Math.max(0.8, scaleY)})`;
  });

  /**
   * Calculate fade-in factor based on distance from element edges
   *
   * Ported from reference lines 394-411
   * Returns 0 when outside activation zone, 1 at element edge
   */
  readonly fadeInFactor = computed(() => {
    const mousePos = this.effectiveGlobalMousePos();
    const size = this.glassSize();
    const hostEl = this.elementRef.nativeElement as HTMLElement;

    if (!mousePos.x || !mousePos.y || !hostEl) {
      return 0;
    }

    const rect = hostEl.getBoundingClientRect();
    const pillCenterX = rect.left + rect.width / 2;
    const pillCenterY = rect.top + rect.height / 2;
    const pillWidth = size.width;
    const pillHeight = size.height;

    const edgeDistanceX = Math.max(0, Math.abs(mousePos.x - pillCenterX) - pillWidth / 2);
    const edgeDistanceY = Math.max(0, Math.abs(mousePos.y - pillCenterY) - pillHeight / 2);
    const edgeDistance = Math.sqrt(edgeDistanceX * edgeDistanceX + edgeDistanceY * edgeDistanceY);

    const activationZone = 200;
    return edgeDistance > activationZone ? 0 : 1 - edgeDistance / activationZone;
  });

  /**
   * Calculate elastic translation toward/away from cursor
   *
   * Ported from reference lines 414-428
   * Returns offset in pixels based on cursor position and elasticity
   */
  readonly elasticTranslation = computed(() => {
    const mousePos = this.effectiveGlobalMousePos();
    const hostEl = this.elementRef.nativeElement as HTMLElement;

    if (!hostEl || !mousePos.x || !mousePos.y) {
      return { x: 0, y: 0 };
    }

    const fadeIn = this.fadeInFactor();
    const rect = hostEl.getBoundingClientRect();
    const pillCenterX = rect.left + rect.width / 2;
    const pillCenterY = rect.top + rect.height / 2;

    return {
      x: (mousePos.x - pillCenterX) * this.elasticity() * 0.1 * fadeIn,
      y: (mousePos.y - pillCenterY) * this.elasticity() * 0.1 * fadeIn,
    };
  });

  // ========== Lifecycle ==========

  ngAfterViewInit(): void {
    // Update glass size on init
    this.updateGlassSize();

    // Set up mouse tracking if no external mouse position provided
    if (!this.globalMousePos() && !this.mouseOffset()) {
      this.setupMouseTracking();
    }

    // Set up resize listener (only in browser)
    if (isPlatformBrowser(this.platformId)) {
      window.addEventListener('resize', this.updateGlassSizeBound);
      this.cleanupFunctions.push(() => window.removeEventListener('resize', this.updateGlassSizeBound));
    }
  }

  ngOnDestroy(): void {
    // Clean up all registered cleanup functions
    this.cleanupFunctions.forEach(fn => fn());
  }

  // ========== Private Methods ==========

  /**
   * Update glass size by measuring the host element
   */
  private readonly updateGlassSize = (): void => {
    const hostEl = this.elementRef.nativeElement as HTMLElement;
    if (hostEl) {
      const rect = hostEl.getBoundingClientRect();
      this.glassSize.set({ width: rect.width, height: rect.height });
    }
  };

  /**
   * Bound version of updateGlassSize for event listener
   */
  private readonly updateGlassSizeBound = (): void => {
    this.updateGlassSize();
  };

  /**
   * Set up internal mouse tracking with proper cleanup
   */
  private setupMouseTracking(): void {
    const hostEl = this.elementRef.nativeElement as HTMLElement;

    this.ngZone.runOutsideAngular(() => {
      const unlisten = this.renderer.listen(hostEl, 'mousemove', (e: MouseEvent) => {
        const rect = hostEl.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        this.internalMouseOffset.set({
          x: ((e.clientX - centerX) / rect.width) * 100,
          y: ((e.clientY - centerY) / rect.height) * 100,
        });

        this.internalGlobalMousePos.set({
          x: e.clientX,
          y: e.clientY,
        });
      });

      // Store cleanup function
      this.cleanupFunctions.push(unlisten);
    });
  }

  // ========== Event Handlers ==========

  onMouseEnter(): void {
    this.isHovered.set(true);
  }

  onMouseLeave(): void {
    this.isHovered.set(false);
  }

  onMouseDown(): void {
    this.isActive.set(true);
  }

  onMouseUp(): void {
    this.isActive.set(false);
  }

  handleClick(): void {
    this.click.emit();
  }
}
