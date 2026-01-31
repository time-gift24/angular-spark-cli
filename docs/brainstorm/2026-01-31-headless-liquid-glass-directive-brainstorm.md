# Headless Liquid Glass Directive - Architecture Design

**Date:** 2026-01-31
**Status:** Design Phase
**Goal:** Create a headless Angular directive that provides liquid glass effects while keeping styling under Tailwind CSS control

---

## 🎯 Core Concept

Transform `liquid-glass-react` into a **headless Angular directive** that:

```html
<!-- Usage Example -->
<button
  spark-liquid-glass
  [intensity]="medium"
  [elasticity]="0.15"
  spark-button
  class="w-32 h-10 rounded-md text-white">
  Click Me
</button>
```

**Key Principle:**
- `spark-liquid-glass` = **Logic layer** (physics, SVG filters, dynamic effects)
- **Tailwind classes** = **Style layer** (dimensions, typography, colors, layout)

---

## 🏗️ Architecture Design

### Component Structure

```
SparkLiquidGlassDirective (Attribute Directive)
│
├── LiquidGlassService (Headless Logic)
│   ├── Mouse tracking physics
│   ├── Elasticity calculations
│   └── Directional scaling
│
├── DOM Structure Builder
│   ├── SVG filter container
│   ├── Layered border elements
│   └── Hover/active feedback layers
│
└── Dynamic Style Injector
    ├── CSS variables for static styles
    └── Inline styles for dynamic values
```

### Data Flow

```
User Interaction
    ↓
Mouse Movement Event
    ↓
LiquidGlassService.calculateTransforms()
    ├── elasticTranslation (x, y)
    ├── directionalScale (scaleX, scaleY)
    └── mouseOffset (normalized)
    ↓
Directive.applyDynamicStyles()
    ├── Update inline styles (transform, gradient angles)
    └── Update CSS variables (if needed)
    ↓
Visual Output (Glass effect with Tailwind base styles)
```

---

## 📊 Responsibility Separation

### 🔧 Built-in Advanced Effects (Directive Handles)

These are **non-negotiable** core glass effects that cannot be achieved with pure CSS:

1. **SVG Filter Generation**
   - Displacement map for refraction
   - Chromatic aberration (edge color splitting)
   - Multiple refraction modes (MVP: standard only)

2. **Mouse Physics Engine**
   - Mouse position tracking (global + container-relative)
   - Elasticity calculation (spring-like movement)
   - Directional scaling (stretch based on mouse direction)
   - Activation zone detection (200px proximity)

3. **Dynamic Gradient Borders**
   - Mouse-reactive gradient rotation
   - Multi-layer border composition
   - Mix-blend-mode edge effects (screen/overlay)

4. **Interactive States**
   - Hover state detection
   - Active/click state animations
   - Smooth transition management

5. **Dynamic DOM Creation**
   - SVG filter element (hidden, reference-only)
   - Glass backdrop layer
   - 2 border layers (different blend modes)
   - Hover/active feedback layers
   - Content wrapper (keeps children sharp)

### 🎨 Tailwind CSS Controls (User Override)

These are **standard styling** that users fully control via Tailwind:

| Aspect | Tailwind Classes | Example |
|--------|------------------|---------|
| **Dimensions** | `w-*`, `h-*`, `p-*`, `m-*` | `w-40 h-12 px-6` |
| **Border Radius** | `rounded-*` | `rounded-md`, `rounded-xl` |
| **Typography** | `text-*`, `font-*` | `text-sm font-medium text-white` |
| **Colors** | `bg-*`, `text-*` | `bg-stone-900 text-stone-100` |
| **Shadows** | `shadow-*` | `shadow-lg`, `shadow-xl` |
| **Layout** | `flex`, `grid`, `items-*` | `flex items-center justify-center` |
| **Z-Index** | `z-*` | `z-10`, `z-50` |
| **Position** | `relative`, `absolute` | `relative`, `absolute top-4` |

---

## 🎯 MVP Scope

### ✅ Must Have (MVP)

1. **Standard Mode Only**
   - Single displacement mode
   - Core chromatic aberration effect
   - Sufficient for 80% of use cases

2. **Essential Inputs**
   ```typescript
   @Input() intensity: 'low' | 'medium' | 'high' = 'medium'
   @Input() elasticity: number = 0.15  // 0-1 range
   @Input() blur: number = 0.0625      // backdrop blur amount
   @Input() saturation: number = 140   // color saturation %
   ```

3. **Core Mouse Physics**
   - Mouse tracking within element
   - Elastic translation (subtle movement toward mouse)
   - Directional scaling (stretch effect)
   - Activation zone (200px proximity)

