import { describe, expect, it } from 'vitest';
import { brokenRefs, localRefs } from '../../tools/lib/base-links.mjs';

const exists = (files: string[]) => (rel: string) => files.includes(rel);

describe('localRefs', () => {
  it('collects src, href and every srcset candidate, skipping external and protocol-relative', () => {
    const html = '<img src="/a.png" srcset="/a-1.avif 640w, /a-2.avif 960w"><a href="https://x.com"></a><a href="//cdn.x/y"></a><a href="#faq"></a>';
    expect(localRefs(html)).toEqual(['/a.png', '/a-1.avif', '/a-2.avif']);
  });
});

describe('brokenRefs', () => {
  it('accepts refs under the root base that exist', () => {
    expect(brokenRefs('<img src="/_astro/a.png">', '/', exists(['_astro/a.png']))).toEqual([]);
  });
  it('flags refs that ignore a sub-path base', () => {
    expect(brokenRefs('<img src="/_astro/a.png">', '/Site-oficial-MAW', exists(['_astro/a.png']))).toEqual(['/_astro/a.png']);
  });
  it('flags missing files under the base', () => {
    expect(brokenRefs('<a href="/Site-oficial-MAW/press/x.zip">', '/Site-oficial-MAW/', exists([]))).toEqual(['/Site-oficial-MAW/press/x.zip']);
  });
  it('maps the base itself to index.html', () => {
    expect(brokenRefs('<a href="/Site-oficial-MAW/">', '/Site-oficial-MAW', exists(['index.html']))).toEqual([]);
  });
});
