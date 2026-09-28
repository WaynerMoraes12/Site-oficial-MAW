import { existsSync, readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => page.goto('/'));

test('tech rider lists 8 channels and the VC++ runtime note', async ({ page }) => {
  await expect(page.locator('#rider tbody tr')).toHaveCount(8);
  await expect(page.locator('#rider .rider-note')).toContainText('Visual C++ Redistributable');
});

test('read-before-install shows six plates, SmartScreen first', async ({ page }) => {
  await expect(page.locator('#read-before-install .plate')).toHaveCount(6);
  await expect(page.locator('#read-before-install .plate').first()).toHaveClass(/hot/);
  const site = JSON.parse(readFileSync('src/data/site.json', 'utf8'));
  const aiTitle = site.neuralServerBundled ? 'AI needs a first-run download' : 'AI server not bundled yet';
  await expect(page.locator('#read-before-install h3', { hasText: aiTitle })).toHaveCount(1);
});

test('download button matches the real release state', async ({ page }) => {
  const button = page.locator('#download [data-download]');
  if (existsSync('src/data/release.json')) {
    const release = JSON.parse(readFileSync('src/data/release.json', 'utf8'));
    await expect(button).toHaveAttribute('href', new RegExp(`/v${release.version}/${release.file}$`));
    await expect(page.locator('#download .hash')).toContainText(release.sha256);
  } else {
    await expect(button).toHaveText('Installer coming soon');
    await expect(button).toHaveAttribute('aria-disabled', 'true');
    await expect(button).not.toHaveAttribute('href', /.+/);
  }
});

test('source code link only appears when configured', async ({ page }) => {
  const site = JSON.parse(readFileSync('src/data/site.json', 'utf8'));
  await expect(page.locator('#download')).toHaveCount(1);
  await expect(page.locator('#download .source-link')).toHaveCount(site.sourceCodeUrl ? 1 : 0);
});
