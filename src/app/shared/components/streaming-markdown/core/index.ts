/**
 * Code Highlighting - Core Types Export
 *
 * Central export point for all code highlighting domain types.
 * Provides convenient imports for consumers of the highlighting system.
 */

// Shini highlighter types
export {
  type IShiniHighlighter,
  type ShiniInitializationState,
  type ShiniLanguage,
  type ShiniTheme,
  type HighlightResult,
  type FallbackHighlightResult,
  LANGUAGE_DISPLAY_NAMES,
  PRELOAD_LANGUAGES,
  SHINI_THEME_MAP
} from './shini-types';

// Shini highlighter service
export { ShiniHighlighter } from './shini-highlighter';

// Theme service
export { ThemeService } from './theme.service';

// Theme integration types
export {
  type AppTheme,
  type IThemeService,
  type ThemeMapping,
  type ThemeChangeData,
  type IThemeChangeObserver,
  type ThemeStorageConfig,
  type SystemThemePreference,
  THEME_MAPPING,
  DEFAULT_THEME_STORAGE
} from './theme-integration.types';

// CSS variables types
export {
  CODE_CSS_VARIABLES,
  SHINI_TOKEN_MAPPING,
  type ShiniTokenClass,
  LIGHT_MODE_VALUES,
  DARK_MODE_VALUES,
  type CssRule,
  type CodeHighlightStylesheet,
  type CssVariableSetterOptions,
  type ICssVariableUtils
} from './css-variables.types';

// Error handling types
export {
  type ErrorSeverity,
  type ErrorCategory,
  type HighlightingError,
  type InitializationError,
  type HighlightingExecutionError,
  type UnsupportedLanguageError,
  type ThemeError,
  type ErrorHandlerResult,
  type IErrorHandler,
  type ErrorLogEntry,
  type ErrorLoggerConfig,
  type RecoveryStrategy,
  type RecoveryResult,
  type IErrorFactory
} from './error-handling.types';
