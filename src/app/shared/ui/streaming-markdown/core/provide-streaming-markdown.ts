/**
 * Streaming Markdown - Provider Factory
 *
 * Provides `provideStreamingMarkdown()` for configuring the plugin system.
 * Supports deterministic ordering, conflict handling, lifecycle hooks,
 * and runtime observability.
 */

import { DestroyRef, EnvironmentProviders, Provider, Type, inject, makeEnvironmentProviders } from '@angular/core';
import { BlockType } from './models';
import {
  BlockComponentRegistry,
  BLOCK_COMPONENT_REGISTRY,
  DEFAULT_STREAMDOWN_SECURITY_POLICY,
  PluginConflictRecord,
  PluginCounter,
  PluginLifecycleContext,
  PluginObservabilitySnapshot,
  PluginOverrideStrategy,
  STREAMDOWN_PLUGINS,
  STREAMDOWN_PLUGIN_RUNTIME,
  STREAMDOWN_SECURITY_POLICY,
  StreamdownPlugin,
  StreamdownPluginObservability,
  StreamdownPluginRuntime,
  StreamdownSecurityPolicy
} from './plugin';

interface OrderedPlugin {
  plugin: StreamdownPlugin;
  order: number;
  declarationIndex: number;
}

class DefaultPluginObservability implements StreamdownPluginObservability {
  private readonly counters: Record<PluginCounter, number> = {
    lifecycleInitCalls: 0,
    lifecycleDestroyCalls: 0,
    beforeRenderCalls: 0,
    afterRenderCalls: 0,
    parserExtensionCalls: 0,
    parserExtensionFallbacks: 0,
    inlineExtensionCalls: 0,
    inlineExtensionFallbacks: 0,
    errors: 0
  };

  private readonly conflicts: PluginConflictRecord[] = [];
  private readonly byPlugin = new Map<string, Record<PluginCounter, number>>();

  increment(counter: PluginCounter, pluginName?: string): void {
    this.counters[counter] += 1;
    if (!pluginName) {
      return;
    }

    let pluginCounters = this.byPlugin.get(pluginName);
    if (!pluginCounters) {
      pluginCounters = {
        lifecycleInitCalls: 0,
        lifecycleDestroyCalls: 0,
        beforeRenderCalls: 0,
        afterRenderCalls: 0,
        parserExtensionCalls: 0,
        parserExtensionFallbacks: 0,
        inlineExtensionCalls: 0,
        inlineExtensionFallbacks: 0,
        errors: 0
      };
      this.byPlugin.set(pluginName, pluginCounters);
    }

    pluginCounters[counter] += 1;
  }

  recordConflict(conflict: PluginConflictRecord): void {
    this.conflicts.push(conflict);
  }

  snapshot(): PluginObservabilitySnapshot {
    const byPlugin: Record<string, Record<PluginCounter, number>> = {};
    this.byPlugin.forEach((value, key) => {
      byPlugin[key] = { ...value };
    });

    return {
      ...this.counters,
      conflicts: [...this.conflicts],
      byPlugin
    };
  }
}

class CompiledPluginRuntime implements StreamdownPluginRuntime {
  readonly hasBeforeRenderHooks: boolean;
  readonly hasAfterRenderHooks: boolean;

  private initialized = false;
  private readonly cleanupHandlers: Array<() => void> = [];

  constructor(
    private readonly orderedPlugins: OrderedPlugin[],
    public readonly registry: BlockComponentRegistry,
    public readonly observability: StreamdownPluginObservability
  ) {
    this.hasBeforeRenderHooks = !!registry.beforeRenderHooks && registry.beforeRenderHooks.length > 0;
    this.hasAfterRenderHooks = !!registry.afterRenderHooks && registry.afterRenderHooks.length > 0;
  }

  initialize(): void {
    if (this.initialized) {
      return;
    }

    this.initialized = true;

    for (const { plugin } of this.orderedPlugins) {
      if (!plugin.onInit) {
        continue;
      }

      this.observability.increment('lifecycleInitCalls', plugin.name);
      this.runLifecycleHook(plugin.name, plugin.onInit);
    }
  }

  destroy(): void {
    if (!this.initialized) {
      return;
    }

    for (let i = this.orderedPlugins.length - 1; i >= 0; i--) {
      const plugin = this.orderedPlugins[i].plugin;
      if (!plugin.onDestroy) {
        continue;
      }

      this.observability.increment('lifecycleDestroyCalls', plugin.name);
      this.runLifecycleHook(plugin.name, plugin.onDestroy);
    }

    for (let i = this.cleanupHandlers.length - 1; i >= 0; i--) {
      const cleanup = this.cleanupHandlers[i];
      try {
        cleanup();
      } catch (error) {
        this.observability.increment('errors');
        console.error('[StreamdownPluginRuntime] Plugin cleanup error:', error);
      }
    }

    this.cleanupHandlers.length = 0;
    this.initialized = false;
  }

