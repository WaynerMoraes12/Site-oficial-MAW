import { describe, expect, it } from 'vitest';
import { findPortuguese } from '../../tools/lib/portuguese.mjs';

describe('findPortuguese', () => {
  it('finds Portuguese words in visible text', () => {
    expect(findPortuguese('<p>A música que você grava</p>')).toEqual(expect.arrayContaining(['música', 'você', 'que']));
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
  it('catches realistic leaks the reviewer found', () => {
    const leaks = [
      '<img alt="Janela de exportação do projeto">',
      '<figcaption>SEPARAÇÃO DE FAIXAS</figcaption>',
      '<p>Configuração do áudio</p>',
      '<button>Abrir menu</button>',
      '<a>Baixe o instalador</a>',
      '<h3>O que é a MAW?</h3>',
    ];
    for (const html of leaks) expect(findPortuguese(html), html).not.toEqual([]);
  });
  it('does not flag accented proper nouns that are allowed', () => {
    expect(findPortuguese('<p>Centro Universitário Hermínio Ometto (FHO)</p>', ['Centro Universitário Hermínio Ometto'])).toEqual([]);
  });
  it('does not mistake audio jargon and acronyms for Portuguese', () => {
    expect(findPortuguese('<p>Put a de-esser on the vocal. Runs on Windows, not DOS.</p>')).toEqual([]);
  });
  it('skips text marked as another language, such as native language names', () => {
    expect(findPortuguese('<a lang="pt-BR" href="/pt/">Português</a> <span lang="es">Descarga para Windows</span>')).toEqual([]);
  });
  it('still reads text marked as English', () => {
    expect(findPortuguese('<p lang="en-US">Baixe o instalador</p>')).not.toEqual([]);
  });
  it('still catches long Portuguese words in capitals', () => {
    expect(findPortuguese('<b>BAIXAR AGORA</b>')).toContain('baixar');
  });
  it('accepts plain English', () => {
    expect(findPortuguese('<h1>The DAW that understands the music it records</h1>')).toEqual([]);
  });
});
