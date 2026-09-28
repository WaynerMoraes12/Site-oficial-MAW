# World Tour sincronizado com a MAW — plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** O World Tour do site passa a refletir sozinho o estado da MAW no GitHub (Na estrada = versão do instalador; Ensaiando = recursos mergeados depois do instalador, PRs abertos e branches em andamento; Anunciado = issues `roadmap`), com textos em EN/PT/ES e sincronização diária neste PC.

**Architecture:** Um script `npm run tour` (Node) lê o GitHub da MAW pelo `gh`, classifica as paradas com funções puras (`tools/lib/tour.mjs`), pede ao Claude CLI só os textos que faltam (`tools/lib/tour-texts.mjs`) e grava um snapshot commitado (`src/data/tour.json`). O site só lê o snapshot (build sem rede). `check:tour` trava o deploy se faltar texto ou se o snapshot não for do instalador atual. Uma tarefa do Agendador do Windows roda o script todo dia e commita/sobe se mudou.

**Tech Stack:** Node 24 (ESM), `gh` 2.97, Claude Code CLI 2.1 (`claude -p`), Astro 7, Vitest, Playwright, PowerShell 5.1 (ScheduledTasks).

**Spec:** `docs/superpowers/specs/2026-09-27-site-oficial-maw-design.md` §11 (e §10 para as três línguas).

## Global Constraints

- Repo da MAW: `WaynerMoraes12/MAW` (privado), lido só pelo `gh` autenticado; nada de token novo.
- O build (`npm run build`) não acessa a rede; só `npm run tour` fala com GitHub e Claude.
- Textos já existentes no snapshot (inclusive editados à mão) nunca são sobrescritos.
- Cada parada: texto em `en`, `pt`, `es`, até 60 caracteres (alvo 48). PT = português do Brasil; ES = espanhol neutro da América Latina.
- `fix/*`, `docs/*` e PR sem `feat` não entram. PR fechado sem merge não entra.
- Máximo de 14 paradas; corta-se o Ensaiando mais antigo.
- Página em inglês sem português (verificador existente); logo intocável; nada é publicado (Pages/Release).
- Commits terminam com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. PR mergeado exatamente no limite do instalador (mesmo instante do commit) — deve contar como "no instalador".
2. Issue `roadmap` já atendida por um PR mergeado mas ainda aberta — não pode aparecer como Anunciado.
3. Resposta do Claude CLI fora do formato (texto antes/depois do JSON, campo faltando, texto longo) — o item fica sem texto e o `check:tour` acusa; nada quebra o snapshot.
4. Tarefa diária com outras mudanças no working tree — só `src/data/tour.json` pode ir no commit.
5. Reconstruir o instalador da mesma versão (ex.: troca de ícone) não pode duplicar a parada da versão.

---

### Task 1: `mawCommit` no release.json

**Files:**
- Modify: `src/lib/release.ts`, `scripts/lib/release-info.mjs`, `tools/lib/release-check.mjs`, `scripts/build-installer.mjs`
- Test: `tests/unit/release.test.ts`, `tests/unit/release-info.test.ts`, `tests/unit/release-check.test.ts`

**Interfaces:**
- Produces: `ReleaseInfo.mawCommit?: string` (40 hex); `buildReleaseInfo({ ..., mawCommit })`; `exeIsCurrent(exeMtime: Date, commitDate: Date): boolean`.

- [ ] **Step 1: testes que falham**

```ts
// release.test.ts
it('accepts the MAW commit of the installer and rejects a malformed one', () => {
  expect(isReleaseInfo({ ...good, mawCommit: 'a'.repeat(40) })).toBe(true);
  expect(isReleaseInfo({ ...good, mawCommit: '5433daa' })).toBe(false);
});
// release-info.test.ts
it('records the MAW commit the installer was built from', () => {
  expect(buildReleaseInfo({ ...ok, mawCommit: 'c'.repeat(40) }).mawCommit).toBe('c'.repeat(40));
  expect(() => buildReleaseInfo({ ...ok, mawCommit: 'xyz' })).toThrow(/mawCommit/);
});
it('refuses an executable older than the commit it claims to come from', () => {
  expect(exeIsCurrent(new Date('2026-09-23T14:49:16Z'), new Date('2026-09-23T14:45:54Z'))).toBe(true);
  expect(exeIsCurrent(new Date('2026-09-23T14:00:00Z'), new Date('2026-09-23T14:45:54Z'))).toBe(false);
});
// release-check.test.ts: acrescentar à tabela de variantes { ...release, mawCommit: 'nope' } (página mostraria "coming soon")
```

