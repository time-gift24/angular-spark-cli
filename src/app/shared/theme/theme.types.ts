/**
 * Visual theme identifiers for the application.
 *
 * These correspond to CSS classes defined in styles.css:
 * - `default`: Base "Mineral & Time" rock-color theme (岩彩主题)
 * - `tiny3`: Blue primary + red accent theme
 * - `mira': Standard shadcn/ui theme
 *
 * Each theme has light and dark variants controlled by the .dark class.
 *
 * @see styles.css for CSS variable definitions
 */
export type AppVisualTheme = 'mineral' | 'tiny3' | 'mira';

/**
 * Theme mode representing light/dark state.
 */
export type ThemeMode = 'light' | 'dark';

/**
 * Theme storage keys for localStorage persistence.
 */
const THEME_STORAGE_KEYS = {
  THEME: 'spark-visual-theme',
  MODE: 'spark-theme-mode',
} as const;

/**
 * Default theme values.
 * mira is the default as per Task 1 completion.
 */
export const DEFAULT_THEME: AppVisualTheme = 'mira';
export const DEFAULT_MODE: ThemeMode = 'light';

/**
 * CSS class mappings for themes.
 * Maps theme identifiers to their CSS class names.
 *
 * Note: 'mineral' theme uses `:root` base variables, so it has no class.
 */
export const THEME_CLASS_MAP: Record<AppVisualTheme, string> = {
  mineral: '',
  tiny3: 'theme-tiny3',
  mira: 'theme-mira',
} as const;

/**
 * Validates if a value is a valid AppVisualTheme.
 */
export function isValidTheme(value: unknown): value is AppVisualTheme {
  return typeof value === 'string' && ['mineral', 'tiny3', 'mira'].includes(value);
}

/**
 * Validates if a value is a valid ThemeMode.
 */
export function isValidMode(value: unknown): value is ThemeMode {
  return value === 'light' || value === 'dark';
}

export { THEME_STORAGE_KEYS };
