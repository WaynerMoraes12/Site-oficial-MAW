// Roda no deploy (antes de publicar o site): falha se o botão de download do Windows apontaria para um 404.
// Os pacotes de macOS e Linux e o zip do código-fonte vêm do platforms.json do release público; o que não estiver
// publicado (ou não bater o SHA-256) sai do release.json deste build, e só aquele sistema fica "em breve".
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { checkPublishedRelease, mergePlatforms, readReleaseJson } from './lib/release-check.mjs';

const RELEASE = 'src/data/release.json';
const site = JSON.parse(readFileSync('src/data/site.json', 'utf8'));
try {
  let release = readReleaseJson(existsSync(RELEASE) ? readFileSync(RELEASE, 'utf8') : undefined);
  if (release?.version) {
    const res = await fetch(`${site.releaseBaseUrl}/v${release.version}/platforms.json`, { redirect: 'follow' }).catch(() => null);
    if (res?.ok) release = mergePlatforms(release, await res.json());
  }
  const result = await checkPublishedRelease({ release, site });
  if (result.status === 'ok') {
    for (const d of result.dropped) console.log(`${d.key}: fica "em breve" (${d.reason})`);
    writeFileSync(RELEASE, `${JSON.stringify(result.release, null, 2)}\n`);
    const extra = ['macos', 'linux', 'source'].filter((k) => k in result.release);
    console.log(`release publicado e conferido: ${result.url}${extra.length ? ` (+ ${extra.join(', ')})` : ''}`);
  } else console.log('sem release.json: site mostra "coming soon"');
} catch (err) {
  console.error(err.message);
  process.exitCode = 1;
}
