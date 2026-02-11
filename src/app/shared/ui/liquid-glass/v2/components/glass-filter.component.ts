import {
  ChangeDetectionStrategy,
  Component,
  input,
  computed,
  inject,
  OnInit,
  OnDestroy,
  ElementRef,
} from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { ShaderDisplacementService } from '../services/shader-displacement.service';
import { displacementMap } from '../constants/displacement-map';
import { polarDisplacementMap } from '../constants/polar-displacement-map';
import { prominentDisplacementMap } from '../constants/prominent-displacement-map';

/**
 * Refraction mode for the glass filter effect
 */
export type GlassFilterMode = 'standard' | 'polar' | 'prominent' | 'shader';

/**
 * Safe displacement map URLs (pre-vetted base64 data URLs)
 */
const SAFE_DISPLACEMENT_MAPS: Record<GlassFilterMode, string> = {
  standard: displacementMap,
  polar: polarDisplacementMap,
  prominent: prominentDisplacementMap,
  shader: displacementMap, // fallback
};

/**
 * Validates that a URL is a safe data URL or matches our allowed patterns
 */
function isValidDisplacementMapUrl(url: string): boolean {
  // Only allow data: URLs with image/svg+xml or image/jpeg
  const safeDataUrlPattern = /^data:image\/(svg\+xml|jpeg);base64,[a-zA-Z0-9+/=]+$/;
  return safeDataUrlPattern.test(url);
}

/**
 * Helper function to get the displacement map URL based on mode
 */
function getDisplacementMap(mode: GlassFilterMode, shaderMapUrl?: string): string {
  switch (mode) {
    case 'standard':
      return SAFE_DISPLACEMENT_MAPS.standard;
    case 'polar':
      return SAFE_DISPLACEMENT_MAPS.polar;
    case 'prominent':
      return SAFE_DISPLACEMENT_MAPS.prominent;
    case 'shader':
      // For shader mode, return the provided shaderMapUrl or fallback
      return shaderMapUrl || SAFE_DISPLACEMENT_MAPS.standard;
    default:
      return SAFE_DISPLACEMENT_MAPS.standard;
  }
}

/**
 * Glass Filter Component
 *
 * Creates an SVG filter with edge-only displacement and chromatic aberration
 * effects for the liquid glass distortion. This component renders an invisible
 * SVG element that is referenced by the CSS filter property.
 *
 * @selector spk-glass-filter
 * @standalone true
 *
 * @example
 * ```html
 * <spk-glass-filter
 *   [id]="filterId"
 *   [mode]="'standard'"
 *   [displacementScale]="25"
 *   [aberrationIntensity]="2"
 *   [width]="270"
 *   [height]="69" />
 * ```
 */
