# Site oficial da MAW

Site estático (Astro 7) da **MAW — Musical Artificial Workspace**, a DAW para Windows com IA na timeline. O site nasce em inglês (`/`) e tem tradução nossa em português (`/pt/`) e espanhol (`/es/`); na raiz, quem não escolheu idioma abre na língua do navegador. Spec em `docs/superpowers/specs/` (tradução no §10), plano em `docs/superpowers/plans/`.

## Rodar

```bash
npm install
npm run dev          # http://localhost:4321
npm test             # testes unitários (Vitest)
npm run test:e2e     # build + preview + Playwright (desktop 1440 e celular 390)
npm run build && npm run check:dist   # sem português na página em inglês, links locais ok
python -m unittest discover -s tools/tests   # logo e ícones
```

### Testar com o subcaminho do GitHub Pages

No PowerShell:

```powershell
$env:BASE_PATH = '/Site-oficial-MAW'; npm run build; npm run check:dist; Remove-Item Env:BASE_PATH
```

No Git Bash, desligue a conversão de caminhos, senão `/Site-oficial-MAW` vira `C:/Program Files/Git/Site-oficial-MAW` e o verificador acusa centenas de links quebrados:

```bash
MSYS_NO_PATHCONV=1 BASE_PATH=/Site-oficial-MAW npm run build
MSYS_NO_PATHCONV=1 BASE_PATH=/Site-oficial-MAW npm run check:dist
```

## Onde mudar o conteúdo

| O quê | Arquivo |
|---|---|
| Versão, flags (`neuralServerBundled`, `sourceCodeUrl`) | `src/data/site.json` |
| Redes sociais: preencher `href` e `value` para aparecer | `src/data/channels.ts` |
| Todo texto visível (inglês, português, espanhol) | `src/i18n/en.ts`, `pt.ts`, `es.ts` (mesmo formato; os testes acusam frase esquecida em inglês) |
| O que não é texto: atalhos, status do roadmap, números, imagens | `src/data/*.ts` |
| Prints | `src/assets/screens/` (ver `tools/screenshots/README.md`) |

## Instalador

`npm run installer` compila `installer/MAW.iss` (Inno Setup 6) a partir do `MAW_APP.exe` de Release e grava `src/data/release.json`. Variáveis: `MAW_REPO`, `MAW_EXE` e `ISCC`. Sem `release.json`, o botão de download mostra "Installer coming soon".

## Publicar

Nada é publicado automaticamente. O workflow `.github/workflows/deploy.yml` só roda manualmente e usa `BASE_PATH=/Site-oficial-MAW`. O GitHub Pages grátis exige repo público. O release do instalador depende da decisão sobre o código-fonte (GPL).

Com `src/data/release.json` presente, o botão aponta para `.../releases/download/v<versão>/MAW-Setup-<versão>.exe`. Por isso o site só deve ir ao ar **junto** com a publicação desse release, senão o link dá 404. O workflow garante isso: `tools/check-release.mjs` baixa o arquivo publicado, confere o SHA-256 e para o deploy se não bater.

Ordem para publicar: (1) criar o release `v<versão>` neste repo com o `installer/output/MAW-Setup-<versão>.exe`; (2) Actions → Deploy site to GitHub Pages → Run workflow.

## Logo

O logo da MAW nunca é alterado. `python tools/logo_web.py --check` prova que o logo da web tem os mesmos pixels do original.
