import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => page.goto('/'));

test('tracklist has 16 tracks with real MAW keys', async ({ page }) => {
  await expect(page.locator('#tracklist .trk')).toHaveCount(16);
  const keys = await page.locator('#tracklist .trk .kbd').allTextContents();
  expect(keys).toEqual(['R', 'METRO', 'S', 'G', 'K', 'Ctrl U', 'MIDI', 'KEYBOARD', 'MIXER', 'EFEITO', 'UI', 'A', 'Ctrl Z', 'Ctrl S', 'E', 'MENU']);
  expect(await page.locator('#tracklist .barcode rect').count()).toBeGreaterThan(20);
});

test('every AI card says where it runs', async ({ page }) => {
  const cards = page.locator('#ai .card');
  await expect(cards).toHaveCount(5);
  await expect(page.locator('#ai .runtime.app')).toHaveCount(3);
  await expect(page.locator('#ai .runtime.server')).toHaveCount(2);
  await expect(page.locator('#ai .card', { hasText: 'Stem separation' }).locator('.runtime')).toHaveText('Needs the MAW Neural Server');
});

test('rack shows the seven built-in effects as pedals', async ({ page }) => {
  const names = await page.locator('#rack .pedal .name').allTextContents();
  expect(names.map((n) => n.replace(/\u00ad/g, ''))).toEqual(['Noise Gate', 'Distortion', 'Equalizer', 'Compressor', 'Reverb', 'Delay', 'AutoTune']);
  await expect(page.locator('#rack figure.shot')).toHaveCount(3);
});

test('backstage shows the measured numbers', async ({ page }) => {
  await expect(page.locator('#backstage .stat .v')).toHaveText(['0.29%', '3,934', '24', '50']);
  await expect(page.locator('#backstage figure.shot')).toHaveCount(2);
});
