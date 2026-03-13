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
    // Click outside of the UI elements to avoid event interception
    const canvas = page.locator('canvas');
    await canvas.click({ position: { x: 400, y: 400 } });
    
    // 4. Verify no error in console
    page.on('console', msg => {
      if (msg.type() === 'error') throw new Error(`Console error: ${msg.text()}`);
    });
  });
  test('CUJ: View and Copy Generated Code', async ({ page }) => {
    // Navigate
    await page.goto('http://localhost:5173', { timeout: 3000 }).catch(() => page.goto('http://localhost:5175'));
    await page.waitForSelector('canvas', { timeout: 10000 });

    // Open CodeView (assuming a button with id 'view-code-btn')
    const viewCodeBtn = page.locator('#view-code-btn');
    await viewCodeBtn.click();
    
    // Verify CodeView modal is open
    const modal = page.locator('h2', { hasText: 'R3F Code Export' });
    await expect(modal).toBeVisible();
    
    // Check if code contains R3F components
    const codeContent = page.locator('pre');
    await expect(codeContent).toContainText('<mesh');
    await expect(codeContent).toContainText('<Canvas');
    
    // Test Copy button
    const copyBtn = page.getByText(/Copy Code/i);
    await copyBtn.click();
    await expect(copyBtn).toContainText('Copied!');
  });

});
