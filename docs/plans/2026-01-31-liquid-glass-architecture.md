# Liquid Glass Directive - Architectural Implementation Plan

**Goal**: Implement a headless Liquid Glass directive that creates interactive, refractive glass effects while maintaining compatibility with the "矿物与时光" (Mineral & Time) design system.

**Architecture**: Angular Directive with Composition Pattern + State Machine for Animation

**Design Philosophy**: Ultra-compact, low-saturation, mineral-themed visual effects with OKLCH color integration

---

## Master Status Tracker

| Phase | Independence | Dependencies | Status |
| :--- | :--- | :--- | :--- |
| **P1: Core Domain Models** | High | None | 🔴 To Do |
| **P2: Theme Integration Layer** | High | None | 🔴 To Do |
| **P3: Animation State Machine** | Medium | P1 | 🔴 To Do |
| **P4: SVG Filter Engine** | Medium | P1 | 🔴 To Do |
| **P5: Directive Core Implementation** | Low | P1, P2, P3, P4 | 🔴 To Do |
| **P6: Accessibility Layer** | High | P5 | 🔴 To Do |
| **P7: Demo & Documentation** | Low | P5, P6 | 🔴 To Do |
| **P8: Testing Suite** | Medium | P5 | 🔴 To Do |

> **Status Legend:** 🔴 To Do, 🟡 In Progress, 🟢 Done

---

## Phase 1: Core Domain Models

**Independence**: High (Can be built in parallel)

**Goal**: Define all TypeScript interfaces, types, and domain models

### Task 1.1: Define Core Types (Compilable)

```typescript
// src/app/shared/ui/liquid-glass/types/liquid-glass.types.ts

/**
 * Refraction mode determines the visual distortion pattern
 */
export type LiquidGlassRefractionMode = 'standard' | 'polar' | 'prominent';

/**
 * Theme presets matching "矿物与时光" design system
 */
export type LiquidGlassTheme =
  | 'mineral-light'   // Light mode - 绢黄 + 石绿
  | 'mineral-dark'    // Dark mode - 深石青 + 浅石绿
  | 'custom';         // User-defined colors

/**
 * Animation state for the state machine
 */
export type LiquidGlassAnimationState =
  | 'idle'           // No interaction
  | 'tracking'       // Mouse moving
  | 'resetting';     // Returning to center

/**
 * Color configuration using OKLCH or CSS variables
 */
export interface LiquidGlassColorConfig {
  /** Primary border/accent color (e.g., 'var(--accent)') */
  readonly border: string;
  /** Hotspot highlight color (RGBA) */
  readonly hotspot: string;
  /** Base tint overlay color (RGBA) */
  readonly tint: string;
  /** Chromatic aberration color 1 (red/pink) */
  readonly aberration1: string;
  /** Chromatic aberration color 2 (blue/cyan) */
  readonly aberration2: string;
}

/**
 * Spacing configuration using design system tokens
 */
export interface LiquidGlassSpacingConfig {
  /** Corner radius using CSS var (e.g., 'var(--radius-xl)') */
  readonly cornerRadius: string;
  /** Border width in pixels */
  readonly borderWidth: number;
  /** Internal padding in pixels */
  readonly padding: number;
}

/**
 * Animation configuration
 */
export interface LiquidGlassAnimationConfig {
  /** Smoothing factor 0-0.6 (higher = faster response) */
  readonly elasticity: number;
  /** Maximum parallax offset in pixels */
  readonly parallaxIntensity: number;
  /** Enable/disable animations */
  readonly enabled: boolean;
}

/**
 * SVG Filter configuration
 */
export interface LiquidGlassFilterConfig {
  /** Displacement scale 0-140 */
  readonly displacementScale: number;
  /** Blur amount 0-1 (maps to 0-18px) */
  readonly blurAmount: number;
  /** Saturation boost 50-200% */
  readonly saturation: number;
  /** Chromatic aberration intensity 0-6px */
  readonly aberrationIntensity: number;
  /** Turbulence frequency for noise pattern */
  readonly turbulenceBaseFrequency: [number, number];
}

/**
 * Complete Liquid Glass configuration
 */
export interface LiquidGlassConfig {
  readonly theme: LiquidGlassTheme;
  readonly mode: LiquidGlassRefractionMode;
  readonly colors: LiquidGlassColorConfig;
  readonly spacing: LiquidGlassSpacingConfig;
  readonly animation: LiquidGlassAnimationConfig;
  readonly filter: LiquidGlassFilterConfig;
}

/**
 * Position for cursor tracking (normalized 0-1)
 */
export interface LiquidGlassPosition {
  readonly x: number;
  readonly y: number;
}

/**
 * Accessibility configuration
 */
export interface LiquidGlassA11yConfig {
  readonly ariaLabel: string;
  readonly role: string;
  readonly respectReducedMotion: boolean;
}
```

