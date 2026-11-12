import { describe, expect, it } from 'vitest';
import { PRIVATE_PATHS, archivePathspec, publicFiles, releaseNotes, sourceZipName } from '../../tools/lib/publish.mjs';

describe('the public copy of a MAW release', () => {
  it('keeps the TCC, the deliverables and the internal plans out of the source zip', () => {
    for (const p of ['entregas', 'docs/TCC.md', 'docs/TCC-artigo.md', 'docs/figuras', 'docs/superpowers']) {
      expect(PRIVATE_PATHS).toContain(p);
    }
    const spec = archivePathspec();
    expect(spec[0]).toBe('.');
    for (const p of PRIVATE_PATHS) expect(spec).toContain(`:(exclude)${p}`);
  });

  it('names the source zip after the version', () => {
    expect(sourceZipName('1.0.7')).toBe('MAW-1.0.7-source.zip');
  });

  it('publishes every file of the private release, plus the source zip and the platforms index', () => {
    const files = publicFiles('1.0.7', ['MAW-Setup-1.0.7.exe', 'release.json', 'MAW-FFmpeg-7.1.1-source.zip']);
    expect(files).toEqual(['MAW-Setup-1.0.7.exe', 'release.json', 'MAW-FFmpeg-7.1.1-source.zip', 'MAW-1.0.7-source.zip', 'platforms.json']);
  });

  it('writes release notes that point to the license and to every source', () => {
    const notes = releaseNotes('1.0.7');
    expect(notes).toContain('GNU GPL v3');
    expect(notes).toContain('MAW-1.0.7-source.zip');
    expect(notes).toContain('FFmpeg');
    expect(notes).toContain('PyAV');
    expect(notes).toContain('waynermoraes12.github.io/Site-oficial-MAW');
    expect(notes).not.toMatch(/areaincrivel/);
  });
});
