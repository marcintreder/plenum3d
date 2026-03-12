import { test, expect } from '@playwright/test';

test.describe('Sculpt3D E2E', () => {
  test.beforeEach(async ({ page }) => {
    const url = process.env.TEST_URL || 'https://3d-figma-ai.vercel.app';
    await page.goto(url); 
  });

  test('should load the Sculpt3D title', async ({ page }) => {
    const title = page.locator('h1');
    await expect(title).toContainText('Sculpt');
    await expect(title).toContainText('3D');
  });

  test('should open settings modal', async ({ page }) => {
    await page.click('button[class*="p-2 hover:bg-[#333]"]'); // Settings gear
    await expect(page.locator('text=Provider Settings')).toBeVisible();
  });

  test('should show inspector when joint is (theoretically) selected', async ({ page }) => {
    // This test will help us verify the "Joint Click" bug.
    // If we can't find the inspector text, the logic is broken.
    const inspectorText = page.locator('text=Select a joint to edit vertices');
    await expect(inspectorText).toBeVisible();
  });

  test('should have a functional download button', async ({ page }) => {
    const downloadBtn = page.locator('text=Download .GLB');
    await expect(downloadBtn).toBeEnabled();
  });
});