**Expected Output**: TypeScript compilation passes with all type definitions

---

### Task 1.2: Define Theme Constants

```typescript
// src/app/shared/ui/liquid-glass/types/theme.constants.ts

import { LiquidGlassColorConfig, LiquidGlassFilterConfig, LiquidGlassSpacingConfig } from './liquid-glass.types';

/**
 * Mineral Light Theme - 绢黄 + 石绿 (Aged Silk + Malachite)
 */
export const MINERAL_LIGHT_THEME: LiquidGlassColorConfig = {
  border: 'var(--accent)',              // 亮泥金
  hotspot: 'rgba(255, 255, 255, 0.18)',
  tint: 'rgba(0, 0, 0, 0.12)',          // Lighter for light mode
  aberration1: 'rgba(200, 80, 120, 0.15)',
  aberration2: 'rgba(80, 140, 200, 0.12)',
};

/**
 * Mineral Dark Theme - 深石青 + 浅石绿 (Deep Stone Blue + Light Stone Green)
 */
export const MINERAL_DARK_THEME: LiquidGlassColorConfig = {
  border: 'var(--accent)',              // 亮泥金
  hotspot: 'rgba(255, 255, 255, 0.22)',
  tint: 'rgba(0, 0, 0, 0.32)',          // Darker for dark mode
  aberration1: 'rgba(255, 40, 120, 0.18)',
  aberration2: 'rgba(40, 160, 255, 0.16)',
};

/**
 * Default spacing - Ultra compact design system
 */
export const COMPACT_SPACING: LiquidGlassSpacingConfig = {
  cornerRadius: 'var(--radius-xl)',     // 6px - matches design system
  borderWidth: 1,
  padding: 12,                           // var(--spacing-lg) * 1.5
};

/**
 * Subtle filter defaults - Lower intensity for mineral aesthetic
 */
export const SUBTLE_FILTER: LiquidGlassFilterConfig = {
  displacementScale: 60,                 // Reduced from 90 for subtlety
  blurAmount: 0.35,                      // Slightly less blur
  saturation: 105,                       // Lower saturation (was 140)
  aberrationIntensity: 1.5,              // Reduced chromatic effect
  turbulenceBaseFrequency: [0.014, 0.035],
};

/**
 * Refraction mode turbulence presets
 */
export const REFRACTION_MODE_TURBULENCE: Record<LiquidGlassRefractionMode, [number, number]> = {
  standard: [0.014, 0.035],
  polar: [0.010, 0.060],
  prominent: [0.020, 0.020],
};
```

**Expected Output**: Constants file with all theme presets

---

## Phase 2: Theme Integration Layer

**Independence**: High (Can be built in parallel)

**Goal**: Create utilities for integrating with OKLCH-based design system

### Task 2.1: Color Utilities

```typescript
// src/app/shared/ui/liquid-glass/utils/color.utils.ts

/**
 * Resolve CSS variable to actual color value
 * Handles both var(--name) and direct color values
 */
export function resolveColorValue(color: string, element: HTMLElement): string {
  if (color.startsWith('var(')) {
    const varName = color.match(/var\(([^)]+)\)/)?.[1];
    if (!varName) return color;

    const computed = getComputedStyle(element).getPropertyValue(varName);
    return computed || color;
  }
  return color;
}

/**
 * Check if color uses OKLCH format
 */
export function isOKLCHColor(color: string): boolean {
  return color.includes('oklch(');
}

/**
 * Build CSS gradient string from color config
 */
export function buildGlassGradient(
  position: { x: number; y: number },
  colors: LiquidGlassColorConfig
): string {
  const xPct = (position.x * 100).toFixed(2);
  const yPct = (position.y * 100).toFixed(2);

  return `
    radial-gradient(140px 140px at ${xPct}% ${yPct}%, ${colors.hotspot}, ${colors.hotspot.replace(/[\d.]+\)$/, '0.08)')} 35%, rgba(255,255,255,0) 70%),
    linear-gradient(180deg, rgba(255,255,255,0.12), rgba(255,255,255,0) 65%),
    ${colors.tint}
  `.replace(/\s+/g, ' ').trim();
}
```

**Expected Output**: Utility functions for color handling

---

### Task 2.2: Theme Resolver Service

