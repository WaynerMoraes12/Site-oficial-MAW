import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { checkPublishedRelease } from '../../tools/lib/release-check.mjs';

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
    await expect(checkPublishedRelease({ release, site, fetchImpl: fakeFetch(200) })).resolves.toEqual({
      status: 'ok',
      url: 'https://github.com/WaynerMoraes12/Site-oficial-MAW/releases/download/v1.0.0/MAW-Setup-1.0.0.exe',
    });
  });
});
