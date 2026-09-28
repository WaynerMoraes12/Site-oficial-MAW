import { expect, test } from '@playwright/test';

test('Portuguese page is complete and declared as pt-BR', async ({ page }) => {
  await page.goto('/pt/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR');
  await expect(page.locator('.hero h1')).toHaveText(/A DAW que entende\s*a música\s*que grava/);
  await expect(page.locator('#tracklist .trk')).toHaveCount(16);
  await expect(page.locator('#faq details')).toHaveCount(8);
});

test('Spanish page is complete and declared as es', async ({ page }) => {
  await page.goto('/es/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'es');
  await expect(page.locator('.hero h1')).toHaveText(/La DAW que entiende\s*la música\s*que grabas/);
  await expect(page.locator('#read-before-install .plate')).toHaveCount(6);
});

test('language switcher links the three versions and marks the current one', async ({ page }) => {
  await page.goto('/pt/');
  const links = page.locator('[data-lang-switch] a');
  await expect(links).toHaveText(['EN', 'PT', 'ES']);
  await expect(page.locator('[data-lang-switch] a[aria-current="true"]')).toHaveText('PT');
  await links.filter({ hasText: 'ES' }).click();
  await expect(page).toHaveURL(/\/es\/$/);
});

test('every page announces its translations to search engines', async ({ page }) => {
  for (const path of ['/', '/pt/', '/es/']) {
    await page.goto(path);
    const langs = await page.locator('link[rel="alternate"][hreflang]').evaluateAll((ls) => ls.map((l) => l.getAttribute('hreflang')));
    expect(langs.sort()).toEqual(['en', 'es', 'pt-BR', 'x-default']);
  }
});

test('brand names, app buttons and shortcuts are protected from browser translation', async ({ page }) => {
  await page.goto('/');
  const unprotected = await page.locator('.kbd, .pedal .name, img[data-logo]').evaluateAll((els) =>
    els.filter((el) => !el.closest('[translate="no"]')).map((el) => el.textContent || el.getAttribute('alt')),
  );
  expect(unprotected).toEqual([]);
});

test.describe('automatic language', () => {
  test.describe('Brazilian browser', () => {
    test.use({ locale: 'pt-BR' });
    test('opens in Portuguese', async ({ page }) => {
      await page.goto('/');
      await expect(page).toHaveURL(/\/pt\/$/);
      await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR');
    });
    test('respects an explicit choice of English', async ({ page }) => {
      await page.goto('/pt/');
      await page.locator('[data-lang-switch] a', { hasText: 'EN' }).click();
      await expect(page).toHaveURL(/127\.0\.0\.1:4321\/$/);
      await page.goto('/');
      await expect(page).toHaveURL(/127\.0\.0\.1:4321\/$/);
      await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    });
  });
  test.describe('Argentinian browser', () => {
    test.use({ locale: 'es-AR' });
    test('opens in Spanish', async ({ page }) => {
      await page.goto('/');
      await expect(page).toHaveURL(/\/es\/$/);
    });
  });
  test.describe('German browser', () => {
    test.use({ locale: 'de-DE' });
    test('stays in English, left to the browser translator', async ({ page }) => {
      await page.goto('/');
      await expect(page.locator('html')).toHaveAttribute('lang', 'en');
      await expect(page).toHaveURL(/127\.0\.0\.1:4321\/$/);
    });
  });
});
