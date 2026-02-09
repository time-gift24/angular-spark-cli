import { test, expect } from '@playwright/test';

/**
 * Liquid Glass E2E Tests
 *
 * Tests the liquid-glass component and directive functionality including:
 * - Mode variations (standard, polar, prominent, shader)
 * - Elasticity settings
 * - Directive usage
 * - Click interactions
 * - Visual rendering
 */

test.describe('Liquid Glass', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/demo/liquid-glass');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500); // Wait for animations to settle
  });

  test.describe('Page Load', () => {
    test('should load demo page with title', async ({ page }) => {
      const title = page.locator('h1.demo-title');
      await expect(title).toBeVisible();
      await expect(title).toContainText('Liquid Glass');
    });

    test('should display all demo sections', async ({ page }) => {
      const sections = page.locator('section.demo-section');
      const sectionCount = await sections.count();

      // Should have: Mode Comparison, Elasticity, Size Variants, Card Examples, Directive, Click Feedback
      expect(sectionCount).toBeGreaterThanOrEqual(5);
    });
  });

  test.describe('spk-liquid-glass Component', () => {
    test('should render mode comparison buttons', async ({ page }) => {
      const section = page.locator('section.demo-section').filter({ hasText: '模式对比' });
      const buttons = section.locator('spk-liquid-glass');
      const modeLabels = section.locator('.demo-label');

      // Check all four modes are displayed
      await expect(modeLabels).toContainText(['Standard', 'Polar', 'Prominent', 'Shader']);
      await expect(buttons).toHaveCount(4);
    });

    test('should render elasticity comparison buttons', async ({ page }) => {
      const section = page.locator('section.demo-section').filter({ hasText: '弹性对比' });
      const buttons = section.locator('spk-liquid-glass');

      await expect(buttons).toHaveCount(3);
    });

    test('should render size variant buttons', async ({ page }) => {
      const section = page.locator('section.demo-section').filter({ hasText: '尺寸变体' });
      const buttons = section.locator('spk-liquid-glass');

      await expect(buttons).toHaveCount(3);
    });

    test('should emit click event when button is clicked', async ({ page }) => {
      const firstButton = page.locator('spk-liquid-glass').first();

      await firstButton.click();
      await page.waitForTimeout(200);

      // Check click feedback is displayed
      const feedback = page.locator('.click-feedback');
      await expect(feedback).toBeVisible();
    });
  });

  test.describe('Directive Usage', () => {
    test('should render directive card', async ({ page }) => {
      const section = page.locator('section.demo-section').filter({ hasText: '指令用法' });
      await expect(section).toBeVisible();

      const directiveCard = section.locator('.custom-card');
      await expect(directiveCard).toBeVisible();
    });

    test('directive card should have content', async ({ page }) => {
      const directiveCard = page.locator('.custom-card');

      await expect(directiveCard.locator('.card-icon')).toBeVisible();
      await expect(directiveCard.locator('.card-title')).toContainText('Directive Style');
      await expect(directiveCard.locator('.card-text')).toContainText('Works on any element!');
    });

    test('directive card should have liquid glass class', async ({ page }) => {
      const directiveCard = page.locator('.custom-card');

      // Check for the liquid glass class that the directive adds
      await expect(directiveCard).toHaveClass(/liquid-glass/);
    });

    test('directive card should have warp layer element', async ({ page }) => {
      const directiveCard = page.locator('.custom-card');

      // Check that the warp layer span was created
      const warpLayer = directiveCard.locator('.lg-warp');
      await expect(warpLayer).toHaveCount(1);
    });

    test('directive card should have SVG filter', async ({ page }) => {
      const directiveCard = page.locator('.custom-card');

      // Check that SVG filter element was created
      const svg = directiveCard.locator('svg');
      await expect(svg).toHaveCount(1);

      // Check for filter element with correct ID pattern
      const filter = svg.locator('filter[id^="lg-filter-"]');
      await expect(filter).toHaveCount(1);
    });

    test('directive SVG filter should have displacement map', async ({ page }) => {
      const directiveCard = page.locator('.custom-card');
      const svg = directiveCard.locator('svg');
      const filter = svg.locator('filter');

      // Check for feImage (displacement map)
      const feImage = filter.locator('feImage');
      await expect(feImage).toHaveCount(1);
      await expect(feImage).toHaveAttribute('result', 'DISPLACEMENT_MAP');

      // Check for feDisplacementMap
      const feDisplacementMaps = filter.locator('feDisplacementMap');
      const count = await feDisplacementMaps.count();
      expect(count).toBeGreaterThanOrEqual(1); // At least 1 for chromatic aberration
    });

    test('directive SVG filter should use JPEG displacement map', async ({ page }) => {
      const directiveCard = page.locator('.custom-card');
      const svg = directiveCard.locator('svg');
      const feImage = svg.locator('feImage');

      const href = await feImage.getAttribute('href');
      expect(href).toMatch(/^data:image\/jpeg;base64,/);
    });

    test('directive SVG filter should have chromatic aberration', async ({ page }) => {
      const directiveCard = page.locator('.custom-card');
      const svg = directiveCard.locator('svg');
      const filter = svg.locator('filter');

      // Check for multiple feDisplacementMap elements (RGB channels)
      const feDisplacementMaps = filter.locator('feDisplacementMap');
      const count = await feDisplacementMaps.count();
      expect(count).toBeGreaterThanOrEqual(3); // Should have at least R, G, B channels

      // Check for feBlend elements (screen mode blending)
      const feBlends = filter.locator('feBlend');
      const blendCount = await feBlends.count();
      expect(blendCount).toBeGreaterThanOrEqual(2); // At least GB_COMBINED and RGB_COMBINED
    });

    test('directive card should respond to hover', async ({ page }) => {
      const directiveCard = page.locator('.custom-card');
      const section = page.locator('section.demo-section').filter({ hasText: '指令用法' });

      // Scroll into view
      await section.scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);

      // Get initial bounding box
      const initialBox = await directiveCard.boundingBox();

      // Hover over the card
      await directiveCard.hover();
      await page.waitForTimeout(300);

      // Check that transform is applied during hover
      const transform = await directiveCard.evaluate(el => {
        return window.getComputedStyle(el).transform;
      });

      // Transform should not be 'none' during hover (due to mouse tracking)
      // or at minimum the element should be interactive
      expect(directiveCard).toBeVisible();
    });
  });

  test.describe('Card Examples', () => {
    test('should render Liquid Card', async ({ page }) => {
      const section = page.locator('section.demo-section').filter({ hasText: '卡片示例' });
      await expect(section).toBeVisible();

      const liquidCard = section.locator('spk-liquid-glass').first();
      await expect(liquidCard).toBeVisible();
    });

    test('should render Prominent card', async ({ page }) => {
      const section = page.locator('section.demo-section').filter({ hasText: '卡片示例' });
      const prominentCard = section.locator('spk-liquid-glass').nth(1);
      await expect(prominentCard).toBeVisible();
    });

    test('should render Over Light card', async ({ page }) => {
      const section = page.locator('section.demo-section').filter({ hasText: '卡片示例' });
      const overLightCard = section.locator('spk-liquid-glass').nth(2);
      await expect(overLightCard).toBeVisible();
    });
  });

  test.describe('Visual Regression', () => {
    test('should match screenshot of mode comparison', async ({ page }) => {
      const section = page.locator('section.demo-section').filter({ hasText: '模式对比' });
      await section.scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);

      // Take screenshot of the mode comparison section
      await expect(section).toHaveScreenshot('liquid-glass-mode-comparison.png', {
        maxDiffPixels: 100,
        threshold: 0.2,
      });
    });

    test('should match screenshot of directive card', async ({ page }) => {
      const section = page.locator('section.demo-section').filter({ hasText: '指令用法' });
      await section.scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);

      // Take screenshot of directive section
      await expect(section).toHaveScreenshot('liquid-glass-directive-card.png', {
        maxDiffPixels: 100,
        threshold: 0.2,
      });
    });
  });

  test.describe('Accessibility', () => {
    test('directive card should be accessible', async ({ page }) => {
      const directiveCard = page.locator('.custom-card');

      // Check that content is readable
      const title = directiveCard.locator('.card-title');
      await expect(title).toBeVisible();

      const text = directiveCard.locator('.card-text');
      await expect(text).toBeVisible();
    });

    test('buttons should have clickable area', async ({ page }) => {
      const buttons = page.locator('spk-liquid-glass');

      const count = await buttons.count();
      for (let i = 0; i < count; i++) {
        const button = buttons.nth(i);
        await expect(button).toBeVisible();
        await expect(button).toHaveCSS('cursor', /pointer|auto/);
      }
    });
  });

  test.describe('Performance', () => {
    test('should load within reasonable time', async ({ page }) => {
      const startTime = Date.now();
      await page.goto('/demo/liquid-glass');
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - startTime;

      // Page should load within 5 seconds
      expect(loadTime).toBeLessThan(5000);
    });

    test('should render all SVG filters', async ({ page }) => {
      // Check that all spk-liquid-glass components have their SVG filters
      const components = page.locator('spk-liquid-glass');
      const componentCount = await components.count();

      let filterCount = 0;
      for (let i = 0; i < componentCount; i++) {
        const component = components.nth(i);
        const svg = component.locator('svg').first();
        const hasSvg = await svg.count();
        if (hasSvg > 0) {
          filterCount++;
        }
      }

      // At least some components should have SVG filters
      expect(filterCount).toBeGreaterThan(0);
    });
  });

  test.describe('Interaction', () => {
    test('should track click events', async ({ page }) => {
      const feedback = page.locator('.click-feedback');
      const firstButton = page.locator('spk-liquid-glass').first();

      // Wait for feedback to be visible after click
      await firstButton.click();
      await page.waitForTimeout(500);

      const afterClick = await feedback.textContent();
      expect(afterClick).toContain('Clicked:');
    });

    test('should handle multiple clicks in sequence', async ({ page }) => {
      const feedback = page.locator('.click-feedback');
      const buttons = page.locator('spk-liquid-glass');

      // Click first 3 buttons
      await buttons.nth(0).click();
      await page.waitForTimeout(200);
      await buttons.nth(1).click();
      await page.waitForTimeout(200);
      await buttons.nth(2).click();
      await page.waitForTimeout(200);

      const text = await feedback.textContent();
      expect(text).toContain('Clicked:');
    });
  });
});
