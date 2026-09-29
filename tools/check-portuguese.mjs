import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { findPortuguese } from './lib/portuguese.mjs';

// Exceções do spec: nomes de botões do app, projeto demo e nomes próprios.
const ALLOW = ['Noite Roxa', 'Centro Universitário Hermínio Ometto', 'Hermínio Ometto', 'EFEITO', 'ASSISTENTE IA', 'Configurar placa de audio', 'Wayner Pires de Moraes', 'Araras'];

// /pt/ e /es/ são as traduções (adendo §10 do spec): só as páginas em inglês são verificadas.
const TRANSLATIONS = new Set(['pt', 'es']);
const root = process.argv[2] ?? 'dist';
const walk = (dir) => readdirSync(dir).flatMap((n) => {
  const p = join(dir, n);
  if (dir === root && TRANSLATIONS.has(n)) return [];
  return statSync(p).isDirectory() ? walk(p) : p.endsWith('.html') ? [p] : [];
});

let problems = 0;
for (const file of walk(root)) {
  const hits = findPortuguese(readFileSync(file, 'utf8'), ALLOW);
  if (hits.length) {
    problems++;
    console.error(`${file}: ${hits.join(', ')}`);
  }
}
console.log(problems ? `português encontrado em ${problems} arquivo(s)` : 'nenhum português no site');
process.exit(problems ? 1 : 0);
