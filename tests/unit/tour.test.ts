import { describe, expect, it } from 'vitest';
import { MAX_STOPS, classifyStops, mergeTexts, rememberTexts, snapshotProblems, updateVersions } from '../../tools/lib/tour.mjs';

type Pr = Record<string, unknown>;
const pr = (n: number, o: Pr = {}) => ({
  number: n,
  title: `feat(x): recurso ${n}`,
  body: '',
  headRefName: `feature/r${n}`,
  baseRefName: 'main',
  state: 'MERGED',
  mergedAt: '2026-09-24T10:00:00Z',
  createdAt: '2026-09-20T10:00:00Z',
  updatedAt: '2026-09-24T10:00:00Z',
  ...o,
});
const base = {
  versions: [{ version: '1.0.0', mawCommit: 'a'.repeat(40), builtAt: '2026-09-28T02:27:10.476Z' }],
  prs: [] as Pr[],
  branches: [] as Pr[],
  issues: [] as Pr[],
  installedUntil: '2026-09-23T14:45:54Z',
};
const ids = (stops: { status: string; id: string }[]) => stops.map((s) => `${s.status}:${s.id}`);

describe('classifyStops', () => {
  it('puts the installer version on the road, one stop per version', () => {
    expect(ids(classifyStops(base))).toEqual(['live:version:1.0.0']);
  });
  it('rehearses features merged after the installer and leaves out what the installer has', () => {
    const prs = [pr(57, { mergedAt: '2026-09-23T14:45:54Z' }), pr(58, { mergedAt: '2026-09-23T17:17:48Z' })];
    expect(ids(classifyStops({ ...base, prs }))).toEqual(['live:version:1.0.0', 'reh:pr:58']);
  });
  it('leaves out fixes, docs, closed PRs and PRs into other branches', () => {
    const prs = [
      pr(68, { headRefName: 'fix/x', title: 'fix: y' }),
      pr(69, { headRefName: 'docs/x', title: 'docs: z' }),
      pr(59, { state: 'CLOSED', mergedAt: null }),
      pr(61, { baseRefName: 'feature/a' }),
    ];
    expect(ids(classifyStops({ ...base, prs }))).toEqual(['live:version:1.0.0']);
  });
  it('rehearses open feature PRs and feature branches without a PR, newest first', () => {
    const prs = [
      pr(71, { state: 'OPEN', mergedAt: null, updatedAt: '2026-09-29T10:00:00Z' }),
      pr(59, { state: 'CLOSED', mergedAt: null, headRefName: 'feature/automacao-completa' }),
    ];
    const branches = [
      { name: 'feature/time-stretch', ahead: 3, lastCommitAt: '2026-09-30T10:00:00Z', lastMessage: 'feat: time-stretch' },
      { name: 'feature/automacao-completa', ahead: 1, lastCommitAt: '2026-09-30T11:00:00Z', lastMessage: 'x' },
      { name: 'feature/vazia', ahead: 0, lastCommitAt: '2026-09-30T12:00:00Z', lastMessage: '' },
    ];
    expect(ids(classifyStops({ ...base, prs, branches }))).toEqual(['live:version:1.0.0', 'reh:branch:feature/time-stretch', 'reh:pr:71']);
  });
  it('announces open roadmap issues until a PR or branch picks them up', () => {
    const issues = [
      { number: 3, title: 'MAW como plugin VST3', body: '', createdAt: '2026-09-28T10:00:00Z', labels: ['roadmap'] },
      { number: 4, title: 'b', body: '', createdAt: '2026-09-28T11:00:00Z', labels: ['roadmap'] },
      { number: 5, title: 'c', body: '', createdAt: '2026-09-28T12:00:00Z', labels: ['roadmap'] },
      { number: 6, title: 'sem etiqueta', body: '', createdAt: '2026-09-28T13:00:00Z', labels: [] },
    ];
    const prs = [pr(80, { state: 'OPEN', mergedAt: null, body: 'Fecha #4.' })];
    const branches = [{ name: '5-algo', ahead: 1, lastCommitAt: '2026-09-30T10:00:00Z', lastMessage: '' }];
    expect(ids(classifyStops({ ...base, prs, issues, branches }))).toEqual(['live:version:1.0.0', 'reh:branch:5-algo', 'reh:pr:80', 'next:issue:3']);
  });
  it('does not announce an issue a merged PR already delivered, and does not mistake #30 for #3', () => {
    const issues = [
      { number: 3, title: 'x', body: '', createdAt: '2026-09-28T10:00:00Z', labels: ['roadmap'] },
      { number: 7, title: 'y', body: '', createdAt: '2026-09-28T11:00:00Z', labels: ['roadmap'] },
    ];
    const prs = [pr(90, { body: 'Resolve #3' }), pr(91, { body: 'Ver #70 e &#7;', mergedAt: '2026-09-25T10:00:00Z' })];
    expect(ids(classifyStops({ ...base, prs, issues }))).toEqual(['live:version:1.0.0', 'reh:pr:91', 'reh:pr:90', 'next:issue:7']);
  });
  it('keeps at most 14 stops, dropping the oldest rehearsals', () => {
    const prs = Array.from({ length: 20 }, (_, i) => pr(100 + i, { mergedAt: `2026-10-${String(i + 1).padStart(2, '0')}T10:00:00Z` }));
    const stops = classifyStops({ ...base, prs });
    expect(stops).toHaveLength(MAX_STOPS);
    expect(stops[1].id).toBe('pr:119');
    expect(stops.at(-1)!.id).toBe('pr:107');
  });
  it('dates each stop from the installer build or the merge', () => {
    const stops = classifyStops({ ...base, prs: [pr(58, { mergedAt: '2026-09-23T17:17:48Z' })] });
    expect(stops.map((s: { date: string }) => s.date)).toEqual(['2026-09-28', '2026-09-23']);
  });
  it('orders versions from the oldest', () => {
    const versions = [
      { version: '1.1.0', mawCommit: 'b'.repeat(40), builtAt: '2026-11-01T10:00:00Z' },
      { version: '1.0.0', mawCommit: 'a'.repeat(40), builtAt: '2026-09-28T02:27:10.476Z' },
    ];
    expect(ids(classifyStops({ ...base, versions }))).toEqual(['live:version:1.0.0', 'live:version:1.1.0']);
  });
});

