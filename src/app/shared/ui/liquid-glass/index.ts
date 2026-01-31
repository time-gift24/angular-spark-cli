/**
 * Liquid Glass UI Module
 *
 * A headless liquid glass distortion effect system for Angular 21+
 * Integrates theme resolution, SVG filters, and animation state management
 *
 * ## Architecture
 *
 * - **Directives**: Main [liquidGlass] directive for applying effects
 * - **Services**: Theme resolution and SVG filter building
 * - **Types**: TypeScript interfaces and constants
 * - **Utils**: Color manipulation utilities
 *
 * ## Usage
 *
 * ```typescript
 * import { LiquidGlassDirective } from '@shared/ui/liquid-glass';
 * ```
 *
 * @module @shared/ui/liquid-glass
 */

// Public API
export * from './directives';
export * from './services';
export * from './types/liquid-glass.types';
export * from './types/theme.constants';