4. **Required DOM Layers**
   - SVG filter (displacement + chromatic aberration)
   - Glass backdrop (frosted effect)
   - 2 border layers (blend mode effects)
   - Content wrapper (preserves text sharpness)

5. **Basic States**
   - Hover state (enhanced reflections)
   - Active/click state (scale down + brightness)

### 📋 Future Plans (Post-MVP)

1. **Additional Displacement Modes**
   - `polar` mode (radial displacement)
   - `prominent` mode (exaggerated edges)
   - `shader` mode (GPU-generated displacement)

2. **Advanced Configuration**
   - Custom displacement scale
   - Chromatic aberration intensity control
   - Corner radius override (beyond Tailwind)
   - Mode selection: `@Input() mode: 'standard' | 'polar' | 'prominent' | 'shader'`

3. **Performance Optimizations**
   - RequestAnimationFrame batching
   - Throttle/debounce options
   - GPU acceleration hints

4. **Accessibility Enhancements**
   - `prefers-reduced-motion` support
   - Disable animations on demand
   - ARIA attributes for screen readers

5. **Container Mode**
   - Support for larger mouse tracking areas
   - `@Input() mouseContainer: HTMLElement` reference

---

## 🔧 Technical Implementation Strategy

### Directive Lifecycle

```
ngOnInit()
  ├── Initialize LiquidGlassService
  ├── Build DOM structure
  ├── Generate SVG filter
  └── Apply base styles

ngAfterViewInit()
  ├── Measure element dimensions
  ├── Set up mouse event listeners
  └── Initialize animation frame loop

ngOnChanges()
  ├── Update configuration (if inputs change)
  └── Regenerate SVG filter if needed

ngOnDestroy()
  ├── Remove event listeners
  ├── Clean up DOM elements
  └── Cancel animation frames
```

### DOM Structure (Conceptual)

```html
<!-- Original element (user controls via Tailwind) -->
<button spark-liquid-glass class="w-32 h-10">
  Click Me
</button>

<!-- Directive creates this structure: -->
<div class="spark-glass-wrapper">
  <!-- SVG Filter (hidden, referenced via url(#id)) -->
  <svg class="hidden">
    <defs>
      <filter id="spark-glass-filter-xxx">
        <!-- Displacement + chromatic aberration logic -->
      </filter>
    </defs>
  </svg>

  <!-- Glass backdrop (receives SVG filter) -->
  <div class="spark-glass-backdrop" style="filter: url(#spark-glass-filter-xxx); backdrop-filter: blur(...)">
    <!-- Dynamic transform applied here -->
  </div>

  <!-- Content wrapper (keeps children sharp) -->
  <div class="spark-glass-content">
    <ng-content></ng-content>
  </div>

  <!-- Border layer 1 (screen blend mode) -->
  <span class="spark-glass-border-1"
        style="mix-blend-mode: screen;
               background: linear-gradient(...dynamic angle...);">

  <!-- Border layer 2 (overlay blend mode) -->
  <span class="spark-glass-border-2"
        style="mix-blend-mode: overlay;
               background: linear-gradient(...dynamic angle...);">

  <!-- Hover feedback (conditional) -->
  <div class="spark-glass-hover-effect"></div>
  <div class="spark-glass-active-effect"></div>
</div>
```

### Style Application Strategy

**Static Styles (CSS Variables - Tailwind can override):**
```css
:root {
  --spark-glass-blur: 12px;
  --spark-glass-saturation: 140%;
  --spark-glass-shadow: 0px 12px 40px rgba(0, 0, 0, 0.25);
}
```

**Dynamic Styles (Inline - calculated per frame):**
```javascript
element.style.transform = `translate(
  calc(-50% + ${elasticTranslation.x}px),
  calc(-50% + ${elasticTranslation.y}px)
) ${directionalScale}`;

borderElement.style.background = `linear-gradient(
  ${135 + mouseOffset.x * 1.2}deg,
  rgba(255, 255, 255, 0.0) 0%,
  rgba(255, 255, 255, ${0.12 + Math.abs(mouseOffset.x) * 0.008}) 33%,
  ...
)`;
```

### Service Logic (Pseudocode)