describe('classifyStops, work that has not reached main yet', () => {
  it('rehearses a feature stacked on a branch that main does not have yet', () => {
    const prs = [
      pr(71, { headRefName: 'feature/time-stretch', mergedAt: '2026-09-28T11:15:01Z' }),
      pr(72, { headRefName: 'feature/punch-e-historico', baseRefName: 'feature/time-stretch', mergedAt: '2026-09-28T11:15:11Z' }),
    ];
    const branches = [
      { name: 'feature/time-stretch', ahead: 7, lastCommitAt: '2026-09-28T11:15:11Z', lastMessage: 'merge' },
      // o branch do #72 também está à frente da main, mas o trabalho dele é o próprio #72
      { name: 'feature/punch-e-historico', ahead: 7, lastCommitAt: '2026-09-28T11:14:00Z', lastMessage: 'feat: punch' },
    ];
    expect(ids(classifyStops({ ...base, prs, branches }))).toEqual(['live:version:1.0.0', 'reh:pr:72', 'reh:pr:71']);
  });
  it('rehearses a branch whose merged PR left work behind, unless a PR merged into it already tells the story', () => {
    const prs = [pr(80, { headRefName: 'feature/x' })];
    const branches = [{ name: 'feature/x', ahead: 2, lastCommitAt: '2026-09-30T10:00:00Z', lastMessage: 'feat: mais x' }];
    expect(ids(classifyStops({ ...base, prs, branches }))).toEqual(['live:version:1.0.0', 'reh:branch:feature/x', 'reh:pr:80']);
  });
  it('compares instants, not text, so a merge written in another time zone is still placed right', () => {
    const prs = [pr(90, { mergedAt: '2026-09-23T12:00:00-03:00' })];
    expect(ids(classifyStops({ ...base, prs }))).toEqual(['live:version:1.0.0', 'reh:pr:90']);
  });
});

describe('classifyStops, picking up a roadmap issue', () => {
  const issue = { number: 73, title: 'MAW como plugin VST3', body: '', createdAt: '2026-09-28T10:00:00Z', labels: ['roadmap'] };
  it('a branch created from the issue rehearses in its place', () => {
    const branches = [{ name: '73-plugin-vst3', ahead: 2, lastCommitAt: '2026-09-30T10:00:00Z', lastMessage: 'primeiro passo do plugin' }];
    expect(ids(classifyStops({ ...base, issues: [issue], branches }))).toEqual(['live:version:1.0.0', 'reh:branch:73-plugin-vst3']);
  });
  it('a PR that picks up the issue rehearses even without feat in the title', () => {
    const prs = [pr(81, { title: 'VST3: primeiro passo', headRefName: 'plugin', state: 'OPEN', mergedAt: null, body: 'Parte de #73' })];
    expect(ids(classifyStops({ ...base, issues: [issue], prs }))).toEqual(['live:version:1.0.0', 'reh:pr:81']);
  });
});