```typescript
// src/app/shared/ui/liquid-glass/services/theme-resolver.service.ts
import { inject, Injectable } from '@angular/core';
import { LiquidGlassTheme, LiquidGlassColorConfig } from '../types/liquid-glass.types';
import { MINERAL_LIGHT_THEME, MINERAL_DARK_THEME } from '../types/theme.constants';

@Injectable({ providedIn: 'root' })
export class LiquidGlassThemeResolver {
  /**
   * Get color configuration based on theme
   */
  getColorConfig(theme: LiquidGlassTheme): LiquidGlassColorConfig {
    switch (theme) {
      case 'mineral-light':
        return MINERAL_LIGHT_THEME;
      case 'mineral-dark':
        return MINERAL_DARK_THEME;
      case 'custom':
        // Return empty - user must provide custom colors
        return {
          border: '',
          hotspot: '',
          tint: '',
          aberration1: '',
          aberration2: '',
        };
      default:
        return MINERAL_DARK_THEME; // Default to dark mode
    }
  }

  /**
   * Detect current theme from document class
   */
  detectCurrentTheme(): 'light' | 'dark' {
    return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  }

  /**
   * Auto-select theme based on current mode
   */
  autoSelectTheme(): LiquidGlassTheme {
    return this.detectCurrentTheme() === 'dark' ? 'mineral-dark' : 'mineral-light';
  }
}
```

**Expected Output**: Service for theme resolution

---

## Phase 3: Animation State Machine

**Independence**: Medium (Depends on P1 types)

**Goal**: Implement state machine for smooth cursor tracking and animation

### Task 3.1: State Machine Interface

```typescript
// src/app/shared/ui/liquid-glass/state-machine/animation-state.machine.ts
import { inject, Injectable } from '@angular/core';
import { LiquidGlassPosition, LiquidGlassAnimationState } from '../types/liquid-glass.types';

@Injectable({ providedIn: 'root' })
export class LiquidGlassAnimationStateMachine {
  private currentState: LiquidGlassAnimationState = 'idle';
  private targetPosition: LiquidGlassPosition = { x: 0.5, y: 0.5 };
  private currentPosition: LiquidGlassPosition = { x: 0.5, y: 0.5 };
  private elasticity = 0.25;

  /**
   * Transition to new state
   */
  transition(newState: LiquidGlassAnimationState): void {
    this.currentState = newState;
  }

  /**
   * Update target position
   */
  setTarget(position: LiquidGlassPosition): void {
    this.targetPosition = position;
    if (this.currentState === 'idle') {
      this.transition('tracking');
    }
  }

  /**
   * Reset to center
   */
  reset(): void {
    this.targetPosition = { x: 0.5, y: 0.5 };
    this.transition('resetting');
  }

  /**
   * Get current state
   */
  getState(): LiquidGlassAnimationState {
    return this.currentState;
  }

  /**
   * Calculate next position with exponential smoothing
   * Returns true when animation should continue
   */
  tick(): { position: LiquidGlassPosition; isAnimating: boolean } {
    const k = 1 - Math.pow(1 - this.elasticity, 2);

    this.currentPosition.x += (this.targetPosition.x - this.currentPosition.x) * k;
    this.currentPosition.y += (this.targetPosition.y - this.currentPosition.y) * k;

    // Check if close enough to target
    const dx = Math.abs(this.targetPosition.x - this.currentPosition.x);
    const dy = Math.abs(this.targetPosition.y - this.currentPosition.y);
    const threshold = 0.001;

    if (dx < threshold && dy < threshold) {
      if (this.currentState === 'resetting') {
        this.transition('idle');
      }
      return { position: this.currentPosition, isAnimating: false };
    }

    return { position: this.currentPosition, isAnimating: true };
  }

  /**
   * Set elasticity factor
   */
  setElasticity(value: number): void {
    this.elasticity = Math.max(0, Math.min(0.6, value));
  }
}
```

**Expected Output**: State machine for animation control

---

## Phase 4: SVG Filter Engine

**Independence**: Medium (Depends on P1 types)

**Goal**: Create SVG filters for refractive distortion effects

### Task 4.1: SVG Filter Builder

