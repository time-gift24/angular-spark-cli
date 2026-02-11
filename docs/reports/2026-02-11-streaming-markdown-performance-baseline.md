# Streaming Markdown Performance Baseline (2026-02-11)

## Scope
- Target: `streaming-markdown` parse/render/highlight path
- Environment: local ChromeHeadless test run
- Method: chunked incremental parse benchmark spec

## Baseline Run
- Spec: `src/app/shared/components/streaming-markdown/core/block-parser.performance.spec.ts`
- Log:
  - `chunks=724`
  - `avg=1.067ms`
  - `p95=2.200ms`
  - `max=6.100ms`

## Interpretation
- Incremental chunk parsing latency is stable and low in this baseline.
- p95 and max are both within the guardrail asserted in spec (`p95 < 15ms`, `max < 40ms`).

## Regression Gates
- Keep the performance spec in CI test matrix.
- Track the console baseline line on future optimization commits.
