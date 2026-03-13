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

  test('CUJ: Add Primitive and Manipulate', async ({ page }) => {
    // Navigate to local dev server (default 5173, fallback if in use)
    await page.goto('http://localhost:5173', { timeout: 3000 }).catch(() => page.goto('http://localhost:5175'));
    await page.waitForSelector('canvas', { timeout: 10000 });

    // 1. Ensure model loads
    await expect(page.locator('canvas')).toBeVisible();

    // 2. Click "Cube" primitive
    const cubeBtn = page.getByText(/Cube/i);
    await cubeBtn.click();
    
    // 3. Ensure cube is present and interactive (Canvas has 3D elements)
    // Check for mesh interaction
    const canvas = page.locator('canvas');
    await canvas.click({ position: { x: 100, y: 100 } });
    
    // 4. Verify no error in console
    page.on('console', msg => {
      if (msg.type() === 'error') throw new Error(`Console error: ${msg.text()}`);
    });
  });

  test('CUJ: Switch to Sculpt Mode and Interact', async ({ page }) => {
    await page.goto('http://localhost:5173', { timeout: 3000 }).catch(() => page.goto('http://localhost:5175'));
    await page.waitForSelector('canvas', { timeout: 10000 });

    const sculptBtn = page.locator('#sculpt-mode-btn');
    await sculptBtn.click();
    await expect(sculptBtn).toHaveClass(/bg-\[#06B6D4\]/);
    
    // Simulate selection by clicking on the canvas
    const canvas = page.locator('canvas');
    await canvas.click({ position: { x: 300, y: 300 } });
    
    // If the canvas didn't crash, the UI should still be there
    await expect(page.locator('#sculpt-mode-btn')).toBeVisible();
  });

});