  runBeforeRender(context: import('./plugin').RenderHookContext): void {
    const hooks = this.registry.beforeRenderHooks;
    if (!hooks || hooks.length === 0) {
      return;
    }

    for (const { pluginName, hook } of hooks) {
      this.observability.increment('beforeRenderCalls', pluginName);
      try {
        hook(context);
      } catch (error) {
        this.observability.increment('errors', pluginName);
        console.error(`[StreamdownPluginRuntime] beforeRender hook error from ${pluginName}:`, error);
      }
    }
  }

  runAfterRender(context: import('./plugin').RenderHookContext): void {
    const hooks = this.registry.afterRenderHooks;
    if (!hooks || hooks.length === 0) {
      return;
    }

    for (const { pluginName, hook } of hooks) {
      this.observability.increment('afterRenderCalls', pluginName);
      try {
        hook(context);
      } catch (error) {
        this.observability.increment('errors', pluginName);
        console.error(`[StreamdownPluginRuntime] afterRender hook error from ${pluginName}:`, error);
      }
    }
  }

  private runLifecycleHook(pluginName: string, hook: NonNullable<StreamdownPlugin['onInit']>): void {
    const context: PluginLifecycleContext = {
      pluginName,
      observability: this.observability,
      registerCleanup: (cleanup: () => void) => {
        this.cleanupHandlers.push(cleanup);
      }
    };

    try {
      const cleanup = hook(context);
      if (typeof cleanup === 'function') {
        this.cleanupHandlers.push(cleanup);
      }
    } catch (error) {
      this.observability.increment('errors', pluginName);
      console.error(`[StreamdownPluginRuntime] lifecycle hook error from ${pluginName}:`, error);
    }
  }
}

function sortPlugins(plugins: StreamdownPlugin[]): OrderedPlugin[] {
  const ordered = new Array<OrderedPlugin>(plugins.length);
  for (let i = 0; i < plugins.length; i++) {
    ordered[i] = {
      plugin: plugins[i],
      order: plugins[i].order ?? 0,
      declarationIndex: i
    };
  }

  ordered.sort((a, b) => {
    if (a.order !== b.order) {
      return a.order - b.order;
    }

    return a.declarationIndex - b.declarationIndex;
  });

  return ordered;
}

function chooseOverrideStrategy(plugin: StreamdownPlugin): PluginOverrideStrategy {
  return plugin.overrideStrategy ?? 'replace';
}

function shouldAllowComponentRegistration(
  securityPolicy: StreamdownSecurityPolicy,
  blockType: string,
  pluginName: string
): boolean {
  const gate = securityPolicy.allowComponentRegistration;
  if (typeof gate === 'function') {
    return gate(blockType, pluginName);
  }

  // Secure default: only builtin can bind an HTML renderer component.
  if (blockType === BlockType.HTML && pluginName !== 'builtin') {
    return false;
  }

  return true;
}

/**
 * Builds a BlockComponentRegistry from ordered plugins.
 */
