import { describe, expect, it } from 'vitest';
import { buildPrompt, parseTexts } from '../../tools/lib/tour-texts.mjs';

describe('parseTexts', () => {
  it('reads the JSON even with text around it', () => {
    const out = 'Aqui:\n{"en":"Sends, buses & groups","pt":"Envios, barramentos e grupos","es":"Envíos, buses y grupos"}\nPronto';
    expect(parseTexts(out)).toEqual({ en: 'Sends, buses & groups', pt: 'Envios, barramentos e grupos', es: 'Envíos, buses y grupos' });
  });
  it('reads JSON inside a markdown code block', () => {
    expect(parseTexts('```json\n{"en":"A","pt":"B","es":"C"}\n```')).toEqual({ en: 'A', pt: 'B', es: 'C' });
  });
  it('refuses a missing language, an empty text or a text too long for a tour stop', () => {
    expect(() => parseTexts('{"en":"a","pt":"b"}')).toThrow(/es/);
    expect(() => parseTexts('{"en":" ","pt":"b","es":"c"}')).toThrow(/en/);
    expect(() => parseTexts(`{"en":"${'x'.repeat(61)}","pt":"b","es":"c"}`)).toThrow(/longo/);
    expect(() => parseTexts('sem json')).toThrow(/JSON/);
  });
});

describe('buildPrompt', () => {
  it('asks for the three languages in the tour tone, from the PR title and description', () => {
    const p = buildPrompt({ kind: 'pr', number: 60, title: 'feat(mixagem): envios auxiliares, barramentos e grupos', body: 'Barramento com cadeia de efeitos própria.' });
    expect(p).toMatch(/"en"/);
    expect(p).toMatch(/Latin American Spanish/);
    expect(p).toMatch(/Brazilian Portuguese/);
    expect(p).toContain('envios auxiliares, barramentos e grupos');
    expect(p).toContain('Barramento com cadeia');
  });
  it('keeps long descriptions short', () => {
    const p = buildPrompt({ kind: 'pr', number: 1, title: 't', body: 'y'.repeat(5000) });
    expect(p.length).toBeLessThan(3500);
  });
  it('names a version stop after the version', () => {
    expect(buildPrompt({ kind: 'version', version: '1.1.0' })).toContain('Version 1.1');
  });
});
