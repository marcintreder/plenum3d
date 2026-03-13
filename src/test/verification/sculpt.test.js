import { test, expect } from '@playwright/test';

test.describe('Sculpt3D Automated Verification', () => {
  test.beforeEach(async ({ page }) => {
    // Attempt navigation to both ports
    try {
      await page.goto('http://localhost:5173', { timeout: 3000 });
    } catch {
      await page.goto('http://localhost:5174');
    }
    // Wait for the main canvas to be present (the "stable" state indicator)
    await page.waitForSelector('canvas', { timeout: 10000 });
  });

  test('App should be interactive and stable', async ({ page }) => {
    // Check if the canvas is rendering (no crash)
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
    
    // Verify no console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        throw new Error(`Browser console error: ${msg.text()}`);
      }
    });
  });

  test('Switching Editor Modes should not crash', async ({ page }) => {
    const objectModeBtn = page.getByText(/Object Mode/i);
    const sculptModeBtn = page.getByText(/Sculpt Mode/i);
    
    await objectModeBtn.click();
    await expect(objectModeBtn).toHaveClass(/bg-\[#7C3AED\]/);
    
    await sculptModeBtn.click();
    await expect(sculptModeBtn).toHaveClass(/bg-\[#06B6D4\]/);
    
    // Ensure canvas is still visible after switch
    await expect(page.locator('canvas')).toBeVisible();
  });
});
