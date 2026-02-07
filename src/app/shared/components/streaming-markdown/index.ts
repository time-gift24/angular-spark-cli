/**
 * Streaming Markdown Component - Public API
 *
 * Main entry point for the streaming markdown component.
 * Exports the main component, services, and types for public use.
 */

// Main component
export { StreamingMarkdownComponent } from './streaming-markdown.component';

// Core types and models
export {
  type MarkdownBlock,
  type MarkdownInline,
  type StreamingState,
  type ParserResult,
  type HighlightResult,
  type SyntaxToken,
  type CodeLine,
  BlockType,
  createEmptyState
} from './core/models';

// Virtual scroll types
export {
  type VirtualScrollConfig,
  type VirtualWindow,
  type BlockRenderState,
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

// Plugin types
export {
  type BlockRenderer,
  type BlockMatcher,
  type StreamdownPlugin,
  type BlockComponentRegistry
} from './core/plugin';

// Provider function
export { provideStreamingMarkdown } from './core/provide-streaming-markdown';