@Component({
  selector: 'spk-glass-filter',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg
      [attr.style]="'position:absolute; width:' + width() + 'px; height:' + height() + 'px;'"
      aria-hidden="true"
    >
      <defs>
        <radialGradient [attr.id]="id() + '-edge-mask'" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="black" [attr.stopOpacity]="0" />
          <stop
            [attr.offset]="edgeMaskOffset() + '%'"
            stopColor="black"
            [attr.stopOpacity]="0"
          />
          <stop offset="100%" stopColor="white" [attr.stopOpacity]="1" />
        </radialGradient>

        <filter
          [attr.id]="id()"
          x="-35%"
          y="-35%"
          width="170%"
          height="170%"
          color-interpolation-filters="sRGB"
        >
          <feImage
            id="feimage"
            x="0"
            y="0"
            width="100%"
            height="100%"
            result="DISPLACEMENT_MAP"
            [attr.href]="displacementMapHref()"
            preserveAspectRatio="xMidYMid slice"
          />

          <!-- Create edge mask using the displacement map itself -->
          <feColorMatrix
            in="DISPLACEMENT_MAP"
            type="matrix"
            values="0.3 0.3 0.3 0 0
                   0.3 0.3 0.3 0 0
                   0.3 0.3 0.3 0 0
                   0 0 0 1 0"
            result="EDGE_INTENSITY"
          />
          <feComponentTransfer in="EDGE_INTENSITY" result="EDGE_MASK">
            <feFuncA type="discrete" [attr.tableValues]="edgeMaskTableValues()" />
          </feComponentTransfer>

          <!-- Original undisplaced image for center -->
          <feOffset in="SourceGraphic" dx="0" dy="0" result="CENTER_ORIGINAL" />

          <!-- Red channel displacement with slight offset -->
          <feDisplacementMap
            in="SourceGraphic"
            in2="DISPLACEMENT_MAP"
            [attr.scale]="redDisplacementScale()"
            xChannelSelector="R"
            yChannelSelector="B"
            result="RED_DISPLACED"
          />
          <feColorMatrix
            in="RED_DISPLACED"
            type="matrix"
            values="1 0 0 0 0
                   0 0 0 0 0
                   0 0 0 0 0
                   0 0 0 1 0"
            result="RED_CHANNEL"
          />

          <!-- Green channel displacement -->
          <feDisplacementMap
            in="SourceGraphic"
            in2="DISPLACEMENT_MAP"
            [attr.scale]="greenDisplacementScale()"
            xChannelSelector="R"
            yChannelSelector="B"
            result="GREEN_DISPLACED"
          />
          <feColorMatrix
            in="GREEN_DISPLACED"
            type="matrix"
            values="0 0 0 0 0
                   0 1 0 0 0
                   0 0 0 0 0
                   0 0 0 1 0"
            result="GREEN_CHANNEL"
          />

          <!-- Blue channel displacement with slight offset -->
          <feDisplacementMap
            in="SourceGraphic"
            in2="DISPLACEMENT_MAP"
            [attr.scale]="blueDisplacementScale()"
            xChannelSelector="R"
            yChannelSelector="B"
            result="BLUE_DISPLACED"
          />
          <feColorMatrix
            in="BLUE_DISPLACED"
            type="matrix"
            values="0 0 0 0 0
                   0 0 0 0 0
                   0 0 1 0 0
                   0 0 0 1 0"
            result="BLUE_CHANNEL"
          />

          <!-- Combine all channels with screen blend mode for chromatic aberration -->
          <feBlend in="GREEN_CHANNEL" in2="BLUE_CHANNEL" mode="screen" result="GB_COMBINED" />
          <feBlend in="RED_CHANNEL" in2="GB_COMBINED" mode="screen" result="RGB_COMBINED" />

          <!-- Add slight blur to soften the aberration effect -->
          <feGaussianBlur
            in="RGB_COMBINED"
            [attr.stdDeviation]="blurStdDeviation()"
            result="ABERRATED_BLURRED"
          />

          <!-- Apply edge mask to aberration effect -->
          <feComposite in="ABERRATED_BLURRED" in2="EDGE_MASK" operator="in" result="EDGE_ABERRATION" />

          <!-- Create inverted mask for center -->
          <feComponentTransfer in="EDGE_MASK" result="INVERTED_MASK">
            <feFuncA type="table" tableValues="1 0" />
          </feComponentTransfer>
          <feComposite in="CENTER_ORIGINAL" in2="INVERTED_MASK" operator="in" result="CENTER_CLEAN" />

          <!-- Combine edge aberration with clean center -->
          <feComposite in="EDGE_ABERRATION" in2="CENTER_CLEAN" operator="over" />
        </filter>
      </defs>
    </svg>
  `,
})
export class GlassFilterComponent implements OnInit, OnDestroy {
  private readonly shaderDisplacementService = inject(ShaderDisplacementService);
  private readonly sanitizer = inject(DomSanitizer);

  /** Unique ID for this filter instance */
  readonly id = input.required<string>();

  /** Refraction mode - determines the displacement map pattern */
  readonly mode = input<GlassFilterMode>('standard');

  /** Displacement scale - controls distortion intensity */
  readonly displacementScale = input<number>(25);

  /** Chromatic aberration intensity - RGB split effect strength */
  readonly aberrationIntensity = input<number>(2);

  /** Width of the filter canvas */
  readonly width = input<number>(270);

  /** Height of the filter canvas */
  readonly height = input<number>(69);

  /** Optional shader map URL (used when mode='shader') */
  readonly shaderMapUrl = input<string | undefined>(undefined);

  /** Computed: Edge mask offset based on aberration intensity */
  protected readonly edgeMaskOffset = computed(() => {
    return Math.max(30, 80 - this.aberrationIntensity() * 2);
  });

  /** Computed: Edge mask table values for feFuncA */
  protected readonly edgeMaskTableValues = computed(() => {
    return `0 ${this.aberrationIntensity() * 0.05} 1`;
  });

  /** Computed: Displacement map href based on mode */
  protected readonly displacementMapHref = computed(() => {
    // Use generated shader URL if in shader mode, otherwise use pre-defined maps
    let mapUrl: string;
    if (this.mode() === 'shader') {
      mapUrl = this.generatedShaderUrl || SAFE_DISPLACEMENT_MAPS.standard;
    } else {
      mapUrl = getDisplacementMap(this.mode());
    }

    // Validate the URL before using it
    if (!isValidDisplacementMapUrl(mapUrl)) {
      console.warn(`[GlassFilter] Invalid displacement map URL, falling back to standard mode`, mapUrl);
      mapUrl = SAFE_DISPLACEMENT_MAPS.standard;
    }

    return this.sanitizer.bypassSecurityTrustResourceUrl(mapUrl) as unknown as string;
  });

  /** Computed: Red channel displacement scale */
  protected readonly redDisplacementScale = computed(() => {
    const modeMultiplier = this.mode() === 'shader' ? 1 : -1;
    return this.displacementScale() * modeMultiplier;
  });

  /** Computed: Green channel displacement scale */
  protected readonly greenDisplacementScale = computed(() => {
    const modeMultiplier = this.mode() === 'shader' ? 1 : -1;
    return this.displacementScale() * (modeMultiplier - this.aberrationIntensity() * 0.05);
  });

  /** Computed: Blue channel displacement scale */
  protected readonly blueDisplacementScale = computed(() => {
    const modeMultiplier = this.mode() === 'shader' ? 1 : -1;
    return this.displacementScale() * (modeMultiplier - this.aberrationIntensity() * 0.1);
  });

  /** Computed: Gaussian blur standard deviation */
  protected readonly blurStdDeviation = computed(() => {
    return Math.max(0.1, 0.5 - this.aberrationIntensity() * 0.1);
  });

  /** Generated shader map URL for shader mode */
  private generatedShaderUrl: string | undefined;

  /** Generate shader map when in shader mode */
  ngOnInit(): void {
    if (this.mode() === 'shader' && !this.shaderMapUrl()) {
      this.generatedShaderUrl = this.shaderDisplacementService.generateShaderDisplacementMap(
        this.width(),
        this.height()
      );
    }
  }

  /** Cleanup resources */
  ngOnDestroy(): void {
    // No cleanup needed - shaderDisplacementService manages its own cache
  }
}
