import { describe, expect, it } from 'vitest';
import { channels } from '../../src/data/channels';
import { visibleChannels } from '../../src/lib/channels';
import { trackKeys } from '../../src/data/tracklist';
import { existsSync, readFileSync } from 'node:fs';
import tour from '../../src/data/tour.json';
import { snapshotProblems } from '../../tools/lib/tour.mjs';
import { dictionaries, locales } from '../../src/i18n';

describe('site data', () => {
  it('shows only the e-mail channel at launch, labelled in each language', () => {
    for (const locale of locales) {
      const shown = visibleChannels(channels(dictionaries[locale]));
      expect(shown.map((c) => c.id)).toEqual(['email']);
      expect(shown[0].label).toBe(dictionaries[locale].contact.email);
    }
  });
  it('has 16 tracks, 8 per side, with a key for every track in every language', () => {
    expect(trackKeys.map((side) => side.length)).toEqual([8, 8]);
    for (const locale of locales) {
      expect(dictionaries[locale].tracklist.sides.map((s) => s.tracks.length)).toEqual([8, 8]);
    }
  });
  it('has a complete world tour snapshot, made for the current installer', () => {
    const release = existsSync('src/data/release.json') ? JSON.parse(readFileSync('src/data/release.json', 'utf8')) : null;
    expect(snapshotProblems(tour, release)).toEqual([]);
    expect(tour.stops.filter((s) => s.status === 'live').length).toBeGreaterThan(0);
    for (const s of tour.stops) expect(s.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
  it('names the twelve months for the tour dates in every language', () => {
    for (const locale of locales) expect(dictionaries[locale].tour.months).toHaveLength(12);
  });
  it('has 8 FAQ entries and 8 rider rows in every language', () => {
    for (const locale of locales) {
      expect(dictionaries[locale].faq.items).toHaveLength(8);
      expect(dictionaries[locale].rider.rows).toHaveLength(8);
    }
  });
});
