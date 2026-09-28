// Roda no deploy (antes de publicar o site): falha se o botão de download apontaria para um 404.
import { existsSync, readFileSync } from 'node:fs';
import { checkPublishedRelease, readReleaseJson } from './lib/release-check.mjs';

const site = JSON.parse(readFileSync('src/data/site.json', 'utf8'));
try {
  const release = readReleaseJson(existsSync('src/data/release.json') ? readFileSync('src/data/release.json', 'utf8') : undefined);
  const result = await checkPublishedRelease({ release, site });
  console.log(result.status === 'ok' ? `release publicado e conferido: ${result.url}` : 'sem release.json: site mostra "coming soon"');
} catch (err) {
  console.error(err.message);
  process.exitCode = 1;
}