```typescript
class LiquidGlassService {
  // Calculate physics based on mouse position
  calculateTransforms(
    mousePos: { x: number, y: number },
    elementRect: DOMRect,
    glassSize: { width: number, height: number },
    elasticity: number
  ): TransformResult {

    // 1. Calculate distance from mouse to element edges
    const edgeDistance = this.calculateEdgeDistance(mousePos, elementRect, glassSize)

    // 2. Calculate fade-in factor (1 at edge, 0 at activation zone boundary)
    const activationZone = 200
    const fadeInFactor = Math.max(0, 1 - edgeDistance / activationZone)

    // 3. Calculate normalized direction
    const centerDelta = {
      x: mousePos.x - elementRect.centerX,
      y: mousePos.y - elementRect.centerY
    }
    const centerDistance = Math.sqrt(centerDelta.x ** 2 + centerDelta.y ** 2)
    const normalizedDirection = {
      x: centerDelta.x / centerDistance,
      y: centerDelta.y / centerDistance
    }

    // 4. Calculate stretch intensity
    const stretchIntensity = Math.min(centerDistance / 300, 1) * elasticity * fadeInFactor

    // 5. Calculate directional scaling
    const scaleX = 1 +
      Math.abs(normalizedDirection.x) * stretchIntensity * 0.3 -
      Math.abs(normalizedDirection.y) * stretchIntensity * 0.15

    const scaleY = 1 +
      Math.abs(normalizedDirection.y) * stretchIntensity * 0.3 -
      Math.abs(normalizedDirection.x) * stretchIntensity * 0.15

    // 6. Calculate elastic translation
    const translation = {
      x: centerDelta.x * elasticity * 0.1 * fadeInFactor,
      y: centerDelta.y * elasticity * 0.1 * fadeInFactor
    }

    return {
      translation,
      scale: { x: Math.max(0.8, scaleX), y: Math.max(0.8, scaleY) },
      mouseOffset: {
        x: ((mousePos.x - elementRect.centerX) / elementRect.width) * 100,
        y: ((mousePos.y - elementRect.centerY) / elementRect.height) * 100
      }
    }
  }
}
```

---

## 🎨 Integration with "矿物与时光" Theme

### Theme Compatibility

The directive should respect the existing design system:

```css
/* Existing theme variables that can influence glass effect */
:root {
  --background: oklch(0.91 0.015 85);      /* Can affect glass tint */
  --foreground: oklch(0.28 0.03 185);     /* Content color */
  --primary: oklch(0.48 0.07 195);        /* Border tints */
  --radius-md: 4px;                       /* Border radius */
}

/* Directive respects these via Tailwind classes */
<button spark-liquid-glass
        class="bg-stone-100/10           /* Glass background tint */
               text-stone-900             /* Theme foreground */
               rounded-md                 /* Theme radius */
               backdrop-blur-md">         /* Works with glass blur */
  Glass Button
</button>
```

### Preset Intensity Levels

```typescript
// Low intensity (subtle, for cards/panels)
intensity = 'low' → {
  elasticity: 0.08,
  blur: 0.04,
  saturation: 120,
  aberration: 1
}

// Medium intensity (balanced, for buttons)
intensity = 'medium' → {
  elasticity: 0.15,
  blur: 0.0625,
  saturation: 140,
  aberration: 2
}

// High intensity (dramatic, for hero elements)
intensity = 'high' → {
  elasticity: 0.25,
  blur: 0.1,
  saturation: 180,
  aberration: 3
}
```

---

## 🧪 Testing Strategy

### Unit Tests (Service)

1. **Physics Calculations**
   - Test edge distance calculation
   - Test fade-in factor with different distances
   - Test directional scaling logic
   - Test elasticity translation

2. **Edge Cases**
   - Mouse exactly at center
   - Mouse outside activation zone
   - Zero elasticity (no movement)
   - Maximum elasticity ( exaggerated movement)

### Integration Tests (Directive)

1. **DOM Structure**
   - Verify SVG filter creation
   - Verify all layers present
   - Verify cleanup on destroy

2. **Mouse Interaction**
   - Simulate mouse movement
   - Verify transform updates
   - Test hover/active states

3. **Theme Integration**
   - Test with Tailwind classes
   - Verify CSS variable application
   - Test override behavior

### Visual Tests

1. **Cross-browser Rendering**
   - Chrome/Edge (full effect)
   - Firefox (partial support)
   - Safari (partial support)

2. **Performance**
   - FPS during mouse movement
   - Memory leak detection
   - Layout thrashing checks

---

## 📝 API Design

### Directive Interface

