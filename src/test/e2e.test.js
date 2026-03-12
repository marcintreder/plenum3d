import { test, expect } from '@playwright/test';

test.describe('Sculpt3D E2E - Advanced Tools', () => {
  test.beforeEach(async ({ page }) => {
    // Try both standard vite ports
    try {
      await page.goto('http://localhost:5173', { timeout: 2000 });
    } catch (e) {
      await page.goto('http://localhost:5174');
    }
  });

  test('should switch to Sculpt Mode', async ({ page }) => {
    await page.click('text=Sculpt Mode');
    const sculptBtn = page.locator('button:has-text("Sculpt Mode")');
    await expect(sculptBtn).toHaveClass(/bg-\[#06B6D4\]/);
  });

  test('should open and close Code View', async ({ page }) => {
    await page.click('text=View R3F Code');
    await expect(page.locator('h2:has-text("R3F Code Export")')).toBeVisible();
    await page.click('button:has(svg.lucide-x)');
    await expect(page.locator('h2:has-text("R3F Code Export")')).not.toBeVisible();
  });

  test('should show transform inputs in Object Mode', async ({ page }) => {
    await page.click('text=Main Chassis');
    await expect(page.locator('text=Object Settings')).toBeVisible();
    await expect(page.locator('label:has-text("position")')).toBeVisible();
  });

  test('should delete object with Backspace shortcut', async ({ page }) => {
    await page.click('text=Main Chassis');
    await page.keyboard.press('Backspace');
    await expect(page.locator('text=Main Chassis')).not.toBeVisible();
  });
});