function buildRegistry(
  orderedPlugins: OrderedPlugin[],
  securityPolicy: StreamdownSecurityPolicy,
  observability: StreamdownPluginObservability
): BlockComponentRegistry {
  const componentMap = new Map<string, Type<any>>();
  const componentOwners = new Map<string, string>();
  const matchers: BlockComponentRegistry['matchers'] = [];
  const parserExtensions: BlockComponentRegistry['parserExtensions'] = [];
  const inlineParserExtensions: NonNullable<BlockComponentRegistry['inlineParserExtensions']> = [];
  const beforeRenderHooks: NonNullable<BlockComponentRegistry['beforeRenderHooks']> = [];
  const afterRenderHooks: NonNullable<BlockComponentRegistry['afterRenderHooks']> = [];

  for (const { plugin } of orderedPlugins) {
    const overrideStrategy = chooseOverrideStrategy(plugin);

    for (const [type, component] of Object.entries(plugin.components)) {
      if (!shouldAllowComponentRegistration(securityPolicy, type, plugin.name)) {
        const existingPluginName = componentOwners.get(type) ?? 'security-policy';
        observability.recordConflict({
          pluginName: plugin.name,
          existingPluginName,
          blockType: type,
          strategy: 'preserve'
        });
        continue;
      }

      const existingPluginName = componentOwners.get(type);
      if (!existingPluginName) {
        componentMap.set(type, component);
        componentOwners.set(type, plugin.name);
        continue;
      }

      observability.recordConflict({
        pluginName: plugin.name,
        existingPluginName,
        blockType: type,
        strategy: overrideStrategy
      });

      if (overrideStrategy === 'preserve') {
        continue;
      }

      if (overrideStrategy === 'error') {
        throw new Error(
          `[provideStreamingMarkdown] Component conflict for block type "${type}" between ` +
          `"${existingPluginName}" and "${plugin.name}" (overrideStrategy=error).`
        );
      }

      componentMap.set(type, component);
      componentOwners.set(type, plugin.name);
    }

    if (plugin.blockMatcher || plugin.blockResolver) {
      matchers.push({
        pluginName: plugin.name,
        matcher: plugin.blockMatcher ?? (() => true),
        resolveType: plugin.blockResolver,
        components: plugin.components
      });
    }

    const pluginParserExtensions = plugin.parserExtensions;
    if (pluginParserExtensions && pluginParserExtensions.length > 0) {
      for (const extension of pluginParserExtensions) {
        parserExtensions.push({
          pluginName: plugin.name,
          extension,
          priority: extension.priority ?? 0
        });
      }
    }

    const pluginInlineExtensions = plugin.inlineParserExtensions;
    if (pluginInlineExtensions && pluginInlineExtensions.length > 0) {
      for (const extension of pluginInlineExtensions) {
        inlineParserExtensions.push({
          pluginName: plugin.name,
          extension,
          priority: extension.priority ?? 0
        });
      }
    }

    if (plugin.beforeRender) {
      beforeRenderHooks.push({ pluginName: plugin.name, hook: plugin.beforeRender });
    }

    if (plugin.afterRender) {
      afterRenderHooks.push({ pluginName: plugin.name, hook: plugin.afterRender });
    }
  }

  parserExtensions.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
  inlineParserExtensions.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));

  return {
    componentMap,
    matchers,
    parserExtensions,
    inlineParserExtensions,
    beforeRenderHooks,
    afterRenderHooks,
    securityPolicy,
    observability
  };
}

function createPluginRuntime(plugins: StreamdownPlugin[]): StreamdownPluginRuntime {
  const destroyRef = inject(DestroyRef);
  const securityPolicy = inject(STREAMDOWN_SECURITY_POLICY, { optional: true }) ?? DEFAULT_STREAMDOWN_SECURITY_POLICY;
  const observability = new DefaultPluginObservability();
  const orderedPlugins = sortPlugins(plugins);
  const registry = buildRegistry(orderedPlugins, securityPolicy, observability);
  const runtime = new CompiledPluginRuntime(orderedPlugins, registry, observability);

  runtime.initialize();
  destroyRef.onDestroy(() => {
    runtime.destroy();
  });

  return runtime;
}

/**
 * Configures the streaming markdown plugin system.
 * Call this in your application's `providers` array.
 *
 * @param plugins - One or more StreamdownPlugin instances to register
 * @returns EnvironmentProviders for Angular's DI system
 */
export function provideStreamingMarkdown(...plugins: StreamdownPlugin[]): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: STREAMDOWN_PLUGINS, useValue: plugins },
    { provide: STREAMDOWN_PLUGIN_RUNTIME, useFactory: () => createPluginRuntime(plugins) },
    {
      provide: BLOCK_COMPONENT_REGISTRY,
      useFactory: () => {
        const runtime = inject(STREAMDOWN_PLUGIN_RUNTIME);
        return runtime.registry;
      }
    }
  ]);
}

/**
 * Configures the streaming markdown plugin system for component-level providers.
 * Use this in a component's `providers` array instead of the root app config.
 *
 * @param plugins - One or more StreamdownPlugin instances to register
 * @returns Array of providers for component-level use
 */
export function provideStreamingMarkdownComponent(...plugins: StreamdownPlugin[]): Provider[] {
  return [
    { provide: STREAMDOWN_PLUGINS, useValue: plugins },
    { provide: STREAMDOWN_PLUGIN_RUNTIME, useFactory: () => createPluginRuntime(plugins) },
    {
      provide: BLOCK_COMPONENT_REGISTRY,
      useFactory: () => {
        const runtime = inject(STREAMDOWN_PLUGIN_RUNTIME);
        return runtime.registry;
      }
    }
  ];
}
