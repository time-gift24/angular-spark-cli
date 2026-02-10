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

// Plugin architecture
export {
  type BlockRenderer,
  type BlockMatcher,
  type BlockParserContext,
  type BlockParseBase,
  type TokenHandlerInput,
  type BlockTokenHandler,
  type BlockParserExtension,
  type StreamdownPlugin,
  type BlockComponentRegistry,
  createStreamdownPlugin,
  createParserExtensionPlugin,
  defineBlockParserExtension,
  STREAMDOWN_PLUGINS,
  BLOCK_COMPONENT_REGISTRY
} from './plugin';

export { provideStreamingMarkdown } from './provide-streaming-markdown';

// Preprocessor
export { MarkdownPreprocessor, type IMarkdownPreprocessor } from './markdown-preprocessor';

// Domain models
export {
  type SyntaxToken,
  type CodeLine,
  type MarkdownBlock,
  type MarkdownInline,
  type StreamingState,
  type ParserResult,
  type HighlightResult,
  BlockType,
  createEmptyState,
  type VirtualScrollConfig,
  type VirtualWindow,
  type BlockRenderState,
  DEFAULT_VIRTUAL_SCROLL_CONFIG
} from './models';

// Virtual scroll service
export { VirtualScrollService } from './virtual-scroll.service';

// Highlight coordinator
export { HighlightCoordinator } from './highlight-coordinator.service';

// Streaming pipeline service
export { StreamingPipelineService, type PipelineConfig } from './streaming-pipeline.service';

// Stream adapters
export {
  sseToMarkdownStream$,
  fetchStreamToMarkdownStream$,
  type SseAdapterOptions,
  type FetchStreamAdapterOptions
} from './stream-adapters';

// Error handling types
export {
  ComponentErrorType,
  type ErrorSeverity,
  type ErrorCode,
  type ErrorCategory,
  type StreamingMarkdownError,
  type HighlightingError,
  type ComponentError,
  type ErrorInput,
  type InitializationError,
  type HighlightingExecutionError,
  type UnsupportedLanguageError,
  type ThemeError,
  type ErrorHandlerResult,
  type IErrorHandler,
  type ErrorBoundaryState,
  type RetryConfig,
  type ErrorLogEntry,
  type ErrorLoggerConfig,
  type RecoveryStrategy,
  type RecoveryResult,
  type IErrorFactory
} from './error-handling';
