import { BlockParser } from './block-parser';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { BLOCK_COMPONENT_REGISTRY, BlockComponentRegistry, DEFAULT_STREAMDOWN_SECURITY_POLICY } from './plugin';

interface BaselineMetrics {
  chunks: number;
  avgMs: number;
  p95Ms: number;
  maxMs: number;
}

describe('BlockParser performance baseline', () => {
  it('records chunk parse latency for large streaming markdown input', () => {
    const parser = createParser();
    const markdown = buildLargeMarkdown(220);
    const chunkSize = 64;
    const metrics = runBenchmark(parser, markdown, chunkSize);

    // Baseline logs for tracking trend across commits.
    console.info(
      `[PerfBaseline][BlockParser] chunks=${metrics.chunks} avg=${metrics.avgMs.toFixed(3)}ms p95=${metrics.p95Ms.toFixed(3)}ms max=${metrics.maxMs.toFixed(3)}ms`
    );

    expect(metrics.chunks).toBeGreaterThan(50);
    expect(metrics.p95Ms).toBeLessThan(15);
    expect(metrics.maxMs).toBeLessThan(40);
  });

  it('keeps chunk parse latency stable with inline extension pipeline enabled', () => {
    const parser = createParser(buildPluginHeavyRegistry());
    const markdown = buildLargeMarkdown(220);
    const chunkSize = 64;
    const metrics = runBenchmark(parser, markdown, chunkSize);

    console.info(
      `[PerfBaseline][BlockParser+Plugins] chunks=${metrics.chunks} avg=${metrics.avgMs.toFixed(3)}ms p95=${metrics.p95Ms.toFixed(3)}ms max=${metrics.maxMs.toFixed(3)}ms`
    );

    expect(metrics.chunks).toBeGreaterThan(50);
    expect(metrics.p95Ms).toBeLessThan(18);
    expect(metrics.maxMs).toBeLessThan(45);
  });
});

function createParser(registry?: BlockComponentRegistry): BlockParser {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [
      provideZonelessChangeDetection(),
      ...(registry ? [{ provide: BLOCK_COMPONENT_REGISTRY, useValue: registry }] : [])
    ]
  });

  return TestBed.runInInjectionContext(() => new BlockParser());
}

function buildPluginHeavyRegistry(): BlockComponentRegistry {
  return {
    componentMap: new Map(),
    matchers: [],
    parserExtensions: [],
    inlineParserExtensions: [
      {
        pluginName: 'perf-inline',
        priority: 10,
        extension: {
          type: 'text',
          handler: ({ token, context }) => {
            if (typeof token?.text !== 'string' || token.text.indexOf('http') === -1) {
              return undefined;
            }
            return {
              type: 'link',
              content: token.text,
              href: token.text,
              children: context.parseInlineTokens(token.tokens)
            };
          }
        }
      }
    ],
    securityPolicy: DEFAULT_STREAMDOWN_SECURITY_POLICY
  };
}

function runBenchmark(parser: BlockParser, markdown: string, chunkSize: number): BaselineMetrics {
  let previous = '';
  const samples: number[] = [];

  for (let cursor = 0; cursor < markdown.length; cursor += chunkSize) {
    const next = markdown.slice(0, Math.min(markdown.length, cursor + chunkSize));
    const start = performance.now();
    parser.parseIncremental(previous, next);
    samples.push(performance.now() - start);
    previous = next;
  }

  return summarize(samples);
}

function buildLargeMarkdown(sectionCount: number): string {
  let output = '';
  for (let i = 0; i < sectionCount; i++) {
    output += `## Section ${i}\n\n`;
    output += `Paragraph ${i}: lorem ipsum dolor sit amet, consectetur adipiscing elit.\n\n`;
    output += '```typescript\n';
    output += `const value${i} = ${i};\n`;
    output += `const doubled${i} = value${i} * 2;\n`;
    output += `console.log(doubled${i});\n`;
    output += '```\n\n';
    output += `- item a ${i}\n- item b ${i}\n\n`;
  }
  return output;
}

function summarize(samples: number[]): BaselineMetrics {
  const sorted = [...samples].sort((a, b) => a - b);
  const sum = samples.reduce((acc, value) => acc + value, 0);
  const p95Index = Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95));

  return {
    chunks: samples.length,
    avgMs: sum / samples.length,
    p95Ms: sorted[p95Index],
    maxMs: sorted[sorted.length - 1]
  };
}
