import { describe, expect, it } from 'vitest';
import { dictionaries, localeUrl, locales, pickLocale } from '../../src/i18n';
import type { Locale } from '../../src/i18n/types';
import { synthPresets } from '../../src/data/tracklist';

describe('pickLocale', () => {
  it('opens Brazilian and Portuguese browsers in Portuguese', () => {
    expect(pickLocale(['pt-BR'])).toBe('pt');
    expect(pickLocale(['pt-PT', 'en'])).toBe('pt');
  });
  it('opens Spanish-speaking browsers in Spanish', () => {
    expect(pickLocale(['es-AR'])).toBe('es');
    expect(pickLocale(['ES'])).toBe('es');
  });
  it('follows the first supported language in the preference order', () => {
    expect(pickLocale(['de-DE', 'es-MX', 'pt-BR'])).toBe('es');
    expect(pickLocale(['en-US', 'pt-BR'])).toBe('en');
  });
  it('falls back to English for unsupported or empty lists', () => {
    expect(pickLocale(['de-DE', 'ja'])).toBe('en');
    expect(pickLocale([])).toBe('en');
    expect(pickLocale([''])).toBe('en');
  });
  it('is self-contained so it can be inlined in the page head', () => {
    const inlined = new Function(`return (${pickLocale.toString()})`)() as typeof pickLocale;
    expect(inlined(['pt-BR'])).toBe('pt');
  });
});

describe('localeUrl', () => {
  it('keeps English at the root and prefixes the others', () => {
    expect(localeUrl('en', '/')).toBe('/');
    expect(localeUrl('pt', '/')).toBe('/pt/');
    expect(localeUrl('es', '/Site-oficial-MAW')).toBe('/Site-oficial-MAW/es/');
  });
});

type Shape = string | Shape[] | { [k: string]: Shape };
const shape = (v: unknown): Shape => {
  if (Array.isArray(v)) return v.map(shape);
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, shape(x)]));
  return typeof v;
};
const leaves = (v: unknown, path = ''): [string, string][] => {
  if (typeof v === 'string') return [[path, v]];
  if (Array.isArray(v)) return v.flatMap((x, i) => leaves(x, `${path}[${i}]`));
  if (v && typeof v === 'object') return Object.entries(v).flatMap(([k, x]) => leaves(x, path ? `${path}.${k}` : k));
  return [];
};

// Caminhos que podem ficar iguais ao inglês: nomes próprios, marcas, siglas, rótulos do app e datas com o mesmo mês.
// Chave por caminho, não por texto: um "Download for Windows" esquecido em outro lugar continua sendo pego.
const SAME_AS_ENGLISH = new Set([
  'nav.tour', 'nav.menu', 'hero.ledeBefore', 'ticker.items[5]', 'ticker.items[6]', 'stage.shots.mixer.label',
  'stage.shots.piano-roll.label', 'tracklist.sides[0].tracks[5].title', 'ai.cards.smart-mix.title',
  'ai.cards.whisper.hud', 'rider.rev', 'rider.headers[0]', 'rider.headers[1]', 'rider.rows[3].item',
  'rider.rows[7].item', 'download.steps[0].bold', 'download.steps[3].bold', 'tour.eyebrow', 'tour.title',
  'liner.timeline[0].when', 'liner.timeline[4].when', 'liner.timeline[5].when', 'liner.credits[0].name',
  'liner.credits[2].name', 'liner.credits[2].note', 'liner.credits[3].name', 'liner.credits[3].note',
  'liner.credits[4].name', 'liner.credits[4].note', 'liner.credits[5].name', 'liner.credits[5].note',
  'liner.credits[6].name', 'liner.credits[6].note', 'liner.credits[7].name', 'liner.credits[8].name',
  'ai.cards.keys.keyLabels[1]', 'ai.cards.keys.keyLabels[2]', 'rider.rows[1].item', 'tour.stops[0].when',
  'liner.timeline[3].when', 'liner.timeline[7].when',
]);

const untranslated = (dict: unknown): string[] => {
  const en = new Map(leaves(dictionaries.en));
  return leaves(dict)
    .filter(([path, text]) => /\p{L}/u.test(text) && en.get(path) === text && !SAME_AS_ENGLISH.has(path))
    .map(([path, text]) => `${path}: ${text}`);
};

const untranslatedPaths = (dict: unknown): string[] => {
  const en = new Map(leaves(dictionaries.en));
  return leaves(dict).filter(([path, text]) => /\p{L}/u.test(text) && en.get(path) === text).map(([path]) => path);
};

describe('dictionaries', () => {
  it('exist for every locale', () => {
    expect(Object.keys(dictionaries).sort()).toEqual([...locales].sort());
  });
  for (const locale of ['pt', 'es'] as const) {
    it(`${locale} has exactly the same shape as English`, () => {
      expect(shape(dictionaries[locale])).toEqual(shape(dictionaries.en));
    });
    it(`${locale} leaves no English sentence untranslated`, () => {
      expect(untranslated(dictionaries[locale])).toEqual([]);
    });
  }
  it('allows only paths that really stay the same in some language', () => {
    const same = new Set(untranslatedPaths(dictionaries.pt).concat(untranslatedPaths(dictionaries.es)));
    expect([...SAME_AS_ENGLISH].filter((path) => !same.has(path))).toEqual([]);
  });
  it('catches English left behind even when the same words are fine elsewhere', () => {
    const pt = structuredClone(dictionaries.pt);
    pt.hero.ctaDownload = dictionaries.en.hero.ctaDownload;
    pt.nav.story = dictionaries.en.nav.story;
    expect(untranslated(pt)).toEqual(['nav.story: Story', 'hero.ctaDownload: Download for Windows']);
  });
  it('declares the page language for each locale', () => {
    expect(dictionaries.en.meta.htmlLang).toBe('en');
    expect(dictionaries.pt.meta.htmlLang).toBe('pt-BR');
    expect(dictionaries.es.meta.htmlLang).toBe('es');
  });
});

describe('copy details', () => {
  const synthDetail = (l: Locale) =>
    dictionaries[l].tracklist.sides.flatMap((s) => s.tracks).find((t) => t.detail.includes('7 presets'))?.detail ?? '';
  it('names the synth presets exactly as the app does, in every language', () => {
    for (const l of locales) {
      for (const name of synthPresets) expect(synthDetail(l)).toContain(name);
    }
  });
  it('writes neutral Latin American Spanish', () => {
    const es = JSON.stringify(dictionaries.es);
    for (const spainOnly of ['ordenador', 'Ingeniería Informática', 'fin de carrera', 'de pago', 'habitación', 'se pelean']) {
      expect(es).not.toContain(spainOnly);
    }
    expect(dictionaries.es.meta.ogLocale).toBe('es_LA');
  });
  it('does not promise an interface in English or Spanish', () => {
    const answer = (l: Locale) => dictionaries[l].faq.items.find((i) => /interface|interfaz/i.test(i.q))?.a ?? '';
    expect(answer('en')).not.toMatch(/^Not yet/);
    expect(answer('es')).not.toMatch(/^Todavía no/);
  });
  it('keeps Portuguese commands in the você form', () => {
    const pt = JSON.stringify(dictionaries.pt);
    expect(pt).not.toContain('ou deixa a MAW');
    expect(pt).not.toContain('coloca sozinho');
  });
});
