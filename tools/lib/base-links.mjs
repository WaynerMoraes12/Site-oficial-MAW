// Todo recurso local precisa começar pelo base (GitHub Pages usa /Site-oficial-MAW) e existir no dist.
export function localRefs(html) {
  const refs = [];
  for (const m of html.matchAll(/\s(?:src|href)="([^"]+)"/g)) refs.push(m[1]);
  for (const m of html.matchAll(/\ssrcset="([^"]+)"/g)) {
    for (const part of m[1].split(',')) refs.push(part.trim().split(/\s+/)[0]);
  }
  return refs.filter((r) => r.startsWith('/') && !r.startsWith('//'));
}

export function brokenRefs(html, base, exists) {
  const b = base.endsWith('/') ? base : `${base}/`;
  return localRefs(html).filter((ref) => {
    const clean = ref.split('#')[0].split('?')[0];
    if (clean === b || clean === b.slice(0, -1)) return !exists('index.html');
    if (!clean.startsWith(b)) return true;
    const rel = clean.slice(b.length);
    return !exists(decodeURIComponent(rel.endsWith('/') ? `${rel}index.html` : rel));
  });
}
