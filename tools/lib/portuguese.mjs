// Palavras que só aparecem em português; se surgirem no site, alguma frase escapou da tradução.
export const PT_WORDS = [
  'você', 'voce', 'não', 'nao', 'para', 'música', 'musica', 'uma', 'também', 'tambem', 'está', 'esta',
  'trilha', 'trilhas', 'gravação', 'gravacao', 'mixagem', 'baixar', 'recursos', 'requisitos', 'história',
  'historia', 'perguntas', 'canais', 'seu', 'sua', 'com', 'sem', 'pelo', 'pela', 'então', 'entao', 'porque',
  'quando', 'ainda', 'aqui', 'grave', 'edite', 'mixe', 'entregue', 'leia', 'antes', 'instalar',
  'que', 'de', 'da', 'dos', 'das', 'ao', 'são', 'é', 'abrir', 'baixe', 'clique', 'veja', 'instale', 'instalador',
  'janela', 'projeto', 'faixas', 'sobre',
];

// Qualquer palavra com acento típico do português (depois de tirar os nomes permitidos) também é suspeita.
const ACCENTED = /(?<!\p{L})\p{L}*[áéíóúâêôãõçà]\p{L}*(?!\p{L})/giu;

// Siglas em inglês que coincidem com palavras da lista quando escritas em maiúsculas.
const ACRONYMS = new Set(['DOS', 'COM']);

// Elemento marcado com outra língua (ex.: o nome "Português" no seletor) não é texto em inglês esquecido.
const OTHER_LANG = /<(?!html\b)(\w+)\b[^>]*\slang="(?!en(?:-|"))[^"]*"[^>]*>[\s\S]*?<\/\1>/gi;

export function extractText(html) {
  const noCode = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(OTHER_LANG, ' ');
  const attrs = [...noCode.matchAll(/\s(?:alt|title|aria-label|content|placeholder)="([^"]*)"/gi)].map((m) => m[1]);
  const text = noCode.replace(/<[^>]+>/g, ' ');
  return [text, ...attrs].join('\n');
}

export function findPortuguese(html, allow = []) {
  let text = extractText(html)
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, ' ');
  for (const phrase of allow) text = text.split(phrase).join(' ');
  // hífen conta como parte da palavra: "de-esser" não é o "de" do português
  const re = new RegExp(`(?<![\\p{L}-])(${PT_WORDS.join('|')})(?![\\p{L}-])`, 'giu');
  const words = [...text.matchAll(re)].map((m) => m[1]).filter((w) => !ACRONYMS.has(w));
  const accented = [...text.matchAll(ACCENTED)].map((m) => m[0]);
  return [...new Set([...words, ...accented].map((w) => w.toLowerCase()))];
}
