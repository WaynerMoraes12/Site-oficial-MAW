// Compila installer/MAW.iss e grava src/data/release.json (arquivo, tamanho, SHA-256).
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertMicrosoftSigned, buildReleaseInfo, exeIsCurrent, findIscc, installedFiles, parseProductVersion, parseRedistInfo, sha256File } from './lib/release-info.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const site = JSON.parse(readFileSync(join(root, 'src/data/site.json'), 'utf8'));
const mawRepo = process.env.MAW_REPO ?? 'C:\\Users\\User\\MAW';
const sourceExe = process.env.MAW_EXE ?? join(mawRepo, 'Builds', 'VisualStudio2022', 'x64', 'Release', 'App', 'MAW_APP.exe');

if (!existsSync(sourceExe)) throw new Error(`MAW_APP.exe não encontrado: ${sourceExe}`);

// De qual commit da MAW sai este MAW.exe: o World Tour usa para saber o que já está "na estrada".
const git = (...args) => execFileSync('git', ['-C', mawRepo, ...args], { encoding: 'utf8' }).trim();
const mawCommit = git('rev-parse', 'HEAD');
const commitDate = new Date(git('log', '-1', '--format=%cI', 'HEAD'));
if (!exeIsCurrent(statSync(sourceExe).mtime, commitDate)) {
  throw new Error(`MAW_APP.exe é mais velho que o commit ${mawCommit.slice(0, 7)} da MAW: compile a MAW de novo (ou volte o repo para o commit do exe)`);
}
if (git('status', '--porcelain', '--untracked-files=no')) console.warn(`aviso: o repo da MAW tem mudanças não commitadas; o release.json aponta para ${mawCommit.slice(0, 7)}`);

const redist = join(root, 'installer', 'redist', 'vc_redist.x64.exe');
if (!existsSync(redist)) {
  mkdirSync(dirname(redist), { recursive: true });
  let res = await fetch('https://aka.ms/vc14/vc_redist.x64.exe');
  if (!res.ok) res = await fetch('https://aka.ms/vs/17/release/vc_redist.x64.exe');
  if (!res.ok) throw new Error(`download do VC++ Redistributable falhou: HTTP ${res.status}`);
  writeFileSync(redist, Buffer.from(await res.arrayBuffer()));
  console.log(`baixado ${redist}`);
}

// Só empacota o runtime com assinatura válida da Microsoft; a versão vai para a checagem de registro do .iss.
const psCmd = `$p='${redist.replace(/'/g, "''")}'; $s=Get-AuthenticodeSignature -LiteralPath $p; [pscustomobject]@{Status=[string]$s.Status; Subject=[string]$s.SignerCertificate.Subject; Version=[string](Get-Item -LiteralPath $p).VersionInfo.ProductVersion} | ConvertTo-Json -Compress`;
const redistInfo = parseRedistInfo(execFileSync('powershell', ['-NoProfile', '-NonInteractive', '-Command', psCmd], { encoding: 'utf8' }));
assertMicrosoftSigned(redistInfo);
const redistVersion = parseProductVersion(redistInfo.version);
console.log(`vc_redist.x64.exe ${redistInfo.version}: assinatura Microsoft válida`);

const iscc = findIscc([
  process.env.ISCC,
  'C:\\Program Files (x86)\\Inno Setup 6\\ISCC.exe',
  process.env.LOCALAPPDATA && join(process.env.LOCALAPPDATA, 'Programs', 'Inno Setup 6', 'ISCC.exe'),
]);
if (!iscc) throw new Error('ISCC.exe não encontrado: instale o Inno Setup 6 ou defina ISCC');

execFileSync(iscc, [
  `/DAppVersion=${site.version}`, `/DSourceExe=${sourceExe}`, `/DMawRepo=${mawRepo}`,
  `/DRedistMajor=${redistVersion.major}`, `/DRedistMinor=${redistVersion.minor}`, `/DRedistBld=${redistVersion.build}`,
  join(root, 'installer', 'MAW.iss'),
], { stdio: 'inherit' });

const file = `MAW-Setup-${site.version}.exe`;
const out = join(root, 'installer', 'output', file);
const installedBytes = installedFiles({ sourceExe, mawRepo, iscc }).reduce((n, f) => n + statSync(f).size, 0);
const info = buildReleaseInfo({ file, bytes: statSync(out).size, sha256: await sha256File(out), version: site.version, builtAt: new Date().toISOString(), installedBytes, mawCommit });
writeFileSync(join(root, 'src', 'data', 'release.json'), `${JSON.stringify(info, null, 2)}\n`);
console.log(`release.json: ${file} · ${info.bytes} bytes · ${info.sha256} · MAW ${mawCommit.slice(0, 7)}`);
