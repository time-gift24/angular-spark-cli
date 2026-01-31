# Liquid Glass Directive - Usage Guide

## Import

```typescript
import { LiquidGlassDirective } from '@shared/ui/liquid-glass';
```

## Basic Usage

```html
<!-- Minimal usage with defaults -->
<div liquidGlass class="p-4">
  <h2>Liquid Glass Card</h2>
  <p>Content with distortion effect</p>
</div>
```

## Customized Examples

### Theme Variants

```html
<!-- Dark mineral theme (default) -->
<div liquidGlass lgTheme="mineral-dark">
  Dark theme content
</div>

<!-- Light mineral theme -->
<div liquidGlass lgTheme="mineral-light">
  Light theme content
</div>

<!-- Custom colors -->
<div liquidGlass
  lgTheme="custom"
  lgBorder="oklch(0.70 0.12 75)"
  lgHotspot="rgba(255,255,255,0.3)"
  lgTint="rgba(0,0,0,0.4)">
  Custom themed content
</div>
```

### Refraction Modes

```html
<!-- Standard distortion -->
<div liquidGlass lgMode="standard">
  Balanced distortion effect
</div>

<!-- Polar (vertical) distortion -->
<div liquidGlass lgMode="polar">
  Vertical distortion effect
</div>

<!-- Prominent (strong) distortion -->
<div liquidGlass lgMode="prominent">
  Strong distortion effect
</div>
```

### Spacing & Layout

```html
<!-- Custom corner radius -->
<div liquidGlass lgCornerRadius="var(--radius-2xl)">
  Extra rounded corners
</div>

<!-- Explicit pixel radius -->
<div liquidGlass lgCornerRadius="24px">
  24px rounded corners
</div>

<!-- Thicker border -->
<div liquidGlass lgBorderWidth="2">
  2px border
</div>
```

### Filter Configuration

```html
<!-- Disable filters (backdrop blur only) -->
<div liquidGlass [lgDisableFilters]="true">
  No SVG filters
</div>

<!-- Custom displacement -->
<div liquidGlass [lgDisplacementScale]="80">
  Stronger displacement
</div>

<!-- More blur -->
<div liquidGlass [lgBlurAmount]="0.5">
  Increased blur
</div>

<!-- Higher saturation -->
<div liquidGlass [lgSaturation]="120">
  More vibrant colors
</div>

<!-- Strong chromatic aberration -->
<div liquidGlass [lgAberrationIntensity]="3">
  Pronounced RGB split
</div>
```

### Animation Control

```html
<!-- Disable animation -->
<div liquidGlass [lgDisableAnimation]="true">
  Static effect
</div>

<!-- Faster tracking -->
<div liquidGlass [lgElasticity]="0.5">
  Snappier motion
</div>

<!-- Slower, smoother tracking -->
<div liquidGlass [lgElasticity]="0.1">
  Gradual motion
</div>

<!-- Stronger parallax -->
<div liquidGlass [lgParallaxIntensity]="4">
  More depth effect
</div>

<!-- Ignore reduced motion preference -->
<div liquidGlass [lgRespectReducedMotion]="false">
  Always animate
</div>
```

### Accessibility

```html
<!-- Custom ARIA label -->
<div liquidGlass lgAriaLabel="Featured product card">
  Product content
</div>

<!-- Custom role -->
<div liquidGlass lgRole="article">
  Article content
</div>
```

## Complete Example

```html
<div
  liquidGlass
  lgTheme="mineral-light"
  lgMode="prominent"
  lgCornerRadius="var(--radius-2xl)"
  lgBorderWidth="1"
  [lgBlurAmount]="0.4"
  [lgSaturation]="110"
  [lgElasticity]="0.3"
  [lgParallaxIntensity]="3"
  lgAriaLabel="Premium feature card"
  class="p-6 space-y-4">
  <h3 class="text-lg font-medium text-foreground">
    Liquid Glass Effect
  </h3>
  <p class="text-sm text-muted-foreground">
    Move your mouse over this card to see the distortion effect.
  </p>
</div>
```

## Integration with Design System

```html
<!-- Using design system tokens -->
<div
  liquidGlass
  lgTheme="mineral-dark"
  lgCornerRadius="var(--radius-xl)"
  lgBorder="var(--accent)"
  class="card bg-card">
  <div class="card-content">
    <h4 class="h4">Design System Card</h4>
    <p class="p">Integrated with mineral theme</p>
  </div>
</div>
```

## CSS Variables Available

The directive sets these CSS custom properties on the host element:

```css
--lg-x: 50%;     /* Current mouse X position (%) */
--lg-y: 50%;     /* Current mouse Y position (%) */
```

You can use these for additional effects:

```html
<div liquidGlass class="custom-effect">
  Content
</div>

<style>
.custom-effect::after {
  content: '';
  position: absolute;
  top: var(--lg-y);
  left: var(--lg-x);
  width: 10px;
  height: 10px;
  background: var(--accent);
  border-radius: 50%;
  transform: translate(-50%, -50%);
}
</style>
```

## Performance Considerations

1. **Disable filters on low-end devices**:
   ```html
   <div liquidGlass [lgDisableFilters]="isLowEndDevice">
   ```

2. **Reduce animation complexity**:
   ```html
   <div liquidGlass [lgDisableAnimation]="prefersReducedMotion">
   ```

3. **Use lower displacement**:
   ```html
   <div liquidGlass [lgDisplacementScale]="40">
   ```

## Accessibility

The directive automatically:
- Adds `role="region"` (configurable via `lgRole`)
- Adds `aria-label="Liquid glass card"` (configurable via `lgAriaLabel`)
- Disables animation when user prefers reduced motion (respect `lgRespectReducedMotion`)
- Sets `pointer-events: none` on overlay to avoid keyboard interference

## Angular Signals Integration

```typescript
import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-example',
  template: `
    <div
      liquidGlass
      [lgDisableAnimation]="disableAnimation()"
      [lgElasticity]="elasticity()"
      [lgBlurAmount]="blurAmount()">
      <ng-content />
    </div>
  `,
})
export class ExampleComponent {
  disableAnimation = signal(false);
  elasticity = signal(0.25);
  blurAmount = signal(0.35);

  updateBlur(amount: number) {
    this.blurAmount.set(amount);
  }
}
```

## Standalone Component Usage

```typescript
import { Component } from '@angular/core';
import { LiquidGlassDirective } from '@shared/ui/liquid-glass';

@Component({
  selector: 'app-card',
  template: `
    <div liquidGlass lgTheme="mineral-dark" class="p-4">
      <h2>Standalone Card</h2>
    </div>
  `,
  standalone: true,
  imports: [LiquidGlassDirective],
})
export class CardComponent {}
```
