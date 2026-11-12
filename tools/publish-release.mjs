// npm run publish-release [X.Y.Z]: copia um release da MAW (repositório privado) para os releases deste repositório
// (público), com o código-fonte daquela versão — é o que deixa o botão de download do site funcionar.
// Roda neste PC: o gh daqui lê a MAW, e a cópia não precisa de token novo nem de minutos pagos do GitHub.
// Sem versão: a do último release da MAW. Já publicada e completa: não faz nada.
// Retoma de onde parou (rede lenta): baixa só o que falta, envia só o que falta, e só publica com tudo conferido.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { appendFileSync, createReadStream, existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
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

const privateAssets = JSON.parse(gh('release', 'view', tag, '-R', MAW, '--json', 'assets')).assets.map((a) => ({ name: a.name, size: a.size, apiUrl: a.apiUrl }));

// Download em trechos de 8 MB pela API (o gh autentica; o Range segue no redirecionamento para o armazenamento do
// GitHub): numa rede lenta e instável, um download de 500 MB de uma vez cai no meio (PROTOCOL_ERROR) e o gh release
// download não retoma. Aqui cada trecho que chega fica no disco, e a próxima tentativa continua dali.
const CHUNK = 8 * 1024 * 1024;
const pause = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
function downloadResumable(asset, local) {
  let have = existsSync(local) ? statSync(local).size : 0;
  if (have > asset.size) {
    rmSync(local);
    have = 0;
  }
  let failures = 0;
  let reported = have;
  while (have < asset.size) {
    const end = Math.min(have + CHUNK, asset.size) - 1;
    try {
      const part = execFileSync('gh', ['api', '-H', 'Accept: application/octet-stream', '-H', `Range: bytes=${have}-${end}`, asset.apiUrl], {
        maxBuffer: CHUNK + 65536,
        stdio: ['ignore', 'pipe', 'pipe'],
        timeout: 10 * 60 * 1000,
      });
      if (part.length !== end - have + 1) throw new Error(`trecho veio com ${part.length} bytes em vez de ${end - have + 1}`);
      appendFileSync(local, part);
      have += part.length;
      failures = 0;
      if (have - reported >= 64 * 1024 * 1024 || have === asset.size) {
        log(`  ${asset.name}: ${(have / 1048576).toFixed(0)} de ${(asset.size / 1048576).toFixed(0)} MB`);
        reported = have;
      }
    } catch (err) {
      if (++failures > 8) throw new Error(`${asset.name}: a rede falhou 8 vezes seguidas (${String(err.message).split('\n')[0]})`);
      log(`  ${asset.name}: falha de rede, tento de novo (${failures}/8)`);
      pause(15000 * failures);
    }
  }
}
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
  downloadResumable(asset, local);
}

// confere cada arquivo pelo SHA-256 que o próprio release declara (instalador no release.json; FFmpeg e PyAV nos
// índices deles). Arquivo diferente é apagado, para a próxima tentativa baixar de novo; nada é publicado.
const release = JSON.parse(readFileSync(join(work, 'release.json'), 'utf8'));
if (release.version !== version) throw new Error(`release.json é da ${release.version}, não da ${version}`);
const expected = [[release.file, release.sha256]];
for (const index of ['ffmpeg-artifacts.json', `MAW-${version}-pyav-artifacts.json`]) {
  if (!existsSync(join(work, index))) continue;
  const data = JSON.parse(readFileSync(join(work, index), 'utf8'));
  for (const entry of Object.values(data)) if (entry?.file && entry?.sha256) expected.push([entry.file, entry.sha256]);
}
for (const [file, sha] of expected) {
  if ((await sha256(join(work, file))) !== sha) {
    rmSync(join(work, file), { force: true });
    throw new Error(`${file} não bate com o SHA-256 do release: apagado, rode de novo para baixar outra vez`);
  }
}
log(`${expected.length} arquivos conferidos pelo SHA-256 (instalador, FFmpeg, PyAV)`);

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
  // o envio para o GitHub não retoma: se a rede cair no meio, manda o arquivo de novo (até 3 vezes)
  for (let attempt = 1; ; attempt++) {
    try {
      gh('release', 'upload', tag, local, '-R', SITE, '--clobber');
      break;
    } catch (err) {
      if (attempt === 3) throw err;
      log(`  envio de ${name} falhou (${String(err.message).split('\n')[0]}); tentativa ${attempt + 1}/3`);
      pause(30000);
    }
  }
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
