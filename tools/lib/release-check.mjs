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
// Mesma regra da página (src/lib/release.ts: isReleaseInfo + releaseView). Um teste confere que as duas concordam.
export function pageShowsDownload(release, site) {
  const r = release;
  return (
    typeof r === 'object' && r !== null &&
    typeof r.version === 'string' && /^\d+\.\d+\.\d+$/.test(r.version) && r.version === site.version &&
    r.file === `MAW-Setup-${r.version}.exe` &&
    Number.isInteger(r.bytes) && r.bytes > 0 &&
    typeof r.sha256 === 'string' && /^[0-9a-f]{64}$/.test(r.sha256) &&
    typeof r.builtAt === 'string' &&
    (r.installedBytes === undefined || (Number.isInteger(r.installedBytes) && r.installedBytes > 0)) &&
    (r.mawCommit === undefined || (typeof r.mawCommit === 'string' && /^[0-9a-f]{40}$/.test(r.mawCommit)))
  );
}

// Os outros arquivos do release público (pacote do macOS, do Linux e o zip do código-fonte), descritos no
// platforms.json do release. Mesma regra da página (src/lib/release.ts: isPackageInfo); um teste confere.
export const PACKAGES = ['source', 'macos', 'linux'];
const packageFile = (key, version) =>
  key === 'macos' ? `MAW-${version}-macos-universal.zip` : key === 'linux' ? `MAW-${version}-linux-x86_64.tar.gz` : `MAW-${version}-source.zip`;

export function validPackage(key, p, version) {
  return (
    typeof p === 'object' && p !== null &&
    p.file === packageFile(key, version) &&
    Number.isInteger(p.bytes) && p.bytes > 0 &&
    typeof p.sha256 === 'string' && /^[0-9a-f]{64}$/.test(p.sha256)
  );
}

// junta ao release.json os pacotes do platforms.json da mesma versão (o que não for válido fica de fora)
export function mergePlatforms(release, platforms) {
  if (!platforms || platforms.version !== release?.version) return release;
  const out = { ...release };
  for (const key of PACKAGES) if (validPackage(key, platforms[key], release.version)) out[key] = platforms[key];
  return out;
}

async function sameFile(url, sha256, fetchImpl) {
  const res = await fetchImpl(url, { redirect: 'follow' });
  if (!res.ok) return `HTTP ${res.status}`;
  const sha = createHash('sha256').update(Buffer.from(await res.arrayBuffer())).digest('hex');
  return sha === sha256 ? null : `SHA-256 ${sha} ≠ ${sha256}`;
}

// O instalador do Windows decide se o site mostra download (sem ele, o deploy para); cada pacote a mais que não
// estiver publicado ou não bater o SHA-256 sai do release.json, e só aquele sistema fica "em breve".
export async function checkPublishedRelease({ release, site, fetchImpl = fetch }) {
  if (!release) return { status: 'pending' };
  if (!pageShowsDownload(release, site)) {
    throw new Error('release.json existe, mas a página mostraria "coming soon" (versão, arquivo ou hash não batem com o site.json): gere de novo com npm run installer');
  }
  const base = `${site.releaseBaseUrl}/v${release.version}`;
  const url = `${base}/${release.file}`;
  const problem = await sameFile(url, release.sha256, fetchImpl);
  if (problem?.startsWith('HTTP')) throw new Error(`release não publicado: ${problem} em ${url}`);
  if (problem) throw new Error(`o arquivo publicado não bate com o release.json (${problem})`);
  const verified = { ...release };
  const dropped = [];
  for (const key of PACKAGES) {
    if (!(key in verified)) continue;
    const p = verified[key];
    const why = validPackage(key, p, release.version) ? await sameFile(`${base}/${p.file}`, p.sha256, fetchImpl) : 'descrição inválida';
    if (why) {
      delete verified[key];
      dropped.push({ key, reason: why });
    }
  }
  return { status: 'ok', url, release: verified, dropped };
}
