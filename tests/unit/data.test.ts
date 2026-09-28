import { describe, expect, it } from 'vitest';
import { channels } from '../../src/data/channels';
import { visibleChannels } from '../../src/lib/channels';
import { sides } from '../../src/data/tracklist';
import { roadmap } from '../../src/data/roadmap';
import { faq } from '../../src/data/faq';
import { riderRows } from '../../src/data/rider';

describe('site data', () => {
  it('shows only the e-mail channel at launch', () => {
    expect(visibleChannels(channels).map((c) => c.id)).toEqual(['email']);
  });
  it('has 16 numbered tracks, 8 per side', () => {
    expect(sides.map((s) => s.tracks.length)).toEqual([8, 8]);
    expect(sides.flatMap((s) => s.tracks).map((t) => t.n)).toEqual(
      Array.from({ length: 16 }, (_, i) => String(i + 1).padStart(2, '0')),
    );
  });
  it('has exactly one live stop on the tour', () => {
    expect(roadmap.filter((r) => r.status === 'live')).toHaveLength(1);
  });
  it('has 8 FAQ entries and 8 rider rows', () => {
    expect(faq).toHaveLength(8);
    expect(riderRows).toHaveLength(8);
  });
});
