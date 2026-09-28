# Site oficial da MAW

Site estático (Astro 7) da **MAW — Musical Artificial Workspace**, a DAW para Windows com IA na timeline. Todo o texto do site é em inglês. Spec em `docs/superpowers/specs/`, plano em `docs/superpowers/plans/`.

## Rodar

```bash
npm install
npm run dev          # http://localhost:4321
npm test             # testes unitários (Vitest)
npm run test:e2e     # build + preview + Playwright (desktop 1440 e celular 390)
npm run build && npm run check:dist   # sem português no site, links locais ok
```

## Onde mudar o conteúdo

| O quê | Arquivo |
|---|---|
| Versão, flags (`neuralServerBundled`, `sourceCodeUrl`) | `src/data/site.json` |
| Redes sociais: preencher `href` e `value` para aparecer | `src/data/channels.ts` |
| Roadmap, FAQ, créditos, história, requisitos, tracklist | `src/data/*.ts` |
| Prints | `src/assets/screens/` (ver `tools/screenshots/README.md`) |

## Instalador

`npm run installer` compila `installer/MAW.iss` (Inno Setup 6) a partir do `MAW_APP.exe` de Release e grava `src/data/release.json`. Variáveis: `MAW_REPO`, `MAW_EXE` e `ISCC`. Sem `release.json`, o botão de download mostra "Installer coming soon".

## Publicar

Nada é publicado automaticamente. O workflow `.github/workflows/deploy.yml` só roda manualmente e usa `BASE_PATH=/Site-oficial-MAW`. O GitHub Pages grátis exige repo público. O release do instalador depende da decisão sobre o código-fonte (GPL).

Com `src/data/release.json` presente, o botão aponta para `.../releases/download/v<versão>/MAW-Setup-<versão>.exe`. Por isso o site só deve ir ao ar **junto** com a publicação desse release, senão o link dá 404.

## Logo

O logo da MAW nunca é alterado. `python tools/logo_web.py --check` prova que o logo da web tem os mesmos pixels do original.
