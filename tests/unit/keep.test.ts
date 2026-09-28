import { describe, expect, it } from 'vitest';
import { splitKeep } from '../../src/lib/keep';

describe('splitKeep', () => {
  it('marks every protected term and keeps the text around it', () => {
    expect(splitKeep('Real screenshots · demo project “Noite Roxa”', ['Noite Roxa'])).toEqual([
      { text: 'Real screenshots · demo project “', keep: false },
      { text: 'Noite Roxa', keep: true },
      { text: '”', keep: false },
    ]);
  });
  it('only matches whole words, so "Pad" does not catch "Padrão"', () => {
    expect(splitKeep('Padrão, Pad', ['Pad'])).toEqual([
      { text: 'Padrão, ', keep: false },
      { text: 'Pad', keep: true },
    ]);
  });
  it('prefers the longest term when two overlap', () => {
    expect(splitKeep('MAW Demo', ['MAW', 'MAW Demo'])).toEqual([{ text: 'MAW Demo', keep: true }]);
  });
  it('treats terms as plain text, not as patterns', () => {
    expect(splitKeep('a.b axb', ['a.b'])).toEqual([
      { text: 'a.b', keep: true },
      { text: ' axb', keep: false },
    ]);
  });
  it('returns the whole text when there is nothing to protect', () => {
    expect(splitKeep('Built-in synth', [])).toEqual([{ text: 'Built-in synth', keep: false }]);
    expect(splitKeep('', ['x'])).toEqual([]);
  });
});
