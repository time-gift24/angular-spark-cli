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
  type BlockResolver,
  type RenderHookContext,
  type BeforeRenderHook,
  type AfterRenderHook,
  type InlineParserContext,
  type InlineTokenHandlerInput,
  type InlineTokenHandler,
  type InlineParserExtension,
  type StreamdownPluginRuntime,
  type StreamdownPluginInput,
  type StreamdownPluginObservability,
  type PluginObservabilitySnapshot,
  type PluginConflictRecord,
  type StreamdownSecurityPolicy,
  type PluginOverrideStrategy,
  type BlockParserContext,
  type BlockParseBase,
  type TokenHandlerInput,
  type BlockTokenHandler,
  type BlockParserExtension,
  type StreamdownPlugin,
  type BlockComponentRegistry,
  createStreamdownPlugin,
  createParserExtensionPlugin,
  createInlineParserExtensionPlugin,
  defineBlockParserExtension,
  defineInlineParserExtension,
  DEFAULT_STREAMDOWN_SECURITY_POLICY,
  LEGACY_STREAMDOWN_SECURITY_POLICY,
  STREAMDOWN_PLUGINS,
  BLOCK_COMPONENT_REGISTRY,
  STREAMDOWN_PLUGIN_RUNTIME,
  STREAMDOWN_SECURITY_POLICY
} from './plugin';

export { provideStreamingMarkdown } from './provide-streaming-markdown';

// Preprocessor
export { MarkdownPreprocessor, type IMarkdownPreprocessor } from './markdown-preprocessor';

// Domain models
export {
  type SyntaxToken,
  type CodeLine,
  type MarkdownBlock,
  type ParagraphBlock,
  type HeadingBlock,
  type CodeBlock,
  type MarkdownListItem,
  type ListBlock,
  type BlockquoteBlock,
  type TableBlock,
  type ThematicBreakBlock,
  type HtmlBlock,
  type FootnoteDefBlock,
  type UnknownBlock,
  type RawBlock,
  type CustomBlock,
  type MarkdownInline,
  type StreamingState,
  type ParserResult,
  type HighlightResult,
  BlockType,
  createEmptyState,
  isCodeBlock,
  isHeadingBlock,
  isListBlock,
  isBlockquoteBlock,
  isTableBlock,
  isParagraphBlock,
  isThematicBreakBlock,
  isHtmlBlock,
  isFootnoteDefBlock,
  isUnknownBlock,
  isRawBlock,
  isCustomBlock,
  type VirtualScrollConfig,
  type VirtualWindow,
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

// Depth guard
export { DepthGuard, MAX_NEST_DEPTH } from './depth-guard';

// Block Router Registry
export { BlockRouterRegistry } from './block-router-registry';

// Marked.js token types
export {
  type MarkedToken,
  type MarkedTokenBase,
  type MarkedInlineToken,
  type MarkedHeadingToken,
  type MarkedParagraphToken,
  type MarkedCodeToken,
  type MarkedListToken,
  type MarkedListItemToken,
  type MarkedBlockquoteToken,
  type MarkedHrToken,
  type MarkedSpaceToken,
  type MarkedHtmlBlockToken,
  type MarkedTableToken,
  type MarkedTableCellToken,
  type MarkedStrongToken,
  type MarkedEmToken,
  type MarkedDelToken,
  type MarkedCodespanToken,
  type MarkedLinkToken,
  type MarkedImageToken,
  type MarkedBrToken,
  type MarkedHtmlInlineToken,
  type MarkedTextToken,
  type MarkedAnyInlineToken,
  isMarkedHeadingToken,
  isMarkedParagraphToken,
  isMarkedCodeToken,
  isMarkedListToken,
  isMarkedBlockquoteToken,
  isMarkedHtmlBlockToken,
  isMarkedTableToken
} from './marked-tokens';