```typescript
@Directive({
  selector: '[spark-liquid-glass]',
  standalone: true
})
export class SparkLiquidGlassDirective {
  // Configuration
  @Input() intensity: 'low' | 'medium' | 'high' = 'medium'
  @Input() elasticity?: number      // Override intensity preset
  @Input() blur?: number             // Override blur amount
  @Input() saturation?: number       // Override color saturation

  // Advanced (future)
  // @Input() mode: 'standard' | 'polar' | 'prominent' | 'shader'
  // @Input() mouseContainer?: HTMLElement

  // State outputs (for debugging/advanced usage)
  @Output() glassHover = new EventEmitter<boolean>()
  @Output() glassActive = new EventEmitter<boolean>()
}
```

### Usage Examples

```html
<!-- Basic button -->
<button spark-liquid-glass
        spark-button
        class="w-32 h-10">
  Click Me
</button>

<!-- Card with low intensity -->
<div spark-liquid-glass
     intensity="low"
     class="w-64 h-32 rounded-xl p-6">
  <h2>Card Title</h2>
  <p>Card content with subtle glass effect</p>
</div>

<!-- Custom configuration -->
<button spark-liquid-glass
        [elasticity]="0.3"
        [blur]="0.08"
        [saturation]="160"
        class="w-40 h-12 rounded-lg">
  Custom Glass
</button>

<!-- With state tracking -->
<button spark-liquid-glass
        (glassHover)="onHover($event)"
        (glassActive)="onActive($event)"
        class="w-32 h-10">
  Tracked Button
</button>
```

---

## 🚀 Implementation Roadmap

### Phase 1: Core Service (MVP)
- [ ] Create `LiquidGlassService` with physics calculations
- [ ] Implement mouse tracking logic
- [ ] Add elasticity and directional scaling
- [ ] Unit tests for calculation methods

### Phase 2: Basic Directive (MVP)
- [ ] Create `SparkLiquidGlassDirective`
- [ ] Implement DOM structure builder
- [ ] Generate SVG filter for standard mode
- [ ] Apply dynamic transforms via inline styles
- [ ] Integration tests

### Phase 3: Visual Polish (MVP)
- [ ] Add border layers with blend modes
- [ ] Implement hover/active states
- [ ] Add transition smoothing
- [ ] Cross-browser testing

### Phase 4: Theme Integration
- [ ] Test with "矿物与时光" theme
- [ ] Document Tailwind class combinations
- [ ] Create preset intensity configurations
- [ ] Update component documentation

### Phase 5: Advanced Features (Post-MVP)
- [ ] Add additional displacement modes
- [ ] Implement container mode
- [ ] Add performance optimizations
- [ ] Accessibility enhancements

---

## 🎯 Success Criteria

**MVP is complete when:**

1. ✅ A `<button>` with `spark-liquid-glass` renders with glass effect
2. ✅ Mouse movement triggers elastic deformation
3. ✅ Border gradients react to mouse position
4. ✅ Hover/active states provide visual feedback
5. ✅ All styles except dynamic effects controlled by Tailwind
6. ✅ Works with existing `spark-button` component
7. ✅ Compatible with "矿物与时光" theme colors
8. ✅ No performance degradation (60fps during interaction)

---

## 📚 Reference Materials

- **Original Implementation:** `.vendor/liquid-glass-react/src/index.tsx`
- **SVG Filter Logic:** Lines 35-128 (displacement + chromatic aberration)
- **Physics Calculations:** Lines 342-428 (elasticity + directional scaling)
- **DOM Structure:** Lines 458-610 (layered borders + feedback effects)
- **Design System:** `/CLAUDE.md` (矿物与时光 theme specifications)

---

## 💡 Design Decisions Log

| Decision | Rationale |
|----------|-----------|
| **Directive over Component** | Allows application to any element (button, div, card, etc.) |
| **Service for physics** | Separation of concerns - testable, reusable logic |
| **Inline styles for dynamics** | Mouse-reactive values cannot be pre-defined in Tailwind |
| **CSS variables for statics** | Allows Tailwind override while providing sensible defaults |
| **Standard mode only (MVP)** | Covers 80% use cases, other modes are preset variations |
| **Intensity presets** | Simpler API than exposing all raw parameters |
| **Multi-layer borders** | Essential for realistic glass effect (cannot be done with single border) |

---

## 🔍 Open Questions

1. **SVG Filter Performance:** Should filters be cached/reused across multiple glass elements?
2. **Resize Observation:** Should we use `ResizeObserver` to track container size changes?
3. **CSS Variable Injection:** Where should base CSS variables be defined (global vs component-scoped)?
4. **Animation Frame Strategy:** Shared global loop or per-element requestAnimationFrame?
5. **Mobile Support:** How should touch events map to mouse tracking logic?

---

**Document Status:** Ready for implementation planning
**Next Step:** Confirm MVP scope → Create detailed implementation plan → Set up git worktree → Implement
