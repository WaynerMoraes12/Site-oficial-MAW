import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => page.goto('/#stage'));

test('starts on the arrangement screenshot', async ({ page }) => {
  await expect(page.locator('#tab-arrangement')).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('#panel-arrangement img')).toBeVisible();
  await expect(page.locator('#panel-mixer')).toBeHidden();
});

test('clicking a tab swaps the screenshot', async ({ page }) => {
  await page.locator('#tab-mixer').click();
  await expect(page.locator('#tab-mixer')).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('#panel-mixer img')).toBeVisible();
  await expect(page.locator('#panel-arrangement')).toBeHidden();
});

test('arrow keys move between tabs', async ({ page }) => {
  await page.locator('#tab-arrangement').focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#tab-mixer')).toBeFocused();
  await expect(page.locator('#panel-mixer')).toBeVisible();
  await page.keyboard.press('ArrowLeft');
  await expect(page.locator('#tab-arrangement')).toBeFocused();
});

test('screenshots are optimized and described', async ({ page }) => {
  const sources = await page.locator('#stage picture source').evaluateAll((s) => s.map((x) => x.getAttribute('type')));
  expect(sources).toContain('image/avif');
  const alts = await page.locator('#stage img').evaluateAll((imgs) => imgs.map((i) => i.getAttribute('alt') ?? ''));
  expect(alts).toHaveLength(4);
  for (const a of alts) expect(a.length).toBeGreaterThan(20);
});
