import {
  Component,
  input,
  output,
  computed,
  inject,
  OnInit,
  signal,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { GlassFilterComponent } from './glass-filter.component';
import type { GlassFilterMode } from './glass-filter.component';
import { ShaderDisplacementService } from '../services/shader-displacement.service';

/**
 * Glass Container Component
 *
 * Inner glass effect component that provides a container with liquid glass
 * distortion effects. Features include:
 *
 * - Refractive distortion using SVG filters
 * - Edge-only chromatic aberration
 * - Backdrop blur with saturation boost
 * - Mouse event tracking for interactive effects
 * - Multiple refraction modes (standard, polar, prominent, shader)
 * - Configurable corner radius, padding, and size
 *
 * @selector spk-glass-container
 * @standalone true
 *
 * @example
 * ```html
 * <spk-glass-container
 *   [mode]="'standard'"
 *   [displacementScale]="25"
 *   [blurAmount]="12"
 *   [saturation]="180"
 *   [cornerRadius]="999"
 *   [padding]="'24px 32px'"
 *   [overLight]="false"
 *   (mouseEnter)="onMouseEnter()"
 *   (mouseLeave)="onMouseLeave()">
 *   <ng-content />
 * </spk-glass-container>
 * ```
 */
@Component({
  selector: 'spk-glass-container',
  standalone: true,
  imports: [CommonModule, GlassFilterComponent],
  host: {
    '[class.spk-glass-container]': 'true',
    '[class.cursor-pointer]': 'hasClick()',
    '[class.active]': 'active()',
  },
  template: `
    <spk-glass-filter
      [id]="filterId()"
      [mode]="mode()"
      [displacementScale]="displacementScale()"
      [aberrationIntensity]="aberrationIntensity()"
      [width]="glassSize().width"
      [height]="glassSize().height"
      [shaderMapUrl]="shaderMapUrl()"
    />

    <div
      class="spk-glass"
      [style.border-radius.px]="cornerRadius()"
      [style.padding]="padding()"
      [style.box-shadow]="boxShadow()"
      (mouseenter)="handleMouseEnter()"
      (mouseleave)="handleMouseLeave()"
      (mousedown)="handleMouseDown()"
      (mouseup)="handleMouseUp()"
      (click)="handleClick($event)"
    >
      <!-- backdrop layer that gets wiggly -->
      <span
        class="spk-glass__warp"
        [style.filter]="warpFilter()"
        [style.backdrop-filter]="backdropFilter()"
      ></span>

      <!-- user content stays sharp -->
      <div
        class="spk-glass__content"
        [style.text-shadow]="textShadow()"
      >
        <ng-content />
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: inline-block;
        position: relative;
      }
      .spk-glass-container {
        position: relative;
        display: inline-block;
      }
      .spk-glass-container.active {
        transform: scale(0.96);
      }
      .spk-glass {
        position: relative;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        overflow: hidden;
        transition: all 0.2s ease-in-out;
        isolation: isolate;
      }
      .spk-glass__warp {
        position: absolute;
        inset: -50%;
        width: 200%;
        height: 200%;
        pointer-events: none;
        z-index: 0;
      }
      .spk-glass__content {
        position: relative;
        z-index: 1;
        font: 500 16px/1.2 system-ui, -apple-system, sans-serif;
        color: white;
        display: flex;
        align-items: center;
        gap: inherit;
      }
    `,
  ],
})
export class GlassContainerComponent implements OnInit {
  private readonly shaderDisplacementService = inject(ShaderDisplacementService);

  // ========== Inputs ==========

  /** Displacement scale - controls distortion intensity (default: 25) */
  readonly displacementScale = input<number>(25);

  /** Blur amount - controls backdrop blur strength (default: 12) */
  readonly blurAmount = input<number>(12);

  /** Saturation boost for backdrop filter (default: 180) */
  readonly saturation = input<number>(180);

