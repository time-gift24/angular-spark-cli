import { expect, test, type Page } from '@playwright/test';
import { expectNoAxeViolations } from './helpers/a11y';
import { openContextMenu, pressKey } from './helpers/keyboard';

async function gotoDemo(page: Page, path: string, pageTitle: string): Promise<void> {
  await page.goto(path);
  await expect(page.getByRole('heading', { level: 1, name: pageTitle })).toBeVisible();
}

test.describe('Shadcn Components A11y + Keyboard', () => {
  test('sheet: keyboard loop + escape close', async ({ page }) => {
    await gotoDemo(page, '/demo/sheet', 'Sheet');

    await page.getByRole('button', { name: 'Open Right Sheet' }).click();

    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();

    const dialogButtons = dialog.getByRole('button');
    await dialogButtons.first().focus();
    await pressKey(page, 'Shift+Tab');
    await expect(dialogButtons.last()).toBeFocused();

    await pressKey(page, 'Tab');
    await expect(dialogButtons.first()).toBeFocused();

    await pressKey(page, 'Escape');
    await expect(dialog).toBeHidden();
  });

  test('sheet: axe', async ({ page }) => {
    await gotoDemo(page, '/demo/sheet', 'Sheet');
    await page.getByRole('button', { name: 'Open Right Sheet' }).click();
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await expectNoAxeViolations(page, { include: ['[role="dialog"]'] });
  });

  test('tabs: keyboard switch', async ({ page }) => {
    await gotoDemo(page, '/demo/tabs', 'Tabs');

    const firstTabList = page.locator('[role="tablist"]').first();
    const accountTab = firstTabList.getByRole('tab', { name: 'Account' });
    const passwordTab = firstTabList.getByRole('tab', { name: 'Password' });

    await expect(accountTab).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('#tabs-content-account')).toBeVisible();

    await passwordTab.focus();
    await pressKey(page, 'Enter');

    await expect(passwordTab).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('#tabs-content-password')).toBeVisible();
  });

  test('tabs: axe', async ({ page }) => {
    await gotoDemo(page, '/demo/tabs', 'Tabs');
    await expect(page.locator('ui-tabs').first()).toBeVisible();
    await expectNoAxeViolations(page, { include: ['ui-tabs'] });
  });

  test('tooltip: keyboard focus and escape', async ({ page }) => {
    await gotoDemo(page, '/demo/tooltip', 'Tooltip Component');

    const firstTooltip = page.locator('ui-tooltip').first();
    const trigger = firstTooltip.getByRole('button', { name: '悬停查看' });
    const tooltip = firstTooltip.getByRole('tooltip');

    await trigger.focus();
    await expect(tooltip).toHaveAttribute('data-state', 'open');

    await pressKey(page, 'Escape');
    await expect(tooltip).toHaveAttribute('data-state', 'closed');
  });

  test('tooltip: axe', async ({ page }) => {
    await gotoDemo(page, '/demo/tooltip', 'Tooltip Component');
    await expect(page.locator('.demo-section').first()).toBeVisible();
    await expectNoAxeViolations(page, { include: ['.demo-section'] });
  });

  test('context-menu: keyboard navigation + escape', async ({ page }) => {
    await gotoDemo(page, '/demo/context-menu', 'Context Menu');

    const trigger = page.locator('.context-trigger-area').first();
    await expect(trigger).toBeVisible();
    await openContextMenu(trigger);

    const menu = page.locator('.context-menu-wrapper');
    await expect(menu).toBeVisible();
    await expect(menu).toHaveAttribute('role', 'menu');

    const enabledItems = menu.locator('.menu-item:not([aria-disabled="true"])');
    await expect(enabledItems.first()).toBeFocused();

    await pressKey(page, 'ArrowDown');
    await expect(enabledItems.nth(1)).toBeFocused();

    await pressKey(page, 'End');
    await expect(enabledItems.last()).toBeFocused();

    await pressKey(page, 'Home');
    await expect(enabledItems.first()).toBeFocused();

    await pressKey(page, 'Escape');
    await expect(menu).toBeHidden();
  });

  test('context-menu: axe (menu open state)', async ({ page }) => {
    await gotoDemo(page, '/demo/context-menu', 'Context Menu');
    await openContextMenu(page.locator('.context-trigger-area').first());
    await expect(page.locator('.context-menu-wrapper')).toBeVisible();
    await expectNoAxeViolations(page, { include: ['.context-menu-wrapper'] });
  });
});
