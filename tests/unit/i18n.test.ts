import { describe, expect, it } from 'vitest';
import { dictionaries, localeUrl, locales, pickLocale } from '../../src/i18n';

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

// Termos que não se traduzem: nomes próprios, marcas, siglas e rótulos idênticos nas três línguas.
const UNIVERSAL = new Set([
  'MAW', 'FAQ', 'AI', 'Smart Mix', 'MIDI', 'Roadmap', 'Download', 'Tracklist', 'Menu', 'Spleeter', 'Flask', 'JUCE 8',
  'GNU GPL v3', 'Wayner Pires de Moraes', 'ASIO SDK · VST3 SDK', 'Google Gemini API', 'faster-whisper · Whisper large-v3',
  'Deezer · MIT', 'SYSTRAN · OpenAI · MIT', 'Pallets · BSD-3', 'Steinberg Media Technologies', 'Raw Material Software · AGPLv3',
  '// SMART MIX · EQ CLASHES', '// WHISPER · PT · EN', 'MAW World Tour', '2026 — 2027', 'ALL ACCESS', 'Windows 10/11 · x64',
  'VST3 + ASIO', 'WAV · FLAC · OGG · MP3', 'CH', 'MIDI', '1329 × 620', '—', 'Piano Roll', 'Mixer', 'MIDI + Audio', 'Tech rider',
  'Delay', 'Reverb', 'Pluck', 'Pad', 'Lead', 'MIXER', 'KEYBOARD', 'Sep 2026', '04 APR', '14 APR', '16 JUL', 'JUL', 'AUG', 'SEP',
  'Intelligence', 'Backstage', 'Story', 'Download for Windows', 'en', 'es',
  // iguais em pt/es: placeholder, rótulo do app, empréstimos e datas com o mesmo mês
  'MAW — ', '{file}', 'MENU → ASIO Audio Setup', 'Piano roll', 'Internet', 'Audio', 'tempo', 'audio → MIDI',
  'ITEM', 'REV. 09/2026', '31 MAR 2026', '03 MAY',
]);

describe('dictionaries', () => {
  it('exist for every locale', () => {
    expect(Object.keys(dictionaries).sort()).toEqual([...locales].sort());
  });
  for (const locale of ['pt', 'es'] as const) {
    it(`${locale} has exactly the same shape as English`, () => {
      expect(shape(dictionaries[locale])).toEqual(shape(dictionaries.en));
    });
    it(`${locale} leaves no English sentence untranslated`, () => {
      const en = new Map(leaves(dictionaries.en));
      const same = leaves(dictionaries[locale])
        .filter(([path, text]) => /\p{L}/u.test(text) && en.get(path) === text && !UNIVERSAL.has(text))
        .map(([path, text]) => `${path}: ${text}`);
      expect(same).toEqual([]);
    });
  }
  it('declares the page language for each locale', () => {
    expect(dictionaries.en.meta.htmlLang).toBe('en');
    expect(dictionaries.pt.meta.htmlLang).toBe('pt-BR');
    expect(dictionaries.es.meta.htmlLang).toBe('es');
  });
});
