import { BlockParser } from './block-parser';

interface BaselineMetrics {
  chunks: number;
  avgMs: number;
  p95Ms: number;
  maxMs: number;
}

describe('BlockParser performance baseline', () => {
  it('records chunk parse latency for large streaming markdown input', () => {
    const parser = new BlockParser();
    const markdown = buildLargeMarkdown(220);
    const chunkSize = 64;

    let previous = '';
    const samples: number[] = [];

    for (let cursor = 0; cursor < markdown.length; cursor += chunkSize) {
      const next = markdown.slice(0, Math.min(markdown.length, cursor + chunkSize));
      const start = performance.now();
      parser.parseIncremental(previous, next);
      samples.push(performance.now() - start);
      previous = next;
    }

    const metrics = summarize(samples);
    // Baseline logs for tracking trend across commits.
    console.info(
      `[PerfBaseline][BlockParser] chunks=${metrics.chunks} avg=${metrics.avgMs.toFixed(3)}ms p95=${metrics.p95Ms.toFixed(3)}ms max=${metrics.maxMs.toFixed(3)}ms`
    );

    expect(metrics.chunks).toBeGreaterThan(50);
    expect(metrics.p95Ms).toBeLessThan(15);
    expect(metrics.maxMs).toBeLessThan(40);
  });
});

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
