import { Injectable, inject, DestroyRef, signal, computed, effect, type Signal } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import {
  AppVisualTheme,
  ThemeMode,
  DEFAULT_THEME,
  DEFAULT_MODE,
  THEME_CLASS_MAP,
  THEME_STORAGE_KEYS,
  isValidTheme,
  isValidMode,
} from './theme.types';

/**
 * Service for managing application theme and light/dark mode.
 *
 * Key responsibilities:
 * - **Visual Theme Management**: Switch between mineral, tiny3, and mira themes
 * - **Mode Management**: Toggle between light and dark modes
 * - **CSS Class Management**: Apply/remove theme and mode classes to document
 * - **State Persistence**: Save/load preferences from localStorage
 * - **No-Refresh Switching**: Change themes without page reload
 *
 * CSS Integration:
 * - Visual themes use CSS classes: `.theme-tiny3`, `.theme-mira`
 * - Mineral theme uses `:root` base variables (no class)
 * - Dark mode uses the `.dark` class on document element
 *
 * @example
 * ```typescript
 * constructor(private theme: AppThemeService) {
 *   // Access current theme as signal (returns Signal, call with () to get value)
 *   console.log(this.theme.theme()); // 'mira'
 *   console.log(this.theme.mode()); // 'light'
 *   console.log(this.theme.isDark()); // false
 * }
 *
 * // Switch to mineral theme
 * this.theme.setVisualTheme('mineral');
 *
 * // Toggle dark mode
 * this.theme.toggleMode();
 *
 * // Explicit mode control
 * this.theme.setMode('dark');
 * ```
 *
 * @Phase 3.1 - Theme runtime implementation
 */