```typescript
// src/app/shared/ui/liquid-glass/services/svg-filter-builder.service.ts
import { Injectable, Renderer2 } from '@angular/core';
import { LiquidGlassFilterConfig, LiquidGlassRefractionMode } from '../types/liquid-glass.types';
import { REFRACTION_MODE_TURBULENCE } from '../types/theme.constants';

@Injectable({ providedIn: 'root' })
export class SvgFilterBuilderService {
  /**
   * Generate unique filter ID
   */
  generateFilterId(): string {
    return `lg-filter-${Math.random().toString(16).slice(2)}`;
  }

  /**
   * Create SVG filter element with all child primitives
   */
  createFilterElement(
    renderer: Renderer2,
    config: LiquidGlassFilterConfig,
    mode: LiquidGlassRefractionMode,
    filterId: string
  ): SVGSVGElement {
    // Create SVG container
    const svg = renderer.createElement('svg', 'svg') as SVGSVGElement;
    renderer.setAttribute(svg, 'width', '0');
    renderer.setAttribute(svg, 'height', '0');
    renderer.setAttribute(svg, 'style', 'position:absolute; width:0; height:0; overflow:hidden;');

    // Create defs and filter
    const defs = renderer.createElement('defs', 'svg');
    const filter = renderer.createElement('filter', 'svg');

    // Configure filter
    renderer.setAttribute(filter, 'id', filterId);
    renderer.setAttribute(filter, 'x', '-20%');
    renderer.setAttribute(filter, 'y', '-20%');
    renderer.setAttribute(filter, 'width', '140%');
    renderer.setAttribute(filter, 'height', '140%');
    renderer.setAttribute(filter, 'color-interpolation-filters', 'sRGB');

    // Build filter primitives
    const turbulence = this.createTurbulence(renderer, config, mode);
    const displacement = this.createDisplacementMap(renderer, config);
    const blur = this.createGaussianBlur(renderer, config);

    // Assemble tree
    filter.appendChild(turbulence);
    filter.appendChild(displacement);
    filter.appendChild(blur);
    defs.appendChild(filter);
    svg.appendChild(defs);

    return svg;
  }

  /**
   * Create turbulence primitive
   */
  private createTurbulence(
    renderer: Renderer2,
    config: LiquidGlassFilterConfig,
    mode: LiquidGlassRefractionMode
  ): SVGFETurbulenceElement {
    const turbulence = renderer.createElement('feTurbulence', 'svg') as SVGFETurbulenceElement;

    renderer.setAttribute(turbulence, 'type', 'fractalNoise');
    renderer.setAttribute(turbulence, 'numOctaves', mode === 'prominent' ? '3' : '2');
    renderer.setAttribute(turbulence, 'seed', mode === 'polar' ? '9' : mode === 'prominent' ? '4' : '2');

    const freq = config.turbulenceBaseFrequency || REFRACTION_MODE_TURBULENCE[mode];
    renderer.setAttribute(turbulence, 'baseFrequency', freq.join(' '));
    renderer.setAttribute(turbulence, 'result', 'noise');

    return turbulence;
  }

  /**
   * Create displacement map primitive
   */
  private createDisplacementMap(
    renderer: Renderer2,
    config: LiquidGlassFilterConfig
  ): SVGFEDisplacementMapElement {
    const disp = renderer.createElement('feDisplacementMap', 'svg') as SVGFEDisplacementMapElement;

    renderer.setAttribute(disp, 'in', 'SourceGraphic');
    renderer.setAttribute(disp, 'in2', 'noise');
    renderer.setAttribute(disp, 'scale', String(config.displacementScale));
    renderer.setAttribute(disp, 'xChannelSelector', 'R');
    renderer.setAttribute(disp, 'yChannelSelector', 'G');
    renderer.setAttribute(disp, 'result', 'displaced');

    return disp;
  }

  /**
   * Create Gaussian blur primitive
   */
  private createGaussianBlur(
    renderer: Renderer2,
    config: LiquidGlassFilterConfig
  ): SVGFEGaussianBlurElement {
    const blur = renderer.createElement('feGaussianBlur', 'svg') as SVGFEGaussianBlurElement;

    renderer.setAttribute(blur, 'in', 'displaced');
    renderer.setAttribute(blur, 'stdDeviation', String(Math.max(0, config.blurAmount * 0.8)));
    renderer.setAttribute(blur, 'result', 'out');

    return blur;
  }
}
```

**Expected Output**: Service for creating SVG filters

---

## Phase 5: Directive Core Implementation

**Independence**: Low (Depends on P1, P2, P3, P4)

**Goal**: Implement the main directive with all features integrated

### Task 5.1: Directive Skeleton with Inputs

