import { describe, expect, it } from 'vitest';
import { channels } from '../../src/data/channels';
import { visibleChannels } from '../../src/lib/channels';
import { trackKeys } from '../../src/data/tracklist';
import { tourStatuses } from '../../src/data/roadmap';
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
  it('has exactly one live stop on the tour and a text for every stop', () => {
    expect(tourStatuses.filter((s) => s === 'live')).toHaveLength(1);
    for (const locale of locales) expect(dictionaries[locale].tour.stops).toHaveLength(tourStatuses.length);
  });
  it('has 8 FAQ entries and 8 rider rows in every language', () => {
    for (const locale of locales) {
      expect(dictionaries[locale].faq.items).toHaveLength(8);
      expect(dictionaries[locale].rider.rows).toHaveLength(8);
    }
  });
});
