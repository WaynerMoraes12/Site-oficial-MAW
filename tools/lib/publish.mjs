// Regras da cópia pública de um release da MAW (o repositório da MAW é privado; a cópia vai para os releases
// deste repositório, que é público). Quem distribui o binário oferece o código-fonte junto (GPL v3): o zip do
// código daquela versão vai no mesmo release, sem o que não faz parte do programa e é do autor (TCC, entregas,
// planos internos).

export const PRIVATE_PATHS = ['entregas', 'docs/TCC.md', 'docs/TCC-artigo.md', 'docs/figuras', 'docs/superpowers'];

// argumento de caminho do `git archive`: o repositório inteiro menos o que é privado
export const archivePathspec = () => ['.', ...PRIVATE_PATHS.map((p) => `:(exclude)${p}`)];

export const sourceZipName = (version) => `MAW-${version}-source.zip`;

// o que vai para o release público: tudo do release privado, o código-fonte e o índice dos sistemas
// (platforms.json: o build de macOS e Linux deste repositório acrescenta os pacotes nele)
export const publicFiles = (version, privateAssets) => [...privateAssets, sourceZipName(version), 'platforms.json'];

export function releaseNotes(version) {
  return [
    `MAW ${version} — Musical Artificial Workspace`,
    '',
    'Download page: https://waynermoraes12.github.io/Site-oficial-MAW/#download',
    '',
    `- **Windows 10/11 (64-bit):** \`MAW-Setup-${version}.exe\` — complete installer, AI included.`,
    `- **macOS 11+ / Linux x86-64:** built from the source below by this repository's workflow and attached here when ready.`,
    '',
    `MAW is free software under the **GNU GPL v3**. The complete source code of this version is \`${sourceZipName(version)}\`.`,
    'The sources of the bundled third-party components are attached too: FFmpeg (`MAW-FFmpeg-*-source.zip` and its build manifest)',
    'and PyAV with the FFmpeg it links (`*-pyav-corresponding-source.zip` and its manifest).',
    '',
    'Each file can be checked against the SHA-256 in `release.json` and `platforms.json`.',
  ].join('\n');
}
