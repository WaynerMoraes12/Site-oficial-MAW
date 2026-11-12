export interface ReleaseInfo {
  file: string;
  bytes: number;
  sha256: string;
  version: string;
  builtAt: string;
  // o que o instalador põe na pasta do app (MAW.exe + licenças), para o espaço em disco do rider
  installedBytes?: number;
  // commit da MAW de onde saiu o MAW.exe do instalador (o World Tour usa para saber o que está "na estrada")
  mawCommit?: string;
}

export type ReleaseView =
  | { state: 'ready'; url: string; file: string; sizeLabel: string; sha256: string }
  | { state: 'pending' };

// Só o instalador com o nome da própria versão (MAW-Setup-1.0.0.exe): o nome vai direto na URL de download.
export function isReleaseInfo(raw: unknown): raw is ReleaseInfo {
  if (typeof raw !== 'object' || raw === null) return false;
  const r = raw as Record<string, unknown>;
  return (
    typeof r.version === 'string' && /^\d+\.\d+\.\d+$/.test(r.version) && r.file === `MAW-Setup-${r.version}.exe` &&
    typeof r.bytes === 'number' && Number.isInteger(r.bytes) && r.bytes > 0 &&
    typeof r.sha256 === 'string' && /^[0-9a-f]{64}$/.test(r.sha256) &&
    typeof r.builtAt === 'string' &&
    (r.installedBytes === undefined || (typeof r.installedBytes === 'number' && Number.isInteger(r.installedBytes) && r.installedBytes > 0)) &&
    (r.mawCommit === undefined || (typeof r.mawCommit === 'string' && /^[0-9a-f]{40}$/.test(r.mawCommit)))
  );
}

// release.json é gerado pelo build do instalador; se vier corrompido, o site mostra "coming soon" em vez de quebrar o build.
export function parseRelease(text: string | undefined): unknown {
  if (text === undefined) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export function formatBytes(bytes: number): string {
  const mb = 1024 * 1024;
  return bytes < mb ? `${Math.round(bytes / 1024)} KB` : `${(bytes / mb).toFixed(1)} MB`;
}

// Espaço em disco medido no build do instalador, arredondado para cima ("10 MB", "2.1 GB" / "2,1 GB"). Sem o
// release.json (o deploy tira enquanto o download não é público), vale a medida que o site guardou do último
// release (site.json); null se não houver medida.
export function diskLabel(raw: unknown, site: { version: string; installedBytes?: number }, lang = 'en'): string | null {
  const fromRelease = isReleaseInfo(raw) && raw.version === site.version ? raw.installedBytes : undefined;
  const bytes = fromRelease ?? site.installedBytes;
  if (bytes === undefined) return null;
  const mb = Math.ceil(bytes / (1024 * 1024));
  if (mb < 1024) return `${mb} MB`;
  const gb = Math.ceil((bytes / 1024 ** 3) * 10) / 10;
  return `${gb.toLocaleString(lang, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} GB`;
}

// Os outros arquivos do release público: o pacote do macOS, o do Linux (compilados neste repositório a partir do
// código-fonte publicado) e o zip do código-fonte. Vêm do platforms.json do release; cada um tem o nome da versão.
export type Package = 'macos' | 'linux' | 'source';
export interface PackageInfo {
  file: string;
  bytes: number;
  sha256: string;
}
export interface DownloadLink {
  url: string;
  file: string;
  sizeLabel: string;
  sha256: string;
}

export const packageFile = (key: Package, version: string): string =>
  key === 'macos' ? `MAW-${version}-macos-universal.zip` : key === 'linux' ? `MAW-${version}-linux-x86_64.tar.gz` : `MAW-${version}-source.zip`;

// Mesma regra do deploy (tools/lib/release-check.mjs: validPackage). Um teste confere que as duas concordam.
export function isPackageInfo(key: Package, raw: unknown, version: string): raw is PackageInfo {
  if (typeof raw !== 'object' || raw === null) return false;
  const p = raw as Record<string, unknown>;
  return (
    p.file === packageFile(key, version) &&
    typeof p.bytes === 'number' && Number.isInteger(p.bytes) && p.bytes > 0 &&
    typeof p.sha256 === 'string' && /^[0-9a-f]{64}$/.test(p.sha256)
  );
}

// Só com o instalador do Windows desta versão pronto; o pacote que falta (ou não confere) fica "em breve".
export function extraDownloads(raw: unknown, site: { version: string; releaseBaseUrl: string }): Partial<Record<Package, DownloadLink>> {
  if (releaseView(raw, site).state !== 'ready') return {};
  const r = raw as Record<string, unknown>;
  const out: Partial<Record<Package, DownloadLink>> = {};
  for (const key of ['macos', 'linux', 'source'] as const) {
    const p = r[key];
    if (!isPackageInfo(key, p, site.version)) continue;
    out[key] = { url: `${site.releaseBaseUrl}/v${site.version}/${p.file}`, file: p.file, sizeLabel: formatBytes(p.bytes), sha256: p.sha256 };
  }
  return out;
}

// Sem instalador válido desta versão, o site mostra "coming soon" em vez de link quebrado.
export function releaseView(raw: unknown, site: { version: string; releaseBaseUrl: string }): ReleaseView {
  if (!isReleaseInfo(raw) || raw.version !== site.version) return { state: 'pending' };
  return {
    state: 'ready',
    url: `${site.releaseBaseUrl}/v${raw.version}/${raw.file}`,
    file: raw.file,
    sizeLabel: formatBytes(raw.bytes),
    sha256: raw.sha256,
  };
}
