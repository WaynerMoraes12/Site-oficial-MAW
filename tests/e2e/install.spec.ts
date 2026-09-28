import { existsSync, readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import { diskLabel, parseRelease, releaseView } from '../../src/lib/release';

test.beforeEach(async ({ page }) => page.goto('/'));

test('tech rider lists 8 channels and the VC++ runtime note', async ({ page }) => {
  await expect(page.locator('#rider tbody tr')).toHaveCount(8);
  // espaço em disco vem do build do instalador (release.json); sem ele, a estimativa de 14 MB
  const text = existsSync('src/data/release.json') ? readFileSync('src/data/release.json', 'utf8') : undefined;
  const disk = diskLabel(parseRelease(text), JSON.parse(readFileSync('src/data/site.json', 'utf8'))) ?? '14 MB';
  await expect(page.locator('#rider tbody tr', { hasText: 'Disk' })).toContainText(`About ${disk} for MAW`);
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
  // mesma decisão que a página toma (arquivo, versão, hash), não só "o arquivo existe"
  const text = existsSync('src/data/release.json') ? readFileSync('src/data/release.json', 'utf8') : undefined;
  const view = releaseView(parseRelease(text), JSON.parse(readFileSync('src/data/site.json', 'utf8')));
  // com release.json, a página tem que oferecer o download (o deploy também exige isso)
  expect(view.state).toBe(text ? 'ready' : 'pending');
  if (view.state === 'ready') {
    await expect(button).toHaveAttribute('href', view.url);
    await expect(page.locator('#download .hash')).toContainText(view.sha256);
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

test('the rider keeps explicit table roles, which Safari needs when the phone layout turns rows into cards', async ({ page }) => {
  const table = page.locator('#rider table');
  await expect(table).toHaveAttribute('role', 'table');
  await expect(table.locator('tbody tr[role="row"]')).toHaveCount(8);
  await expect(table.locator('tbody td[role="cell"]')).toHaveCount(32);
  await expect(table.locator('thead th[role="columnheader"]')).toHaveCount(4);
});
