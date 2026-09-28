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
  it('keeps the installed size so the site can show the real disk space', () => {
    const info = buildReleaseInfo({ ...ok, installedBytes: 9_565_687 });
    expect(info.installedBytes).toBe(9_565_687);
    expect(isReleaseInfo(info)).toBe(true);
    expect(() => buildReleaseInfo({ ...ok, installedBytes: 0 })).toThrow(/installedBytes/);
  });
  it('refuses an installer not named after its version', () => {
    expect(() => buildReleaseInfo({ ...ok, file: 'MAW-Setup-9.9.9.exe' })).toThrow(/file/);
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

import { assertMicrosoftSigned, parseProductVersion, parseRedistInfo } from '../../scripts/lib/release-info.mjs';

describe('VC++ redistributable verification', () => {
  const good = parseRedistInfo('{"Status":"Valid","Subject":"CN=Microsoft Corporation, O=Microsoft Corporation, L=Redmond, S=Washington, C=US","Version":"14.51.36247.0"}');
  it('reads status, signer and version from PowerShell JSON', () => {
    expect(good).toEqual({ status: 'Valid', subject: 'CN=Microsoft Corporation, O=Microsoft Corporation, L=Redmond, S=Washington, C=US', version: '14.51.36247.0' });
  });
  it('accepts only a valid Microsoft signature', () => {
    expect(() => assertMicrosoftSigned(good)).not.toThrow();
    expect(() => assertMicrosoftSigned({ ...good, status: 'NotSigned' })).toThrow(/Microsoft/);
    expect(() => assertMicrosoftSigned({ ...good, status: 'HashMismatch' })).toThrow(/Microsoft/);
    expect(() => assertMicrosoftSigned({ ...good, subject: 'CN=Evil Corp, O=Evil Corp' })).toThrow(/Microsoft/);
  });
  it('splits the product version used by the installer registry check', () => {
    expect(parseProductVersion('14.51.36247.0')).toEqual({ major: 14, minor: 51, build: 36247 });
    expect(() => parseProductVersion('garbage')).toThrow(/versão/);
  });
});
