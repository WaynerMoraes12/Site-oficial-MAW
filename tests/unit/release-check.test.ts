import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { checkPublishedRelease, mergePlatforms, readReleaseJson, validPackage } from '../../tools/lib/release-check.mjs';
import { extraDownloads, releaseView } from '../../src/lib/release';

const site = { version: '1.0.0', releaseBaseUrl: 'https://github.com/WaynerMoraes12/Site-oficial-MAW/releases/download' };
const bytes = Buffer.from('fake installer bytes');
const release = {
  file: 'MAW-Setup-1.0.0.exe',
  bytes: bytes.length,
  sha256: createHash('sha256').update(bytes).digest('hex'),
  version: '1.0.0',
  builtAt: '2026-09-28T00:00:00.000Z',
};
const fakeFetch = (status: number, body: Buffer = bytes) => async (url: string) => ({
  ok: status >= 200 && status < 300,
  status,
  url,
  arrayBuffer: async () => body.buffer.slice(body.byteOffset, body.byteOffset + body.byteLength),
});

describe('checkPublishedRelease', () => {
  it('has nothing to check while the site shows "coming soon"', async () => {
    await expect(checkPublishedRelease({ release: undefined, site, fetchImpl: fakeFetch(404) })).resolves.toEqual({ status: 'pending' });
  });
  it('blocks the deploy when the release file is not published', async () => {
    await expect(checkPublishedRelease({ release, site, fetchImpl: fakeFetch(404) })).rejects.toThrow(/404/);
  });
  it('blocks the deploy when the published file is not the one in release.json', async () => {
    await expect(checkPublishedRelease({ release, site, fetchImpl: fakeFetch(200, Buffer.from('other build')) })).rejects.toThrow(/SHA-256/);
  });
  it('passes when the published file matches size and hash', async () => {
    await expect(checkPublishedRelease({ release, site, fetchImpl: fakeFetch(200) })).resolves.toMatchObject({
      status: 'ok',
      url: 'https://github.com/WaynerMoraes12/Site-oficial-MAW/releases/download/v1.0.0/MAW-Setup-1.0.0.exe',
      release,
      dropped: [],
    });
  });
});

describe('checkPublishedRelease agrees with the page', () => {
  const variants = [
    release,
    { ...release, version: '1.1', file: 'MAW-Setup-1.1.exe' },
    { ...release, version: '1.0.0-beta.1', file: 'MAW-Setup-1.0.0-beta.1.exe' },
    { ...release, version: '0.9.0', file: 'MAW-Setup-0.9.0.exe' },
    { ...release, file: 'maw.exe' },
    { ...release, sha256: 'nope' },
    { ...release, bytes: 0 },
    { ...release, mawCommit: 'nope' },
    { ...release, mawCommit: 'd'.repeat(40) },
  ];
  it('blocks the deploy whenever release.json exists but the page would show "coming soon"', async () => {
    for (const v of variants) {
      const pending = releaseView(v, site).state === 'pending';
      const run = checkPublishedRelease({ release: v, site, fetchImpl: fakeFetch(200) });
      if (pending) await expect(run, JSON.stringify(v)).rejects.toThrow(/coming soon/);
      else await expect(run, JSON.stringify(v)).resolves.toMatchObject({ status: 'ok' });
    }
  });
});

// Mac, Linux e o zip do código-fonte vêm do platforms.json do release público; cada um é conferido sozinho
describe('the macOS, Linux and source packages', () => {
  const sha = (b: Buffer) => createHash('sha256').update(b).digest('hex');
  const pkg = (file: string, body: Buffer) => ({ file, bytes: body.length, sha256: sha(body) });
  const mac = Buffer.from('mac zip');
  const lin = Buffer.from('linux tarball');
  const src = Buffer.from('source zip');
  const platforms = {
    version: '1.0.0',
    source: pkg('MAW-1.0.0-source.zip', src),
    macos: pkg('MAW-1.0.0-macos-universal.zip', mac),
    linux: pkg('MAW-1.0.0-linux-x86_64.tar.gz', lin),
  };
  const files: Record<string, Buffer | undefined> = {
    'MAW-Setup-1.0.0.exe': bytes,
    'MAW-1.0.0-source.zip': src,
    'MAW-1.0.0-macos-universal.zip': mac,
    'MAW-1.0.0-linux-x86_64.tar.gz': lin,
  };
  const byName = (map: Record<string, Buffer | undefined>) => async (url: string) => {
    const body = map[url.split('/').pop()!];
    return {
      ok: !!body,
      status: body ? 200 : 404,
      url,
      arrayBuffer: async () => (body ?? Buffer.alloc(0)).buffer.slice(body?.byteOffset ?? 0, (body?.byteOffset ?? 0) + (body?.byteLength ?? 0)),
    };
  };

  it('merges the platforms index of the same version into the release', () => {
    expect(mergePlatforms(release, platforms)).toEqual({ ...release, source: platforms.source, macos: platforms.macos, linux: platforms.linux });
    expect(mergePlatforms(release, { ...platforms, version: '0.9.0' })).toEqual(release);
    expect(mergePlatforms(release, undefined)).toEqual(release);
  });
  it('ignores a package whose file name is not the one of this version', () => {
    const merged = mergePlatforms(release, { ...platforms, macos: pkg('MAW-0.9.0-macos-universal.zip', mac) });
    expect(merged).not.toHaveProperty('macos');
    expect(merged).toHaveProperty('linux');
  });
  it('keeps every package that is published and matches its hash', async () => {
    const result = await checkPublishedRelease({ release: mergePlatforms(release, platforms), site, fetchImpl: byName(files) });
    expect(result.release).toMatchObject({ source: platforms.source, macos: platforms.macos, linux: platforms.linux });
    expect(result.dropped).toEqual([]);
  });
  it('drops only the package that is missing or different, and keeps the Windows download', async () => {
    const fetchImpl = byName({ ...files, 'MAW-1.0.0-macos-universal.zip': undefined, 'MAW-1.0.0-linux-x86_64.tar.gz': Buffer.from('tampered') });
    const result = await checkPublishedRelease({ release: mergePlatforms(release, platforms), site, fetchImpl });
    expect(result.status).toBe('ok');
    expect(result.release).not.toHaveProperty('macos');
    expect(result.release).not.toHaveProperty('linux');
    expect(result.release.source).toEqual(platforms.source);
    expect(result.dropped.map((d: { key: string }) => d.key).sort()).toEqual(['linux', 'macos']);
  });
  it('validates a package the same way the page does', () => {
    const entries = [
      platforms.macos,
      { ...platforms.macos, file: 'MAW-1.0.0-macos.zip' },
      { ...platforms.macos, bytes: 0 },
      { ...platforms.macos, sha256: 'x' },
      undefined,
    ];
    for (const e of entries) {
      const page = extraDownloads({ ...release, macos: e }, site).macos !== undefined;
      expect(validPackage('macos', e, '1.0.0'), JSON.stringify(e)).toBe(page);
    }
  });
});

describe('readReleaseJson', () => {
  it('blocks the deploy with a clear message when release.json is broken', () => {
    expect(() => readReleaseJson('{"file": ')).toThrow(/release\.json/);
  });
  it('reads a valid file and treats a missing one as "coming soon"', () => {
    expect(readReleaseJson(JSON.stringify(release))).toEqual(release);
    expect(readReleaseJson(undefined)).toBeUndefined();
  });
});
