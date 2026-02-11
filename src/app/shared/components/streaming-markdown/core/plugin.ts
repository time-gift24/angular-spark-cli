/**
 * Streaming Markdown - Plugin Architecture
 *
 * Defines the plugin system for extensible parsing and rendering.
 * The API is designed for long-term maintainability, deterministic ordering,
 * and safety boundaries that plugins cannot bypass.
 */

import { InjectionToken, Type } from '@angular/core';
import { MarkdownBlock, MarkdownInline } from './models';

export type PluginOverrideStrategy = 'replace' | 'preserve' | 'error';

export interface StreamdownSecurityPolicy {
  sanitizeUrl(url: string | null | undefined): string | undefined;
  sanitizeInline(inline: MarkdownInline): MarkdownInline | null;
  allowComponentRegistration?(blockType: string, pluginName: string): boolean;
}

function sanitizeSafeUrl(url: string | null | undefined): string | undefined {
  if (!url) {
    return undefined;
  }

  const trimmed = url.trim();
  if (!trimmed) {
    return undefined;
  }

  const normalized = trimmed.toLowerCase();
  if (
    normalized.startsWith('javascript:') ||
    normalized.startsWith('vbscript:') ||
    normalized.startsWith('data:')
  ) {
    return undefined;
  }

  if (
    normalized.startsWith('http://') ||
    normalized.startsWith('https://') ||
    normalized.startsWith('mailto:') ||
    normalized.startsWith('tel:') ||
    normalized.startsWith('#') ||
    normalized.startsWith('/') ||
    normalized.startsWith('./') ||
    normalized.startsWith('../')
  ) {
    return trimmed;
  }

  return undefined;
}

/**
 * Default security policy used when no custom policy is provided.
 * - Allows only http/https/mailto/tel/hash/relative URLs
 * - Blocks protocol-based script URLs (javascript:, vbscript:, data:)
 */
export const DEFAULT_STREAMDOWN_SECURITY_POLICY: StreamdownSecurityPolicy = {
  sanitizeUrl(url: string | null | undefined): string | undefined {
    return sanitizeSafeUrl(url);
  },

  sanitizeInline(inline: MarkdownInline): MarkdownInline | null {
    if (!inline) {
      return null;
    }

    if (inline.type === 'link') {
      const safeHref = sanitizeSafeUrl(inline.href);
      if (!safeHref) {
        return {
          type: 'text',
          content: inline.content,
          children: inline.children
        };
      }

      if (safeHref === inline.href) {
        return inline;
      }

      return {
        ...inline,
        href: safeHref
      };
    }

    if (inline.type === 'image') {
      const safeSrc = sanitizeSafeUrl(inline.src);
      if (!safeSrc) {
        return {
          type: 'text',
          content: inline.alt || inline.content
        };
      }

      if (safeSrc === inline.src) {
        return inline;
      }

      return {
        ...inline,
        src: safeSrc
      };
    }

    return inline;
  },

  allowComponentRegistration(blockType: string, pluginName: string): boolean {
    if (blockType === 'html' && pluginName !== 'builtin') {
      return false;
    }

    return true;
  }
};

/**
 * Compatibility policy for projects that relied on pre-2026 behavior where
 * any plugin could register an HTML renderer component.
 */
export const LEGACY_STREAMDOWN_SECURITY_POLICY: StreamdownSecurityPolicy = {
  ...DEFAULT_STREAMDOWN_SECURITY_POLICY,
  allowComponentRegistration: () => true
};

export interface BlockParserContext {
  parseInlineTokens(tokens: any[] | undefined): MarkdownInline[];
  extractText(token: any): string;
  tokenToBlock(token: any, position: number): MarkdownBlock | null;
  generateStableId(type: string, position: number): string;
  sanitizeInline(inline: MarkdownInline): MarkdownInline | null;
}

export interface InlineParserContext {
  parseInlineTokens(tokens: any[] | undefined): MarkdownInline[];
  extractText(token: any): string;
  sanitizeInline(inline: MarkdownInline): MarkdownInline | null;
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

export interface InlineTokenHandlerInput {
  token: any;
  context: InlineParserContext;
}

export type BlockTokenHandler = (input: TokenHandlerInput) => MarkdownBlock | null | undefined;
export type InlineTokenHandler = (
  input: InlineTokenHandlerInput
) => MarkdownInline | MarkdownInline[] | null | undefined;

export interface BlockParserExtension {
  /** Human-readable extension label for observability */
  name?: string;

  /** Priority within all registered extensions (higher first) */
  priority?: number;

  type?: string;
  match?: (token: any) => boolean;
  handler: BlockTokenHandler;

  /** Validate handler output; invalid output triggers fallback */
  validate?: (result: MarkdownBlock | null | undefined, input: TokenHandlerInput) => boolean;

  /** Fallback when validation fails or handler throws */
  fallback?: BlockTokenHandler;
}

export interface InlineParserExtension {
  /** Human-readable extension label for observability */
  name?: string;

  /** Priority within all registered extensions (higher first) */
  priority?: number;

  type?: string;
  match?: (token: any) => boolean;
  handler: InlineTokenHandler;

  /** Validate handler output; invalid output triggers fallback */
  validate?: (
    result: MarkdownInline | MarkdownInline[] | null | undefined,
    input: InlineTokenHandlerInput
  ) => boolean;

