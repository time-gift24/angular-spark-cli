/**
 * Streaming Markdown - Provider Factory
 *
 * Provides the `provideStreamingMarkdown()` function for configuring
 * the plugin-based block rendering system at the application level.
 */

import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import {
  StreamdownPlugin,
  BlockComponentRegistry,
  STREAMDOWN_PLUGINS,
  BLOCK_COMPONENT_REGISTRY
} from './plugin';

/**
 * Builds a BlockComponentRegistry from an array of plugins.
 * Later plugins override earlier ones for the same block type.
 */
function buildRegistry(plugins: StreamdownPlugin[]): BlockComponentRegistry {
  const componentMap = new Map<string, any>();
  const matchers: BlockComponentRegistry['matchers'] = [];
  const parserExtensions: BlockComponentRegistry['parserExtensions'] = [];

  for (const plugin of plugins) {
    for (const [type, comp] of Object.entries(plugin.components)) {
      componentMap.set(type, comp);
    }
    if (plugin.blockMatcher) {
      matchers.push({
        pluginName: plugin.name,
        matcher: plugin.blockMatcher,
        components: plugin.components
      });
    }

    for (const extension of plugin.parserExtensions || []) {
      parserExtensions.push({
        pluginName: plugin.name,
        extension
      });
    }
  }

  return { componentMap, matchers, parserExtensions };
}

/**
 * Configures the streaming markdown plugin system.
 * Call this in your application's `providers` array.
 *
 * @param plugins - One or more StreamdownPlugin instances to register
 * @returns EnvironmentProviders for Angular's DI system
 *
 * @example
 * ```typescript
 * export const appConfig: ApplicationConfig = {
 *   providers: [
 *     provideStreamingMarkdown(builtinPlugin()),
 *   ]
 * };
 * ```
 */
export function provideStreamingMarkdown(...plugins: StreamdownPlugin[]): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: STREAMDOWN_PLUGINS, useValue: plugins },
    { provide: BLOCK_COMPONENT_REGISTRY, useFactory: () => buildRegistry(plugins) }
  ]);
}