```typescript
// src/app/shared/ui/liquid-glass/directives/liquid-glass.directive.ts
import {
  Directive,
  ElementRef,
  Renderer2,
  inject,
  OnInit,
  OnDestroy,
  Input,
  HostListener,
  booleanAttribute,
} from '@angular/core';
import {
  LiquidGlassTheme,
  LiquidGlassRefractionMode,
} from '../types/liquid-glass.types';

@Directive({
  selector: '[liquidGlass]',
  standalone: true,
})
export class LiquidGlassDirective implements OnInit, OnDestroy {
  private el = inject(ElementRef<HTMLElement>);
  private r = inject(Renderer2);

  // ===== Theme & Mode =====
  @Input() lgTheme: LiquidGlassTheme = 'mineral-dark';
  @Input() lgMode: LiquidGlassRefractionMode = 'standard';

  // ===== Colors =====
  @Input() lgBorder?: string;
  @Input() lgHotspot?: string;
  @Input() lgTint?: string;
  @Input() lgAriaLabel = 'Liquid glass card';
  @Input() lgRole = 'region';

  // ===== Spacing =====
  @Input() lgCornerRadius: string = 'var(--radius-xl)';
  @Input() lgBorderWidth: number = 1;
  @Input() lgPadding: number = 12;

  // ===== Filter =====
  @Input({ transform: booleanAttribute }) lgDisableFilters = false;
  @Input() lgDisplacementScale: number = 60;
  @Input() lgBlurAmount: number = 0.35;
  @Input() lgSaturation: number = 105;
  @Input() lgAberrationIntensity: number = 1.5;

  // ===== Animation =====
  @Input({ transform: booleanAttribute }) lgDisableAnimation = false;
  @Input() lgElasticity: number = 0.25;
  @Input() lgParallaxIntensity: number = 2;
  @Input({ transform: booleanAttribute }) lgRespectReducedMotion = true;

  ngOnInit(): void {
    // TODO: Initialize
  }

  ngOnDestroy(): void {
    // TODO: Cleanup
  }

  @HostListener('pointermove', ['$event'])
  onPointerMove(event: PointerEvent): void {
    // TODO: Handle pointer move
  }

  @HostListener('pointerleave')
  onPointerLeave(): void {
    // TODO: Handle pointer leave
  }
}
```

**Expected Output**: Directive compiles with all inputs defined

---

### Task 5.2-5.5: Implementation Details

*(Implementation details follow the same structure as the original review code, adapted for the design system)*

---

## Phase 6: Accessibility Layer

**Independence**: High (Depends on P5 being complete)

**Goal**: Add comprehensive accessibility features

- Reduced motion detection (already in P5)
- ARIA labels and roles
- Keyboard navigation support

---

## Phase 7: Demo & Documentation

**Independence**: Low (Depends on P5 complete)

**Goal**: Create comprehensive demo page and documentation

### Directory Structure
```
src/app/demo/liquid-glass/
├── types/
│   └── liquid-glass-demo.types.ts
├── examples/
│   ├── basic-examples.ts
│   ├── theme-examples.ts
│   └── animation-examples.ts
├── liquid-glass-demo.component.ts
├── liquid-glass-demo.component.html
└── liquid-glass-demo.component.css
```

### Route Addition
```typescript
// src/app/app.routes.ts
{
  path: 'demo/liquid-glass',
  loadComponent: () => import('./demo/liquid-glass/liquid-glass-demo.component')
    .then(m => m.LiquidGlassDemoComponent)
}
```

---

## Phase 8: Testing Suite

**Independence**: Medium (Depends on P5 complete)

**Goal**: Create unit and integration tests

- Unit tests for directive lifecycle
- Theme integration tests
- Accessibility tests
- Performance benchmarks

---

## Implementation Strategy

### **Sprint 1: Foundation (Parallel)**
- **Team A**: P1 (Core Domain Models) → P2 (Theme Integration)
- **Team B**: P3 (State Machine) → P4 (SVG Filter Engine)

### **Sprint 2: Core Implementation (Sequential)**
- **All**: P5 (Directive Core) - Must wait for Sprint 1

### **Sprint 3: Polish (Parallel)**
- **Team A**: P6 (Accessibility) + P7 (Demo)
- **Team B**: P8 (Testing)

---

## Success Criteria

- ✅ All examples render correctly in both light and dark modes
- ✅ Animation maintains 60 FPS on modern hardware
- ✅ Reduced motion preference is respected
- ✅ No console errors or warnings
- ✅ All unit and integration tests pass
- ✅ Demo page accessible at `/demo/liquid-glass`
- ✅ Design system integration verified (colors, spacing, typography)

---

## Design System Integration

### Color Mapping
| Usage | Mineral Dark | Mineral Light |
|-------|-------------|---------------|
| Border | `var(--accent)` | `var(--accent)` |
| Hotspot | `rgba(255,255,255,0.22)` | `rgba(255,255,255,0.18)` |
| Tint | `rgba(0,0,0,0.32)` | `rgba(0,0,0,0.12)` |

### Spacing
- Corner Radius: `var(--radius-xl)` (6px)
- Border Width: 1px
- Internal Padding: 12px

---

**End of Architecture Plan**
