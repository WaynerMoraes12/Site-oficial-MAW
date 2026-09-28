// Palavras que só aparecem em português; se surgirem no site, alguma frase escapou da tradução.
export const PT_WORDS = [
  'você', 'voce', 'não', 'nao', 'para', 'música', 'musica', 'uma', 'também', 'tambem', 'está', 'esta',
  'trilha', 'trilhas', 'gravação', 'gravacao', 'mixagem', 'baixar', 'recursos', 'requisitos', 'história',
  'historia', 'perguntas', 'canais', 'seu', 'sua', 'com', 'sem', 'pelo', 'pela', 'então', 'entao', 'porque',
  'quando', 'ainda', 'aqui', 'grave', 'edite', 'mixe', 'entregue', 'leia', 'antes', 'instalar',
];

export function extractText(html) {
  const noCode = html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ');
  const attrs = [...noCode.matchAll(/\s(?:alt|title|aria-label|content|placeholder)="([^"]*)"/gi)].map((m) => m[1]);
  const text = noCode.replace(/<[^>]+>/g, ' ');
  return [text, ...attrs].join('\n');
}

export function findPortuguese(html, allow = []) {
  let text = extractText(html)
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, ' ');
  for (const phrase of allow) text = text.split(phrase).join(' ');
  const re = new RegExp(`(?<!\\p{L})(${PT_WORDS.join('|')})(?!\\p{L})`, 'giu');
  return [...new Set([...text.matchAll(re)].map((m) => m[1].toLowerCase()))];
}
