/**
 * Streaming Markdown - Plugin Architecture
 *
 * Defines the plugin system for extensible block rendering.
 * Plugins register component mappings for block types,
 * enabling custom block renderers without modifying core code.
 */

import { InjectionToken, Type } from '@angular/core';
import { MarkdownBlock, MarkdownInline, BlockType } from './models';

export interface BlockParserContext {
  parseInlineTokens(tokens: any[] | undefined): MarkdownInline[];
  extractText(token: any): string;
  tokenToBlock(token: any, position: number): MarkdownBlock | null;
  generateStableId(type: string, position: number): string;
}

export interface BlockParseBase {
  id: string;
  position: number;
  isComplete: boolean;
}

export interface TokenHandlerInput {
  token: any;
  position: number;
  baseBlock: BlockParseBase;
  context: BlockParserContext;
}

export type BlockTokenHandler = (input: TokenHandlerInput) => MarkdownBlock | null;

export interface BlockParserExtension {
  type?: string;
  match?: (token: any) => boolean;
  handler: BlockTokenHandler;
}

export function defineBlockParserExtension(extension: BlockParserExtension): BlockParserExtension {
  return extension;
}

export interface StreamdownPluginInput extends Omit<StreamdownPlugin, 'components'> {
  components?: Record<string, Type<any>>;
}

export function createStreamdownPlugin(input: StreamdownPluginInput): StreamdownPlugin {
  return {
    components: {},
    ...input
  };
}

export function createParserExtensionPlugin(
  name: string,
  ...parserExtensions: BlockParserExtension[]
): StreamdownPlugin {
  return {
    name,
    components: {},
    parserExtensions
  };
}

/**
 * Interface that all block renderer components must satisfy.
 * Components receive a unified `block` + `isComplete` input pair.
 */
export interface BlockRenderer {
  block: MarkdownBlock;
  isComplete: boolean;
}

/**
 * Function that determines whether a plugin can handle a given block.
 * Used for custom block type matching beyond simple type string lookup.
 */
export type BlockMatcher = (block: MarkdownBlock) => boolean;

/**
 * A plugin that registers block renderer components.
 *
 * @example
 * ```typescript
 * const myPlugin: StreamdownPlugin = {
 *   name: 'chart',
 *   components: { 'chart': ChartBlockComponent },
 *   blockMatcher: (block) => block.type === BlockType.UNKNOWN && block.content.startsWith('```chart')
 * };
 * ```
 */
export interface StreamdownPlugin {
  /** Unique plugin name for debugging and conflict resolution */
  name: string;

  /** Map of block type string → component class */
  components: Record<string, Type<any>>;

  /** Optional custom matcher for blocks that don't match by type string alone */
  blockMatcher?: BlockMatcher;

  /** Optional parser extensions for custom marked tokens */
  parserExtensions?: BlockParserExtension[];
}

/**
 * Runtime registry built from all registered plugins.
 * Used by the block-router to resolve components dynamically.
 */
export interface BlockComponentRegistry {
  /** Direct type → component lookup map */
  componentMap: Map<string, Type<any>>;

  /** Ordered list of custom matchers from plugins */
  matchers: {
    pluginName: string;
    matcher: BlockMatcher;
    components: Record<string, Type<any>>;
  }[];

  parserExtensions: {
    pluginName: string;
    extension: BlockParserExtension;
  }[];
}

/**
 * DI token for providing plugins to the streaming markdown system.
 */
export const STREAMDOWN_PLUGINS = new InjectionToken<StreamdownPlugin[]>('STREAMDOWN_PLUGINS');

/**
 * DI token for the compiled block component registry.
 */
export const BLOCK_COMPONENT_REGISTRY = new InjectionToken<BlockComponentRegistry>('BLOCK_COMPONENT_REGISTRY');
