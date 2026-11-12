import { existsSync, readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import { diskLabel, extraDownloads, parseRelease, releaseView } from '../../src/lib/release';

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

// o que a página mostra para cada sistema é o que o release.json local diz (no deploy, só o que foi conferido fica nele)
const localRelease = () => {
  const text = existsSync('src/data/release.json') ? readFileSync('src/data/release.json', 'utf8') : undefined;
  return parseRelease(text);
};
const siteData = () => JSON.parse(readFileSync('src/data/site.json', 'utf8'));

test('macOS and Linux each get their own card: a real download when the package exists, "coming soon" otherwise', async ({ page }) => {
  await expect(page.locator('#download .os-card')).toHaveCount(2);
  const extra = extraDownloads(localRelease(), siteData());
  for (const [id, key, name] of [['mac', 'macos', 'macOS'], ['linux', 'linux', 'Linux']] as const) {
    const button = page.locator(`#download .os-card[data-os="${id}"] [data-download]`);
    const pkg = extra[key];
    if (pkg) {
      await expect(button).toHaveAttribute('href', pkg.url);
      await expect(button).toHaveText(`Download MAW ${siteData().version} · ${name}`);
      await expect(page.locator(`#download .os-card[data-os="${id}"] .hash`)).toContainText(pkg.sha256);
    } else {
      await expect(button).toHaveText(`${name} · coming soon`);
      await expect(button).toHaveAttribute('aria-disabled', 'true');
      await expect(button).not.toHaveAttribute('href', /.+/);
    }
  }
  await expect(page.locator('#download .os-card[data-os="mac"]')).toContainText('Open Anyway');
  await expect(page.locator('#download .os-card[data-os="linux"]')).toContainText('ALSA or JACK');
});

test.describe("the visitor's own system comes highlighted", () => {
  for (const [agent, os] of [
    ['Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36', 'mac'],
    ['Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36', 'linux'],
    ['Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36', 'win'],
  ] as const) {
    test(os, async ({ browser }) => {
      const context = await browser.newContext({ userAgent: agent });
      const page = await context.newPage();
      await page.goto('/');
      await expect(page.locator('#download')).toHaveAttribute('data-yours', os);
      await expect(page.locator(`#download [data-os="${os}"] .os-yours`)).toBeVisible();
      await expect(page.locator('#download .os-yours:visible')).toHaveCount(1);
      await context.close();
    });
  }
});

test('read-before-install shows six plates, the unsigned-app warning first', async ({ page }) => {
  await expect(page.locator('#read-before-install .plate')).toHaveCount(6);
  await expect(page.locator('#read-before-install .plate').first()).toHaveClass(/hot/);
  const site = JSON.parse(readFileSync('src/data/site.json', 'utf8'));
  const aiTitle = site.neuralServerBundled ? 'AI needs a first-run download' : 'AI server not bundled yet';
  await expect(page.locator('#read-before-install h3', { hasText: aiTitle })).toHaveCount(1);
});

test('download button matches the real release state', async ({ page }) => {
  const button = page.locator('#download .os-main [data-download]');
  // mesma decisão que a página toma (arquivo, versão, hash), não só "o arquivo existe"
  const text = existsSync('src/data/release.json') ? readFileSync('src/data/release.json', 'utf8') : undefined;
  const view = releaseView(parseRelease(text), JSON.parse(readFileSync('src/data/site.json', 'utf8')));
  // com release.json, a página tem que oferecer o download (o deploy também exige isso)
  expect(view.state).toBe(text ? 'ready' : 'pending');
  if (view.state === 'ready') {
    await expect(button).toHaveAttribute('href', view.url);
    await expect(page.locator('#download .os-main .hash')).toContainText(view.sha256);
  } else {
    await expect(button).toHaveText('Installer coming soon');
    await expect(button).toHaveAttribute('aria-disabled', 'true');
    await expect(button).not.toHaveAttribute('href', /.+/);
  }
});

test('the source code link points to the zip of this version when the release has it', async ({ page }) => {
  const source = extraDownloads(localRelease(), siteData()).source;
  await expect(page.locator('#download .source-link')).toHaveCount(source ? 1 : 0);
  if (source) await expect(page.locator('#download .source-link')).toHaveAttribute('href', source.url);
});

test('the rider keeps explicit table roles, which Safari needs when the phone layout turns rows into cards', async ({ page }) => {
  const table = page.locator('#rider table');
  await expect(table).toHaveAttribute('role', 'table');
  await expect(table.locator('tbody tr[role="row"]')).toHaveCount(8);
  await expect(table.locator('tbody td[role="cell"]')).toHaveCount(32);
  await expect(table.locator('thead th[role="columnheader"]')).toHaveCount(4);
});
