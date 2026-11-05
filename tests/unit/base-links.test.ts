import { describe, expect, it } from 'vitest';
import { brokenRefs, localRefs } from '../../tools/lib/base-links.mjs';

const exists = (files: string[]) => (rel: string) => files.includes(rel);

describe('localRefs', () => {
  it('collects src, href and every srcset candidate, skipping external and protocol-relative', () => {
    const html = '<img src="/a.png" srcset="/a-1.avif 640w, /a-2.avif 960w"><a href="https://x.com"></a><a href="//cdn.x/y"></a><a href="#faq"></a>';
    expect(localRefs(html)).toEqual(['/a.png', '/a-1.avif', '/a-2.avif']);
  });
});

describe('localRefs in CSS and relative links', () => {
  it('collects url() from inlined CSS and style attributes, skipping data: URIs', () => {
    const html = '<style>@font-face{src:url(/_astro/a.woff2) format("woff2")}.x{background:url("/b.png")}.y{mask:url(data:image/svg+xml;utf8,z)}</style><div style="background:url(&quot;/c.png&quot;)"></div>' + "<i style=\"mask:url('/d.png')\"></i>";
    expect(localRefs(html)).toEqual(['/_astro/a.woff2', '/b.png', '/c.png', '/d.png']);
  });
  it('collects relative links and skips other schemes', () => {
    const html = '<a href="pt/"></a><img src="_astro/x.png"><a href="mailto:a@b.c"></a><a href="tel:1"></a>';
    expect(localRefs(html)).toEqual(['pt/', '_astro/x.png']);
  });
});

describe('brokenRefs', () => {
  it('flags a font in the inlined CSS that ignores a sub-path base', () => {
    expect(brokenRefs('<style>@font-face{src:url(/_astro/a.woff2)}</style>', '/Site-oficial-MAW/', exists(['_astro/a.woff2']))).toEqual(['/_astro/a.woff2']);
  });
  it('resolves relative links from the page folder', () => {
    const files = exists(['_astro/x.png', 'pt/index.html']);
    expect(brokenRefs('<img src="../_astro/x.png"><a href="../pt/">', '/Site-oficial-MAW/', files, 'es/')).toEqual([]);
    expect(brokenRefs('<img src="_astro/x.png">', '/Site-oficial-MAW/', files, 'es/')).toEqual(['_astro/x.png']);
  });
  it('accepts refs under the root base that exist', () => {
    expect(brokenRefs('<img src="/_astro/a.png">', '/', exists(['_astro/a.png']))).toEqual([]);
  });
  it('flags refs that ignore a sub-path base', () => {
    expect(brokenRefs('<img src="/_astro/a.png">', '/Site-oficial-MAW', exists(['_astro/a.png']))).toEqual(['/_astro/a.png']);
  });
  it('flags missing files under the base', () => {
    expect(brokenRefs('<a href="/Site-oficial-MAW/press/x.zip">', '/Site-oficial-MAW/', exists([]))).toEqual(['/Site-oficial-MAW/press/x.zip']);
  });
  it('ignores the url() references inside an embedded data: image (they point inside the image, not to the site)', () => {
    const cloth = 'data:image/svg+xml,%3Csvg%3E%3Cg%20clip-path%3D%22url(%23t)%22%3E%3Crect%20fill%3D%22url(%23b)%22%2F%3E%3C%2Fg%3E%3C%2Fsvg%3E';
    const html = `<div style="--cloth:url(&quot;${cloth}&quot;)"></div><img src="/_astro/gone.png">`;
    expect(brokenRefs(html, '/Site-oficial-MAW/', exists([]))).toEqual(['/_astro/gone.png']);
  });
  it('maps the base itself to index.html', () => {
    expect(brokenRefs('<a href="/Site-oficial-MAW/">', '/Site-oficial-MAW', exists(['index.html']))).toEqual([]);
  });
});
