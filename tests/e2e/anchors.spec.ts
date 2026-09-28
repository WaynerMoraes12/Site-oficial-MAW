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

test('a link to where the reader already is does not pull them back when they scroll', async ({ page }) => {
  await page.goto('/');
  await page.locator('.nav .logo').click();
  await page.mouse.move(200, 400);
  await page.mouse.wheel(0, 2500);
  await settle(page);
  expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(2000);
});

test('moving away during the smooth scroll is not undone when it ends', async ({ page }) => {
  await page.goto('/');
  await page.locator('.hero .ctas a[href="#download"]').click();
  await page.waitForTimeout(150);
  // a pessoa gira a roda e sai dali; o navegador troca a rolagem suave pela dela
  await page.mouse.move(200, 400);
  await page.mouse.wheel(0, -100);
  await page.evaluate(() => window.scrollTo({ top: Math.max(0, window.scrollY - 2000), behavior: 'instant' }));
  await settle(page);
  expect(await topOf(page, '#download')).toBeGreaterThan(200);
});

test('after jumping to Download with the keyboard, Tab continues inside the download section', async ({ page }) => {
  await page.goto('/');
  await page.locator('.hero .ctas a[href="#download"]').focus();
  await page.keyboard.press('Enter');
  await settle(page);
  await page.keyboard.press('Tab');
  expect(await page.evaluate(() => !!document.activeElement?.closest('#download'))).toBe(true);
});

test('clicking the same section twice adds only one step to the back button', async ({ page }) => {
  await page.goto('/');
  const before = await page.evaluate(() => history.length);
  const faq = page.locator('a[href="#faq"]').first();
  await faq.evaluate((a: HTMLAnchorElement) => a.click());
  await settle(page);
  await faq.evaluate((a: HTMLAnchorElement) => a.click());
  await settle(page);
  expect(await page.evaluate(() => history.length)).toBe(before + 1);
});

test('a malformed #hash in a shared link does not break the page', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/#%E0%A4%A');
  await page.waitForLoadState('load');
  expect(errors).toEqual([]);
});

test('on a slow connection, the reader who already scrolled is not pulled back when the page finishes loading', async ({ page }) => {
  // segura as imagens para o evento load demorar
  await page.route('**/*.{png,avif,webp}', async (route) => {
    await new Promise((r) => setTimeout(r, 1500));
    await route.continue();
  });
  await page.goto('/#faq', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(300);
  // a pessoa gira a roda e sai dali; o navegador troca a rolagem pela dela
  await page.mouse.move(200, 400);
  await page.mouse.wheel(0, -100);
  await page.evaluate(() => window.scrollTo({ top: Math.max(0, window.scrollY - 2500), behavior: 'instant' }));
  await page.waitForLoadState('load');
  await settle(page);
  expect(await topOf(page, '#faq')).toBeGreaterThan(300);
});

test('coming back with the Back button returns to where the reader was, not to the #section', async ({ page }) => {
  await page.goto('/#tour');
  await settle(page);
  await page.mouse.move(200, 400);
  await page.mouse.wheel(0, 3600);
  await settle(page);
  const y = await page.evaluate(() => window.scrollY);
  await page.goto('/pt/');
  await page.goBack();
  await page.waitForLoadState('load');
  // o navegador pode ficar parado um instante antes de restaurar: espera chegar, com prazo
  await expect.poll(async () => Math.abs((await page.evaluate(() => window.scrollY)) - y), { timeout: 5_000 }).toBeLessThan(400);
  await settle(page);
  expect(Math.abs((await page.evaluate(() => window.scrollY)) - y)).toBeLessThan(400);
  await expect(page).toHaveURL(/#tour$/);
});

test('reloading the page keeps the reader where they were, with the #section still in the address', async ({ page }) => {
  await page.goto('/#tour');
  await settle(page);
  await page.mouse.move(200, 400);
  await page.mouse.wheel(0, 1500);
  await settle(page);
  const y = await page.evaluate(() => window.scrollY);
  await page.reload();
  await page.waitForLoadState('load');
  await expect.poll(async () => Math.abs((await page.evaluate(() => window.scrollY)) - y), { timeout: 5_000 }).toBeLessThan(400);
  await settle(page);
  expect(Math.abs((await page.evaluate(() => window.scrollY)) - y)).toBeLessThan(400);
  await expect(page).toHaveURL(/#tour$/);
});

test('a section clicked while the reloaded page is still loading keeps its #hash', async ({ page }) => {
  await page.goto('/#tour');
  await settle(page);
  await page.route('**/*.{png,avif,webp}', async (route) => {
    await new Promise((r) => setTimeout(r, 1500));
    await route.continue();
  });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.locator('a[href="#faq"]').first().evaluate((a: HTMLAnchorElement) => a.click());
  await page.waitForLoadState('load');
  await expect(page).toHaveURL(/#faq$/);
});
