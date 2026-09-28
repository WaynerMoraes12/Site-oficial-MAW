import { describe, expect, it } from 'vitest';
import { readBeforeInstallPlates } from '../../src/lib/notices';

describe('readBeforeInstallPlates', () => {
  it('always has six plates and starts with the SmartScreen warning', () => {
    for (const flag of [true, false]) {
      const plates = readBeforeInstallPlates(flag);
      expect(plates).toHaveLength(6);
      expect(plates[0]).toMatchObject({ title: 'SmartScreen will warn you', hot: true });
    }
  });
  it('says the AI server is not bundled while the flag is off', () => {
    const titles = readBeforeInstallPlates(false).map((p) => p.title);
    expect(titles).toContain('AI server not bundled yet');
    expect(titles).not.toContain('AI needs a first-run download');
  });
  it('switches to first-run download text when the server ships', () => {
    const titles = readBeforeInstallPlates(true).map((p) => p.title);
    expect(titles).toContain('AI needs a first-run download');
    expect(titles).not.toContain('AI server not bundled yet');
  });
  it('always warns that the app interface is in Brazilian Portuguese', () => {
    expect(readBeforeInstallPlates(false).map((p) => p.title)).toContain('Interface in Brazilian Portuguese');
  });
});
