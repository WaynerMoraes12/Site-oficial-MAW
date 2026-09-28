import { describe, expect, it } from 'vitest';
import { barcodeBars } from '../../src/lib/barcode';

describe('barcodeBars', () => {
  it('is deterministic for the same seed', () => {
    expect(barcodeBars(7, 186)).toEqual(barcodeBars(7, 186));
  });
  it('keeps every bar inside the width, without overlaps', () => {
    const bars = barcodeBars(7, 186);
    expect(bars.length).toBeGreaterThan(20);
    for (const b of bars) {
      expect(b.x).toBeGreaterThanOrEqual(0);
      expect(b.x + b.width).toBeLessThanOrEqual(186);
    }
    for (let i = 1; i < bars.length; i++) expect(bars[i].x).toBeGreaterThan(bars[i - 1].x + bars[i - 1].width - 1);
  });
});
