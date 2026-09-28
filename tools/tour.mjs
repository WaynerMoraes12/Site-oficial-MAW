// npm run tour: lê o estado da MAW no GitHub, classifica as paradas do World Tour e grava src/data/tour.json.
// Só aqui o site fala com a rede (gh já autenticado) e com o Claude CLI (textos das paradas novas).
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { classifyStops, mergeTexts, snapshotProblems } from './lib/tour.mjs';
import { buildPrompt, parseTexts } from './lib/tour-texts.mjs';

const REPO = 'WaynerMoraes12/MAW';
const OUT = 'src/data/tour.json';
const readJson = (path) => (existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : null);
const gh = (...args) => execFileSync('gh', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
const ghJson = (...args) => JSON.parse(gh(...args));

// No Windows o npm instala o Claude Code como claude.cmd, que o Node não roda sem shell: usa o claude.exe dele.
function claudeBin() {
  if (process.env.CLAUDE_BIN) return process.env.CLAUDE_BIN;
  if (process.platform !== 'win32') return 'claude';
  const where = (name) => {
    try {
      return execFileSync('where', [name], { encoding: 'utf8' }).split(/\r?\n/)[0].trim();
    } catch {
      return '';
    }
  };
  const exe = where('claude.exe');
  if (exe) return exe;
  const shim = where('claude.cmd');
  const bundled = shim && join(dirname(shim), 'node_modules', '@anthropic-ai', 'claude-code', 'bin', 'claude.exe');
  return bundled && existsSync(bundled) ? bundled : 'claude';
}

function writeTexts(source) {
  const bin = claudeBin();
  let lastError;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const out = execFileSync(bin, ['-p', '--tools', '', '--no-session-persistence'], {
        input: buildPrompt(source),
        encoding: 'utf8',
        timeout: 180_000,
      });
      return parseTexts(out);
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError;
}

const release = readJson('src/data/release.json');
const previous = readJson(OUT);

// histórico de versões: a do instalador atual entra uma vez; reconstruir a mesma versão só troca o commit
const versions = (previous?.versions ?? []).map((v) => ({ ...v }));
if (release?.mawCommit) {
  const same = versions.find((v) => v.version === release.version);
  if (!same) versions.push({ version: release.version, mawCommit: release.mawCommit, builtAt: release.builtAt });
  else same.mawCommit = release.mawCommit;
}
const installerCommit = release?.mawCommit ?? previous?.installerCommit ?? null;
const installedUntil = installerCommit ? gh('api', `repos/${REPO}/commits/${installerCommit}`, '--jq', '.commit.committer.date').trim() : '';

const prs = ghJson(
  'pr', 'list', '-R', REPO, '--state', 'all', '--limit', '1000',
  '--json', 'number,title,body,headRefName,baseRefName,state,mergedAt,createdAt,updatedAt',
);
const issues = ghJson('issue', 'list', '-R', REPO, '--state', 'open', '--label', 'roadmap', '--limit', '200', '--json', 'number,title,body,createdAt,labels')
  .map((i) => ({ ...i, labels: i.labels.map((l) => l.name) }));
const withPr = new Set(prs.map((p) => p.headRefName));
const branches = gh('api', '--paginate', `repos/${REPO}/branches?per_page=100`, '--jq', '.[].name')
  .split(/\r?\n/)
  .map((n) => n.trim())
  .filter((n) => n.startsWith('feature/') && !withPr.has(n))
  .map((name) => {
    const c = ghJson('api', `repos/${REPO}/compare/main...${name}`, '--jq', '{ahead: .ahead_by, at: .commits[-1].commit.committer.date, message: .commits[-1].commit.message}');
    return { name, ahead: c.ahead ?? 0, lastCommitAt: c.at ?? '', lastMessage: (c.message ?? '').split('\n')[0] };
  });

const stops = mergeTexts(classifyStops({ versions, prs, branches, issues, installedUntil }), previous);
const fresh = stops.filter((s) => !s.text);
for (const stop of fresh) {
  try {
    stop.text = writeTexts(stop.source);
    console.log(`texto novo  ${stop.id}: ${stop.text.en}`);
  } catch (err) {
    console.error(`sem texto   ${stop.id}: ${err.message.split('\n')[0]}`);
  }
}

const snapshot = { installerCommit, versions, stops: stops.map(({ source, ...s }) => s) };
writeFileSync(OUT, `${JSON.stringify(snapshot, null, 2)}\n`);

const count = (status) => snapshot.stops.filter((s) => s.status === status).length;
console.log(`World Tour: ${count('live')} na estrada, ${count('reh')} ensaiando, ${count('next')} anunciado(s) → ${OUT}`);
const problems = snapshotProblems(snapshot, release);
for (const p of problems) console.error(p);
if (problems.length) process.exitCode = 1;
