/**
 * Liquid Glass New Components
 *
 * New Angular component implementations for the liquid glass effect.
 * Ported from the reference React implementation.
 */

// Main component
export { LiquidGlassComponent } from './components/liquid-glass.component';

// Internal components
export { GlassContainerComponent } from './components/glass-container.component';
export { GlassFilterComponent } from './components/glass-filter.component';
export type { GlassFilterMode } from './components/glass-filter.component';

// Services
export { ShaderDisplacementService } from './services/shader-displacement.service';
export type { Vec2, DisplacementResult } from './services/shader-displacement.service';

// Constants
export { displacementMap } from './constants/displacement-map';
export { polarDisplacementMap } from './constants/polar-displacement-map';
export { prominentDisplacementMap } from './constants/prominent-displacement-map';

// Directive
export { LiquidGlassDirective } from './directives/liquid-glass.directive';
