import { existsSync, readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import { diskLabel, parseRelease, releaseView } from '../../src/lib/release';

test.beforeEach(async ({ page }) => page.goto('/'));

test('tech rider lists 8 channels and the VC++ runtime note', async ({ page }) => {
  await expect(page.locator('#rider tbody tr')).toHaveCount(8);
  // espaço em disco vem do build do instalador (release.json, ou o site.json quando o deploy tira o release.json)
  const text = existsSync('src/data/release.json') ? readFileSync('src/data/release.json', 'utf8') : undefined;
  const disk = diskLabel(parseRelease(text), JSON.parse(readFileSync('src/data/site.json', 'utf8'))) ?? '14 MB';
  await expect(page.locator('#rider tbody tr', { hasText: 'Disk' })).toContainText(`About ${disk} on Windows, AI included`);
  await expect(page.locator('#rider .rider-note')).toContainText('Visual C++ Redistributable');
});

test('the rider writes the disk size with the decimal comma in Portuguese', async ({ page }) => {
  await page.goto('/pt/');
  await expect(page.locator('#rider tbody tr', { hasText: 'Disco' })).toContainText(/Cerca de \d+(,\d)? [GM]B no Windows/);
});

test('macOS and Linux each get a card with a "coming soon" button that is not a link', async ({ page }) => {
  await expect(page.locator('#download .os-card')).toHaveCount(2);
  for (const [id, name] of [['mac', 'macOS'], ['linux', 'Linux']]) {
    const soon = page.locator(`#download .os-card[data-os="${id}"] [data-soon]`);
    await expect(soon).toHaveText(`${name} · coming soon`);
    await expect(soon).toHaveAttribute('aria-disabled', 'true');
    await expect(soon).not.toHaveAttribute('href', /.+/);
  }
  await expect(page.locator('#download .os-card[data-os="mac"]')).toContainText('Open Anyway');
  await expect(page.locator('#download .os-card[data-os="linux"]')).toContainText('ALSA or JACK');
});

test('read-before-install shows six plates, the unsigned-app warning first', async ({ page }) => {
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
