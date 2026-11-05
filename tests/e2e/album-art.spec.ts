import { expect, test } from '@playwright/test';

// Arte de disco atrás do roadmap (cidade de neon), das dúvidas (floresta à noite) e dos bastidores (bandeira de batalha).
// É só cenário: some para o leitor de tela, não pega clique e nunca fica na frente do texto.
const ART = [
  { id: 'tour', art: '.art-city', text: ['h2', '.date .what'] },
  { id: 'faq', art: '.art-forest', text: ['h2', 'summary'] },
  { id: 'backstage', art: '.art-flag', text: ['h2', '.stat .v'] },
] as const;

for (const path of ['/', '/pt/', '/es/']) {
  test.describe(`album art on ${path}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(path);
      await page.addStyleTag({ content: 'main > section { content-visibility: visible !important; }' });
    });

    for (const { id, art, text } of ART) {
      test(`#${id} has its art behind the text`, async ({ page }) => {
        const scene = page.locator(`#${id} ${art}`);
        await expect(scene).toHaveCount(1);
        await expect(scene).toHaveAttribute('aria-hidden', 'true');
        await expect(scene).toHaveCSS('pointer-events', 'none');
        // elementFromPoint ignora o que não pega clique: liga o clique na arte para ver quem está por cima de verdade
        await page.addStyleTag({ content: `${art}, ${art} * { pointer-events: auto !important; }` });
        for (const sel of text) {
          const target = page.locator(`#${id} ${sel}`).first();
          // o site rola suave: sem 'instant' o teste mediria antes de a rolagem chegar
          await target.evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
          const onTop = await target.evaluate((el) => {
            const r = el.getBoundingClientRect();
            const hit = document.elementFromPoint(r.left + Math.min(r.width, 40) / 2, r.top + r.height / 2);
            return !!hit && el.contains(hit);
          });
          expect(onTop, `${id} ${sel}`).toBe(true);
        }
      });
    }

    test('the FAQ questions still open over the forest', async ({ page }) => {
      const second = page.locator('#faq details').nth(1);
      await second.locator('summary').click();
      await expect(second).toHaveAttribute('open', '');
    });
  });
}