- [ ] **Step 2:** `npx vitest run tests/unit/release*.test.ts` → FAIL (mawCommit desconhecido, exeIsCurrent inexistente).
- [ ] **Step 3: implementação**
  - `release.ts`: campo opcional `mawCommit?: string`; em `isReleaseInfo`: `(r.mawCommit === undefined || (typeof r.mawCommit === 'string' && /^[0-9a-f]{40}$/.test(r.mawCommit)))`.
  - `release-check.mjs` (`pageShowsDownload`): a mesma condição.
  - `release-info.mjs`: `buildReleaseInfo` aceita `mawCommit` (se vier, 40 hex, senão `throw new Error('mawCommit inválido: …')`); `export function exeIsCurrent(exeMtime, commitDate) { return exeMtime.getTime() >= commitDate.getTime(); }`.
  - `build-installer.mjs`: `const mawCommit = execFileSync('git', ['-C', mawRepo, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();` e a data `git -C mawRepo log -1 --format=%cI HEAD`; se `!exeIsCurrent(statSync(sourceExe).mtime, commitDate)` → `throw new Error('MAW_APP.exe é mais velho que o commit ' + mawCommit.slice(0, 7) + ': compile a MAW de novo')`; `git status --porcelain` não vazio → só `console.warn`. Passa `mawCommit` para `buildReleaseInfo`.
- [ ] **Step 4:** `npx vitest run` → PASS (todos).
- [ ] **Step 5:** `npm run installer` → `release.json` ganha `"mawCommit": "5433daa…"` (40 hex). Commit: `feat: release.json guarda o commit da MAW do instalador`.

### Task 2: classificação das paradas (funções puras)

**Files:**
- Create: `tools/lib/tour.mjs`
- Test: `tests/unit/tour.test.ts`

**Interfaces:**
- Produces:
  - `classifyStops({ versions, prs, branches, issues, installedUntil }) → Stop[]` com `Stop = { id, status: 'live'|'reh'|'next', date: 'YYYY-MM-DD', source }`.
  - `mergeTexts(stops, previous) → Stop[]` (com `text` ou `null`).
  - `snapshotProblems(snapshot, release) → string[]`.
  - `MAX_STOPS = 14`.
  - Formatos de entrada: `pr = { number, title, body, headRefName, baseRefName, state: 'OPEN'|'MERGED'|'CLOSED', mergedAt, createdAt, updatedAt }`; `branch = { name, ahead, lastCommitAt, lastMessage }`; `issue = { number, title, body, createdAt, labels: string[] }`; `version = { version, mawCommit, builtAt }`; `installedUntil` = data ISO (UTC) do commit do instalador.

- [ ] **Step 1: testes que falham** (`tests/unit/tour.test.ts`)

