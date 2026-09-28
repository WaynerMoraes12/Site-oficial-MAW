// Tira um print 1200x630 da capa do site para o Open Graph. Precisa do preview rodando.
import { chromium } from '@playwright/test';

const url = process.argv[2] ?? 'http://127.0.0.1:4321/';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await page.emulateMedia({ reducedMotion: 'reduce' });
await page.goto(url, { waitUntil: 'networkidle' });
await page.addStyleTag({ content: '.nav{display:none!important} .hero{min-height:630px!important;padding:36px 0!important}' });
await page.screenshot({ path: 'public/og-image.png' });
await browser.close();
console.log('escrito public/og-image.png');
