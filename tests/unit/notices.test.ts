import { describe, expect, it } from 'vitest';
import { readBeforeInstallPlates } from '../../src/lib/notices';
import { dictionaries } from '../../src/i18n';

const rb = dictionaries.en.readBefore;

describe('readBeforeInstallPlates', () => {
  it('always has six plates and starts with the unsigned-app warning, for Windows and for the Mac', () => {
    for (const flag of [true, false]) {
      const plates = readBeforeInstallPlates(flag, rb);
      expect(plates).toHaveLength(6);
      expect(plates[0]).toMatchObject({ title: 'Your system will warn you', hot: true });
      expect(plates[0].body).toContain('Run anyway');
      expect(plates[0].body).toContain('Open Anyway');
    }
  });
  it('names the three systems right after the warning', () => {
    expect(readBeforeInstallPlates(true, rb)[1].title).toBe('Windows, macOS and Linux');
    expect(readBeforeInstallPlates(true, dictionaries.pt.readBefore)[1].title).toBe('Windows, macOS e Linux');
    expect(readBeforeInstallPlates(true, dictionaries.es.readBefore)[1].title).toBe('Windows, macOS y Linux');
  });
  it('says the AI server is not bundled while the flag is off', () => {
    const titles = readBeforeInstallPlates(false, rb).map((p) => p.title);
    expect(titles).toContain('AI server not bundled yet');
    expect(titles).not.toContain('AI needs a first-run download');
  });
  it('switches to first-run download text when the server ships', () => {
    const titles = readBeforeInstallPlates(true, rb).map((p) => p.title);
    expect(titles).toContain('AI needs a first-run download');
    expect(titles).not.toContain('AI server not bundled yet');
  });
  it('always warns about the interface language', () => {
    expect(readBeforeInstallPlates(false, rb).map((p) => p.title)).toContain('Interface in Brazilian Portuguese');
    expect(readBeforeInstallPlates(false, dictionaries.pt.readBefore).map((p) => p.title)).toContain('Interface em português');
  });
});
