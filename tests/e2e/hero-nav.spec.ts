import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => page.goto('/'));

test('hero headline is the English tagline', async ({ page }) => {
  await expect(page.locator('.hero h1')).toHaveText(/The DAW that understands\s*the music\s*it records/);
  await expect(page.locator('.hero .ctas a').first()).toHaveText('Download for Windows');
});

test('logo images are never filtered, blended or animated', async ({ page }) => {
  const styles = await page.locator('img[data-logo]').evaluateAll((imgs) =>
    imgs.map((img) => {
      const cs = getComputedStyle(img);
      return { filter: cs.filter, blend: cs.mixBlendMode, anim: cs.animationName };
    }),
  );
  expect(styles.length).toBeGreaterThanOrEqual(3);
  for (const s of styles) expect(s).toEqual({ filter: 'none', blend: 'normal', anim: 'none' });
});

test('ticker repeats items for the loop and hides the copy from screen readers', async ({ page }) => {
  const spans = page.locator('.ticker .track > span');
  const total = await spans.count();
  expect(total).toBeGreaterThan(0);
  expect(total % 2).toBe(0);
  expect(await page.locator('.ticker .track > span[aria-hidden="true"]').count()).toBe(total / 2);
});

test('footer states the non-affiliation', async ({ page }) => {
  await expect(page.locator('footer')).toContainText('MAW is not affiliated with any artist or band.');
});

test('mobile menu opens and closes', async ({ page }, info) => {
  test.skip(info.project.name !== 'mobile', 'só no celular');
  const toggle = page.locator('[data-nav-toggle]');
  await expect(page.locator('#nav-links')).toBeHidden();
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('#nav-links')).toBeVisible();
  await page.locator('#nav-links a').first().click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
});
