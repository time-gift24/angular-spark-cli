/**
 * Code Highlighting - Renderer Types Export
 *
 * Central export point for renderer-related types.
 */

// Markdown formatter service
export {
  MarkdownFormatterService,
  MarkdownFormatterServiceExtended
} from './markdown-formatter.service';

// Code block wrapper component
export { CodeBlockWrapperComponent } from './code-block-wrapper.component';

// Code block wrapper types
export {
  type CodeBlockWrapperInputs,
  type CodeBlockDisplayOptions,
  DEFAULT_CODE_BLOCK_OPTIONS,
  type CopyButtonState,
  type CopyButtonFeedback,
  DEFAULT_COPY_FEEDBACK,
  type LineNumbers,
  type LineNumberOptions,
  type CopyState,
  type CopyResult
} from './code-block-wrapper.types';

// Markdown formatter extensions
export {
  type FormatterOptions,
  type CodeBlockMetadata,
  type FormattedCodeBlock,
  type IMarkdownFormatterExtended,
  type FallbackStrategy,
  type FallbackResult,
  type ThemeChangeEvent,
  type ThemeAwareFormatterState
} from './markdown-formatter.extensions';
