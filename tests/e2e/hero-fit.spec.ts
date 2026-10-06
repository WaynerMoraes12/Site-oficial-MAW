import { expect, test } from '@playwright/test';

// A capa inteira (selo, título, texto, botões e a linha de baixo) cabe na primeira tela, centralizada, sem rolar.
// Telas reais de quem abre o site no computador, já sem a barra do navegador: notebook com zoom de 125% do
// Windows (1536 × 690 e 1366 × 620), notebook comum, monitor Full HD e uma tela baixa.
const screens = [
  [1536, 690], [1366, 620], [1440, 780], [1920, 940], [1280, 600], [1024, 640],
] as const;

test.describe('the hero fits the first screen on a computer', () => {
  test.skip(({ isMobile }) => isMobile, 'no celular a capa empilha o disco embaixo; aqui é a tela de computador');
  for (const [width, height] of screens) {
    test(`${width} × ${height}`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      for (const path of ['/', '/pt/', '/es/']) {
        await page.goto(path);
        const box = await page.evaluate(() => {
          const nav = document.querySelector('.nav')!.getBoundingClientRect();
          const parts = ['.hero .catalog', '.hero h1', '.hero .lede', '.hero .ctas', '.hero .meta', '.hero .record'];
          const rects = parts.map((s) => document.querySelector(s)!.getBoundingClientRect());
          return {
            nav: nav.bottom,
            top: Math.min(...rects.map((r) => r.top)),
            bottom: Math.max(...rects.map((r) => r.bottom)),
            view: window.innerHeight,
            scrollX: document.documentElement.scrollWidth - window.innerWidth,
          };
        });
        expect(box.bottom, `${path}: a capa passa da tela`).toBeLessThanOrEqual(box.view);
        expect(box.top, `${path}: a capa entra embaixo do menu`).toBeGreaterThanOrEqual(box.nav);
        // centralizada: o espaço acima (abaixo do menu) e o de baixo quase iguais
        expect(Math.abs((box.top - box.nav) - (box.view - box.bottom)), `${path}: fora do centro`).toBeLessThanOrEqual(40);
        expect(box.scrollX, `${path}: rolagem lateral`).toBeLessThanOrEqual(0);
      }
    });
  }
});
