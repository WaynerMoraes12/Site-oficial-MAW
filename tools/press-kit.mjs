// Empacota os prints da MAW para o kit de imprensa. Roda antes de cada build (npm prebuild).
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { zipSync } from 'fflate';

const dir = 'src/assets/screens';
const files = {};
for (const name of readdirSync(dir).filter((n) => n.endsWith('.png')).sort()) {
  files[`maw-screenshots/${name}`] = [readFileSync(`${dir}/${name}`), { level: 0 }];
}
mkdirSync('public/press', { recursive: true });
writeFileSync('public/press/maw-screenshots.zip', zipSync(files));
console.log(`press kit: ${Object.keys(files).length} prints em public/press/maw-screenshots.zip`);
