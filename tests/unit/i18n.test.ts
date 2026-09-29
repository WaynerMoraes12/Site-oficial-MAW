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

// Caminhos que podem ficar iguais ao inglês, por língua: nomes próprios, marcas, siglas, rótulos do app e datas
// com o mesmo mês. Chave língua:caminho, não texto: um "Download MAW" esquecido em outro lugar continua
// sendo pego, e o "Roadmap" que vale em português não libera o espanhol.
const SAME_AS_ENGLISH = new Set([
  'es:hero.ledeBefore', 'es:ticker.items[5]', 'es:ticker.items[6]', 'es:tracklist.sides[0].tracks[5].title',
  'es:ai.cards.smart-mix.title', 'es:ai.cards.whisper.hud', 'es:rider.rev', 'es:rider.headers[0]',
  'es:rider.rows[3].item', 'es:rider.rows[7].item', 'es:download.steps[0].bold', 'es:download.steps[3].bold',
  'es:tour.title', 'es:liner.timeline[0].when', 'es:liner.timeline[4].when', 'es:liner.timeline[5].when',
  'es:liner.credits[0].name', 'es:liner.credits[2].name', 'es:liner.credits[2].note', 'es:liner.credits[3].name',
  'es:liner.credits[3].note', 'es:liner.credits[4].name', 'es:liner.credits[4].note', 'es:liner.credits[5].name',
  'es:liner.credits[5].note', 'es:liner.credits[6].name', 'es:liner.credits[6].note', 'es:liner.credits[7].name',
  'es:liner.credits[8].name', 'es:ai.cards.keys.keyLabels[1]', 'es:ai.cards.keys.keyLabels[2]',
  'es:rider.rows[1].item', 'es:liner.timeline[3].when', 'es:liner.timeline[7].when',
  'pt:nav.tour', 'pt:nav.menu', 'pt:hero.ledeBefore', 'pt:ticker.items[5]', 'pt:ticker.items[6]',
  'pt:stage.shots.mixer.label', 'pt:stage.shots.piano-roll.label', 'pt:tracklist.sides[0].tracks[5].title',
  'pt:ai.cards.smart-mix.title', 'pt:ai.cards.whisper.hud', 'pt:rider.rev', 'pt:rider.headers[0]',
  'pt:rider.headers[1]', 'pt:rider.rows[3].item', 'pt:rider.rows[7].item', 'pt:download.steps[0].bold',
  'pt:download.steps[3].bold', 'pt:tour.eyebrow', 'pt:tour.title', 'pt:liner.timeline[0].when',
  'pt:liner.timeline[4].when', 'pt:liner.timeline[5].when', 'pt:liner.credits[0].name', 'pt:liner.credits[2].name',
  'pt:liner.credits[2].note', 'pt:liner.credits[3].name', 'pt:liner.credits[3].note', 'pt:liner.credits[4].name',
  'pt:liner.credits[4].note', 'pt:liner.credits[5].name', 'pt:liner.credits[5].note', 'pt:liner.credits[6].name',
  'pt:liner.credits[6].note', 'pt:liner.credits[7].name', 'pt:liner.credits[8].name',
  // abreviações de mês iguais ao inglês
  'pt:tour.months[0]', 'pt:tour.months[2]', 'pt:tour.months[5]', 'pt:tour.months[6]', 'pt:tour.months[10]',
  'es:tour.months[1]', 'es:tour.months[2]', 'es:tour.months[4]', 'es:tour.months[5]', 'es:tour.months[6]', 'es:tour.months[8]', 'es:tour.months[9]', 'es:tour.months[10]',
]);

const untranslated = (locale: 'pt' | 'es', dict: unknown): string[] => {
  const en = new Map(leaves(dictionaries.en));
  return leaves(dict)
    .filter(([path, text]) => /\p{L}/u.test(text) && en.get(path) === text && !SAME_AS_ENGLISH.has(`${locale}:${path}`))
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
      expect(untranslated(locale, dictionaries[locale])).toEqual([]);
    });
  }
  it('allows only entries that really stay the same', () => {
    const same = new Set([
      ...untranslatedPaths(dictionaries.pt).map((path) => `pt:${path}`),
      ...untranslatedPaths(dictionaries.es).map((path) => `es:${path}`),
    ]);
    expect([...SAME_AS_ENGLISH].filter((key) => !same.has(key))).toEqual([]);
  });
  it('catches English left behind even when the same words are fine elsewhere', () => {
    const pt = structuredClone(dictionaries.pt);
    pt.hero.ctaDownload = dictionaries.en.hero.ctaDownload;
    pt.nav.story = dictionaries.en.nav.story;
    expect(untranslated('pt', pt)).toEqual(['nav.story: Story', 'hero.ctaDownload: Download MAW']);
  });
  it('allows a term per language: Portuguese says "Roadmap", Spanish must not', () => {
    const es = structuredClone(dictionaries.es);
    es.nav.tour = dictionaries.en.nav.tour;
    expect(untranslated('es', es)).toEqual(['nav.tour: Roadmap']);
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
    for (const spainOnly of ['ordenador', 'Ingeniería Informática', 'fin de carrera', 'de pago', 'habitación', 'se pelean', 'pulsas']) {
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
    expect(pt).not.toContain('instalador instala');
  });
});
