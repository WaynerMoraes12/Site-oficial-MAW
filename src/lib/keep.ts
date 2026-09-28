export interface Piece {
  text: string;
  keep: boolean;
}

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Separa o texto nos termos que o tradutor do navegador não deve mexer (nomes do app, do projeto demo).
// Só palavra inteira, e o termo mais longo ganha quando dois se sobrepõem.
export function splitKeep(text: string, terms: readonly string[]): Piece[] {
  if (!text) return [];
  const list = terms.filter(Boolean).sort((a, b) => b.length - a.length);
  if (!list.length) return [{ text, keep: false }];
  const re = new RegExp(`(?<![\\p{L}\\p{N}])(?:${list.map(escape).join('|')})(?![\\p{L}\\p{N}])`, 'gu');
  const out: Piece[] = [];
  let last = 0;
  for (const m of text.matchAll(re)) {
    const at = m.index ?? 0;
    if (at > last) out.push({ text: text.slice(last, at), keep: false });
    out.push({ text: m[0], keep: true });
    last = at + m[0].length;
  }
  if (last < text.length) out.push({ text: text.slice(last), keep: false });
  return out;
}
