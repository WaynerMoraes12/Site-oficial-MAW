import { describe, expect, it } from 'vitest';
import { collectMainWork, MAX_COMMIT_PAGES } from '../../tools/lib/tour-github.mjs';
import { classifyStops, mergeTexts } from '../../tools/lib/tour.mjs';

const sha = (prefix: string) => prefix.padEnd(40, '0');
const camera = [sha('a9d14e9'), sha('b506555')];
const latency = [sha('30e9099'), sha('094eb7a')];
const crunch = sha('388cf64');
const installer = 'e'.repeat(40);
const debut = 'd'.repeat(40);
const now = new Date('2026-10-22T15:00:00Z');
const repo = 'WaynerMoraes12/MAW';
const commit = (id: string, message: string, date = '2026-10-20T12:00:00Z') => ({ sha: id,
  commit: { message, committer: { date } } });
const rawCommits = [
  commit(camera[0], 'fix(camera): IN automatico de verdade'),
  commit(camera[1], 'fix(camera): atualizar e fechar a tomada', '2026-10-22T12:00:00Z'),
  commit(latency[0], 'feat(gravacao): compensa a latencia da placa'),
  commit(latency[1], 'fix(gravacao): ajuste sem menos zero', '2026-10-21T12:00:00Z'),
  commit(crunch, 'feat(efeitos): Crunch, um amplificador de guitarra'),
  commit(sha('1111111'), 'docs: novas contagens da suite'),
  commit(sha('2222222'), 'chore: reorganiza arquivos'),
  commit(sha('3333333'), 'fix(ci): cache do compilador'),
];
const issue = (number: number, title: string) => ({ number, title, body: 'Recurso para quem grava.',
  state_reason: 'completed', state: 'closed', labels: [{ name: 'roadmap' }],
  created_at: '2026-10-19T12:00:00Z', closed_at: '2026-10-22T13:00:00Z' });
const closed = [issue(81, 'Camera: monitora o instrumento e encerra a tomada'),
  issue(82, 'Gravacao: compensa a latencia da placa'), issue(83, 'Crunch para guitarra'),
  { ...issue(84, 'Ideia descartada'), state_reason: 'not_planned' }, issue(85, 'Fechada sem commit comprovado')];
const timelines: Record<number, unknown[]> = {
  81: [{ event: 'commented', body: `Corrigido em ${camera.join(' e ')}.` }, { event: 'closed', commit_id: null }],
  82: [{ event: 'commented', body: `Implementado em ${latency.join(' e ')}.` }, { event: 'closed', commit_id: null }],
  83: [{ event: 'closed', commit_id: crunch }],
  85: [{ event: 'closed', commit_id: null }],
};
function fixture(options: { installed?: string[]; pulls?: Record<string, number[]>; commits?: any[];
  timelines?: Record<number, unknown[]>; issues?: any[]; debut?: string[]; prs?: any[] } = {}) {
  const calls: string[] = [];
  const api = (path: string) => {
    calls.push(path);
    const url = new URL(`https://api.github.com/${path}`);
    if (url.pathname === `/repos/${repo}/commits`) return options.commits ?? rawCommits;
    if (url.pathname === `/repos/${repo}/issues`) return options.issues ?? closed;
    const timeline = /\/issues\/(\d+)\/timeline$/.exec(url.pathname);
    if (timeline) return (options.timelines ?? timelines)[Number(timeline[1])] ?? [];
    const pulls = /\/commits\/([a-f0-9]+)\/pulls$/.exec(url.pathname);
    if (pulls) return (options.pulls?.[pulls[1]] ?? []).map((number) => ({ number }));
    const compare = /\/compare\/([a-f0-9]+)\.\.\.([a-f0-9]+)$/.exec(url.pathname);
    if (compare) return { status: ((compare[2] === installer && options.installed?.includes(compare[1])) ||
      (compare[2] === debut && options.debut?.includes(compare[1]))) ? 'ahead' : 'diverged',
      merge_base_commit: { sha: compare[1] } };
    throw new Error(`API inesperada no teste: ${path}`);
  };
  const work = collectMainWork({ api, repo, installerCommit: installer, debutCommit: debut, prs: options.prs ?? [], now });
  const stops = (prs: unknown[] = []) => classifyStops({
    versions: [], prs, branches: [], issues: work.issues, commits: work.commits,
    installerCommit: installer, debutCommit: debut,
    installedUntil: '2026-10-04T12:00:00Z', debutUntil: '2026-09-28T12:00:00Z',
  });
  return { work, calls, stops };
}

