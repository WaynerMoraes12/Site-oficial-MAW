import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => page.goto('/'));

test('world tour stamps every stop with a status', async ({ page }) => {
  await expect(page.locator('#tour .date')).toHaveCount(9);
  await expect(page.locator('#tour .stamp.live')).toHaveText(['On the road']);
});

test('liner notes tell the story and credit JUCE and Spleeter', async ({ page }) => {
  await expect(page.locator('#liner-notes h2')).toContainText('Born in a');
  await expect(page.locator('#credits .credit')).toHaveCount(9);
  await expect(page.locator('#credits')).toContainText('JUCE 8');
  await expect(page.locator('#credits')).toContainText('Spleeter');
});

test('FAQ has 8 questions with the first one open', async ({ page }) => {
  await expect(page.locator('#faq details')).toHaveCount(8);
  await expect(page.locator('#faq details').first()).toHaveAttribute('open', '');
});

test('only the e-mail channel is shown at launch', async ({ page }) => {
  await expect(page.locator('#contact .chan')).toHaveCount(1);
  await expect(page.locator('#contact .chan')).toHaveAttribute('href', 'mailto:waynerbusiness@outlook.com');
});

test('press kit files are downloadable', async ({ page, request }) => {
  const hrefs = await page.locator('#contact .press a').evaluateAll((as) => as.map((a) => a.getAttribute('href')!));
  expect(hrefs).toHaveLength(4);
  for (const href of hrefs) {
    const res = await request.get(href);
    expect(res.status(), href).toBe(200);
  }
});
