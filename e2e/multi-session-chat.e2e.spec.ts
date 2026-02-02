import { test, expect } from '@playwright/test';

test.describe('Multi-Session Chat E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/multi-session-chat');
    await page.waitForLoadState('networkidle');
  });

  test('should load page with default session', async ({ page }) => {
    // Check that container is visible
    const container = page.locator('app-session-chat-container');
    await expect(container).toBeVisible();

    // Check that tabs bar has at least one tab
    const tabs = page.locator('.session-tabs-bar app-session-tab');
    await expect(tabs).toHaveCount(1);
  });

  test('should send and receive message', async ({ page }) => {
    // Type message
    const input = page.locator('textarea[placeholder*="Ask AI"]');
    await input.fill('Hello from E2E test');

    // Click send button
    const sendBtn = page.locator('button[title="Send message"]');
    await sendBtn.click();

    // Wait for AI response
    await page.waitForTimeout(1500);

    // Check that messages are displayed
    const messages = page.locator('.chat-message');
    await expect(messages).toHaveCount(2); // User + AI
  });

  test('should create new session', async ({ page }) => {
    const initialTabs = page.locator('.session-tabs-bar app-session-tab');
    const initialCount = await initialTabs.count();

    // Click new chat button
    const newChatBtn = page.locator('button[title="New chat"]');
    await newChatBtn.click();

    // Wait for new tab
    const newTabs = page.locator('.session-tabs-bar app-session-tab');
    await expect(newTabs).toHaveCount(initialCount + 1);
  });

  test('should switch between sessions', async ({ page }) => {
    // Create second session
    const newChatBtn = page.locator('button[title="New chat"]');
    await newChatBtn.click();

    // Switch to first session
    const firstTab = page.locator('.session-tabs-bar app-session-tab').first();
    await firstTab.click();

    // Verify input is empty (different session)
    const input = page.locator('textarea[placeholder*="Ask AI"]');
    await expect(input).toHaveValue('');
  });

  test('should persist state across reloads', async ({ page }) => {
    // Send a message
    const input = page.locator('textarea[placeholder*="Ask AI"]');
    await input.fill('Persistence test');
    const sendBtn = page.locator('button[title="Send message"]');
    await sendBtn.click();

    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Check that message is still there
    const messages = page.locator('.chat-message');
    await expect(messages).toHaveCount(2); // User + AI
  });
});
