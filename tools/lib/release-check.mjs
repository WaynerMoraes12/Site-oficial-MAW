import { createHash } from 'node:crypto';

// No deploy, release.json corrompido para tudo com uma mensagem clara (o site mostraria "coming soon").
export function readReleaseJson(text) {
  if (text === undefined) return undefined;
  try {
    return JSON.parse(text);
  } catch (err) {
    throw new Error(`release.json inválido (${err.message}): gere de novo com npm run installer`);
  }
}

// O site só pode ir ao ar mostrando "Download" se o arquivo do release.json já estiver publicado
// no GitHub Releases, com o mesmo SHA-256. Sem release.json o site mostra "coming soon": nada a checar.
export async function checkPublishedRelease({ release, site, fetchImpl = fetch }) {
  if (!release) return { status: 'pending' };
  const url = `${site.releaseBaseUrl}/v${release.version}/${release.file}`;
  const res = await fetchImpl(url, { redirect: 'follow' });
  if (!res.ok) throw new Error(`release não publicado: HTTP ${res.status} em ${url}`);
  const body = Buffer.from(await res.arrayBuffer());
  const sha = createHash('sha256').update(body).digest('hex');
  if (sha !== release.sha256) throw new Error(`o arquivo publicado não bate com o release.json (SHA-256 ${sha} ≠ ${release.sha256})`);
  return { status: 'ok', url };
}
