import { expect, test } from '@playwright/test';

test('page is English and titled MAW — Musical Artificial Workspace', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page).toHaveTitle('MAW — Musical Artificial Workspace');
});
