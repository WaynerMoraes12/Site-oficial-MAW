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
