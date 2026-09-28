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
| Ícones (aba, apple-touch, instalador) | `python tools/make_icons.py` a partir do ícone oficial do app da MAW |

## World Tour (roadmap)

O World Tour não é escrito à mão: `npm run tour` lê o GitHub da MAW e grava `src/data/tour.json` (spec §11).

- **Na estrada**: a versão que está no instalador do site (o `mawCommit` do `release.json`).
- **Ensaiando**: PR de recurso (`feature/*` ou título `feat…`) mergeado na `main` da MAW depois do instalador, PR de recurso aberto, ou branch `feature/*` com trabalho e sem PR.
- **Anunciado**: issue aberta na MAW com a etiqueta `roadmap`. Quando um PR mencionar `#número` da issue (ou o branch for criado a partir dela), ela passa para Ensaiando.

Para parada nova, o Claude CLI deste PC escreve o título curto em EN/PT/ES. Dá para corrigir qualquer texto direto no `src/data/tour.json`: o que já está escrito nunca é sobrescrito. `npm run check:tour` (dentro do `check:dist`) trava o deploy se faltar texto ou se o snapshot não for do instalador atual.

Uma tarefa do Agendador do Windows (**MAW Site - World Tour**) roda `scripts/tour-daily.ps1` todo dia às 09:00 (ou quando o PC ligar): sincroniza e, se mudou, commita só o `src/data/tour.json` e dá push no branch atual. Não roda se o `tour.json` tiver mudança sua ainda não commitada. Log em `%LOCALAPPDATA%\MAW-site\tour-sync.log`. Registrar de novo: `powershell -ExecutionPolicy Bypass -File scripts\register-tour-task.ps1`; remover: `Unregister-ScheduledTask -TaskName 'MAW Site - World Tour' -Confirm:$false`.

## Instalador

`npm run installer` compila `installer/MAW.iss` (Inno Setup 6) a partir do `MAW_APP.exe` de Release e grava `src/data/release.json`. Variáveis: `MAW_REPO`, `MAW_EXE` e `ISCC`. Sem `release.json`, o botão de download mostra "Installer coming soon".

## Publicar

Nada é publicado automaticamente. O workflow `.github/workflows/deploy.yml` só roda manualmente e usa `BASE_PATH=/Site-oficial-MAW`. O GitHub Pages grátis exige repo público. O release do instalador depende da decisão sobre o código-fonte (GPL).

Com `src/data/release.json` presente, o botão aponta para `.../releases/download/v<versão>/MAW-Setup-<versão>.exe`. Por isso o site só deve ir ao ar **junto** com a publicação desse release, senão o link dá 404. O workflow garante isso: `tools/check-release.mjs` baixa o arquivo publicado, confere o SHA-256 e para o deploy se não bater.

Ordem para publicar: (1) criar o release `v<versão>` neste repo com o `installer/output/MAW-Setup-<versão>.exe`; (2) Actions → Deploy site to GitHub Pages → Run workflow.

## Logo

O logo da MAW nunca é alterado. `python tools/logo_web.py --check` prova que o logo da web tem os mesmos pixels do original.
