/**
 * Streaming Markdown - Builtin Plugin
 *
 * Registers all built-in block renderer components for standard
 * markdown block types (paragraph, heading, code, list, blockquote, etc.).
 */

import { StreamdownPlugin } from '../core/plugin';
import { BlockType } from '../core/models';
import { MarkdownParagraphComponent } from '../blocks/paragraph/paragraph.component';
import { MarkdownHeadingComponent } from '../blocks/heading/heading.component';
import { MarkdownCodeComponent } from '../blocks/code/code.component';
import { MarkdownListComponent } from '../blocks/list/list.component';
import { MarkdownBlockquoteComponent } from '../blocks/blockquote/blockquote.component';

/**
 * Creates the builtin plugin with all standard block renderers.
 *
 * Block type mapping:
 * - PARAGRAPH, THEMATIC_BREAK, HTML, UNKNOWN → MarkdownParagraphComponent
 * - HEADING → MarkdownHeadingComponent
 * - CODE_BLOCK → MarkdownCodeComponent
 * - LIST → MarkdownListComponent
 * - BLOCKQUOTE → MarkdownBlockquoteComponent
 */
export function builtinPlugin(): StreamdownPlugin {
  return {
    name: 'builtin',
    components: {
      [BlockType.PARAGRAPH]: MarkdownParagraphComponent,
      [BlockType.HEADING]: MarkdownHeadingComponent,
      [BlockType.CODE_BLOCK]: MarkdownCodeComponent,
      [BlockType.LIST]: MarkdownListComponent,
      [BlockType.BLOCKQUOTE]: MarkdownBlockquoteComponent,
      [BlockType.THEMATIC_BREAK]: MarkdownParagraphComponent,
      [BlockType.HTML]: MarkdownParagraphComponent,
      [BlockType.UNKNOWN]: MarkdownParagraphComponent,
    }
  };
}