describe('updateVersions', () => {
  const v1 = { version: '1.0.0', mawCommit: 'a'.repeat(40), builtAt: '2026-09-28T02:27:10.476Z' };
  it('adds a new version once', () => {
    const release = { version: '1.1.0', mawCommit: 'b'.repeat(40), builtAt: '2026-11-01T10:00:00Z' };
    expect(updateVersions([v1], release)).toEqual([v1, { version: '1.1.0', mawCommit: 'b'.repeat(40), builtAt: '2026-11-01T10:00:00Z' }]);
  });
  it('rebuilding the same version keeps one stop and its first date, with the new commit', () => {
    const release = { version: '1.0.0', mawCommit: 'c'.repeat(40), builtAt: '2026-10-05T10:00:00Z' };
    expect(updateVersions([v1], release)).toEqual([{ ...v1, mawCommit: 'c'.repeat(40) }]);
  });
  it('keeps the history when there is no release file', () => {
    expect(updateVersions([v1], null)).toEqual([v1]);
  });
});

describe('rememberTexts', () => {
  it('keeps every text ever written, with fresh hand edits on the stops winning', () => {
    const previous = {
      texts: { 'issue:73': { en: 'old', pt: 'velho', es: 'viejo' }, 'pr:1': { en: 'one', pt: 'um', es: 'uno' } },
      stops: [{ id: 'issue:73', text: { en: 'Edited', pt: 'Editado', es: 'Editado' } }],
    };
    expect(rememberTexts(previous, [{ id: 'pr:2', text: { en: 'two', pt: 'dois', es: 'dos' } }])).toEqual({
      'issue:73': { en: 'Edited', pt: 'Editado', es: 'Editado' },
      'pr:1': { en: 'one', pt: 'um', es: 'uno' },
      'pr:2': { en: 'two', pt: 'dois', es: 'dos' },
    });
  });
});

describe('mergeTexts', () => {
  it('brings back the text of a stop that left the tour and returned', () => {
    const previous = { texts: { 'issue:73': { en: 'MAW as a VST3 plugin', pt: 'A MAW como plugin VST3', es: 'MAW como plugin VST3' } }, stops: [] };
    expect(mergeTexts([{ id: 'issue:73' }], previous)[0].text).toEqual({ en: 'MAW as a VST3 plugin', pt: 'A MAW como plugin VST3', es: 'MAW como plugin VST3' });
  });
  it('keeps every text already written, even edited by hand, and leaves new stops empty', () => {
    const previous = { stops: [{ id: 'pr:58', text: { en: 'Hand-edited', pt: 'Editado', es: 'Editado' } }] };
    const merged = mergeTexts([{ id: 'pr:58' }, { id: 'pr:60' }], previous);
    expect(merged.map((s: { text: unknown }) => s.text)).toEqual([{ en: 'Hand-edited', pt: 'Editado', es: 'Editado' }, null]);
  });
  it('starts empty when there is no previous snapshot', () => {
    expect(mergeTexts([{ id: 'pr:1' }], null)).toEqual([{ id: 'pr:1', text: null }]);
  });
});

describe('snapshotProblems', () => {
  const text = { en: 'a', pt: 'b', es: 'c' };
  it('passes a complete snapshot made for the current installer', () => {
    expect(snapshotProblems({ installerCommit: 'a'.repeat(40), stops: [{ id: 'x', status: 'live', text }] }, { mawCommit: 'a'.repeat(40) })).toEqual([]);
  });
  it('flags missing texts and a snapshot made for another installer', () => {
    const problems = snapshotProblems(
      {
        installerCommit: 'b'.repeat(40),
        stops: [
          { id: 'pr:1', status: 'reh', text: { en: 'a', pt: '', es: 'c' } },
          { id: 'pr:2', status: 'reh', text: null },
        ],
      },
      { mawCommit: 'a'.repeat(40) },
    );
    expect(problems).toEqual([
      'pr:1: sem texto em pt',
      'pr:2: sem texto em en',
      'pr:2: sem texto em pt',
      'pr:2: sem texto em es',
      expect.stringMatching(/outro instalador/),
    ]);
  });
  it('flags an unknown status', () => {
    expect(snapshotProblems({ installerCommit: null, stops: [{ id: 'x', status: 'soon', text }] }, null)).toEqual(['x: status desconhecido soon']);
  });
});
