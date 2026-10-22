// Coleta limitada e sem LLM; apenas ancestrais comprovados do instalador viram entrega.
export const HISTORY_DAYS = 120;
export const MAX_COMMIT_PAGES = 4;
const MAX_ISSUE_PAGES = 2;
const MAX_CLOSED_ISSUES = 30;
const BODY_LIMIT = 1200;
const feature = (title) => /^feat(?:\([^)]*\))?!?:\s/i.test(title);
const maintenance = (title) => /^(?:chore|docs|ci|build|test|refactor|style)(?:\([^)]*\))?!?:/i.test(title);
const completed = (body) => /\b(?:corrigid[oa]s?|implementad[oa]s?|entregue|conclu[i\u00ed]d[oa]s?|resolvid[oa]s?|fixed|implemented|delivered|resolved|completed)\b/i.test(body);
const closes = (message, n, repo) => new RegExp(`\\b(?:close[sd]?|fix(?:e[sd])?|resolve[sd]?|fecha|resolve|corrige)\\s+(?:${repo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})?#${n}(?!\\d)`, 'i').test(message);

export function collectMainWork({ api, repo, installerCommit, debutCommit, prs = [], now = new Date() }) {
  const since = new Date(now.getTime() - HISTORY_DAYS * 86400000).toISOString();
  const warnings = [];
  const pages = (path, maxPages) => {
    const rows = [];
    for (let page = 1; page <= maxPages; page++) {
      const batch = api(`${path}${path.includes('?') ? '&' : '?'}per_page=100&page=${page}`);
      if (!Array.isArray(batch)) throw new Error('GitHub retornou uma lista invalida para o World Tour');
      rows.push(...batch);
      if (batch.length < 100) return { rows, complete: true };
    }
    warnings.push(`World Tour: limite de ${maxPages * 100} registros atingido em ${path.split('?')[0]}`);
    return { rows, complete: false };
  };
  const raw = pages(`repos/${repo}/commits?sha=main&since=${encodeURIComponent(since)}`, MAX_COMMIT_PAGES).rows;
  const main = raw.map((c) => {
    const message = String(c.commit.message ?? '');
    return { sha: c.sha, title: message.split('\n')[0].slice(0, 240), body: message.slice(0, BODY_LIMIT),
      committedAt: c.commit.committer.date, feature: feature(message.split('\n')[0]) };
  });
  const resolveSha = (prefix) => {
    const matches = main.filter((c) => c.sha.startsWith(prefix.toLowerCase()));
    return matches.length === 1 ? matches[0].sha : null;
  };
  const closed = pages(`repos/${repo}/issues?state=closed&sort=updated&direction=desc&since=${encodeURIComponent(since)}`, MAX_ISSUE_PAGES).rows
    .filter((i) => !i.pull_request && i.state_reason === 'completed' && i.closed_at >= since && !maintenance(i.title))
    .slice(0, MAX_CLOSED_ISSUES);
  const issues = [];
  for (const issue of closed) {
    const shas = new Set(main.filter((c) => closes(c.body, issue.number, repo)).map((c) => c.sha));
    let unresolved = false;
    const timeline = pages(`repos/${repo}/issues/${issue.number}/timeline`, 2);
    // Uma timeline truncada nao prova qual foi o comentario de conclusao mais recente.
    if (timeline.complete) {
      const end = timeline.rows.findLastIndex((e) => e.event === 'closed');
      if (end >= 0) {
        const closure = timeline.rows[end];
        if (closure.commit_id) {
          const sha = resolveSha(closure.commit_id);
          if (sha) shas.add(sha);
          else unresolved = true;
        }
        const comment = timeline.rows.slice(0, end).findLast((e) => e.event === 'commented');
        if (comment && completed(comment.body ?? '')) {
          for (const prefix of String(comment.body).match(/\b[a-fA-F0-9]{7,40}\b/g) ?? []) {
            const sha = resolveSha(prefix);
            if (sha) shas.add(sha);
            else unresolved = true;
          }
        }
      }
    }
    if (!shas.size || unresolved) continue;
    issues.push({ number: issue.number, title: issue.title, body: String(issue.body ?? '').slice(0, BODY_LIMIT),
      createdAt: issue.created_at, closedAt: issue.closed_at, state: 'CLOSED', stateReason: 'COMPLETED',
      labels: issue.labels.map((l) => typeof l === 'string' ? l : l.name), commitShas: [...shas] });
  }
  const linked = new Set(issues.flatMap((i) => i.commitShas));
  const ancestry = new Map();
  const ancestorOf = (sha, anchor) => {
    if (!anchor) return false;
    if (sha === anchor) return true;
    const key = `${sha}:${anchor}`;
    if (!ancestry.has(key)) {
      const result = api(`repos/${repo}/compare/${encodeURIComponent(sha)}...${encodeURIComponent(anchor)}?per_page=1`);
      ancestry.set(key, ['ahead', 'identical'].includes(result.status) && result.merge_base_commit?.sha === sha);
    }
    return ancestry.get(key);
  };
  const mergeShas = new Set(prs.map((p) => p.mergeCommit?.oid).filter(Boolean));
  const commits = main.filter((c) => c.feature || linked.has(c.sha) || mergeShas.has(c.sha)).map((c) => ({
    ...c,
    installed: ancestorOf(c.sha, installerCommit),
    beforeDebut: ancestorOf(c.sha, debutCommit),
    prNumbers: mergeShas.has(c.sha) ? prs.filter((p) => p.mergeCommit?.oid === c.sha).map((p) => p.number) :
      api(`repos/${repo}/commits/${c.sha}/pulls?per_page=100`).map((p) => p.number),
  }));
  return { commits, issues, warnings };
}
