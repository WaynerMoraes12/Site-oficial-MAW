import { expect, type Page, test } from '@playwright/test';

// Espera a rolagem suave terminar (scrollY parado por 400 ms).
async function settle(page: Page) {
  await page.waitForFunction(() => new Promise<boolean>((resolve) => {
    let last = -1;
    let still = 0;
    const tick = () => {
      if (window.scrollY === last) still += 1;
      else { still = 0; last = window.scrollY; }
      if (still >= 8) resolve(true);
      else setTimeout(tick, 50);
    };
    tick();
  }), undefined, { timeout: 15_000 });
}

const topOf = (page: Page, sel: string) => page.locator(sel).evaluate((el) => Math.round(el.getBoundingClientRect().top));

test('the hero Download button lands on the download section', async ({ page }) => {
  await page.goto('/');
  await page.locator('.hero .ctas a[href="#download"]').click();
  await settle(page);
  const top = await topOf(page, '#download');
  expect(top).toBeGreaterThanOrEqual(0);
  expect(top).toBeLessThan(120);
});

test('the nav Download button lands on the download section', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'no celular o botão fica no menu');
  await page.goto('/');
  await page.locator('.nav .btn[href="#download"]').click();
  await settle(page);
  const top = await topOf(page, '#download');
  expect(top).toBeGreaterThanOrEqual(0);
  expect(top).toBeLessThan(120);
});

test('opening a link with #faq lands on the FAQ', async ({ page }) => {
  await page.goto('/#faq');
  await settle(page);
  const top = await topOf(page, '#faq');
  expect(top).toBeGreaterThanOrEqual(0);
  expect(top).toBeLessThan(120);
});

test('the mobile menu offers Download', async ({ page }, info) => {
  test.skip(info.project.name !== 'mobile', 'só no celular');
  await page.goto('/');
  await page.locator('[data-nav-toggle]').click();
  await expect(page.locator('#nav-links a[href="#download"]')).toBeVisible();
});
