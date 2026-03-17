import { test, expect } from '@playwright/test';

async function setupAuth(page) {
  await page.addInitScript(() => {
    // Inject mock user into localStorage
    localStorage.setItem('plenum3d_user', JSON.stringify({
      credential: 'fake_test_token',
      name: 'Test User',
      email: 'test@example.com',
      picture: null,
      tokenExpiresAt: Date.now() + 7200000,
    }));

    // Mock fetch so /api calls resolve instantly
    const _fetch = window.fetch;
    window.fetch = (url, opts) => {
      const u = typeof url === 'string' ? url : url.toString();
      if (u.includes('/api/settings')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({}),
          text: () => Promise.resolve('{}'),
        });
      }
      if (u.includes('/api/projects')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ projects: [] }),
          text: () => Promise.resolve('{"projects":[]}'),
        });
      }
      return _fetch(url, opts);
    };
  });
}

test.describe('Plenum3D Smoke Tests', () => {
  test('1. Login page renders', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text="Sign in with Google"').first()).toBeVisible();
  });

  test('2. Settings modal appears and closes', async ({ page }) => {
    await setupAuth(page);
    await page.goto('/');
    await page.click('button:has-text("Settings")');
    await expect(page.locator('h2:has-text("Provider Settings")')).toBeVisible();
    await page.click('[aria-label="Close"]');
    await expect(page.locator('h2:has-text("Provider Settings")')).not.toBeVisible();
  });

  test('3. Scene tabs "+" adds new tab', async ({ page }) => {
    await setupAuth(page);
    await page.goto('/');
    await expect(page.locator('text="Scene 1"').first()).toBeVisible();
    await page.click('button[title="Add scene"]');
    await expect(page.locator('text="Scene 2"').first()).toBeVisible();
  });

  test('4. Prompt bar is visible', async ({ page }) => {
    await setupAuth(page);
    await page.goto('/');
    await expect(page.locator('input[type="text"]').first()).toBeVisible();
  });

  test('5. Export button is in the DOM', async ({ page }) => {
    await setupAuth(page);
    await page.goto('/');
    await expect(page.locator('button:has-text("Export .GLB")')).toBeVisible();
  });
});