@Injectable({ providedIn: 'root' })
export class AppThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);

  /** Current visual theme signal */
  readonly #theme = signal<AppVisualTheme>(this.loadThemeFromStorage() ?? DEFAULT_THEME);

  /** Current mode (light/dark) signal */
  readonly #mode = signal<ThemeMode>(this.loadModeFromStorage() ?? this.detectSystemMode());

  /** Document element reference for class manipulation */
  readonly #documentElement = this.document.documentElement;

  constructor() {
    // Initialize CSS classes on construction
    this.applyThemeClasses();

    // React to theme changes and persist to storage
    effect(() => {
      const theme = this.#theme();
      this.applyThemeClasses();
      this.saveThemeToStorage(theme);
    });

    // React to mode changes and persist to storage
    effect(() => {
      const mode = this.#mode();
      this.applyThemeClasses();
      this.saveModeToStorage(mode);
    });

    // Listen for system color scheme changes
    this.listenForSystemSchemeChanges();
  }

  /**
   * Sets the visual theme.
   *
   * Updates the CSS class on the document element and persists to localStorage.
   * Invalid theme values are silently ignored.
   *
   * @param theme - The visual theme to apply
   *
   * @example
   * ```typescript
   * this.theme.setVisualTheme('mineral');
   * this.theme.setVisualTheme('tiny3');
   * this.theme.setVisualTheme('mira');
   * ```
   */
  setVisualTheme(theme: AppVisualTheme): void {
    if (!isValidTheme(theme)) {
      return;
    }
    this.#theme.set(theme);
  }

  /**
   * Sets the color mode (light or dark).
   *
   * Updates the `.dark` class on the document element and persists to localStorage.
   * Invalid mode values are silently ignored.
   *
   * @param mode - The mode to apply ('light' or 'dark')
   *
   * @example
   * ```typescript
   * this.theme.setMode('dark');
   * this.theme.setMode('light');
   * ```
   */
  setMode(mode: ThemeMode): void {
    if (!isValidMode(mode)) {
      return;
    }
    this.#mode.set(mode);
  }

  /**
   * Toggles between light and dark mode.
   *
   * Convenience method for switching modes without explicitly specifying the target.
   *
   * @example
   * ```typescript
   * // If currently light, switches to dark
   * // If currently dark, switches to light
   * this.theme.toggleMode();
   * ```
   */
  toggleMode(): void {
    this.#mode.update((current) => (current === 'light' ? 'dark' : 'light'));
  }

  /**
   * Read-only signal exposing the current visual theme.
   *
   * @returns Signal containing the current theme value
   *
   * @example
   * ```typescript
   * const currentTheme = this.theme.theme();
   * // or in a template: {{ themeService.theme() }}
   * ```
   */
  readonly theme: Signal<AppVisualTheme> = this.#theme.asReadonly();

  /**
   * Read-only signal exposing the current color mode.
   *
   * @returns Signal containing the current mode value
   *
   * @example
   * ```typescript
   * const currentMode = this.theme.mode();
   * // or in a template: {{ themeService.mode() }}
   * ```
   */
  readonly mode: Signal<ThemeMode> = this.#mode.asReadonly();

  /**
   * Computed signal indicating if dark mode is active.
   *
   * @returns Signal that is true when in dark mode
   *
   * @example
   * ```typescript
   * if (this.theme.isDark()) {
   *   // Show dark mode UI
   * }
   * ```
   */
  readonly isDark: Signal<boolean> = computed(() => this.#mode() === 'dark');

  /**
   * Applies the appropriate CSS classes to the document element.
   *
   * Handles:
   * - Removing previous theme classes
   * - Adding new theme class (except for 'default' which has no class)
   * - Toggling the `.dark` class for mode
   *
   * This ensures compatibility with:
   * - Tailwind v4 `@custom-variant dark (&:is(.dark *))`
   * - streaming-markdown component styling
   * - liquid-glass component styling
   */
  private applyThemeClasses(): void {
    const theme = this.#theme();
    const mode = this.#mode();
    const themeClass = THEME_CLASS_MAP[theme];

    // Remove all known theme classes
    Object.values(THEME_CLASS_MAP).forEach((cls) => {
      if (cls) {
        this.#documentElement.classList.remove(cls);
      }
    });

    // Apply new theme class (default has no class)
    if (themeClass) {
      this.#documentElement.classList.add(themeClass);
    }

    // Apply dark mode class
    if (mode === 'dark') {
      this.#documentElement.classList.add('dark');
    } else {
      this.#documentElement.classList.remove('dark');
    }
  }

  /**
   * Loads the saved theme preference from localStorage.
   *
   * @returns The saved theme, or null if not found or invalid
   */
  private loadThemeFromStorage(): AppVisualTheme | null {
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEYS.THEME);
      if (stored && isValidTheme(stored)) {
        return stored;
      }
    } catch {
      // Gracefully handle localStorage errors
    }
    return null;
  }

  /**
   * Saves the current theme preference to localStorage.
   *
   * @param theme - The theme to persist
   */
  private saveThemeToStorage(theme: AppVisualTheme): void {
    try {
      localStorage.setItem(THEME_STORAGE_KEYS.THEME, theme);
    } catch {
      // Gracefully handle localStorage errors
    }
  }

  /**
   * Loads the saved mode preference from localStorage.
   *
   * @returns The saved mode, or null if not found
   */
  private loadModeFromStorage(): ThemeMode | null {
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEYS.MODE);
      if (stored && isValidMode(stored)) {
        return stored;
      }
    } catch {
      // Gracefully handle localStorage errors
    }
    return null;
  }

  /**
   * Saves the current mode preference to localStorage.
   *
   * @param mode - The mode to persist
   */
  private saveModeToStorage(mode: ThemeMode): void {
    try {
      localStorage.setItem(THEME_STORAGE_KEYS.MODE, mode);
    } catch {
      // Gracefully handle localStorage errors
    }
  }

  /**
   * Detects the system's preferred color scheme.
   *
   * Uses `prefers-color-scheme` media query to determine if the user
   * has requested dark mode at the OS level.
   *
   * @returns 'dark' if system prefers dark, otherwise 'light'
   */
  private detectSystemMode(): ThemeMode {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return DEFAULT_MODE;
    }

    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  /**
   * Listens for system color scheme changes and updates mode accordingly.
   *
   * Only updates the mode if there's no saved user preference,
   * respecting user choice over system defaults.
   */
  private listenForSystemSchemeChanges(): void {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const listener = (event: MediaQueryListEvent) => {
      // Only auto-update if user hasn't set a preference
      if (localStorage.getItem(THEME_STORAGE_KEYS.MODE) === null) {
        this.#mode.set(event.matches ? 'dark' : 'light');
      }
    };

    // Use modern addEventListener API with fallback
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', listener);
      this.destroyRef.onDestroy(() => {
        mediaQuery.removeEventListener('change', listener);
      });
    }
  }
}
