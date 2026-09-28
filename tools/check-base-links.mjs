import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { brokenRefs } from './lib/base-links.mjs';

const dist = process.argv[2] ?? 'dist';
const base = process.env.BASE_PATH ?? '/';
const walk = (dir) => readdirSync(dir).flatMap((n) => {
  const p = join(dir, n);
  return statSync(p).isDirectory() ? walk(p) : p.endsWith('.html') ? [p] : [];
});

let broken = 0;
for (const file of walk(dist)) {
  const dir = relative(dist, dirname(file)).split(sep).join('/');
  const pageDir = dir ? `${dir}/` : '';
  for (const ref of brokenRefs(readFileSync(file, 'utf8'), base, (rel) => existsSync(join(dist, rel)), pageDir)) {
    broken++;
    console.error(`${file}: ${ref}`);
  }
}
console.log(broken ? `${broken} link(s) quebrado(s) com base ${base}` : `todos os links locais ok com base ${base}`);
process.exit(broken ? 1 : 0);
