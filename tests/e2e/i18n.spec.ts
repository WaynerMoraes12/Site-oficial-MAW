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
  await expect(page.locator('.hero h1')).toHaveText(/La DAW que entiende\s*la música\s*que graba$/);
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
    expect(langs.sort()).toEqual(['en', 'es', 'pt', 'pt-BR', 'x-default']);
  }
});

test('every page names its own clean address as canonical', async ({ page }) => {
  for (const path of ['/', '/pt/', '/es/']) {
    await page.goto(path);
    const href = await page.locator('link[rel="canonical"]').getAttribute('href');
    expect(new URL(href!).pathname).toBe(path);
    expect(new URL(href!).search).toBe('');
  }
});

test('brand names, app buttons and shortcuts are protected from browser translation', async ({ page }) => {
  await page.goto('/');
  const unprotected = await page.locator('.kbd, .pedal .name, img[data-logo]').evaluateAll((els) =>
    els.filter((el) => !el.closest('[translate="no"]')).map((el) => el.textContent || el.getAttribute('alt')),
  );
  expect(unprotected).toEqual([]);
});

test('the demo project and the synth presets keep their app names under the browser translator', async ({ page }) => {
  for (const path of ['/', '/pt/', '/es/']) {
    await page.goto(path);
    for (const name of ['Noite Roxa', 'Senoide', 'Orgao']) {
      const hits = page.getByText(name, { exact: true });
      expect(await hits.count(), `${path} ${name}`).toBeGreaterThan(0);
      const loose = await hits.evaluateAll((els) => els.filter((el) => !el.closest('[translate="no"]')).length);
      expect(loose, `${path} ${name}`).toBe(0);
    }
  }
});

test('install steps protect the file name and the app menu, but let Windows wording be translated', async ({ page }) => {
  await page.goto('/');
  const bold = page.locator('#download .steps b');
  await expect(bold.filter({ hasText: 'MAW-Setup-' })).toHaveAttribute('translate', 'no');
  await expect(bold.filter({ hasText: 'MENU' })).toHaveAttribute('translate', 'no');
  const windows = bold.filter({ hasText: 'Run anyway' });
  await expect(windows).toHaveCount(1);
  expect(await windows.evaluate((el) => !!el.closest('[translate="no"]'))).toBe(false);
});

test.describe('automatic language', () => {
  test.describe('Brazilian browser', () => {
    test.use({ locale: 'pt-BR' });
    test('opens in Portuguese', async ({ page }) => {
      await page.goto('/');
      await expect(page).toHaveURL(/\/pt\/$/);
      await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR');
    });
    test('keeps the section and the query of a shared link', async ({ page }) => {
      await page.goto('/?ref=share#download');
      await expect(page).toHaveURL(/\/pt\/\?ref=share#download$/);
    });
    test('respects an explicit choice of English', async ({ page }) => {
      await page.goto('/pt/');
      await page.locator('[data-lang-switch] a', { hasText: 'EN' }).click();
      await expect(page).toHaveURL(/127\.0\.0\.1:4321\/$/);
      await page.goto('/');
      await expect(page).toHaveURL(/127\.0\.0\.1:4321\/$/);
      await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    });
    test('an unknown saved value does not turn off detection', async ({ page }) => {
      await page.addInitScript(() => localStorage.setItem('maw-lang', 'fr'));
      await page.goto('/');
      await expect(page).toHaveURL(/\/pt\/$/);
    });
  });
  test.describe('Brazilian browser, English link opened in a new tab', () => {
    test.use({ locale: 'pt-BR' });
    test('the choice of English still sticks', async ({ page, context }) => {
      await page.goto('/pt/');
      const href = await page.locator('[data-lang-switch] a', { hasText: 'EN' }).getAttribute('href');
      const tab = await context.newPage();
      await tab.goto(href!);
      await expect(tab).toHaveURL(/127\.0\.0\.1:4321\/$/);
      await tab.goto('/');
      await expect(tab).toHaveURL(/127\.0\.0\.1:4321\/$/);
      await expect(tab.locator('html')).toHaveAttribute('lang', 'en');
    });
  });
  test.describe('English browser', () => {
    test.use({ locale: 'en-US' });
    test('a saved choice of Portuguese opens Portuguese at the root', async ({ page }) => {
      await page.goto('/');
      await page.locator('[data-lang-switch] a', { hasText: 'PT' }).click();
      await expect(page).toHaveURL(/\/pt\/$/);
      await page.goto('/');
      await expect(page).toHaveURL(/\/pt\/$/);
    });
    test('Back after choosing Portuguese returns to the English page', async ({ page }) => {
      await page.goto('/');
      await page.locator('[data-lang-switch] a', { hasText: 'PT' }).click();
      await expect(page).toHaveURL(/\/pt\/$/);
      await page.goBack();
      await expect(page).toHaveURL(/127\.0\.0\.1:4321\/$/);
      await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    });
    test('?lang=pt typed at the root opens Portuguese right away', async ({ page }) => {
      await page.goto('/?lang=pt');
      await expect(page).toHaveURL(/\/pt\/$/);
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
