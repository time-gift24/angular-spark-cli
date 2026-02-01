/**
 * Liquid Glass Directive - Theme Resolver Service
 *
 * Angular service for resolving theme configurations and detecting
 * the current theme mode (light/dark) from the document.
 *
 * Part of Phase 2: Theme Integration Layer
 */

import { inject, Injectable } from '@angular/core';
import {
  LiquidGlassTheme,
  LiquidGlassColorConfig,
} from '@app/shared/ui/liquid-glass/types/liquid-glass.types';
import {
  MINERAL_LIGHT_THEME,
  MINERAL_DARK_THEME,
} from '@app/shared/ui/liquid-glass/types/theme.constants';

/**
 * Theme resolver service for liquid glass directive
 *
 * Provides methods to:
 * - Get color configuration for a specific theme
 * - Detect current document theme (light/dark mode)
 * - Auto-select appropriate theme based on current mode
 *
 * Provided in 'root' for tree-shakability and singleton behavior.
 */
@Injectable({ providedIn: 'root' })
export class LiquidGlassThemeResolver {
  /**
   * Get color configuration based on theme
   *
   * Returns the predefined color configuration for mineral themes,
   * or an empty config for custom themes (user must provide colors).
   *
   * @param theme - Theme identifier
   * @returns Color configuration for the theme
   *
   * @example
   * ```ts
   * const resolver = inject(LiquidGlassThemeResolver);
   * const colors = resolver.getColorConfig('mineral-dark');
   * // Returns MINERAL_DARK_THEME object
   * ```
   */
  getColorConfig(theme: LiquidGlassTheme): LiquidGlassColorConfig {
    switch (theme) {
      case 'mineral-light':
        return MINERAL_LIGHT_THEME;

      case 'mineral-dark':
        return MINERAL_DARK_THEME;

      case 'custom':
        // Return empty config - user must provide custom colors via inputs
        return {
          border: '',
          hotspot: '',
          tint: '',
          aberration1: '',
          aberration2: '',
        };

      default:
        // Fallback to dark mode for unknown themes
        return MINERAL_DARK_THEME;
    }
  }

  /**
   * Detect current theme from document class
   *
   * Checks if the document element has the 'dark' class, which is
   * the standard convention for theme switching in the design system.
   *
   * @returns 'dark' if dark mode active, 'light' otherwise
   *
   * @example
   * ```ts
   * const current = resolver.detectCurrentTheme();
   * // Returns: 'dark' or 'light'
   * ```
   */
  detectCurrentTheme(): 'light' | 'dark' {
    return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  }

  /**
   * Auto-select theme based on current document mode
   *
   * Automatically chooses between mineral-light and mineral-dark
   * based on the current theme detected from the document.
   *
   * @returns Appropriate LiquidGlassTheme for current mode
   *
   * @example
   * ```ts
   * const theme = resolver.autoSelectTheme();
   * // Returns: 'mineral-dark' if in dark mode, 'mineral-light' otherwise
   * ```
   */
  autoSelectTheme(): LiquidGlassTheme {
    return this.detectCurrentTheme() === 'dark' ? 'mineral-dark' : 'mineral-light';
  }

  /**
   * Check if a specific theme is currently active
   *
   * Compares the given theme with the auto-detected theme.
   *
   * @param theme - Theme to check
   * @returns true if the theme matches current mode
   *
   * @example
   * ```ts
   * const isDark = resolver.isThemeActive('mineral-dark');
   * // Returns: true if currently in dark mode
   * ```
   */
  isThemeActive(theme: LiquidGlassTheme): boolean {
    const currentTheme = this.autoSelectTheme();
    return theme === currentTheme;
  }

  /**
   * Validate theme string
   *
   * Checks if a string is a valid LiquidGlassTheme value.
   *
   * @param theme - Theme string to validate
   * @returns true if valid theme
   *
   * @example
   * ```ts
   * resolver.isValidTheme('mineral-light'); // true
   * resolver.isValidTheme('invalid'); // false
   * ```
   */
  isValidTheme(theme: string): theme is LiquidGlassTheme {
    return ['mineral-light', 'mineral-dark', 'custom'].includes(theme);
  }
}