  /** Chromatic aberration intensity - RGB split effect (default: 2) */
  readonly aberrationIntensity = input<number>(2);

  /** Corner radius in pixels (default: 999 for fully rounded) */
  readonly cornerRadius = input<number>(999);

  /** Internal padding (default: '24px 32px') */
  readonly padding = input<string>('24px 32px');

  /** Glass size dimensions for filter sizing (default: {width: 270, height: 69}) */
  readonly glassSize = input<{ width: number; height: number }>({
    width: 270,
    height: 69,
  });

  /** Refraction mode - determines distortion pattern */
  readonly mode = input<GlassFilterMode>('standard');

  /** Over-light mode - increases blur and shadow intensity */
  readonly overLight = input<boolean>(false);

  /** Active state - applies active styling when true */
  readonly active = input<boolean>(false);

  /** Whether click handler is attached (adds cursor pointer) */
  readonly hasClick = input<boolean>(false);

  // ========== Outputs ==========

  /** Emitted when mouse enters the glass container */
  readonly mouseEnter = output<void>();

  /** Emitted when mouse leaves the glass container */
  readonly mouseLeave = output<void>();

  /** Emitted when mouse button is pressed */
  readonly mouseDown = output<void>();

  /** Emitted when mouse button is released */
  readonly mouseUp = output<void>();

  /** Emitted when container is clicked */
  readonly click = output<void>();

  // ========== State ==========

  /** Generated shader map URL for shader mode */
  protected readonly shaderMapUrl = signal<string | undefined>(undefined);

  /** Unique filter ID for this instance */
  protected readonly filterId = computed(() => {
    return `glass-filter-${Math.random().toString(16).slice(2)}`;
  });

  /** Detect Firefox browser for filter compatibility */
  private readonly isFirefox = computed(() => {
    if (typeof navigator === 'undefined') return false;
    return navigator.userAgent.toLowerCase().includes('firefox');
  });

  // ========== Computed Styles ==========

  /** Computed box shadow based on overLight mode */
  protected readonly boxShadow = computed(() => {
    return this.overLight()
      ? '0px 16px 70px rgba(0, 0, 0, 0.75)'
      : '0px 12px 40px rgba(0, 0, 0, 0.25)';
  });

  /** Computed warp filter - CSS url() or null for Firefox */
  protected readonly warpFilter = computed(() => {
    if (this.isFirefox()) return 'none';
    return `url(#${this.filterId()})`;
  });

  /** Computed backdrop filter with blur and saturation */
  protected readonly backdropFilter = computed(() => {
    const baseBlur = this.overLight() ? 12 : 4;
    const blur = baseBlur + this.blurAmount() * 32;
    return `blur(${blur}px) saturate(${this.saturation()}%)`;
  });

  /** Computed text shadow based on overLight mode */
  protected readonly textShadow = computed(() => {
    return this.overLight()
      ? '0px 2px 12px rgba(0, 0, 0, 0)'
      : '0px 2px 12px rgba(0, 0, 0, 0.4)';
  });

  // ========== Lifecycle ==========

  constructor() {
    // Generate shader map when entering shader mode
    effect(() => {
      const mode = this.mode();
      const size = this.glassSize();

      if (mode === 'shader') {
        const url = this.shaderDisplacementService.generateShaderDisplacementMap(
          size.width,
          size.height
        );
        this.shaderMapUrl.set(url);
      } else {
        this.shaderMapUrl.set(undefined);
      }
    });
  }

  ngOnInit(): void {
    // Component initialized
  }

  // ========== Event Handlers ==========

  protected handleMouseEnter(): void {
    this.mouseEnter.emit();
  }

  protected handleMouseLeave(): void {
    this.mouseLeave.emit();
  }

  protected handleMouseDown(): void {
    this.mouseDown.emit();
  }

  protected handleMouseUp(): void {
    this.mouseUp.emit();
  }

  protected handleClick(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.click.emit();
  }
}
