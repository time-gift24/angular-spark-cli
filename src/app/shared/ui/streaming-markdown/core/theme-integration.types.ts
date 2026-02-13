/**
 * Theme Service Integration Types
 *
 * This module defines types for integrating code highlighting
 * with the application's theme management system.
 *
 * Phase 4, Task 4.1: Define Theme Service Interface
 */

import { Signal } from '@angular/core';
import { ShiniTheme } from './shini-types';

/**
 * Theme identifier used throughout the application
 */
export type AppTheme = 'light' | 'dark';

/**
 * Theme service interface
 * Manages application theme state and notifications
 */
export interface IThemeService {
  /**
   * Current theme as a reactive Signal.
   * Components can read this to reactively update when theme changes.
   */
  readonly theme: Signal<AppTheme>;

  /**
   * Toggle between light and dark themes.
   */
  toggleTheme(): void;

  /**
   * Set a specific theme.
   * @param theme - Theme to set ('light' or 'dark')
   */
  setTheme(theme: AppTheme): void;

  /**
   * Get the current theme value synchronously.
   * @returns Current theme ('light' or 'dark')
   */
  getCurrentTheme(): AppTheme;

  /**
   * Check if current theme is dark.
   * @returns true if dark theme is active
   */
  isDark(): boolean;

  /**
   * Check if current theme is light.
   * @returns true if light theme is active
   */
  isLight(): boolean;
}

/**
 * Phase 4, Task 4.2: Define Theme Mapping Types
 */

/**
 * Mapping from app theme to Shini theme
 */
export interface ThemeMapping {
  /** App theme identifier */
  appTheme: AppTheme;

  /** Corresponding Shini theme */
  shiniTheme: ShiniTheme;
}

/**
 * Theme mapping configuration
 * Maps application themes to Shini highlighter themes
 */
export const THEME_MAPPING: Readonly<Record<AppTheme, ShiniTheme>> = {
  'light': 'light',
  'dark': 'dark'
} as const;

/**
 * Phase 4, Task 4.3: Define Theme Change Notification Types
 */

/**
 * Theme change event data
 */
export interface ThemeChangeData {
  /** Previous theme */
  previousTheme: AppTheme;

  /** New theme */
  newTheme: AppTheme;

  /** Timestamp of change */
  timestamp: number;

  /** Source of change ('user' | 'system' | 'initial') */
  source: 'user' | 'system' | 'initial';
}

/**
 * Theme change observer
 * Notifies subscribers when theme changes
 */
export interface IThemeChangeObserver {
  /**
   * Subscribe to theme changes.
   * @param callback - Function to call when theme changes
   * @returns Unsubscribe function
   */
  subscribe(callback: (change: ThemeChangeData) => void): () => void;
}

/**
 * Phase 4, Task 4.4: Define Theme Persistence Types
 */

/**
 * Theme storage configuration
 */
export interface ThemeStorageConfig {
  /** Storage key for theme preference */
  storageKey: string;

  /** Whether to persist theme (localStorage/sessionStorage) */
  enabled: boolean;

  /** Storage type */
  storageType: 'localStorage' | 'sessionStorage';
}

/**
 * Default theme storage configuration
 */
export const DEFAULT_THEME_STORAGE: ThemeStorageConfig = {
  storageKey: 'app-theme',
  enabled: true,
  storageType: 'localStorage'
} as const;

/**
 * Phase 4, Task 4.5: Define System Theme Detection Types
 */

/**
 * System theme preference
 * Detected from prefers-color-scheme media query
 */
export interface SystemThemePreference {
  /** Preferred theme ('light' or 'dark') */
  preferredTheme: AppTheme;

  /** Whether system preference is supported */
  supported: boolean;

  /** Media query listener for changes */
  mediaQuery: MediaQueryList | null;
}
