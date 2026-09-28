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

// Espaço em disco medido no build do instalador, arredondado para cima ("10 MB"); null se não houver medida.
export function diskLabel(raw: unknown, site: { version: string }): string | null {
  if (!isReleaseInfo(raw) || raw.version !== site.version || raw.installedBytes === undefined) return null;
  return `${Math.ceil(raw.installedBytes / (1024 * 1024))} MB`;
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
