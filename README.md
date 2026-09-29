# Site oficial da MAW

Site estático (Astro 7) da **MAW — Musical Artificial Workspace**, a DAW para Windows, macOS e Linux com IA na timeline (o instalador com a IA é o do Windows; macOS e Linux aparecem no site com "em breve" até a esteira da MAW publicar esses pacotes). O site nasce em inglês (`/`) e tem tradução nossa em português (`/pt/`) e espanhol (`/es/`); na raiz, quem não escolheu idioma abre na língua do navegador. Spec em `docs/superpowers/specs/` (tradução no §10), plano em `docs/superpowers/plans/`.

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
- **Anunciado**: issue aberta na MAW com a etiqueta `roadmap`. Quando um PR mencionar `#número` da issue (ou um branch for criado a partir dela, `73-…`), ela passa para Ensaiando. Um branch `feature/…` sem PR não sabe de qual issue é: cite `#número` no PR.

Para parada nova, o Claude CLI deste PC escreve o título curto em EN/PT/ES. Dá para corrigir qualquer texto direto no `src/data/tour.json`: o que já está escrito nunca é sobrescrito. `npm run check:tour` (dentro do `check:dist`) trava o deploy se faltar texto ou se o snapshot não for do instalador atual.

Uma tarefa do Agendador do Windows (**MAW Site - World Tour**) roda `scripts/tour-daily.ps1` todo dia às 09:00 (ou quando o PC ligar): sincroniza e, se mudou, commita só o `src/data/tour.json` e dá push no branch atual. Não roda se o `tour.json` ou o `release.json` tiverem mudança ainda não commitada, nem com merge/rebase em andamento. Atenção: o push sobe o branch inteiro, então commits seus ainda não enviados nesse branch vão junto. Log em `%LOCALAPPDATA%\MAW-site\tour-sync.log`. Registrar de novo: `powershell -ExecutionPolicy Bypass -File scripts\register-tour-task.ps1`; remover: `Unregister-ScheduledTask -TaskName 'MAW Site - World Tour' -Confirm:$false`.

## Instalador

O instalador agora é feito pela esteira do repositório da MAW (`.github/workflows/windows-release.yml` e `installer/` de lá): cada PR mergeado na `main` da MAW vira um release `vX.Y.Z` com o instalador completo (com a IA) e um `release.json`. O `npm run tour` (e a tarefa diária) baixa o `release.json` do último release para `src/data/release.json` e acompanha a versão em `src/data/site.json`; o botão de download aponta para os releases da MAW (`releaseBaseUrl`). Enquanto a MAW for privada, esse link não é público e o deploy continua travado pelo `check-release`, como deve. Spec: `docs/superpowers/specs/2026-09-28-esteira-e-atualizacao-design.md`.

O `npm run installer` daqui (Inno Setup com o `MAW_APP.exe` local) é o jeito antigo e sai quando a esteira da MAW publicar o primeiro release. Sem `release.json`, o botão de download mostra "Installer coming soon".

## Publicar

O site está no GitHub Pages: https://waynermoraes12.github.io/Site-oficial-MAW/ (este repositório é público; o da MAW continua privado). O workflow `.github/workflows/deploy.yml` publica a cada push na `main` — inclusive os da tarefa diária, que sobe o World Tour e o último release da MAW — e também pode ser disparado à mão (Actions → Deploy site to GitHub Pages → Run workflow). Usa `BASE_PATH=/Site-oficial-MAW`.

O botão de download só aparece se o instalador do `release.json` estiver publicado e igual: `tools/check-release.mjs` baixa o arquivo, confere o SHA-256 e, se não der (hoje, porque os releases da MAW são privados), o deploy tira o `release.json` e o site vai ao ar com "Installer coming soon". Quando a MAW for pública (a decisão da GPL), o download aparece sozinho no deploy seguinte.

## Logo

O logo da MAW nunca é alterado. `python tools/logo_web.py --check` prova que o logo da web tem os mesmos pixels do original.
