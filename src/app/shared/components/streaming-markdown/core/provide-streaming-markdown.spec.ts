import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { BlockType } from './models';
import { provideStreamingMarkdown } from './provide-streaming-markdown';
import {
  BLOCK_COMPONENT_REGISTRY,
  LEGACY_STREAMDOWN_SECURITY_POLICY,
  STREAMDOWN_PLUGIN_RUNTIME,
  STREAMDOWN_SECURITY_POLICY,
  StreamdownPlugin
} from './plugin';

class ParagraphRendererA {}
class ParagraphRendererB {}
class HtmlRenderer {}

describe('provideStreamingMarkdown plugin runtime', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
  });

  it('keeps earlier component when overrideStrategy=preserve', () => {
    configurePlugins(
      makePlugin('base', {
        components: {
          [BlockType.PARAGRAPH]: ParagraphRendererA
        }
      }),
      makePlugin('preserve', {
        order: 10,
        overrideStrategy: 'preserve',
        components: {
          [BlockType.PARAGRAPH]: ParagraphRendererB
        }
      })
    );

    const registry = TestBed.inject(BLOCK_COMPONENT_REGISTRY);
    const runtime = TestBed.inject(STREAMDOWN_PLUGIN_RUNTIME);

    expect(registry.componentMap.get(BlockType.PARAGRAPH)).toBe(ParagraphRendererA);

    const conflicts = runtime.observability.snapshot().conflicts;
    expect(conflicts.length).toBe(1);
    expect(conflicts[0].strategy).toBe('preserve');
    expect(conflicts[0].existingPluginName).toBe('base');
  });

  it('replaces earlier component by default and orders plugins by order', () => {
    configurePlugins(
      makePlugin('late', {
        order: 100,
        components: {
          [BlockType.PARAGRAPH]: ParagraphRendererB
        }
      }),
      makePlugin('early', {
        order: -100,
        components: {
          [BlockType.PARAGRAPH]: ParagraphRendererA
        }
      })
    );

    const registry = TestBed.inject(BLOCK_COMPONENT_REGISTRY);
    const runtime = TestBed.inject(STREAMDOWN_PLUGIN_RUNTIME);

    // early runs first, late runs later and replaces by default
    expect(registry.componentMap.get(BlockType.PARAGRAPH)).toBe(ParagraphRendererB);

    const conflicts = runtime.observability.snapshot().conflicts;
    expect(conflicts.length).toBe(1);
    expect(conflicts[0].strategy).toBe('replace');
    expect(conflicts[0].pluginName).toBe('late');
    expect(conflicts[0].existingPluginName).toBe('early');
  });

  it('throws for component conflict when overrideStrategy=error', () => {
    configurePlugins(
      makePlugin('first', {
        components: {
          [BlockType.PARAGRAPH]: ParagraphRendererA
        }
      }),
      makePlugin('second', {
        overrideStrategy: 'error',
        components: {
          [BlockType.PARAGRAPH]: ParagraphRendererB
        }
      })
    );

    expect(() => TestBed.inject(STREAMDOWN_PLUGIN_RUNTIME)).toThrowError(/overrideStrategy=error/);
  });

  it('runs lifecycle hooks and cleanup callbacks', () => {
    let initCalls = 0;
    let destroyCalls = 0;
    let cleanupCalls = 0;

    configurePlugins(
      makePlugin('lifecycle', {
        onInit: ({ registerCleanup }) => {
          initCalls += 1;
          registerCleanup(() => {
            cleanupCalls += 1;
          });
        },
        onDestroy: () => {
          destroyCalls += 1;
        }
      })
    );

    const runtime = TestBed.inject(STREAMDOWN_PLUGIN_RUNTIME);
    expect(initCalls).toBe(1);

    runtime.destroy();

    expect(destroyCalls).toBe(1);
    expect(cleanupCalls).toBe(1);

    const snapshot = runtime.observability.snapshot();
    expect(snapshot.lifecycleInitCalls).toBe(1);
    expect(snapshot.lifecycleDestroyCalls).toBe(1);
    expect(snapshot.byPlugin?.['lifecycle']?.lifecycleInitCalls).toBe(1);
    expect(snapshot.byPlugin?.['lifecycle']?.lifecycleDestroyCalls).toBe(1);
  });

  it('blocks non-builtin html renderer registration by default security policy', () => {
    configurePlugins(
      makePlugin('unsafe-html-plugin', {
        components: {
          [BlockType.HTML]: HtmlRenderer
        }
      })
    );

    const registry = TestBed.inject(BLOCK_COMPONENT_REGISTRY);
    expect(registry.componentMap.has(BlockType.HTML)).toBe(false);
  });

  it('allows html registration when custom security policy allows it', () => {
    configurePlugins(
      makePlugin('safe-html-plugin', {
        components: {
          [BlockType.HTML]: HtmlRenderer
        }
      }),
      {
        provide: STREAMDOWN_SECURITY_POLICY,
        useValue: LEGACY_STREAMDOWN_SECURITY_POLICY
      }
    );

    const registry = TestBed.inject(BLOCK_COMPONENT_REGISTRY);
    expect(registry.componentMap.get(BlockType.HTML)).toBe(HtmlRenderer);
  });
});

function configurePlugins(...entries: Array<StreamdownPlugin | { provide: unknown; useValue: unknown }>): void {
  const plugins: StreamdownPlugin[] = [];
  const extraProviders: Array<{ provide: unknown; useValue: unknown }> = [];

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i] as StreamdownPlugin | { provide: unknown; useValue: unknown };
    if ('name' in (entry as StreamdownPlugin) && 'components' in (entry as StreamdownPlugin)) {
      plugins.push(entry as StreamdownPlugin);
    } else {
      extraProviders.push(entry as { provide: unknown; useValue: unknown });
    }
  }

  TestBed.configureTestingModule({
    providers: [
      provideZonelessChangeDetection(),
      provideStreamingMarkdown(...plugins),
      ...extraProviders
    ]
  });
}

function makePlugin(name: string, partial: Partial<StreamdownPlugin>): StreamdownPlugin {
  return {
    name,
    components: {},
    ...partial
  };
}