  /** Fallback when validation fails or handler throws */
  fallback?: InlineTokenHandler;
}

export function defineBlockParserExtension(extension: BlockParserExtension): BlockParserExtension {
  return extension;
}

export function defineInlineParserExtension(extension: InlineParserExtension): InlineParserExtension {
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

export function createInlineParserExtensionPlugin(
  name: string,
  ...inlineParserExtensions: InlineParserExtension[]
): StreamdownPlugin {
  return {
    name,
    components: {},
    inlineParserExtensions
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
 * Function that resolves a component type key from a markdown block.
 * Enables plugins to select among multiple registered components.
 */
export type BlockResolver = (block: MarkdownBlock) => string | null | undefined;

export interface RenderHookContext {
  block: MarkdownBlock;
  isComplete: boolean;
  blockIndex: number;
  depth: number;
  component: Type<any> | null;
  inputs: Record<string, unknown>;
}

export type BeforeRenderHook = (context: RenderHookContext) => void;
export type AfterRenderHook = (context: RenderHookContext) => void;

export type PluginCounter =
  | 'lifecycleInitCalls'
  | 'lifecycleDestroyCalls'
  | 'beforeRenderCalls'
  | 'afterRenderCalls'
  | 'parserExtensionCalls'
  | 'parserExtensionFallbacks'
  | 'inlineExtensionCalls'
  | 'inlineExtensionFallbacks'
  | 'errors';

export interface PluginConflictRecord {
  pluginName: string;
  existingPluginName: string;
  blockType: string;
  strategy: PluginOverrideStrategy;
}

export interface PluginObservabilitySnapshot {
  lifecycleInitCalls: number;
  lifecycleDestroyCalls: number;
  beforeRenderCalls: number;
  afterRenderCalls: number;
  parserExtensionCalls: number;
  parserExtensionFallbacks: number;
  inlineExtensionCalls: number;
  inlineExtensionFallbacks: number;
  errors: number;
  conflicts: PluginConflictRecord[];
  byPlugin?: Record<string, Record<PluginCounter, number>>;
}

export interface StreamdownPluginObservability {
  increment(counter: PluginCounter, pluginName?: string): void;
  recordConflict(conflict: PluginConflictRecord): void;
  snapshot(): PluginObservabilitySnapshot;
}

export interface PluginLifecycleContext {
  pluginName: string;
  observability: StreamdownPluginObservability;
  registerCleanup(cleanup: () => void): void;
}

export type PluginLifecycleHook = (context: PluginLifecycleContext) => void | (() => void);

/**
 * A plugin that registers parser extensions, render hooks, and block renderers.
 */
export interface StreamdownPlugin {
  /** Unique plugin name for debugging and conflict resolution */
  name: string;

  /**
   * Determines plugin ordering.
   * Lower values run first. Same order keeps declaration order.
   */
  order?: number;

  /**
   * Component mapping conflict strategy when this plugin registers a type
   * that was already registered by an earlier plugin.
   */
  overrideStrategy?: PluginOverrideStrategy;

  /** Map of block type string → component class */
  components: Record<string, Type<any>>;

  /** Optional custom matcher for blocks that don't match by type string alone */
  blockMatcher?: BlockMatcher;

  /** Optional type resolver for matcher hits (supports multiple component keys) */
  blockResolver?: BlockResolver;

  /** Optional parser extensions for custom marked block tokens */
  parserExtensions?: BlockParserExtension[];

  /** Optional parser extensions for custom marked inline tokens */
  inlineParserExtensions?: InlineParserExtension[];

  /** Render hooks around block-router resolution */
  beforeRender?: BeforeRenderHook;
  afterRender?: AfterRenderHook;

  /** Lifecycle hooks */
  onInit?: PluginLifecycleHook;
  onDestroy?: PluginLifecycleHook;
}

/**
 * Runtime registry built from all registered plugins.
 * Used by parser and block-router to resolve behavior dynamically.
 */
export interface BlockComponentRegistry {
  /** Direct type → component lookup map */
  componentMap: Map<string, Type<any>>;

  /** Ordered list of custom matchers from plugins */
  matchers: {
    pluginName: string;
    matcher: BlockMatcher;
    resolveType?: BlockResolver;
    components: Record<string, Type<any>>;
  }[];

  parserExtensions: {
    pluginName: string;
    extension: BlockParserExtension;
    priority?: number;
  }[];

  inlineParserExtensions?: {
    pluginName: string;
    extension: InlineParserExtension;
    priority?: number;
  }[];

  beforeRenderHooks?: {
    pluginName: string;
    hook: BeforeRenderHook;
  }[];

  afterRenderHooks?: {
    pluginName: string;
    hook: AfterRenderHook;
  }[];

  securityPolicy?: StreamdownSecurityPolicy;
  observability?: StreamdownPluginObservability;
}

export interface StreamdownPluginRuntime {
  readonly registry: BlockComponentRegistry;
  readonly observability: StreamdownPluginObservability;
  readonly hasBeforeRenderHooks: boolean;
  readonly hasAfterRenderHooks: boolean;

  initialize(): void;
  destroy(): void;
  runBeforeRender(context: RenderHookContext): void;
  runAfterRender(context: RenderHookContext): void;
}

/**
 * DI token for providing plugins to the streaming markdown system.
 */
export const STREAMDOWN_PLUGINS = new InjectionToken<StreamdownPlugin[]>('STREAMDOWN_PLUGINS');

/**
 * DI token for the compiled block component registry.
 */
export const BLOCK_COMPONENT_REGISTRY = new InjectionToken<BlockComponentRegistry>('BLOCK_COMPONENT_REGISTRY');

/**
 * DI token for the plugin runtime (lifecycle + hooks + observability).
 */
export const STREAMDOWN_PLUGIN_RUNTIME = new InjectionToken<StreamdownPluginRuntime>('STREAMDOWN_PLUGIN_RUNTIME');

/**
 * DI token for the security policy.
 */
export const STREAMDOWN_SECURITY_POLICY = new InjectionToken<StreamdownSecurityPolicy>('STREAMDOWN_SECURITY_POLICY');
