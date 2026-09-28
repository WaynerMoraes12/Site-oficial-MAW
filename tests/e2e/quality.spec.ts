import { expect, test } from '@playwright/test';

// As três versões (inglês, português, espanhol) têm textos de tamanhos diferentes: cada uma é conferida.
const PAGES = ['/', '/pt/', '/es/'] as const;

for (const path of PAGES) {
  test.describe(`page ${path}`, () => {
    test('no heading, paragraph or button spills outside the screen', async ({ page }) => {
      await page.goto(path);
      // content-visibility pula seções fora da tela; força o layout real antes de medir
      await page.addStyleTag({ content: 'main > section { content-visibility: visible !important; }' });
      const spills = await page.evaluate(() => {
        // clientWidth é a largura real da tela; innerWidth cresce junto com o conteúdo que vaza no celular
        const w = document.documentElement.clientWidth;
        return Array.from(document.querySelectorAll('h1, h2, h3, p, .btn, .trk, .plate, .date, .chan, td'))
          .filter((el) => !el.closest('.ticker'))
          .map((el) => ({ el, r: el.getBoundingClientRect() }))
          .filter(({ r }) => r.width > 0 && (r.left < -1 || r.right > w + 1))
          .map(({ el, r }) => `${el.tagName}.${(el as HTMLElement).className} ${Math.round(r.left)}..${Math.round(r.right)} "${el.textContent?.trim().slice(0, 40)}"`);
      });
      expect(spills).toEqual([]);
      const pageOverflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(pageOverflow).toBeLessThanOrEqual(0);
      // nada escondido dentro de caixas com rolagem lateral (ex.: a tabela do rider)
      const hidden = await page.locator('.sheet').evaluateAll((els) => els.map((el) => el.scrollWidth - el.clientWidth).filter((d) => d > 1));
      expect(hidden).toEqual([]);
    });

    test('reduced motion stops every animation', async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto(path);
      const animated = await page.evaluate(() =>
        Array.from(document.querySelectorAll('*'))
          .filter((el) => [null, '::before', '::after'].some((p) => getComputedStyle(el, p).animationName !== 'none'))
          .map((el) => `${el.tagName}.${(el as HTMLElement).className}`),
      );
      expect(animated).toEqual([]);
      const vinyl = await page.locator('.vinyl').evaluate((el) => getComputedStyle(el).transform);
      expect(vinyl).not.toBe('none');
    });

    test('every image has an alt attribute and content images describe themselves', async ({ page }) => {
      await page.goto(path);
      const missing = await page.locator('img:not([alt])').count();
      expect(missing).toBe(0);
      const emptyContent = await page.locator('.screen img[alt=""], .card img[alt=""], .shot img[alt=""]').count();
      expect(emptyContent).toBe(0);
    });

    test('every in-page anchor points to an existing section', async ({ page }) => {
      await page.goto(path);
      const targets = await page.locator('a[href^="#"]').evaluateAll((as) => as.map((a) => a.getAttribute('href')!.slice(1)));
      for (const id of new Set(targets)) expect(await page.locator(`[id="${id}"]`).count(), `#${id}`).toBe(1);
    });

    test('external links only go to the official e-mail or the GitHub account', async ({ page }) => {
      await page.goto(path);
      const hrefs = await page.locator('a[href]').evaluateAll((as) => as.map((a) => a.getAttribute('href')!));
      for (const h of hrefs.filter((x) => /^[a-z][a-z0-9+.-]*:/i.test(x))) {
        expect(h, h).toMatch(/^(mailto:waynerbusiness@outlook\.com|https:\/\/github\.com\/WaynerMoraes12\/)/);
      }
    });


    test('every logo keeps its original proportions on screen', async ({ page }) => {
      await page.goto(path);
      const ratios = await page.locator('img[data-logo]').evaluateAll((imgs) =>
        // tamanho de layout (ignora rotação do crachá e do vinil)
        (imgs as HTMLImageElement[])
          .filter((img) => img.offsetWidth > 0 && img.offsetHeight > 0)
          .map((img) => img.offsetWidth / img.offsetHeight),
      );
      expect(ratios.length).toBeGreaterThan(0);
      for (const r of ratios) expect(Math.abs(r - 816 / 391)).toBeLessThan(0.05);
    });

    test('content images keep their natural proportions unless deliberately cropped', async ({ page }) => {
      await page.goto(path);
      await page.addStyleTag({ content: 'main > section { content-visibility: visible !important; } [role="tabpanel"][hidden] { display: block !important; }' });
      // proporção natural = atributos width/height que o Astro preenche com o tamanho real do arquivo
      const bad = await page.locator('picture img').evaluateAll((imgs) =>
        (imgs as HTMLImageElement[])
          .filter((img) => img.offsetWidth > 0 && !['cover', 'contain'].includes(getComputedStyle(img).objectFit))
          .filter((img) => Math.abs(img.offsetWidth / img.offsetHeight - Number(img.getAttribute('width')) / Number(img.getAttribute('height'))) > 0.03)
          .map((img) => `${img.alt.slice(0, 30)} ${img.offsetWidth}x${img.offsetHeight}`),
      );
      expect(bad).toEqual([]);
    });

    test('all text meets WCAG AA contrast', async ({ page }, info) => {
      test.skip(info.project.name !== 'desktop', 'cores iguais nos dois tamanhos');
      const { default: AxeBuilder } = await import('@axe-core/playwright');
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto(path);
      await page.addStyleTag({ content: 'main > section { content-visibility: visible !important; }' });
      const results = await new AxeBuilder({ page }).withRules(['color-contrast']).analyze();
      const nodes = results.violations.flatMap((v) => v.nodes.map((n) => `${n.target.join(' ')} — ${n.any[0]?.message ?? ''}`));
      expect(nodes).toEqual([]);
    });
  });
}

test('robots, sitemap and OG image are served', async ({ request }) => {
  expect((await request.get('/robots.txt')).status()).toBe(200);
  expect((await request.get('/sitemap-index.xml')).status()).toBe(200);
  const og = await request.get('/og-image.png');
  expect(og.status()).toBe(200);
  const buf = await og.body();
  expect([buf.readUInt32BE(16), buf.readUInt32BE(20)]).toEqual([1200, 630]);
});