```ts
import { describe, expect, it } from 'vitest';
import { MAX_STOPS, classifyStops, mergeTexts, snapshotProblems } from '../../tools/lib/tour.mjs';

const pr = (n, o = {}) => ({ number: n, title: `feat(x): recurso ${n}`, body: '', headRefName: `feature/r${n}`, baseRefName: 'main', state: 'MERGED', mergedAt: '2026-09-24T10:00:00Z', createdAt: '2026-09-20T10:00:00Z', updatedAt: '2026-09-24T10:00:00Z', ...o });
const base = { versions: [{ version: '1.0.0', mawCommit: 'a'.repeat(40), builtAt: '2026-09-28T02:27:10.476Z' }], prs: [], branches: [], issues: [], installedUntil: '2026-09-23T14:45:54Z' };
const ids = (stops) => stops.map((s) => `${s.status}:${s.id}`);

describe('classifyStops', () => {
  it('puts the installer version on the road, one stop per version', () => {
    expect(ids(classifyStops(base))).toEqual(['live:version:1.0.0']);
  });
  it('rehearses features merged after the installer and leaves out what the installer has', () => {
    const prs = [pr(57, { mergedAt: '2026-09-23T14:45:54Z' }), pr(58, { mergedAt: '2026-09-23T17:17:48Z' })];
    expect(ids(classifyStops({ ...base, prs }))).toEqual(['live:version:1.0.0', 'reh:pr:58']);
  });
  it('leaves out fixes, docs, closed PRs and PRs into other branches', () => {
    const prs = [pr(68, { headRefName: 'fix/x', title: 'fix: y' }), pr(59, { state: 'CLOSED', mergedAt: null }), pr(61, { baseRefName: 'feature/a' })];
    expect(ids(classifyStops({ ...base, prs }))).toEqual(['live:version:1.0.0']);
  });
  it('rehearses open feature PRs and feature branches without a PR, newest first', () => {
    const prs = [pr(71, { state: 'OPEN', mergedAt: null, updatedAt: '2026-09-29T10:00:00Z' }), pr(59, { state: 'CLOSED', mergedAt: null, headRefName: 'feature/automacao-completa' })];
    const branches = [{ name: 'feature/time-stretch', ahead: 3, lastCommitAt: '2026-09-30T10:00:00Z', lastMessage: 'feat: time-stretch' }, { name: 'feature/automacao-completa', ahead: 1, lastCommitAt: '2026-09-30T11:00:00Z', lastMessage: 'x' }, { name: 'feature/vazia', ahead: 0, lastCommitAt: '2026-09-30T12:00:00Z', lastMessage: '' }];
    expect(ids(classifyStops({ ...base, prs, branches }))).toEqual(['live:version:1.0.0', 'reh:branch:feature/time-stretch', 'reh:pr:71']);
  });
  it('announces open roadmap issues until a PR or branch picks them up', () => {
    const issues = [{ number: 3, title: 'MAW como plugin VST3', body: '', createdAt: '2026-09-28T10:00:00Z', labels: ['roadmap'] }, { number: 4, title: 'b', body: '', createdAt: '2026-09-28T11:00:00Z', labels: ['roadmap'] }, { number: 5, title: 'c', body: '', createdAt: '2026-09-28T12:00:00Z', labels: ['roadmap'] }];
    const prs = [pr(80, { state: 'OPEN', mergedAt: null, body: 'Fecha #4.' })];
    const branches = [{ name: '5-algo', ahead: 1, lastCommitAt: '2026-09-30T10:00:00Z', lastMessage: '' }];
    expect(ids(classifyStops({ ...base, prs, issues, branches }))).toEqual(['live:version:1.0.0', 'reh:pr:80', 'next:issue:3']);
  });
  it('does not announce an issue a merged PR already delivered', () => {
    const issues = [{ number: 3, title: 'x', body: '', createdAt: '2026-09-28T10:00:00Z', labels: ['roadmap'] }];
    const prs = [pr(90, { body: 'Resolve #3' })];
    expect(ids(classifyStops({ ...base, prs, issues }))).not.toContain('next:issue:3');
  });
  it('keeps at most 14 stops, dropping the oldest rehearsals', () => {
    const prs = Array.from({ length: 20 }, (_, i) => pr(100 + i, { mergedAt: `2026-10-${String(i + 1).padStart(2, '0')}T10:00:00Z` }));
    const stops = classifyStops({ ...base, prs });
    expect(stops).toHaveLength(MAX_STOPS);
    expect(stops[1].id).toBe('pr:119');
    expect(stops.at(-1).id).toBe('pr:107');
  });
  it('dates each stop from what it is: build, merge, last commit or issue creation', () => {
    const stops = classifyStops({ ...base, prs: [pr(58, { mergedAt: '2026-09-23T17:17:48Z' })] });
    expect(stops.map((s) => s.date)).toEqual(['2026-09-28', '2026-09-23']);
  });
});

describe('mergeTexts', () => {
  it('keeps every text already written, even edited by hand, and leaves new stops empty', () => {
    const previous = { stops: [{ id: 'pr:58', text: { en: 'Hand-edited', pt: 'Editado', es: 'Editado' } }] };
    const merged = mergeTexts([{ id: 'pr:58' }, { id: 'pr:60' }], previous);
    expect(merged.map((s) => s.text)).toEqual([{ en: 'Hand-edited', pt: 'Editado', es: 'Editado' }, null]);
  });
});

describe('snapshotProblems', () => {
  const text = { en: 'a', pt: 'b', es: 'c' };
  it('passes a complete snapshot made for the current installer', () => {
    expect(snapshotProblems({ installerCommit: 'a'.repeat(40), stops: [{ id: 'x', status: 'live', text }] }, { mawCommit: 'a'.repeat(40) })).toEqual([]);
  });
  it('flags missing texts and a snapshot made for another installer', () => {
    const problems = snapshotProblems({ installerCommit: 'b'.repeat(40), stops: [{ id: 'pr:1', status: 'reh', text: { en: 'a', pt: '', es: 'c' } }, { id: 'pr:2', status: 'reh', text: null }] }, { mawCommit: 'a'.repeat(40) });
    expect(problems).toEqual(['pr:1: sem texto em pt', 'pr:2: sem texto em en', 'pr:2: sem texto em pt', 'pr:2: sem texto em es', expect.stringMatching(/outro instalador/)]);
  });
});
```

