// Paradas do World Tour a partir do estado da MAW no GitHub (spec §11).
//   Na estrada: cada versão publicada no instalador do site.
//   Ensaiando: recurso mergeado na main depois do instalador, PR de recurso aberto, branch feature/* sem PR.
//   Anunciado: issue aberta com a etiqueta roadmap que nenhum PR ou branch pegou ainda.
export const MAX_STOPS = 14;
export const STATUSES = ['live', 'reh', 'next'];
const LOCALES = ['en', 'pt', 'es'];

const isFeature = (pr) => (pr.headRefName ?? '').startsWith('feature/') || /^feat/i.test(pr.title ?? '');
// "#12" num título ou descrição (não pega "#123" nem a entidade "&#12;")
const mentions = (text, n) => new RegExp(`(^|[^\\w&])#${n}(?!\\d)`).test(text ?? '');

export function classifyStops({ versions, prs, branches, issues, installedUntil }) {
  const live = [...versions]
    .sort((a, b) => a.builtAt.localeCompare(b.builtAt))
    .map((v) => ({ id: `version:${v.version}`, status: 'live', date: v.builtAt.slice(0, 10), source: { kind: 'version', ...v } }));

  const reh = [];
  for (const p of prs) {
    if (!isFeature(p)) continue;
    const source = { kind: 'pr', number: p.number, title: p.title, body: p.body };
    // o commit do instalador está na main: PR mergeado na main até esse instante já está nele
    if (p.state === 'MERGED' && p.baseRefName === 'main' && p.mergedAt > installedUntil) {
      reh.push({ id: `pr:${p.number}`, status: 'reh', date: p.mergedAt.slice(0, 10), sortAt: p.mergedAt, source });
    } else if (p.state === 'OPEN') {
      const at = p.updatedAt ?? p.createdAt;
      reh.push({ id: `pr:${p.number}`, status: 'reh', date: at.slice(0, 10), sortAt: at, source });
    }
  }
  // branch com PR (aberto, mergeado ou fechado) já foi decidido pelo PR
  const hasPr = new Set(prs.map((p) => p.headRefName));
  for (const b of branches) {
    if (!b.name.startsWith('feature/') || hasPr.has(b.name) || b.ahead < 1) continue;
    reh.push({
      id: `branch:${b.name}`,
      status: 'reh',
      date: b.lastCommitAt.slice(0, 10),
      sortAt: b.lastCommitAt,
      source: { kind: 'branch', name: b.name, title: b.lastMessage },
    });
  }
  reh.sort((a, b) => b.sortAt.localeCompare(a.sortAt));

  const alive = prs.filter((p) => p.state !== 'CLOSED');
  const pickedUp = (n) =>
    alive.some((p) => mentions(p.title, n) || mentions(p.body, n) || (p.headRefName ?? '').startsWith(`${n}-`)) ||
    branches.some((b) => b.name.startsWith(`${n}-`));
  const next = issues
    .filter((i) => i.labels.includes('roadmap') && !pickedUp(i.number))
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .map((i) => ({
      id: `issue:${i.number}`,
      status: 'next',
      date: i.createdAt.slice(0, 10),
      source: { kind: 'issue', number: i.number, title: i.title, body: i.body },
    }));

  const room = Math.max(0, MAX_STOPS - live.length - next.length);
  return [...live, ...reh.slice(0, room), ...next].map(({ sortAt, ...stop }) => stop);
}

// Texto já escrito (pelo Claude ou à mão) vale para sempre; parada nova fica sem texto até alguém escrever.
export function mergeTexts(stops, previous) {
  const known = new Map((previous?.stops ?? []).map((s) => [s.id, s.text]));
  return stops.map((s) => ({ ...s, text: known.get(s.id) ?? null }));
}

export function snapshotProblems(snapshot, release) {
  const problems = [];
  for (const s of snapshot.stops) {
    if (!STATUSES.includes(s.status)) problems.push(`${s.id}: status desconhecido ${s.status}`);
    for (const l of LOCALES) if (!s.text?.[l]?.trim()) problems.push(`${s.id}: sem texto em ${l}`);
  }
  if (release?.mawCommit && snapshot.installerCommit !== release.mawCommit) {
    problems.push(
      `World Tour feito com outro instalador (${String(snapshot.installerCommit).slice(0, 7)} ≠ ${release.mawCommit.slice(0, 7)}): rode npm run tour`,
    );
  }
  return problems;
}
