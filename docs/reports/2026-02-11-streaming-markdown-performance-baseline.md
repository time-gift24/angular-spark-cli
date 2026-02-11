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

## Plugin Runtime Baseline (After Plugin-System Upgrade)
- Date: 2026-02-11
- Command:
  - `npx ng test --watch=false --browsers=ChromeHeadless --include='src/app/shared/components/streaming-markdown/**/*.spec.ts'`
- Log (same perf spec):
  - Core parser:
    - `chunks=724`
    - `avg=1.857ms`
    - `p95=3.500ms`
    - `max=3.900ms`
  - Parser + inline extension pipeline:
    - `chunks=724`
    - `avg=2.443ms`
    - `p95=5.300ms`
    - `max=6.800ms`

## Delta Summary
- Core parser p95 remains well below guardrail (`< 15ms`).
- Plugin-enabled path p95 is within guardrail (`< 18ms` in new spec assertion).
- No observable regression in max latency relative to configured gates.

## Latest Verification (2026-02-11, full streaming-markdown spec set)
- Command:
  - `npx ng test --watch=false --browsers=ChromeHeadless --include='src/app/shared/components/streaming-markdown/**/*.spec.ts'`
- Log:
  - Core parser:
    - `chunks=724`
    - `avg=0.974ms`
    - `p95=2.200ms`
    - `max=2.600ms`
  - Parser + inline extension pipeline:
    - `chunks=724`
    - `avg=0.950ms`
    - `p95=2.100ms`
    - `max=4.300ms`

## Interpretation
- Incremental chunk parsing latency is stable and low in this baseline.
- p95 and max are both within the guardrail asserted in spec (`p95 < 15ms`, `max < 40ms`).

## Regression Gates
- Keep the performance spec in CI test matrix.
- Track the console baseline line on future optimization commits.