- [ ] **Step 2:** `npx vitest run tests/unit/tour.test.ts` → FAIL (módulo inexistente).
- [ ] **Step 3: implementação** (`tools/lib/tour.mjs`)

```js
// Paradas do World Tour a partir do estado da MAW no GitHub (spec §11).
export const MAX_STOPS = 14;
const LOCALES = ['en', 'pt', 'es'];

const isFeature = (pr) => (pr.headRefName ?? '').startsWith('feature/') || /^feat/i.test(pr.title ?? '');
// "#12" num título ou descrição (não pega "#123" nem "&#12")
const mentions = (text, n) => new RegExp(`(^|[^\\w&])#${n}(?!\\d)`).test(text ?? '');

export function classifyStops({ versions, prs, branches, issues, installedUntil }) {
  const live = [...versions]
    .sort((a, b) => a.builtAt.localeCompare(b.builtAt))
    .map((v) => ({ id: `version:${v.version}`, status: 'live', date: v.builtAt.slice(0, 10), source: { kind: 'version', ...v } }));

  const reh = [];
  for (const p of prs) {
    if (!isFeature(p)) continue;
    const source = { kind: 'pr', number: p.number, title: p.title, body: p.body };
    // o commit do instalador está na main: PR mergeado na main até esse instante está nele
    if (p.state === 'MERGED' && p.baseRefName === 'main' && p.mergedAt > installedUntil) {
      reh.push({ id: `pr:${p.number}`, status: 'reh', date: p.mergedAt.slice(0, 10), sortAt: p.mergedAt, source });
    } else if (p.state === 'OPEN') {
      const at = p.updatedAt ?? p.createdAt;
      reh.push({ id: `pr:${p.number}`, status: 'reh', date: at.slice(0, 10), sortAt: at, source });
    }
  }
  const hasPr = new Set(prs.map((p) => p.headRefName));
  for (const b of branches) {
    if (!b.name.startsWith('feature/') || hasPr.has(b.name) || b.ahead < 1) continue;
    reh.push({ id: `branch:${b.name}`, status: 'reh', date: b.lastCommitAt.slice(0, 10), sortAt: b.lastCommitAt, source: { kind: 'branch', name: b.name, title: b.lastMessage } });
  }
  reh.sort((a, b) => b.sortAt.localeCompare(a.sortAt));

  const alive = prs.filter((p) => p.state !== 'CLOSED');
  const pickedUp = (n) =>
    alive.some((p) => mentions(p.title, n) || mentions(p.body, n) || (p.headRefName ?? '').startsWith(`${n}-`)) ||
    branches.some((b) => b.name.startsWith(`${n}-`));
  const next = issues
    .filter((i) => i.labels.includes('roadmap') && !pickedUp(i.number))
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .map((i) => ({ id: `issue:${i.number}`, status: 'next', date: i.createdAt.slice(0, 10), source: { kind: 'issue', number: i.number, title: i.title, body: i.body } }));

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
    for (const l of LOCALES) if (!s.text?.[l]?.trim()) problems.push(`${s.id}: sem texto em ${l}`);
  }
  if (release?.mawCommit && snapshot.installerCommit !== release.mawCommit) {
    problems.push(`World Tour feito com outro instalador (${String(snapshot.installerCommit).slice(0, 7)} ≠ ${release.mawCommit.slice(0, 7)}): rode npm run tour`);
  }
  return problems;
}
```

- [ ] **Step 4:** `npx vitest run tests/unit/tour.test.ts` → PASS; `npx vitest run` → PASS.
- [ ] **Step 5:** commit `feat: regras do World Tour a partir do estado da MAW`.

### Task 3: textos pelo Claude CLI, `npm run tour` e `check:tour`

**Files:**
- Create: `tools/lib/tour-texts.mjs`, `tools/tour.mjs`, `tools/check-tour.mjs`
- Modify: `package.json` (scripts `tour`, `check:tour`, `check:dist`)
- Test: `tests/unit/tour-texts.test.ts`

**Interfaces:**
- Consumes: `classifyStops`, `mergeTexts`, `snapshotProblems` (Task 2); `release.json.mawCommit` (Task 1).
- Produces: `buildPrompt(source) → string`; `parseTexts(output) → { en, pt, es }` (lança erro se inválido); `src/data/tour.json` = `{ installerCommit, versions: Version[], stops: { id, status, date, text: { en, pt, es } }[] }`.

- [ ] **Step 1: testes que falham** (`tests/unit/tour-texts.test.ts`)

```ts
import { describe, expect, it } from 'vitest';
import { buildPrompt, parseTexts } from '../../tools/lib/tour-texts.mjs';

