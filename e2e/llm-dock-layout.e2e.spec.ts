import { expect, test } from '@playwright/test';

test.describe('LLM Dock Hybrid Layout', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/demo/ai-chat-panel');
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => {
      localStorage.removeItem('ai-chat-dock-mode');
      localStorage.removeItem('ai-chat-dock-width');
    });
    await page.reload();
    await page.waitForLoadState('networkidle');
  });

  test('defaults to pinned mode and toggles collapsed/open', async ({ page }) => {
    const dock = page.getByTestId('llm-dock');
    const toggle = page.getByTestId('dock-toggle');

    await expect(dock).toBeVisible();
    await expect(toggle).toContainText('收起 LLM');

    await toggle.click();
    await expect(toggle).toContainText('展开 LLM');
    await expect(page.getByTestId('dock-open-fab')).toBeVisible();

    await page.getByTestId('dock-open-fab').click();
    await expect(toggle).toContainText('收起 LLM');
    await expect(page.getByTestId('dock-open-fab')).toBeHidden();
  });

  test('restores persisted width with clamp boundaries', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('ai-chat-dock-mode', 'pinned');
      localStorage.setItem('ai-chat-dock-width', '900');
    });
    await page.reload();
    await page.waitForLoadState('networkidle');

    const dock = page.getByTestId('llm-dock');
    const maxWidth = await dock.evaluate((el) => Math.round(parseFloat(getComputedStyle(el).width)));
    expect(maxWidth).toBe(520);

    await page.evaluate(() => {
      localStorage.setItem('ai-chat-dock-mode', 'pinned');
      localStorage.setItem('ai-chat-dock-width', '-10');
    });
    await page.reload();
    await page.waitForLoadState('networkidle');

    const minWidth = await dock.evaluate((el) => Math.round(parseFloat(getComputedStyle(el).width)));
    expect(minWidth).toBe(320);
  });
});
