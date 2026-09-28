import { describe, expect, it } from 'vitest';
import { formatBytes, isReleaseInfo, parseRelease, releaseView } from '../../src/lib/release';

const site = { version: '1.0.0', releaseBaseUrl: 'https://github.com/WaynerMoraes12/Site-oficial-MAW/releases/download' };
const good = {
  file: 'MAW-Setup-1.0.0.exe',
  bytes: 9_300_000,
  sha256: 'a'.repeat(64),
  version: '1.0.0',
  builtAt: '2026-09-28T12:00:00.000Z',
};

describe('releaseView', () => {
  it('is pending when there is no release file', () => {
    expect(releaseView(undefined, site)).toEqual({ state: 'pending' });
  });
  it('is pending for a malformed hash', () => {
    expect(releaseView({ ...good, sha256: 'xyz' }, site)).toEqual({ state: 'pending' });
  });
  it('is pending when the release is for another version', () => {
    expect(releaseView({ ...good, version: '0.9.0' }, site)).toEqual({ state: 'pending' });
  });
  it('is pending for zero bytes or a non-exe file', () => {
    expect(releaseView({ ...good, bytes: 0 }, site)).toEqual({ state: 'pending' });
    expect(releaseView({ ...good, file: 'MAW.zip' }, site)).toEqual({ state: 'pending' });
  });
  it('builds the GitHub Releases URL when ready', () => {
    expect(releaseView(good, site)).toEqual({
      state: 'ready',
      url: 'https://github.com/WaynerMoraes12/Site-oficial-MAW/releases/download/v1.0.0/MAW-Setup-1.0.0.exe',
      file: 'MAW-Setup-1.0.0.exe',
      sizeLabel: '8.9 MB',
      sha256: 'a'.repeat(64),
    });
  });
});

describe('formatBytes', () => {
  it('uses KB below one megabyte and MB with one decimal above', () => {
    expect(formatBytes(512_000)).toBe('500 KB');
    expect(formatBytes(9_300_000)).toBe('8.9 MB');
  });
});

describe('isReleaseInfo', () => {
  it('accepts a valid object and rejects null', () => {
    expect(isReleaseInfo(good)).toBe(true);
    expect(isReleaseInfo(null)).toBe(false);
  });
});

describe('strict release file', () => {
  it('only accepts the installer named after its own version', () => {
    expect(isReleaseInfo({ ...good, file: 'evil.exe' })).toBe(false);
    expect(isReleaseInfo({ ...good, file: 'MAW-Setup-9.9.9.exe' })).toBe(false);
    expect(isReleaseInfo({ ...good, file: '../MAW-Setup-1.0.0.exe' })).toBe(false);
  });
  it('only accepts a plain x.y.z version', () => {
    expect(isReleaseInfo({ ...good, version: '1.0.0/../x', file: 'MAW-Setup-1.0.0/../x.exe' })).toBe(false);
  });
});

describe('parseRelease', () => {
  it('shows "coming soon" instead of breaking the build when release.json is not valid JSON', () => {
    expect(parseRelease('{"file": ')).toBeNull();
    expect(releaseView(parseRelease('{"file": '), site)).toEqual({ state: 'pending' });
  });
  it('reads a valid file and reports a missing one as undefined', () => {
    expect(parseRelease(JSON.stringify(good))).toEqual(good);
    expect(parseRelease(undefined)).toBeUndefined();
  });
});
