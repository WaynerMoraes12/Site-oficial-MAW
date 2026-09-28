// Paradas do World Tour a partir do estado da MAW no GitHub (spec §11; com um instalador por PR,
// spec da esteira §6).
//   Na estrada: a versão mais nova e os recursos que um release já entregou depois da estreia
//     (mergeados na main entre o commit da estreia, debutUntil, e o do último release, installedUntil).
//   Ensaiando: trabalho que ainda não chegou a um instalador — recurso mergeado na main depois do último
//     release, recurso mergeado num branch que a main ainda não tem, PR aberto, branch com trabalho e sem
//     PR — e o que pegou uma issue do roadmap (PR que cita #N, branch criado pela issue "N-…").
//   Anunciado: issue aberta com a etiqueta roadmap que nada pegou ainda.
// Cheio (MAX_STOPS): a versão, o que ensaia e o que foi anunciado ficam; os recursos entregues mais antigos saem.
export const MAX_STOPS = 14;
export const STATUSES = ['live', 'reh', 'next'];
const LOCALES = ['en', 'pt', 'es'];

// "#12" num título ou descrição (não pega "#123" nem a entidade "&#12;")
const mentions = (text, n) => new RegExp(`(^|[^\\w&])#${n}(?!\\d)`).test(text ?? '');
const time = (iso) => (iso ? Date.parse(iso) : Number.NEGATIVE_INFINITY);

export function classifyStops({ versions, prs, branches, issues, installedUntil, debutUntil = installedUntil }) {
  const newest = [...versions].sort((a, b) => time(a.builtAt) - time(b.builtAt)).at(-1);
  const version = newest
    ? [{ id: `version:${newest.version}`, status: 'live', date: newest.builtAt.slice(0, 10), source: { kind: 'version', ...newest } }]
    : [];

  const roadmap = issues.filter((i) => i.labels.includes('roadmap')).map((i) => i.number);
  const picksUp = (p, n) => mentions(p.title, n) || mentions(p.body, n) || (p.headRefName ?? '').startsWith(`${n}-`);
  const isStop = (p) =>
    (p.headRefName ?? '').startsWith('feature/') || /^feat/i.test(p.title ?? '') || roadmap.some((n) => picksUp(p, n));
  const branchByName = new Map(branches.map((b) => [b.name, b]));
  const aheadOfMain = (name) => (branchByName.get(name)?.ahead ?? 0) > 0;
  const installed = time(installedUntil);
  const debut = time(debutUntil);

  const reh = [];
  const delivered = [];
  for (const p of prs) {
    if (!isStop(p)) continue;
    const source = { kind: 'pr', number: p.number, title: p.title, body: p.body };
    const merged = p.state === 'MERGED';
    // o commit do instalador está na main: PR mergeado na main até esse instante já está nele;
    // PR mergeado num branch que ainda tem trabalho fora da main também não chegou ao instalador
    const pending = merged && (p.baseRefName === 'main' ? time(p.mergedAt) > installed : aheadOfMain(p.baseRefName));
    const shipped = merged && p.baseRefName === 'main' && time(p.mergedAt) > debut && time(p.mergedAt) <= installed;
    if (pending) {
      reh.push({ id: `pr:${p.number}`, status: 'reh', date: p.mergedAt.slice(0, 10), sortAt: time(p.mergedAt), source });
    } else if (shipped) {
      delivered.push({ id: `pr:${p.number}`, status: 'live', date: p.mergedAt.slice(0, 10), sortAt: time(p.mergedAt), source });
    } else if (p.state === 'OPEN') {
      const at = p.updatedAt ?? p.createdAt;
      reh.push({ id: `pr:${p.number}`, status: 'reh', date: p.createdAt.slice(0, 10), sortAt: time(at), source });
    }
  }

  // branch com trabalho fora da main: sem PR, ou com o PR já mergeado e trabalho novo por cima
  // (se um PR foi mergeado dentro dele, é esse PR que conta a história)
  const prsByHead = new Map();
  for (const p of prs) prsByHead.set(p.headRefName, [...(prsByHead.get(p.headRefName) ?? []), p]);
  const hasInnerPr = (name) => prs.some((p) => p.state === 'MERGED' && p.baseRefName === name);
  for (const b of branches) {
    const fromIssue = /^(\d+)-/.exec(b.name);
    const kind = b.name.startsWith('feature/') || (fromIssue && roadmap.includes(Number(fromIssue[1])));
    if (!kind || b.ahead < 1 || hasInnerPr(b.name)) continue;
    const own = prsByHead.get(b.name) ?? [];
    if (own.some((p) => p.state !== 'MERGED')) continue; // aberto já aparece; fechado sem merge foi descartado
    if (own.some((p) => p.baseRefName !== 'main')) continue; // mergeado noutro branch: o próprio PR já representa
    reh.push({
      id: `branch:${b.name}`,
      status: 'reh',
      date: b.lastCommitAt.slice(0, 10),
      sortAt: time(b.lastCommitAt),
      source: { kind: 'branch', name: b.name, title: b.lastMessage },
    });
  }
  reh.sort((a, b) => b.sortAt - a.sortAt);

  const alive = prs.filter((p) => p.state !== 'CLOSED');
  const pickedUp = (n) => alive.some((p) => picksUp(p, n)) || branches.some((b) => b.name.startsWith(`${n}-`));
  const next = issues
    .filter((i) => roadmap.includes(i.number) && !pickedUp(i.number))
    .sort((a, b) => time(a.createdAt) - time(b.createdAt))
    .map((i) => ({
      id: `issue:${i.number}`,
      status: 'next',
      date: i.createdAt.slice(0, 10),
      source: { kind: 'issue', number: i.number, title: i.title, body: i.body },
    }));

  // a versão, o que foi anunciado e o que ensaia vêm antes; os recursos entregues preenchem o resto
  const rehRoom = Math.max(0, MAX_STOPS - version.length - next.length);
  const rehearsing = reh.slice(0, rehRoom);
  delivered.sort((a, b) => b.sortAt - a.sortAt);
  const deliveredRoom = Math.max(0, MAX_STOPS - version.length - next.length - rehearsing.length);
  return [...version, ...delivered.slice(0, deliveredRoom), ...rehearsing, ...next].map(({ sortAt, ...stop }) => stop);
}

// Histórico de versões: a do instalador entra uma vez; reconstruir a mesma versão só troca o commit (a data fica).
export function updateVersions(previous, release) {
  const versions = (previous ?? []).map((v) => ({ ...v }));
  if (!release?.mawCommit) return versions;
  const same = versions.find((v) => v.version === release.version);
  if (same) same.mawCommit = release.mawCommit;
  else versions.push({ version: release.version, mawCommit: release.mawCommit, builtAt: release.builtAt });
  return versions;
}

// Todo texto já escrito fica guardado (mesmo de parada que saiu do tour); edição à mão nas paradas vale mais.
export function rememberTexts(previous, stops) {
  const texts = { ...(previous?.texts ?? {}) };
  for (const s of previous?.stops ?? []) if (s.text) texts[s.id] = s.text;
  for (const s of stops) if (s.text) texts[s.id] = s.text;
  return texts;
}

// Parada nova fica sem texto até alguém escrever; a que já teve texto recebe o que estava guardado.
export function mergeTexts(stops, previous) {
  const known = rememberTexts(previous, []);
  return stops.map((s) => ({ ...s, text: known[s.id] ?? null }));
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
