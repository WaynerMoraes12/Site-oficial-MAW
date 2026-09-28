import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { findPortuguese } from './lib/portuguese.mjs';

// Exceções do spec: nomes de botões do app, projeto demo e nomes próprios.
const ALLOW = ['Noite Roxa', 'Centro Universitário Hermínio Ometto', 'Hermínio Ometto', 'EFEITO', 'ASSISTENTE IA', 'Wayner Pires de Moraes', 'Araras'];

const walk = (dir) => readdirSync(dir).flatMap((n) => {
  const p = join(dir, n);
  return statSync(p).isDirectory() ? walk(p) : p.endsWith('.html') ? [p] : [];
});

let problems = 0;
for (const file of walk(process.argv[2] ?? 'dist')) {
  const hits = findPortuguese(readFileSync(file, 'utf8'), ALLOW);
  if (hits.length) {
    problems++;
    console.error(`${file}: ${hits.join(', ')}`);
  }
}
console.log(problems ? `português encontrado em ${problems} arquivo(s)` : 'nenhum português no site');
process.exit(problems ? 1 : 0);
