import AxeBuilder from '@axe-core/playwright';
import { expect, Page } from '@playwright/test';

type AxeOptions = {
  include?: string[];
  exclude?: string[];
};

function formatViolations(
  violations: Awaited<ReturnType<AxeBuilder['analyze']>>['violations'],
): string {
  if (violations.length === 0) {
    return '';
  }

  return violations
    .map((violation) => {
      const targets = violation.nodes
        .flatMap((node) => node.target)
        .slice(0, 5)
        .join(', ');
      return `[${violation.impact ?? 'unknown'}] ${violation.id}: ${violation.description} (${targets})`;
    })
    .join('\n');
}

export async function expectNoAxeViolations(page: Page, options: AxeOptions = {}): Promise<void> {
  let builder = new AxeBuilder({ page });

  for (const selector of options.include ?? []) {
    builder = builder.include(selector);
  }

  for (const selector of options.exclude ?? []) {
    builder = builder.exclude(selector);
  }

  const results = await builder.analyze();
  expect(results.violations, formatViolations(results.violations)).toEqual([]);
}