describe('parseTexts', () => {
  it('reads the JSON even with text around it', () => {
    expect(parseTexts('Aqui:\n{"en":"Sends, buses & groups","pt":"Envios, barramentos e grupos","es":"Envíos, buses y grupos"}\nPronto')).toEqual({ en: 'Sends, buses & groups', pt: 'Envios, barramentos e grupos', es: 'Envíos, buses y grupos' });
  });
  it('refuses a missing language, an empty text or a text too long for a tour stop', () => {
    expect(() => parseTexts('{"en":"a","pt":"b"}')).toThrow(/es/);
    expect(() => parseTexts('{"en":" ","pt":"b","es":"c"}')).toThrow(/en/);
    expect(() => parseTexts(`{"en":"${'x'.repeat(61)}","pt":"b","es":"c"}`)).toThrow(/longo/);
    expect(() => parseTexts('sem json')).toThrow(/JSON/);
  });
});

describe('buildPrompt', () => {
  it('asks for the three languages in the tour tone, from the PR title and description', () => {
    const p = buildPrompt({ kind: 'pr', number: 60, title: 'feat(mixagem): envios auxiliares, barramentos e grupos', body: 'Barramento com cadeia de efeitos própria.' });
    expect(p).toMatch(/"en"/);
    expect(p).toMatch(/Latin American Spanish/);
    expect(p).toMatch(/Brazilian Portuguese/);
    expect(p).toContain('envios auxiliares, barramentos e grupos');
    expect(p).toContain('Barramento com cadeia');
  });
  it('names a version stop after the version', () => {
    expect(buildPrompt({ kind: 'version', version: '1.1.0' })).toContain('Version 1.1');
  });
});
```

- [ ] **Step 2:** `npx vitest run tests/unit/tour-texts.test.ts` → FAIL (módulo inexistente).
- [ ] **Step 3: implementação**
  - `tools/lib/tour-texts.mjs`: `buildPrompt` monta um pedido em inglês com: o que é a MAW (DAW para Windows), exemplos de paradas existentes ("Automation for any parameter", "Sends, buses & sidechain", "Loop recording, punch-in & take history", "MAW as a VST3 plugin"), regras (até 48 caracteres, sem ponto final, termos técnicos como MIDI, VST3, CC, sidechain, Linux ficam como estão; PT = Brazilian Portuguese; ES = neutral Latin American Spanish; versão → "Version X.Y — <resumo curto>"), e responde **só** `{"en":…,"pt":…,"es":…}`; inclui o título e até 1200 caracteres da descrição. `parseTexts` extrai o primeiro `{…}`, faz `JSON.parse`, exige as 3 línguas não vazias e ≤ 60 caracteres, devolve os textos com `trim()`.
  - `tools/tour.mjs`: lê `release.json` e o snapshot anterior; monta `versions` (acrescenta a versão do `release.json` se não existe; se existe com outro `mawCommit`, atualiza `mawCommit` e mantém a data original); `installedUntil` = `gh api repos/WaynerMoraes12/MAW/commits/<mawCommit> --jq .commit.committer.date`; `prs` = `gh pr list -R … --state all --limit 1000 --json number,title,body,headRefName,baseRefName,state,mergedAt,createdAt,updatedAt`; `issues` = `gh issue list -R … --state open --label roadmap --limit 200 --json number,title,body,createdAt,labels` (labels → nomes); `branches` = `gh api --paginate repos/…/branches?per_page=100 --jq .[].name`, só `feature/*` sem PR, cada uma com `gh api repos/…/compare/main...<branch>` (`ahead_by`, último commit); classifica, junta textos antigos, pede ao Claude (`claude -p <prompt> --tools "" --no-session-persistence`, timeout 3 min) só as paradas sem texto; grava `src/data/tour.json` (sem `source`), com `JSON.stringify(…, null, 2)`; imprime o resumo (quantas por status, quais novas) e sai com código 1 se `snapshotProblems` acusar algo.
  - `tools/check-tour.mjs`: lê snapshot + release e imprime os problemas; `process.exitCode = 1` se houver.
  - `package.json`: `"tour": "node tools/tour.mjs"`, `"check:tour": "node tools/check-tour.mjs"`, `check:dist` passa a rodar também `check:tour`.
- [ ] **Step 4:** `npx vitest run` → PASS.
- [ ] **Step 5:** commit `feat: npm run tour sincroniza o World Tour com o GitHub da MAW`.

### Task 4: o site lê o snapshot

**Files:**
- Create: `src/data/tour.ts`, `src/data/tour.json` (semente escrita à mão a partir do tour atual: só a parada `version:1.0.0` com os textos atuais "Version 1.0 — debut" / "Versão 1.0 — estreia" / "Versión 1.0 — estreno", `installerCommit` do release.json)
- Delete: `src/data/roadmap.ts`
- Modify: `src/components/WorldTour.astro`, `src/components/Home.astro` (passa `locale`), `src/i18n/types.ts`, `src/i18n/{en,pt,es}.ts`, `tests/unit/data.test.ts`, `tests/unit/i18n.test.ts` (allowlist por língua:caminho), `tests/e2e/story-contact.spec.ts`

**Interfaces:**
- Consumes: formato do snapshot (Task 3).
- Produces: `tourStops: TourStop[]`, `TourStop = { id, status: 'live'|'reh'|'next', date, text: Record<Locale, string> }`; dicionário `tour` = `{ eyebrow, title, years, stamps, months: string[12], whenReh, whenNext }` (sai `stops`).

- [ ] **Step 1: testes que falham**
  - `tests/e2e/story-contact.spec.ts`: substituir o teste de 9 paradas por:

```ts
import tour from '../../src/data/tour.json';
test('the world tour shows every synced stop, in each language, with its stamp', async ({ page }) => {
  const stamps = { en: { live: 'On the road', reh: 'Rehearsing', next: 'Announced' }, pt: { live: 'Na estrada', reh: 'Ensaiando', next: 'Anunciado' }, es: { live: 'De gira', reh: 'Ensayando', next: 'Anunciado' } };
  for (const [locale, path] of [['en', '/'], ['pt', '/pt/'], ['es', '/es/']] as const) {
    await page.goto(path);
    await expect(page.locator('#tour .date .what')).toHaveText(tour.stops.map((s) => s.text[locale]));
    await expect(page.locator('#tour .date .stamp')).toHaveText(tour.stops.map((s) => stamps[locale][s.status as 'live' | 'reh' | 'next']));
  }
});
```

  - `tests/unit/data.test.ts`: trocar o teste de `tourStatuses` por "o snapshot do tour é válido": `snapshotProblems(tour, release)` vazio, status só `live|reh|next`, datas `YYYY-MM-DD`, ao menos uma parada `live`.
- [ ] **Step 2:** `npx vitest run tests/unit/data.test.ts` e `npx playwright test tests/e2e/story-contact.spec.ts` → FAIL (sem `tour.json`/textos diferentes).
- [ ] **Step 3: implementação**
  - `src/data/tour.ts`: `import snapshot from './tour.json'; export const tourStops = snapshot.stops as TourStop[];`
  - `WorldTour.astro` (props `t`, `locale`): coluna da esquerda = `live` → `${tour.months[mês-1]} ${ano}` (de `date`), `reh` → `tour.whenReh`, `next` → `tour.whenNext`; texto = `stop.text[locale]`; selo = `tour.stamps[stop.status]`.
  - Dicionários: tirar `stops`; `months` EN `Jan…Dec`, PT `Jan Fev Mar Abr Mai Jun Jul Ago Set Out Nov Dez`, ES `Ene Feb Mar Abr May Jun Jul Ago Sep Oct Nov Dic`; `whenReh` / `whenNext` com os rótulos atuais das paradas ("In rehearsal"/"Next tour", "Em ensaio"/…, "En ensayo"/…).
  - Allowlist do teste de paridade: tirar entradas de `tour.stops`, pôr as de `tour.months` que coincidem com o inglês (o teste de entradas mortas mostra a lista exata).
- [ ] **Step 4:** `npx vitest run`, `npx playwright test` e `npm run build && npm run check:dist` → PASS.
- [ ] **Step 5:** commit `feat: World Tour do site lido do snapshot sincronizado`.

### Task 5: primeira sincronização real

- [ ] **Step 1:** criar na MAW a etiqueta e a issue (autorizado pelo usuário em 28/09):
  `gh label create roadmap -R WaynerMoraes12/MAW --color 9D00FF --description "Aparece como Anunciado no World Tour do site"` e `gh issue create -R WaynerMoraes12/MAW --title "MAW como plugin VST3" --label roadmap --body "<descrição curta>"`.
- [ ] **Step 2:** `npm run tour` → Expected: 1 Na estrada (`version:1.0.0`), 10 Ensaiando (#70, #67, #66, #65, #64, #63, #62, #61, #60, #58), 1 Anunciado (a issue do VST3); textos novos gerados; `check:tour` sem problemas.
- [ ] **Step 3:** revisar os textos gerados (tom, tamanho, PT do Brasil, ES neutro); corrigir à mão o que precisar (fica preservado).
- [ ] **Step 4:** `npm run tour` de novo → nada muda (idempotente, sem chamar o Claude). `npx playwright test tests/e2e/story-contact.spec.ts tests/e2e/i18n.spec.ts tests/e2e/quality.spec.ts` → PASS.
- [ ] **Step 5:** commit `chore: World Tour sincronizado com a MAW`.

### Task 6: tarefa diária no Windows

**Files:**
- Create: `scripts/tour-daily.ps1`, `scripts/register-tour-task.ps1`
- Modify: `README.md`

- [ ] **Step 1:** `scripts/tour-daily.ps1`: vai para a raiz do repo; log em `%LOCALAPPDATA%\MAW-site\tour-sync.log`; roda `npm run tour`; se falhar, registra e sai sem commitar; se `git status --porcelain -- src/data/tour.json` vier vazio, registra "sem mudanças"; senão `git commit -m "chore: World Tour sincronizado com a MAW" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -- src/data/tour.json` (só esse arquivo) e `git push`; registra o resultado.
- [ ] **Step 2:** `scripts/register-tour-task.ps1`: `Register-ScheduledTask -TaskName 'MAW Site - World Tour'` diária às 09:00, `-StartWhenAvailable` (roda quando o PC ligar se perdeu o horário), limite de 30 min, `powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "<repo>\scripts\tour-daily.ps1"`, com `-Force` para regravar.
- [ ] **Step 3:** rodar `scripts/tour-daily.ps1` na mão → Expected: log "sem mudanças" (snapshot já atual), nenhum commit novo.
- [ ] **Step 4:** registrar a tarefa; `Get-ScheduledTask 'MAW Site - World Tour'` → Ready, próximo disparo às 09:00; `Start-ScheduledTask` uma vez e conferir o log.
- [ ] **Step 5:** README: seção "World Tour" (regras, `npm run tour`, editar texto à mão, a tarefa diária e como remover: `Unregister-ScheduledTask 'MAW Site - World Tour'`). Commit `feat: tarefa diaria que sincroniza o World Tour`.

### Task 7: revisão final

- [ ] Suíte completa (`npx vitest run`, `python -m unittest discover -s tools/tests`, `npx playwright test`, `npm run check:dist`, build com `BASE_PATH=/Site-oficial-MAW`), revisão independente do intervalo, correções com teste, push do branch.
