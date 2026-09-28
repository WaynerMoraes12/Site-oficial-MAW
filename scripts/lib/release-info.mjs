import { createHash } from 'node:crypto';
import { createReadStream, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';

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
export function buildReleaseInfo({ file, bytes, sha256, version, builtAt, installedBytes, mawCommit }) {
  // o site só mostra o download para versões x.y.z (src/lib/release.ts); qualquer outra ficaria "coming soon"
  if (!/^\d+\.\d+\.\d+$/.test(version)) throw new Error(`version inválida: ${version} (use x.y.z no site.json)`);
  if (file !== `MAW-Setup-${version}.exe`) throw new Error(`file inválido: ${file} (esperado MAW-Setup-${version}.exe)`);
  if (!Number.isInteger(bytes) || bytes <= 0) throw new Error(`bytes inválido: ${bytes}`);
  if (!/^[0-9a-f]{64}$/.test(sha256)) throw new Error(`sha256 inválido: ${sha256}`);
  if (installedBytes !== undefined && (!Number.isInteger(installedBytes) || installedBytes <= 0)) {
    throw new Error(`installedBytes inválido: ${installedBytes}`);
  }
  if (mawCommit !== undefined && !/^[0-9a-f]{40}$/.test(mawCommit)) throw new Error(`mawCommit inválido: ${mawCommit}`);
  const info = { file, bytes, sha256, version, builtAt };
  if (installedBytes !== undefined) info.installedBytes = installedBytes;
  if (mawCommit !== undefined) info.mawCommit = mawCommit;
  return info;
}

// O MAW.exe precisa ser mais novo que o commit da MAW que o release.json diz ser a origem dele;
// senão o repo andou depois da compilação e o commit gravado não descreve o que vai no instalador.
export function exeIsCurrent(exeMtime, commitDate) {
  return exeMtime.getTime() >= commitDate.getTime();
}

// O que o instalador põe na pasta do app ([Files] do .iss, fora o runtime que vai para o temp) mais o
// desinstalador: o unins000.exe é uma cópia do Setup.e32 do Inno Setup (o unins000.dat, de poucos KB, fica de fora).
export function installedFiles({ sourceExe, mawRepo, iscc }) {
  return [sourceExe, join(mawRepo, 'LICENSE'), join(mawRepo, 'LICENSE-THIRD-PARTY.md'), join(dirname(iscc), 'Setup.e32')];
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
