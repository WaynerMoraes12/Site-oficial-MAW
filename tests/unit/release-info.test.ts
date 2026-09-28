import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildReleaseInfo, findIscc, sha256File } from '../../scripts/lib/release-info.mjs';
import { isReleaseInfo } from '../../src/lib/release';

describe('sha256File', () => {
  it('hashes a file like sha256sum does', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'maw-'));
    const file = join(dir, 'abc.txt');
    writeFileSync(file, 'abc');
    expect(await sha256File(file)).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  });
});

describe('buildReleaseInfo', () => {
  const ok = { file: 'MAW-Setup-1.0.0.exe', bytes: 10, sha256: 'b'.repeat(64), version: '1.0.0', builtAt: '2026-09-28T00:00:00.000Z' };
  it('returns data the site accepts', () => {
    expect(isReleaseInfo(buildReleaseInfo(ok))).toBe(true);
  });
  it('refuses a bad hash or an empty file', () => {
    expect(() => buildReleaseInfo({ ...ok, sha256: 'nope' })).toThrow(/sha256/);
    expect(() => buildReleaseInfo({ ...ok, bytes: 0 })).toThrow(/bytes/);
  });
});

describe('findIscc', () => {
  it('returns the first candidate that exists', () => {
    expect(findIscc([undefined, 'C:/a/ISCC.exe', 'C:/b/ISCC.exe'], (p) => p === 'C:/b/ISCC.exe')).toBe('C:/b/ISCC.exe');
  });
  it('returns null when Inno Setup is not installed', () => {
    expect(findIscc(['C:/a/ISCC.exe'], () => false)).toBeNull();
  });
});
