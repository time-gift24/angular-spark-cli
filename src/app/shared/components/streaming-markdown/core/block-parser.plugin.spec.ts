import { BlockParser } from './block-parser';
import { BlockType, MarkdownBlock, MarkdownInline } from './models';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  BLOCK_COMPONENT_REGISTRY,
  BlockComponentRegistry,
  DEFAULT_STREAMDOWN_SECURITY_POLICY,
  StreamdownPluginObservability,
  PluginConflictRecord,
  PluginCounter,
  PluginObservabilitySnapshot
} from './plugin';

class TestObservability implements StreamdownPluginObservability {
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

  increment(counter: PluginCounter, _pluginName?: string): void {
    this.counters[counter] += 1;
  }

  recordConflict(conflict: PluginConflictRecord): void {
    this.conflicts.push(conflict);
  }

  snapshot(): PluginObservabilitySnapshot {
    return {
      ...this.counters,
      conflicts: [...this.conflicts]
    };
  }
}

describe('BlockParser plugin extensions', () => {
  it('uses block extension fallback when validation fails', () => {
    const observability = new TestObservability();
    const parser = createParser(makeRegistry({
      observability,
      parserExtensions: [
        {
          pluginName: 'callout-plugin',
          priority: 100,
          extension: {
            type: 'paragraph',
            handler: () => ({ type: BlockType.CALLOUT } as unknown as MarkdownBlock),
            validate: () => false,
            fallback: ({ baseBlock, context }) => ({
              ...baseBlock,
              type: BlockType.CALLOUT,
              content: context.extractText({ text: 'fallback callout' })
            })
          }
        }
      ]
    }));

    const result = parser.parse('fallback test');

    expect(result.blocks.length).toBe(1);
    expect(result.blocks[0].type).toBe(BlockType.CALLOUT);
    expect(result.blocks[0].content).toBe('fallback callout');

    const snapshot = observability.snapshot();
    expect(snapshot.parserExtensionCalls).toBe(1);
    expect(snapshot.parserExtensionFallbacks).toBe(1);
  });

  it('keeps default parsing when extension returns undefined', () => {
    const parser = createParser(makeRegistry({
      parserExtensions: [
        {
          pluginName: 'pass-through',
          priority: 10,
          extension: {
            type: 'paragraph',
            handler: () => undefined
          }
        }
      ]
    }));

    const result = parser.parse('plain paragraph');

    expect(result.blocks.length).toBe(1);
    expect(result.blocks[0].type).toBe(BlockType.PARAGRAPH);
    expect(result.blocks[0].content).toContain('plain paragraph');
  });

  it('sanitizes unsafe inline links produced by inline extensions', () => {
    const parser = createParser(makeRegistry({
      inlineParserExtensions: [
        {
          pluginName: 'unsafe-link-plugin',
          priority: 100,
          extension: {
            type: 'text',
            match: (token) => token?.text === 'unsafe-link',
            handler: () => ({
              type: 'link',
              content: 'click me',
              href: 'javascript:alert(1)'
            } satisfies MarkdownInline)
          }
        }
      ]
    }));

    const result = parser.parse('unsafe-link');
    expect(result.blocks.length).toBe(1);

    const children = (result.blocks[0] as any).children as MarkdownInline[] | undefined;
    expect(children).toBeTruthy();
    expect(children![0].type).toBe('text');
    expect(children![0].content).toBe('click me');
  });

  it('runs inline extension fallback when handler throws', () => {
    const originalError = console.error;
    let errorCalls = 0;
    (console as any).error = () => {
      errorCalls += 1;
    };

    const observability = new TestObservability();
    const parser = createParser(makeRegistry({
      observability,
      inlineParserExtensions: [
        {
          pluginName: 'inline-fallback',
          priority: 100,
          extension: {
            type: 'text',
            match: (token) => token?.text === 'with-fallback',
            handler: () => {
              throw new Error('boom');
            },
            fallback: () => ({ type: 'text', content: 'from-fallback' })
          }
        }
      ]
    }));

    try {
      const result = parser.parse('with-fallback');
      const children = (result.blocks[0] as any).children as MarkdownInline[] | undefined;

      expect(children).toBeTruthy();
      expect(children![0].content).toBe('from-fallback');

      const snapshot = observability.snapshot();
      expect(snapshot.inlineExtensionCalls).toBe(1);
      expect(snapshot.inlineExtensionFallbacks).toBe(1);
      expect(snapshot.errors).toBeGreaterThan(0);
      expect(errorCalls).toBeGreaterThan(0);
    } finally {
      (console as any).error = originalError;
    }
  });
});

function makeRegistry(partial: Partial<BlockComponentRegistry>): BlockComponentRegistry {
  return {
    componentMap: new Map(),
    matchers: [],
    parserExtensions: [],
    inlineParserExtensions: [],
    beforeRenderHooks: [],
    afterRenderHooks: [],
    securityPolicy: DEFAULT_STREAMDOWN_SECURITY_POLICY,
    ...partial
  };
}

function createParser(registry: BlockComponentRegistry): BlockParser {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [
      provideZonelessChangeDetection(),
      { provide: BLOCK_COMPONENT_REGISTRY, useValue: registry }
    ]
  });

  return TestBed.runInInjectionContext(() => new BlockParser());
}
