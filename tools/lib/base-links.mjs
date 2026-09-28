// Todo recurso local precisa começar pelo base (GitHub Pages usa /Site-oficial-MAW) e existir no dist.
// Olha src/href/srcset, url() do CSS embutido (fontes, fundos) e links relativos à página.
export function localRefs(html) {
  const refs = [];
  for (const m of html.matchAll(/\s(?:src|href)="([^"]+)"/g)) refs.push(m[1]);
  for (const m of html.matchAll(/\ssrcset="([^"]+)"/g)) {
    for (const part of m[1].split(',')) refs.push(part.trim().split(/\s+/)[0]);
  }
  for (const m of html.matchAll(/url\(\s*(?:&quot;|["'])?([^"')\s]+?)(?:&quot;|["'])?\s*\)/g)) refs.push(m[1]);
  // fora: outros esquemas (https:, mailto:, data:...), protocolo relativo e âncoras da própria página
  return refs.filter((r) => r && !/^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(r));
}

// pageDir: pasta da página dentro do dist ('' para a raiz, 'pt/' para pt/index.html), para resolver links relativos.
export function brokenRefs(html, base, exists, pageDir = '') {
  const b = base.endsWith('/') ? base : `${base}/`;
  return localRefs(html).filter((ref) => {
    const abs = ref.startsWith('/') ? ref : new URL(ref, `http://site${b}${pageDir}`).pathname;
    const clean = abs.split('#')[0].split('?')[0];
    if (clean === b || clean === b.slice(0, -1)) return !exists('index.html');
    if (!clean.startsWith(b)) return true;
    const rel = clean.slice(b.length);
    return !exists(decodeURIComponent(rel.endsWith('/') ? `${rel}index.html` : rel));
  });
}
