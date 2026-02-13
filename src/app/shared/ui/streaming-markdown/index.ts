/**
 * Streaming Markdown Component - Public API
 *
 * Main entry point for the streaming markdown component.
 * Exports the main component, services, and types for public use.
 */

import { EnvironmentProviders } from '@angular/core';
import { builtinPlugin } from './plugins/builtin-plugin';
import { provideStreamingMarkdown } from './core/provide-streaming-markdown';
import type { StreamdownPlugin } from './core/plugin';

export function provideDefaultStreamingMarkdown(...plugins: StreamdownPlugin[]): EnvironmentProviders {
  return provideStreamingMarkdown(builtinPlugin(), ...plugins);
}

// Main component
export { StreamingMarkdownComponent } from './streaming-markdown.component';

// Core types and models
export {
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
  type SyntaxToken,
  type CodeLine,
  BlockType,
  createEmptyState
} from './core/models';

// Type guard functions for discriminated unions
export {
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
  isCustomBlock
} from './core/models';

// Virtual scroll types
export {
  type VirtualScrollConfig,
  type VirtualWindow,
  DEFAULT_VIRTUAL_SCROLL_CONFIG
} from './core/models';

// Virtual scroll service
export { VirtualScrollService } from './core/virtual-scroll.service';

// Block components (for direct use if needed)
export {
  MarkdownParagraphComponent,
  MarkdownHeadingComponent,
  MarkdownCodeComponent,
  MarkdownListComponent,
  MarkdownBlockquoteComponent,
  MarkdownThematicBreakComponent,
  MarkdownTableComponent,
  MarkdownBlockRouterComponent,
  MarkdownFootnoteComponent,
  VirtualScrollViewportComponent,
  BlockHeightTrackerDirective
} from './blocks';

// Virtual scroll component types
export type { ScrollEvent } from './blocks/virtual-scroll-viewport.component';
export type { HeightMeasurement } from './blocks/block-height-tracker.directive';

// Core services (for advanced usage)
export { ShiniHighlighter } from './core/shini-highlighter';
export { ThemeService } from './core/theme.service';
export { HighlightSchedulerService } from './core/highlight-scheduler.service';
export { HighlightCoordinator } from './core/highlight-coordinator.service';
export { StreamingPipelineService } from './core/streaming-pipeline.service';
export type { HighlightSchedulerConfig, HighlightPriority } from './core/highlight-scheduler.service';
export type { PipelineConfig } from './core/streaming-pipeline.service';

// Plugin types
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
  STREAMDOWN_PLUGIN_RUNTIME,
  STREAMDOWN_SECURITY_POLICY
} from './core/plugin';

// Provider function
export { provideStreamingMarkdown } from './core/provide-streaming-markdown';
export { builtinPlugin } from './plugins/builtin-plugin';

// Stream adapters
export {
  sseToMarkdownStream$,
  fetchStreamToMarkdownStream$,
  type SseAdapterOptions,
  type FetchStreamAdapterOptions
} from './core/stream-adapters';

// Error handling
export {
  ComponentErrorType,
  type ErrorSeverity,
  type ErrorCode,
  type ErrorCategory,
  type StreamingMarkdownError,
  type HighlightingError,
  type ComponentError,
  type ErrorInput,
  type ErrorHandlerResult,
  type IErrorHandler,
  type ErrorBoundaryState,
  type RetryConfig,
  type IErrorFactory
} from './core/error-handling';
