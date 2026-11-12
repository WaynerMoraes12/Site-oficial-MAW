// npm run publish-release [X.Y.Z]: copia um release da MAW (repositório privado) para os releases deste repositório
// (público), com o código-fonte daquela versão — é o que deixa o botão de download do site funcionar.
// Roda neste PC: o gh daqui lê a MAW, e a cópia não precisa de token novo nem de minutos pagos do GitHub.
// Sem versão: a do último release da MAW. Já publicada e completa: não faz nada.
// Retoma de onde parou (rede lenta): baixa só o que falta, envia só o que falta, e só publica com tudo conferido.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createReadStream, existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { archivePathspec, publicFiles, releaseNotes, sourceZipName } from './lib/publish.mjs';

const MAW = 'WaynerMoraes12/MAW';
const SITE = 'WaynerMoraes12/Site-oficial-MAW';
const MAW_CLONE = process.env.MAW_REPO ?? 'C:/Users/User/MAW';

const run = (cmd, args, opts = {}) => execFileSync(cmd, args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, ...opts });
const gh = (...args) => run('gh', args);
const quiet = (...args) => {
  try {
    return run('gh', args, { stdio: ['ignore', 'pipe', 'ignore'] });
  } catch {
    return null;
  }
};
const log = (msg) => console.log(`${new Date().toISOString().slice(11, 19)} ${msg}`);
const sha256 = (file) =>
  new Promise((resolve, reject) => {
    const h = createHash('sha256');
    createReadStream(file).on('data', (d) => h.update(d)).on('end', () => resolve(h.digest('hex'))).on('error', reject);
  });

const tag = process.argv[2] ? `v${process.argv[2].replace(/^v/, '')}` : gh('release', 'view', '-R', MAW, '--json', 'tagName', '--jq', '.tagName').trim();
const version = tag.slice(1);
if (!/^\d+\.\d+\.\d+$/.test(version)) throw new Error(`versão inválida: ${tag}`);

const privateAssets = JSON.parse(gh('release', 'view', tag, '-R', MAW, '--json', 'assets')).assets.map((a) => ({ name: a.name, size: a.size }));
const wanted = publicFiles(version, privateAssets.map((a) => a.name));

// já publicada e completa: nada a fazer
const existing = quiet('release', 'view', tag, '-R', SITE, '--json', 'isDraft,assets');
const published = existing ? JSON.parse(existing) : null;
if (published && !published.isDraft && wanted.every((n) => published.assets.some((a) => a.name === n))) {
  log(`${tag} já está publicado em ${SITE}`);
  process.exit(0);
}
if (published && !published.isDraft) throw new Error(`${tag} existe em ${SITE} sem todos os arquivos: confira à mão (não mexo em release publicado)`);

// 1. arquivos do release privado (só o que falta ou veio pela metade)
const work = join(tmpdir(), `maw-publish-${version}`);
mkdirSync(work, { recursive: true });
for (const asset of privateAssets) {
  const local = join(work, asset.name);
  if (existsSync(local) && statSync(local).size === asset.size) continue;
  log(`baixando ${asset.name} (${(asset.size / 1048576).toFixed(1)} MB)`);
  gh('release', 'download', tag, '-R', MAW, '-p', asset.name, '-D', work, '--clobber');
  if (statSync(local).size !== asset.size) throw new Error(`${asset.name} veio incompleto`);
}
const release = JSON.parse(readFileSync(join(work, 'release.json'), 'utf8'));
if (release.version !== version || (await sha256(join(work, release.file))) !== release.sha256) {
  throw new Error('o instalador baixado não bate com o release.json: nada publicado');
}
log('instalador conferido pelo SHA-256');

// 2. código-fonte da versão, sem o que é privado do autor
const zip = join(work, sourceZipName(version));
run('git', ['-C', MAW_CLONE, 'fetch', '--quiet', '--tags', 'origin']);
const commit = run('git', ['-C', MAW_CLONE, 'rev-parse', `${tag}^{commit}`]).trim();
if (release.mawCommit && release.mawCommit !== commit) throw new Error(`a tag ${tag} (${commit}) não é o commit do instalador (${release.mawCommit})`);
run('git', ['-C', MAW_CLONE, 'archive', '--format=zip', `--prefix=MAW-${version}/`, '-o', zip, tag, '--', ...archivePathspec()]);
const source = { file: sourceZipName(version), bytes: statSync(zip).size, sha256: await sha256(zip) };
writeFileSync(join(work, 'platforms.json'), `${JSON.stringify({ version, commit, source }, null, 2)}\n`);
writeFileSync(join(work, 'notes.md'), releaseNotes(version));
log(`código-fonte: ${source.file} (${(source.bytes / 1048576).toFixed(1)} MB)`);

// 3. rascunho público, envio arquivo a arquivo (retomável), conferência e só então publica
if (!published) gh('release', 'create', tag, '-R', SITE, '--draft', '--title', `MAW ${version}`, '--notes-file', join(work, 'notes.md'));
for (const name of wanted) {
  const local = join(work, name);
  const size = statSync(local).size;
  const now = JSON.parse(gh('release', 'view', tag, '-R', SITE, '--json', 'assets')).assets.find((a) => a.name === name);
  if (now && now.size === size) continue;
  log(`enviando ${name} (${(size / 1048576).toFixed(1)} MB)`);
  gh('release', 'upload', tag, local, '-R', SITE, '--clobber');
}
const draft = JSON.parse(gh('release', 'view', tag, '-R', SITE, '--json', 'isDraft,assets'));
for (const name of wanted) {
  const up = draft.assets.find((a) => a.name === name);
  if (!up || up.size !== statSync(join(work, name)).size) throw new Error(`${name} não subiu inteiro; o release continua em rascunho`);
}
gh('release', 'edit', tag, '-R', SITE, '--draft=false', '--latest');
log(`${tag} publicado em https://github.com/${SITE}/releases/tag/${tag}`);

// 4. pede o build de macOS e Linux deste repositório (do código-fonte que acabou de subir)
if (quiet('workflow', 'run', 'build-mac-linux.yml', '-R', SITE, '-f', `version=${version}`) === null) {
  log('não deu para disparar o build de macOS e Linux: rode Actions > Build macOS e Linux à mão');
} else log('build de macOS e Linux disparado');
rmSync(work, { recursive: true, force: true });