describe('main commits and completed issues in the World Tour', () => {
  it('represents camera #81, latency #82 and Crunch #83 once each while awaiting the installer', () => {
    const f = fixture();
    expect(f.stops().map((s: any) => `${s.status}:${s.id}`)).toEqual(['reh:issue:81', 'reh:issue:82', 'reh:issue:83']);
    expect(f.work.commits).toHaveLength(5);
  });
  it('only ships an issue when every implementation commit is in the installer ancestry', () => {
    const f = fixture({ installed: [...camera, latency[0], crunch] });
    expect(f.stops().map((s: any) => `${s.status}:${s.id}`)).toEqual(['live:issue:81', 'live:issue:83', 'reh:issue:82']);
  });
  it('does not use an old committer date as proof of inclusion in the installer', () => {
    const id = sha('abcdef1');
    const f = fixture({ commits: [commit(id, 'feat: gravacao nova', '2026-09-01T12:00:00Z')], issues: [] });
    expect(f.stops().map((s: any) => `${s.status}:${s.id}`)).toEqual([`reh:commit:${id}`]);
  });
  it('keeps an existing PR ID without adding the corresponding issue or direct commit again', () => {
    const f = fixture({ pulls: { [crunch]: [90] } });
    const prs = [{ number: 90, title: 'feat: Crunch', body: 'Closes #83', headRefName: 'feature/crunch',
      baseRefName: 'main', state: 'MERGED', mergedAt: '2026-10-20T12:00:00Z', mergeCommit: { oid: crunch } }];
    expect(f.stops(prs).map((s: any) => s.id)).toEqual(['issue:81', 'issue:82', 'pr:90']);
  });
  it('uses merge-commit ancestry before an old PR timestamp when deduplicating', () => {
    const f = fixture({ pulls: { [crunch]: [90] } });
    const prs = [{ number: 90, title: 'feat: Crunch', body: '', headRefName: 'feature/crunch',
      baseRefName: 'main', state: 'MERGED', mergedAt: '2026-09-01T12:00:00Z', mergeCommit: { oid: crunch } }];
    expect(f.stops(prs).find((s: any) => s.id === 'pr:90')?.status).toBe('reh');
    expect(f.stops(prs).some((s: any) => s.id === 'issue:83' || s.id === `commit:${crunch}`)).toBe(false);
  });
  it('collects the merge SHA as proof even when its title is not a feature title', () => {
    const merge = sha('7777777');
    const f = fixture({ commits: [commit(merge, 'Merge pull request #90')], issues: [],
      prs: [{ mergeCommit: { oid: merge } }] });
    expect(f.work.commits.map((c: any) => c.sha)).toEqual([merge]);
    expect(f.stops()).toEqual([]);
  });
  it('leaves debut work inside the version stop instead of adding historical features again', () => {
    const f = fixture({ installed: [...camera, ...latency, crunch], debut: [...camera, ...latency, crunch] });
    expect(f.stops()).toEqual([]);
  });
  it('does not use a truncated timeline as evidence of completion', () => {
    const events = Array.from({ length: 100 }, () => ({ event: 'commented', body: `Corrigido em ${camera[0]}` }));
    const f = fixture({ timelines: { ...timelines, 81: events } });
    expect(f.work.issues.some((i: any) => i.number === 81)).toBe(false);
    expect(f.work.warnings.some((s: string) => s.includes('issues/81/timeline'))).toBe(true);
  });
  it('keeps a hand-edited issue title when it moves from announced to rehearsing', () => {
    const text = { en: 'My camera take', pt: 'Minha tomada', es: 'Mi toma' };
    const previous = { stops: [{ id: 'issue:81', status: 'next', text }] };
    expect(mergeTexts(fixture().stops(), previous).find((s: any) => s.id === 'issue:81').text).toEqual(text);
  });
  it('ignores discarded/unproven issues and maintenance-only commits', () => {
    expect(fixture().stops().map((s: any) => s.id)).not.toEqual(expect.arrayContaining(['issue:84', 'issue:85']));
    const f = fixture({ commits: rawCommits.slice(5), issues: [] });
    expect(f.stops()).toEqual([]);
  });
  it('recognizes an accented Portuguese completion comment', () => {
    const f = fixture({ timelines: { ...timelines, 81: [
      { event: 'commented', body: `Conclu\u00eddo em ${camera.join(' e ')}.` }, { event: 'closed', commit_id: null },
    ] } });
    expect(f.work.issues.find((i: any) => i.number === 81)?.commitShas).toEqual(camera);
  });
  it('requires all SHAs in a completion comment to resolve on main', () => {
    const f = fixture({ timelines: { ...timelines, 81: [
      { event: 'commented', body: `Corrigido em ${camera[0]} e ${sha('fffffff')}.` }, { event: 'closed', commit_id: null },
    ] } });
    expect(f.work.issues.some((i: any) => i.number === 81)).toBe(false);
  });
  it('collects a closing keyword on main, but never a reference to another repository', () => {
    const id = sha('abcdef1');
    const f = fixture({ commits: [commit(id, 'feat: camera\n\nCloses #81. Fixes other/repo#82.')],
      timelines: {}, issues: closed.slice(0, 2) });
    expect(f.work.issues.map((i: any) => i.number)).toEqual([81]);
  });
  it('bounds paginated history and warns when its limit is reached', () => {
    const calls: string[] = [];
    const api = (path: string) => {
      calls.push(path);
      return path.includes('/commits?') ? Array.from({ length: 100 }, (_, n) => commit(sha(n.toString(16)), 'chore: snapshot')) : [];
    };
    const work = collectMainWork({ api, repo, installerCommit: installer, debutCommit: debut, now });
    expect(calls.filter((p) => p.includes('/commits?'))).toHaveLength(MAX_COMMIT_PAGES);
    expect(work.warnings).toHaveLength(1);
    expect(work.commits).toEqual([]);
    expect(calls[0]).toContain('since=2026-06-24');
  });
});
