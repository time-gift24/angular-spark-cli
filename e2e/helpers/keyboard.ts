import { Locator, Page } from '@playwright/test';

export async function pressKey(page: Page, key: string, times = 1): Promise<void> {
  for (let i = 0; i < times; i += 1) {
    await page.keyboard.press(key);
  }
}

export async function openContextMenu(trigger: Locator): Promise<void> {
  const box = await trigger.boundingBox();
  const clientX = box ? box.x + box.width / 2 : 8;
  const clientY = box ? box.y + box.height / 2 : 8;

  await trigger.dispatchEvent('contextmenu', {
    button: 2,
    bubbles: true,
    cancelable: true,
    clientX,
    clientY,
  });
}
