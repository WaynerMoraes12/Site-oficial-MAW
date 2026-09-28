import { describe, expect, it } from 'vitest';
import { findPortuguese } from '../../tools/lib/portuguese.mjs';

describe('findPortuguese', () => {
  it('finds Portuguese words in visible text', () => {
    expect(findPortuguese('<p>A música que você grava</p>')).toEqual(['música', 'você']);
  });
  it('finds Portuguese hidden in attributes', () => {
    expect(findPortuguese('<img alt="Tela do mixer mostrando trilhas">')).toEqual(['trilhas']);
  });
  it('ignores scripts, styles, URLs and e-mails', () => {
    const html = '<script>const para = 1</script><style>.nao{}</style><a href="https://x.com/para">Mail</a> me@site.com';
    expect(findPortuguese(html)).toEqual([]);
  });
  it('ignores allowed phrases such as the demo project name', () => {
    expect(findPortuguese('<p>demo project “Noite Roxa”</p>', ['Noite Roxa'])).toEqual([]);
  });
  it('accepts plain English', () => {
    expect(findPortuguese('<h1>The DAW that understands the music it records</h1>')).toEqual([]);
  });
});
