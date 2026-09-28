import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';

type Stop = { status: 'live' | 'reh' | 'next'; text: Record<'en' | 'pt' | 'es', string> };
const tour: { stops: Stop[] } = JSON.parse(readFileSync('src/data/tour.json', 'utf8'));

test.beforeEach(async ({ page }) => page.goto('/'));

test('the world tour shows every synced stop, in each language, with its stamp and date', async ({ page }) => {
  const stamps = {
    en: { live: 'On the road', reh: 'Rehearsing', next: 'Announced' },
    pt: { live: 'Na estrada', reh: 'Ensaiando', next: 'Anunciado' },
    es: { live: 'De gira', reh: 'Ensayando', next: 'Anunciado' },
  };
  const months = { en: 'Sep', pt: 'Set', es: 'Sep' };
  for (const [locale, path] of [['en', '/'], ['pt', '/pt/'], ['es', '/es/']] as const) {
    await page.goto(path);
    await expect(page.locator('#tour .date .what')).toHaveText(tour.stops.map((s) => s.text[locale]));
    await expect(page.locator('#tour .date .stamp')).toHaveText(tour.stops.map((s) => stamps[locale][s.status]));
    // a versão de setembro de 2026 aparece com o mês na língua da página
    await expect(page.locator('#tour .date').first().locator('.when')).toHaveText(`${months[locale]} 2026`);
  }
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
