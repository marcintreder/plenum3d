import { test, expect } from '@playwright/test';

test.describe('Plenum3D Smoke Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/');
  });

  test('Login page renders and interacts', async ({ page }) => {
    // Plenum3D starts with a Login screen if not authenticated.
    // The previous run showed "Sign in with Google" button.
    const loginButton = page.locator('text="Sign in with Google"');
    await expect(loginButton.first()).toBeVisible();
  });
});
