import { createHash } from 'node:crypto';
import { createReadStream, existsSync } from 'node:fs';

export function sha256File(path) {
  return new Promise((resolve, reject) => {
    const hash = createHash('sha256');
    createReadStream(path)
      .on('data', (chunk) => hash.update(chunk))
      .on('end', () => resolve(hash.digest('hex')))
      .on('error', reject);
  });
}

// Mesmo formato que src/lib/release.ts aceita (isReleaseInfo).
export function buildReleaseInfo({ file, bytes, sha256, version, builtAt }) {
  if (!file.endsWith('.exe')) throw new Error(`file inválido: ${file}`);
  if (!Number.isInteger(bytes) || bytes <= 0) throw new Error(`bytes inválido: ${bytes}`);
  if (!/^[0-9a-f]{64}$/.test(sha256)) throw new Error(`sha256 inválido: ${sha256}`);
  return { file, bytes, sha256, version, builtAt };
}

export function findIscc(candidates, exists = existsSync) {
  return candidates.find((c) => c && exists(c)) ?? null;
}

// VC++ Redistributable baixado da Microsoft: só entra no instalador com assinatura válida dela.
export function parseRedistInfo(jsonText) {
  const o = JSON.parse(jsonText);
  return { status: String(o.Status ?? ''), subject: String(o.Subject ?? ''), version: String(o.Version ?? '') };
}

export function assertMicrosoftSigned(info) {
  if (info.status !== 'Valid' || !/(^|, )O=Microsoft Corporation(,|$)/.test(info.subject)) {
    throw new Error(`vc_redist.x64.exe sem assinatura válida da Microsoft (${info.status}; ${info.subject})`);
  }
}

// "14.51.36247.0" → { major: 14, minor: 51, build: 36247 } (o instalador compara com o registro).
export function parseProductVersion(version) {
  const m = /^(\d+)\.(\d+)\.(\d+)/.exec(version);
  if (!m) throw new Error(`versão do redist inválida: ${version}`);
  return { major: Number(m[1]), minor: Number(m[2]), build: Number(m[3]) };
}
