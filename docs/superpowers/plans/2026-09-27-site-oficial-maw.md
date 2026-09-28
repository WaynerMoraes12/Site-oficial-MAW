# Site oficial da MAW — Plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** construir o site oficial da MAW, uma página única estática, 100% em inglês, fiel ao mockup v2 "o site como um disco", mais o instalador Windows (Inno Setup) com o `release.json` que o site consome.

**Architecture:**
- Astro 7 gera HTML estático. Cada seção do mockup vira um componente `.astro`.
- Todo o texto vem de arquivos de dados em `src/data/`. As regras que podem quebrar ficam em funções puras em `src/lib/` e `tools/lib/`, com testes unitários (Vitest).
- O resultado construído é testado de ponta a ponta (Playwright, desktop 1440 e celular 390).
- O CSS é o do mockup aprovado, copiado por intervalo de linhas e editado nos pontos listados.
- O instalador é um script Inno Setup, compilado por um script Node que calcula o SHA-256 e grava `src/data/release.json`.

**Tech Stack:**
- Site: Astro 7.3.5, @astrojs/sitemap 3.7.4, sharp 0.35.5, @fontsource (8 famílias, só o subconjunto latino)
- Testes: Vitest 5.0.2, @playwright/test 1.63.0
- Utilitários: fflate 0.8.3; Python 3.13 com Pillow e numpy (ferramentas de logo e ícone)
- Instalador: Inno Setup 6
- Ambiente: Node 24 (mínimo exigido pelo Astro 7: 22.12)

**Spec:** `docs/superpowers/specs/2026-09-27-site-oficial-maw-design.md`. Mockup de referência: `docs/superpowers/mockups/site-v2.html`.

**Desvios do spec, só de nome ou formato:**
- `site.config.ts` virou `src/data/site.json`, pra ser lido pelo Astro e pelos scripts Node.
- `scripts/build-installer.ps1` virou `scripts/build-installer.mjs`, testável com Vitest.
- `tools/logo-web.py` virou `tools/logo_web.py`, nome válido de módulo Python.

## Global Constraints

- **Todo o texto visível do site em inglês.** Exceções permitidas:
  - nomes de botões do app exatamente como aparecem na MAW (`MENU`, `EFEITO`, `MIXER`, `PIANO ROLL`, `KEYBOARD`, `METRO`, `UI`, `MIDI`)
  - o nome do projeto demo "Noite Roxa"
  - nomes próprios (Wayner Pires de Moraes, Centro Universitário Hermínio Ometto, FHO, Araras)
- **O logo da MAW nunca é alterado.**
  - Sem filtro, brilho, glitch, recolorir ou redesenhar.
  - Na web, só o fundo preto (máximo dos canais ≤ 12) vira transparente, e os pixels do desenho ficam idênticos ao original.
  - O logo **nunca** passa por `<Image>`/`<Picture>` (compressão com perda). Usa `<img src={logo.src}>` com o atributo `data-logo`.
- **Nenhuma ilustração desenhada à mão** (brasões, asas, rosas, microfones). Só tipografia, composição, formas geométricas e os prints reais.
- **As bandas não são citadas no site.** O rodapé diz: "MAW is not affiliated with any artist or band."
- **Nada é publicado** (GitHub Pages ou GitHub Release) sem autorização explícita do usuário.
- **Instalar software** (Inno Setup via winget) e **rodar o instalador neste PC** só com OK explícito do usuário, pedido na hora.
- Sem analytics, cookies ou framework de UI. Fontes servidas localmente via `@fontsource/*` (arquivos `latin-*.css`).
- `prefers-reduced-motion: reduce` desliga toda animação.
- Base path configurável: `SITE_URL` e `BASE_PATH` (padrão `/`; GitHub Pages usa `/Site-oficial-MAW`).
- Versão da MAW: `1.0.0`. O arquivo do instalador é `MAW-Setup-1.0.0.exe`.
- E-mail oficial: `waynerbusiness@outlook.com`. Redes sociais vazias não aparecem.
- Flags: `neuralServerBundled = false` (bug #1 da MAW ainda aberto) e `sourceCodeUrl = ""` (decisão da GPL pendente).

## Review Focus

As cinco situações que o spec implica, que os testes de cada seção não cobrem sozinhos e que mais podem pegar uma pessoa de verdade:

1. **Instalador ainda não construído** (sem `src/data/release.json`, ou com JSON inválido, ou de outra versão): o botão de download vira "Installer coming soon" desabilitado. Nunca aparece link quebrado nem hash vazio. Coberto na Task 3 (unit `releaseView`) e na Task 7 (e2e lê o estado real do repo).
2. **Deploy em subcaminho `/Site-oficial-MAW/`:** todo `src`, `href` e `srcset` local precisa começar pelo base e apontar para um arquivo que existe em `dist/`. Coberto na Task 9 (unit `brokenRefs` + build com `BASE_PATH` + checker).
3. **Celular de 390 px:** nenhum título, parágrafo ou botão pode vazar da tela (o vinil saindo da capa, palavras grandes cromadas como "UNDERSTANDS"/"DELIVER", pedalboard, tabela do rider). Coberto na Task 9 (e2e mede o retângulo de cada elemento de texto).
4. **`prefers-reduced-motion: reduce`:** vinil, faixa de LED, glitch, feixes, sigilo, selo holográfico e ponto de REC param. O vinil continua visível, saindo da capa. Coberto na Task 9 (e2e varre `animation-name` de todos os elementos e pseudo-elementos).
5. **Português escondido em atributos** (`alt`, `aria-label`, `title`, `content`) ou legendas, e não só no texto visível: o verificador olha os atributos também. Coberto na Task 9 (unit com caso de atributo + execução sobre `dist/`).

---

## Estrutura de arquivos

```
package.json                         scripts e dependências
astro.config.mjs                     site/base por env, sitemap
tsconfig.json
vitest.config.ts
playwright.config.ts                 desktop 1440 + mobile 390, servidor = build + preview
src/
  pages/index.astro                  monta as seções em ordem
  pages/robots.txt.ts                robots com o link do sitemap
  layouts/Base.astro                 <head> (SEO, OG, favicon), fontes, CSS global
  styles/global.css                  CSS do mockup (linhas 11–304) + edições + acréscimos
  components/Nav.astro Hero.astro LedTicker.astro Footer.astro
  components/Stage.astro
  components/Tracklist.astro AiSection.astro Rack.astro Backstage.astro
  components/TechRider.astro ReadBeforeInstall.astro Download.astro
  components/WorldTour.astro LinerNotes.astro Faq.astro Contact.astro
  lib/url.ts channels.ts release.ts barcode.ts notices.ts     regras puras (testadas)
  data/site.json                     versão, flags, URLs
  data/release.json                  GERADO pelo build do instalador (commitado)
  data/ticker.ts tracklist.ts roadmap.ts faq.ts liner.ts rider.ts channels.ts
  data/stage.ts ai.ts rack.ts backstage.ts                    (importam prints)
  assets/screens/*.png               prints reais da MAW
  assets/brand/maw-logo-web.png      logo com fundo transparente (gerado)
public/
  favicon.png apple-touch-icon.png og-image.png
  press/logo_MAW.png press/icon_MAW.png                       originais, byte a byte
  press/maw-screenshots.zip          GERADO no prebuild (fora do git)
tools/
  logo_web.py make_icons.py tests/test_brand.py               marca (Python)
  lib/portuguese.mjs lib/base-links.mjs                        regras dos checkers
  check-portuguese.mjs check-base-links.mjs press-kit.mjs og-image.mjs
  screenshots/                       gerador do projeto demo + automação dos prints
scripts/
  lib/release-info.mjs build-installer.mjs
installer/
  MAW.iss maw.ico redist/ (fora do git) output/ (fora do git)
tests/
  unit/*.test.ts
  e2e/*.spec.ts
.github/workflows/deploy.yml         só workflow_dispatch (não roda sozinho)
README.md
```

**Trabalhar num branch:** `feat/site-v1`. Criar no início da Task 1 com `git switch -c feat/site-v1`, se a execução não estiver num worktree.

---

### Task 1: Esqueleto do projeto, ferramentas de teste e CSS base

**Files:**
- Create: `package.json`, `astro.config.mjs`, `tsconfig.json`, `vitest.config.ts`, `playwright.config.ts`
- Create: `src/data/site.json`, `src/lib/url.ts`, `src/layouts/Base.astro`, `src/pages/index.astro`, `src/styles/global.css`
- Create: `src/assets/screens/*.png` (cópia dos prints)
- Test: `tests/unit/url.test.ts`, `tests/e2e/smoke.spec.ts`
- Modify: `.gitignore`

**Interfaces:**
- Produces: `withBase(path: string, base?: string): string` em `src/lib/url.ts`
- Produces: `src/data/site.json` com as chaves `name, fullName, version, year, author, description, neuralServerBundled, sourceCodeUrl, releaseBaseUrl`
- Produces: layout `Base.astro` com props opcionais `{ title?: string; description?: string }`
- Produces: classes CSS do mockup + as novas `.h-rock`, `.h-rock.xl`, `.h-rock.sm`, `.h-goth.md`, `.h-stencil.white`, `.lede.mt`, `.runtime.app/.server`, `.nav-toggle`, `.tracks`, `.rider-note`, `.source-link`, `.visually-hidden`

- [ ] **Step 1: Criar o branch e o `package.json`**

```bash
git switch -c feat/site-v1
```

`package.json`:
```json
{
  "name": "site-oficial-maw",
  "private": true,
  "type": "module",
  "engines": { "node": ">=22.12.0" },
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "test": "vitest run",
    "test:e2e": "playwright test"
  }
}
```

- [ ] **Step 2: Instalar dependências**

```bash
npm install astro@^7.3.5 @astrojs/sitemap@^3.7.4 sharp@^0.35.5 @fontsource/anton@^5.3.0 @fontsource/grenze-gotisch@^5.3.0 @fontsource/syncopate@^5.3.0 @fontsource/barlow@^5.3.0 @fontsource/barlow-condensed@^5.3.0 @fontsource/jetbrains-mono@^5.3.0 @fontsource/share-tech-mono@^5.3.0 @fontsource/big-shoulders-stencil-display@^5.3.0
npm install -D vitest@^5.0.2 @playwright/test@^1.63.0
npx playwright install chromium
```
Esperado: sem erros. `node_modules/@fontsource/anton/latin-400.css` existe.

- [ ] **Step 3: Configs**

`astro.config.mjs`:
```js
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// SITE_URL e BASE_PATH vêm do ambiente: GitHub Pages usa BASE_PATH=/Site-oficial-MAW
export default defineConfig({
  site: process.env.SITE_URL ?? 'https://waynermoraes12.github.io',
  base: process.env.BASE_PATH ?? '/',
  integrations: [sitemap()],
});
```

`tsconfig.json`:
```json
{
  "extends": "astro/tsconfigs/strict",
  "include": [".astro/types.d.ts", "**/*"],
  "exclude": ["dist", "node_modules"]
}
```

`vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: { include: ['tests/unit/**/*.test.ts'], environment: 'node' },
});
```

`playwright.config.ts`:
```ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 30_000,
  webServer: {
    command: 'npm run build && npm run preview -- --host 127.0.0.1 --port 4321',
    url: 'http://127.0.0.1:4321',
    reuseExistingServer: !process.env.CI,
    timeout: 240_000,
  },
  use: { baseURL: 'http://127.0.0.1:4321' },
  projects: [
    { name: 'desktop', use: { browserName: 'chromium', viewport: { width: 1440, height: 900 } } },
    {
      name: 'mobile',
      use: { browserName: 'chromium', viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 3 },
    },
  ],
});
```

Acrescentar ao `.gitignore`:
```
# gerados
public/press/maw-screenshots.zip
test-results/
playwright-report/
.lighthouse.json
installer/redist/
.shots/
```

- [ ] **Step 4: `site.json`**

`src/data/site.json`:
```json
{
  "name": "MAW",
  "fullName": "Musical Artificial Workspace",
  "version": "1.0.0",
  "year": 2026,
  "author": "Wayner Pires de Moraes",
  "description": "MAW (Musical Artificial Workspace) is a multitrack music production workstation for Windows with AI built into the timeline: stem separation, transcription, chord detection and a mix advisor.",
  "neuralServerBundled": false,
  "sourceCodeUrl": "",
  "releaseBaseUrl": "https://github.com/WaynerMoraes12/Site-oficial-MAW/releases/download"
}
```

- [ ] **Step 5: Escrever o teste de `withBase` (falha)**

`tests/unit/url.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { withBase } from '../../src/lib/url';

describe('withBase', () => {
  it('joins a path to the root base', () => {
    expect(withBase('press/logo.png', '/')).toBe('/press/logo.png');
  });
  it('accepts a base without trailing slash', () => {
    expect(withBase('/press/logo.png', '/Site-oficial-MAW')).toBe('/Site-oficial-MAW/press/logo.png');
  });
  it('accepts a base with trailing slash and a path with leading slashes', () => {
    expect(withBase('//og-image.png', '/Site-oficial-MAW/')).toBe('/Site-oficial-MAW/og-image.png');
  });
  it('returns the base itself for an empty path', () => {
    expect(withBase('', '/Site-oficial-MAW')).toBe('/Site-oficial-MAW/');
  });
});
```

Run: `npx vitest run tests/unit/url.test.ts`
Esperado: FAIL, "Failed to resolve import ../../src/lib/url".

- [ ] **Step 6: Implementar `withBase`**

`src/lib/url.ts`:
```ts
// Junta um caminho ao base do site (Astro BASE_URL), aceitando base com ou sem barra final.
export function withBase(path: string, base: string = import.meta.env.BASE_URL ?? '/'): string {
  const b = base.endsWith('/') ? base : `${base}/`;
  return `${b}${path.replace(/^\/+/, '')}`;
}
```

Run: `npx vitest run tests/unit/url.test.ts`
Esperado: PASS (4 testes).

- [ ] **Step 7: Copiar os prints para `src/assets/screens/`**

```bash
S="C:/Users/User/AppData/Local/Temp/claude/c--Users-User-Site-oficial-MAW/1e3f96e5-e5c5-41c9-9d39-61eb4bf6e8e0/scratchpad/demo/crops"
mkdir -p src/assets/screens
for f in maw-arranjo maw-mixer maw-pianoroll maw-midi maw-ia-menu-full maw-smartmix-full maw-conselheiro-full maw-exportar-full det-smartmix det-conselheiro det-ia-menu det-autotune det-eq det-metro det-desempenho det-testes det-boot det-export-lufs det-formatos; do cp "$S/$f.png" src/assets/screens/; done
ls src/assets/screens | wc -l
```
Esperado: `19`. Se a pasta temporária não existir mais, refazer os prints com `tools/screenshots/` (Task 11) antes de seguir.

- [ ] **Step 8: Criar `global.css` a partir do mockup**

```bash
mkdir -p src/styles
sed -n '11,304p' docs/superpowers/mockups/site-v2.html > src/styles/global.css
```

Aplicar estas substituições exatas em `src/styles/global.css`. Cada texto antigo aparece uma única vez:

| Antigo | Novo |
|---|---|
| `.screen img:not(.on) { display: none; }` | `.screen [role="tabpanel"][hidden] { display: none; }` |
| `rgba(184,77,255,.22) 50%` | `rgba(184,77,255,.3) 50%` |
| `.card h4 {` | `.card h3 {` |
| `.plate h5 {` | `.plate h3 {` |
| `.plate.hot h5 {` | `.plate.hot h3 {` |
| `.timeline div {` | `.timeline li {` |
| `.press { display: grid; grid-template-columns: repeat(3, 1fr);` | `.press { display: grid; grid-template-columns: repeat(4, 1fr);` |

Depois, acrescentar no fim do arquivo:
```css
/* ================= ACRÉSCIMOS DA IMPLEMENTAÇÃO ================= */
:focus-visible { outline: 2px solid var(--maw-bright); outline-offset: 3px; }
.visually-hidden { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
.tracks, .dates, .timeline { list-style: none; }
.h-rock { font-family: var(--f-rock); font-weight: 400; font-size: clamp(48px, 6vw, 86px); line-height: .95; text-transform: uppercase; }
.h-rock.xl { font-size: clamp(54px, 6.5vw, 96px); line-height: .92; margin: 12px 0 18px; }
.h-rock.sm { font-size: clamp(44px, 5vw, 72px); line-height: 1; }
.h-goth.md { font-size: clamp(52px, 6vw, 86px); }
.h-stencil.white { color: #fff; }
.sec-head .lede.mt { margin-top: 18px; }
.warn .eyebrow { color: var(--hazard); }
.card img.tall { max-height: 420px; object-fit: cover; object-position: top; }
.card .keys + p { margin-top: 14px; }
.contact.sec { padding-top: 100px; }
.nav-toggle { display: none; margin-left: auto; font-family: var(--f-cond); font-weight: 700; letter-spacing: .16em; text-transform: uppercase; font-size: 13px; color: #d8d3e6; background: transparent; border: 1px solid #3b3b48; border-radius: 4px; padding: 8px 12px; cursor: pointer; }
.runtime { display: inline-block; margin-bottom: 12px; font-family: var(--f-mono); font-size: 10.5px; letter-spacing: .12em; text-transform: uppercase; padding: 3px 8px; border-radius: 3px; border: 1px solid; }
.runtime.app { color: var(--led-g); border-color: rgba(63,224,160,.45); }
.runtime.server { color: var(--led-y); border-color: rgba(224,201,63,.45); }
.btn[aria-disabled="true"] { background: #1e1e24; color: #8e8a9c; box-shadow: 0 0 0 1px #34343f; cursor: not-allowed; }
.btn[aria-disabled="true"]::before { background: #55525f; box-shadow: none; animation: none; }
.rider-note { margin-top: 16px; font-family: var(--f-mono); font-size: 12.5px; color: #8e8a9c; }
.source-link { display: inline-block; margin-top: 12px; font-family: var(--f-mono); font-size: 12px; color: var(--maw-bright); text-decoration: underline; }
.sheet { overflow-x: auto; }

@media (max-width: 980px) {
  .hero-grid, .dl-grid, .liner-grid, .faq-grid, .contact-grid, .engine .two, .tl-grid { grid-template-columns: 1fr; }
  .side + .side { border-left: 0; border-top: 1px solid #22222a; }
  .board { grid-template-columns: repeat(4, 1fr); }
  .plates, .rack-foot, .press, .credits { grid-template-columns: 1fr; }
  .stats { grid-template-columns: 1fr 1fr; }
  .ia-grid > * { grid-column: 1 / -1; }
  .nav-toggle { display: inline-flex; }
  .nav ul { display: none; position: absolute; top: 64px; left: 0; right: 0; flex-direction: column; gap: 0; background: rgba(0,0,0,.96); border-bottom: 1px solid #1a1a20; padding: 8px 24px 16px; }
  .nav.open ul { display: flex; }
  .nav ul a { display: block; padding: 12px 0; }
  .nav .btn { display: none; }
  .record { margin: 0 auto; width: 80%; }
  .lanyard { max-width: 420px; margin: 0 auto; }
}
@media (max-width: 560px) {
  .sec { padding: 90px 0; }
  .side { padding: 32px 20px 24px; }
  .trk { grid-template-columns: 28px 1fr; }
  .trk .kbd { grid-column: 2; justify-self: start; }
  .backcover-foot { flex-direction: column; align-items: flex-start; padding: 22px 20px; }
  .board { grid-template-columns: repeat(2, 1fr); padding: 20px; }
  .stats { grid-template-columns: 1fr; }
  .stat + .stat { border-left: 0; border-top: 1px solid #22222a; }
  .date { grid-template-columns: 1fr; gap: 6px; }
  table.input { font-size: 12.5px; }
  .input th, .input td { padding: 12px; }
}
@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
  *, *::before, *::after { animation: none !important; transition: none !important; }
  .vinyl { transform: translateX(44%); }
}
```

Conferir que nenhuma regra `.inspo` ou `.notes-toggle` entrou: `grep -c "inspo\|notes-toggle" src/styles/global.css` → `0`.

- [ ] **Step 9: Layout base e página mínima**

`src/layouts/Base.astro`:
```astro
---
import '@fontsource/anton/latin-400.css';
import '@fontsource/grenze-gotisch/latin-400.css';
import '@fontsource/grenze-gotisch/latin-900.css';
import '@fontsource/syncopate/latin-400.css';
import '@fontsource/syncopate/latin-700.css';
import '@fontsource/barlow/latin-400.css';
import '@fontsource/barlow/latin-600.css';
import '@fontsource/barlow/latin-700.css';
import '@fontsource/barlow-condensed/latin-600.css';
import '@fontsource/barlow-condensed/latin-700.css';
import '@fontsource/jetbrains-mono/latin-400.css';
import '@fontsource/jetbrains-mono/latin-600.css';
import '@fontsource/share-tech-mono/latin-400.css';
import '@fontsource/big-shoulders-stencil-display/latin-900.css';
import '../styles/global.css';
import site from '../data/site.json';
import { withBase } from '../lib/url';

interface Props {
  title?: string;
  description?: string;
}
const { title = `MAW — ${site.fullName}`, description = site.description } = Astro.props;
const ogImage = new URL(withBase('og-image.png'), Astro.site).href;
---
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title}</title>
    <meta name="description" content={description} />
    <meta name="theme-color" content="#000000" />
    <link rel="icon" type="image/png" href={withBase('favicon.png')} />
    <link rel="apple-touch-icon" href={withBase('apple-touch-icon.png')} />
    <link rel="sitemap" href={withBase('sitemap-index.xml')} />
    <meta property="og:type" content="website" />
    <meta property="og:title" content={title} />
    <meta property="og:description" content={description} />
    <meta property="og:image" content={ogImage} />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta name="twitter:card" content="summary_large_image" />
  </head>
  <body>
    <slot />
  </body>
</html>
```

`src/pages/index.astro`:
```astro
---
import Base from '../layouts/Base.astro';
---
<Base>
  <main id="content"></main>
</Base>
```

- [ ] **Step 10: Teste e2e de fumaça (falha até o build funcionar)**

`tests/e2e/smoke.spec.ts`:
```ts
import { expect, test } from '@playwright/test';

test('page is English and titled MAW — Musical Artificial Workspace', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page).toHaveTitle('MAW — Musical Artificial Workspace');
});
```

Run: `npm run build && npx playwright test tests/e2e/smoke.spec.ts`
Esperado: build sem erros, 2 testes passando (desktop e mobile). Se o build reclamar de import de fonte, conferir o nome do arquivo em `node_modules/@fontsource/<família>/`.

- [ ] **Step 11: Commit**

```bash
git add package.json package-lock.json astro.config.mjs tsconfig.json vitest.config.ts playwright.config.ts .gitignore src tests
git commit -m "feat: esqueleto Astro, CSS do mockup, fontes locais e testes base"
```

---

### Task 2: Assets da marca (logo para web, originais, ícones)

**Files:**
- Create: `tools/logo_web.py`, `tools/make_icons.py`, `tools/tests/test_brand.py`
- Create (gerados e commitados): `src/assets/brand/maw-logo-web.png`, `public/press/logo_MAW.png`, `public/press/icon_MAW.png`, `public/favicon.png`, `public/apple-touch-icon.png`, `installer/maw.ico`

**Interfaces:**
- Produces: `make_web_logo(original: PIL.Image) -> PIL.Image` (RGBA) e `drawing_pixels_identical(original: PIL.Image, web: PIL.Image) -> bool` em `tools/logo_web.py`
- Produces: CLI `python tools/logo_web.py --source <logo_MAW.png> --out <png>` e `--check`
- Produces: `square_icon(original: PIL.Image) -> PIL.Image` em `tools/make_icons.py`, e o CLI que escreve favicon, apple-touch-icon e o `.ico`
- Consumes: `C:\Users\User\MAW\Source\logo_MAW.png` (1536×1024 RGB) e `C:\Users\User\MAW\Source\icon_MAW.png`

- [ ] **Step 1: Escrever os testes (falham)**

`tools/tests/test_brand.py`:
```python
import sys
import unittest
from pathlib import Path

import numpy as np
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from logo_web import BOX, THRESHOLD, drawing_pixels_identical, make_web_logo  # noqa: E402
from make_icons import square_icon  # noqa: E402

SOURCE = Path(r"C:\Users\User\MAW\Source\logo_MAW.png")


def synthetic_logo() -> Image.Image:
    # fundo quase preto (3,3,3) + um traço roxo dentro da caixa do logo
    a = np.full((1024, 1536, 3), 3, dtype=np.uint8)
    a[400:420, 500:900] = (157, 0, 255)
    a[430, 500:900] = (20, 0, 40)  # borda antialiasing: acima do limiar, fica
    return Image.fromarray(a, "RGB")


class WebLogoTests(unittest.TestCase):
    def test_background_becomes_transparent(self):
        web = make_web_logo(synthetic_logo())
        self.assertEqual(web.mode, "RGBA")
        self.assertEqual(web.size, (BOX[2] - BOX[0], BOX[3] - BOX[1]))
        self.assertEqual(web.getpixel((0, 0))[3], 0)

    def test_drawing_pixels_are_identical_and_opaque(self):
        original = synthetic_logo()
        web = make_web_logo(original)
        self.assertTrue(drawing_pixels_identical(original, web))
        x, y = 600 - BOX[0], 410 - BOX[1]
        self.assertEqual(web.getpixel((x, y)), (157, 0, 255, 255))

    def test_threshold_keeps_dark_edge_pixels(self):
        web = make_web_logo(synthetic_logo())
        self.assertGreater(20, THRESHOLD)
        self.assertEqual(web.getpixel((600 - BOX[0], 430 - BOX[1]))[3], 255)

    def test_detects_altered_pixel(self):
        original = synthetic_logo()
        web = make_web_logo(original)
        web.putpixel((600 - BOX[0], 410 - BOX[1]), (150, 0, 255, 255))
        self.assertFalse(drawing_pixels_identical(original, web))

    @unittest.skipUnless(SOURCE.exists(), "logo original da MAW não encontrado")
    def test_real_logo(self):
        original = Image.open(SOURCE).convert("RGB")
        self.assertTrue(drawing_pixels_identical(original, make_web_logo(original)))


class IconTests(unittest.TestCase):
    def test_square_icon_is_square_crop(self):
        icon = square_icon(synthetic_logo())
        self.assertEqual(icon.size[0], icon.size[1])
        self.assertEqual(icon.size, (800, 800))


if __name__ == "__main__":
    unittest.main()
```

Run: `python -m unittest tools/tests/test_brand.py -v`
Esperado: FAIL, `ModuleNotFoundError: No module named 'logo_web'`.

- [ ] **Step 2: Implementar `tools/logo_web.py`**

```python
"""Logo da MAW para a web: só o fundo preto vira transparente; o desenho fica idêntico ao original."""
import argparse
import sys
from pathlib import Path

import numpy as np
from PIL import Image

# caixa do desenho em logo_MAW.png (1536x1024) com 24 px de respiro
BOX = (383 - 24, 310 - 24, 1151 + 24, 653 + 24)
# fundo do PNG é ~ (3,3,3); o antialiasing do traço fica acima disso
THRESHOLD = 12


def make_web_logo(original: Image.Image) -> Image.Image:
    rgb = np.asarray(original.convert("RGB").crop(BOX))
    alpha = np.where(rgb.max(axis=2) <= THRESHOLD, 0, 255).astype(np.uint8)
    return Image.fromarray(np.dstack([rgb, alpha]), "RGBA")


def drawing_pixels_identical(original: Image.Image, web: Image.Image) -> bool:
    src = np.asarray(original.convert("RGB").crop(BOX))
    out = np.asarray(web.convert("RGBA"))
    drawing = out[..., 3] == 255
    return bool(drawing.any() and (out[..., :3][drawing] == src[drawing]).all())


def main(argv=None) -> int:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--source", default=r"C:\Users\User\MAW\Source\logo_MAW.png")
    p.add_argument("--out", default="src/assets/brand/maw-logo-web.png")
    p.add_argument("--check", action="store_true", help="só confere o --out contra o --source")
    a = p.parse_args(argv)
    original = Image.open(a.source)
    if a.check:
        ok = drawing_pixels_identical(original, Image.open(a.out))
        print("logo intacto" if ok else "LOGO ALTERADO")
        return 0 if ok else 1
    Path(a.out).parent.mkdir(parents=True, exist_ok=True)
    make_web_logo(original).save(a.out, optimize=True)
    print(f"escrito {a.out}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
```

- [ ] **Step 3: Implementar `tools/make_icons.py`**

```python
"""Favicon, apple-touch-icon e o .ico do instalador a partir de um recorte quadrado do logo original."""
import argparse
import sys
from pathlib import Path

from PIL import Image

# quadrado 800x800 centrado no desenho (logo_MAW.png 1536x1024): recorte puro, sem pintar nada
SQUARE = (367, 81, 1167, 881)


def square_icon(original: Image.Image) -> Image.Image:
    return original.convert("RGB").crop(SQUARE)


def main(argv=None) -> int:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--source", default=r"C:\Users\User\MAW\Source\logo_MAW.png")
    a = p.parse_args(argv)
    square = square_icon(Image.open(a.source))
    Path("public").mkdir(exist_ok=True)
    Path("installer").mkdir(exist_ok=True)
    square.resize((64, 64), Image.LANCZOS).save("public/favicon.png", optimize=True)
    square.resize((180, 180), Image.LANCZOS).save("public/apple-touch-icon.png", optimize=True)
    square.save("installer/maw.ico", sizes=[(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)])
    print("escritos public/favicon.png, public/apple-touch-icon.png, installer/maw.ico")
    return 0


if __name__ == "__main__":
    sys.exit(main())
```

- [ ] **Step 4: Rodar os testes**

Run: `python -m unittest tools/tests/test_brand.py -v`
Esperado: PASS (6 testes; `test_real_logo` roda porque o logo existe neste PC).

- [ ] **Step 5: Gerar os arquivos e copiar os originais byte a byte**

```bash
python tools/logo_web.py
python tools/logo_web.py --check
python tools/make_icons.py
mkdir -p public/press
cp "C:/Users/User/MAW/Source/logo_MAW.png" public/press/logo_MAW.png
cp "C:/Users/User/MAW/Source/icon_MAW.png" public/press/icon_MAW.png
sha256sum public/press/logo_MAW.png "C:/Users/User/MAW/Source/logo_MAW.png"
```
Esperado: "logo intacto"; os dois hashes iguais; os arquivos `src/assets/brand/maw-logo-web.png` (816×391), `public/favicon.png`, `public/apple-touch-icon.png` e `installer/maw.ico` existem.

- [ ] **Step 6: Commit**

```bash
git add tools/logo_web.py tools/make_icons.py tools/tests/test_brand.py src/assets/brand public/press public/favicon.png public/apple-touch-icon.png installer/maw.ico
git commit -m "feat: logo web com pixels identicos ao original, icones e originais do kit de imprensa"
```

---

### Task 3: Regras puras e dados de texto (inglês)

**Files:**
- Create: `src/lib/channels.ts`, `src/lib/release.ts`, `src/lib/barcode.ts`, `src/lib/notices.ts`
- Create: `src/data/channels.ts`, `src/data/ticker.ts`, `src/data/tracklist.ts`, `src/data/roadmap.ts`, `src/data/faq.ts`, `src/data/liner.ts`, `src/data/rider.ts`
- Test: `tests/unit/channels.test.ts`, `tests/unit/release.test.ts`, `tests/unit/barcode.test.ts`, `tests/unit/notices.test.ts`, `tests/unit/data.test.ts`

**Interfaces:**
- Produces:
  - `interface Channel { id: string; label: string; value: string; href: string; icon: string }`
  - `visibleChannels(list: readonly Channel[]): Channel[]`
- Produces:
  - `interface ReleaseInfo { file: string; bytes: number; sha256: string; version: string; builtAt: string }`
  - `type ReleaseView = { state: 'ready'; url: string; file: string; sizeLabel: string; sha256: string } | { state: 'pending' }`
  - `isReleaseInfo(raw: unknown): raw is ReleaseInfo`
  - `formatBytes(bytes: number): string`
  - `releaseView(raw: unknown, site: { version: string; releaseBaseUrl: string }): ReleaseView`
- Produces: `interface Bar { x: number; width: number }` e `barcodeBars(seed: number, width: number): Bar[]`
- Produces: `interface Plate { title: string; body: string; hot?: boolean }` e `readBeforeInstallPlates(neuralServerBundled: boolean): Plate[]`
- Produces (dados):
  - `channels: Channel[]` e `tickerItems: string[]`
  - `sides: { name: string; subtitle: string; tracks: { n: string; title: string; detail: string; key: string }[] }[]`
  - `roadmap: { when: string; what: string; status: 'live' | 'reh' | 'next' }[]` e `stampLabel: Record<'live' | 'reh' | 'next', string>`
  - `faq: { q: string; a: string }[]`
  - `story: { lead: string; body: string; quote: string; closing: string }`
  - `timeline: { when: string; what: string }[]`
  - `credits: { role: string; name: string; note?: string }[]`
  - `riderRows: { ch: string; item: string; min: string; rec: string }[]` e `riderNote: string`

- [ ] **Step 1: Testes das regras (falham)**

`tests/unit/channels.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { visibleChannels, type Channel } from '../../src/lib/channels';

const c = (id: string, href: string): Channel => ({ id, label: id, value: id, href, icon: id });

describe('visibleChannels', () => {
  it('keeps only channels with a usable link, in order', () => {
    const list = [c('email', 'mailto:a@b.com'), c('ig', ''), c('yt', 'https://youtube.com/@maw'), c('dc', '   ')];
    expect(visibleChannels(list).map((x) => x.id)).toEqual(['email', 'yt']);
  });
  it('rejects http and javascript links', () => {
    expect(visibleChannels([c('a', 'http://x.com'), c('b', 'javascript:alert(1)')])).toEqual([]);
  });
  it('rejects a malformed mailto', () => {
    expect(visibleChannels([c('a', 'mailto:not-an-email')])).toEqual([]);
  });
});
```

`tests/unit/release.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { formatBytes, isReleaseInfo, releaseView } from '../../src/lib/release';

const site = { version: '1.0.0', releaseBaseUrl: 'https://github.com/WaynerMoraes12/Site-oficial-MAW/releases/download' };
const good = {
  file: 'MAW-Setup-1.0.0.exe',
  bytes: 9_300_000,
  sha256: 'a'.repeat(64),
  version: '1.0.0',
  builtAt: '2026-09-28T12:00:00.000Z',
};

describe('releaseView', () => {
  it('is pending when there is no release file', () => {
    expect(releaseView(undefined, site)).toEqual({ state: 'pending' });
  });
  it('is pending for a malformed hash', () => {
    expect(releaseView({ ...good, sha256: 'xyz' }, site)).toEqual({ state: 'pending' });
  });
  it('is pending when the release is for another version', () => {
    expect(releaseView({ ...good, version: '0.9.0' }, site)).toEqual({ state: 'pending' });
  });
  it('is pending for zero bytes or a non-exe file', () => {
    expect(releaseView({ ...good, bytes: 0 }, site)).toEqual({ state: 'pending' });
    expect(releaseView({ ...good, file: 'MAW.zip' }, site)).toEqual({ state: 'pending' });
  });
  it('builds the GitHub Releases URL when ready', () => {
    expect(releaseView(good, site)).toEqual({
      state: 'ready',
      url: 'https://github.com/WaynerMoraes12/Site-oficial-MAW/releases/download/v1.0.0/MAW-Setup-1.0.0.exe',
      file: 'MAW-Setup-1.0.0.exe',
      sizeLabel: '8.9 MB',
      sha256: 'a'.repeat(64),
    });
  });
});

describe('formatBytes', () => {
  it('uses KB below one megabyte and MB with one decimal above', () => {
    expect(formatBytes(512_000)).toBe('500 KB');
    expect(formatBytes(9_300_000)).toBe('8.9 MB');
  });
});

describe('isReleaseInfo', () => {
  it('accepts a valid object and rejects null', () => {
    expect(isReleaseInfo(good)).toBe(true);
    expect(isReleaseInfo(null)).toBe(false);
  });
});
```

`tests/unit/barcode.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { barcodeBars } from '../../src/lib/barcode';

describe('barcodeBars', () => {
  it('is deterministic for the same seed', () => {
    expect(barcodeBars(7, 186)).toEqual(barcodeBars(7, 186));
  });
  it('keeps every bar inside the width, without overlaps', () => {
    const bars = barcodeBars(7, 186);
    expect(bars.length).toBeGreaterThan(20);
    for (const b of bars) {
      expect(b.x).toBeGreaterThanOrEqual(0);
      expect(b.x + b.width).toBeLessThanOrEqual(186);
    }
    for (let i = 1; i < bars.length; i++) expect(bars[i].x).toBeGreaterThan(bars[i - 1].x + bars[i - 1].width - 1);
  });
});
```

`tests/unit/notices.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { readBeforeInstallPlates } from '../../src/lib/notices';

describe('readBeforeInstallPlates', () => {
  it('always has six plates and starts with the SmartScreen warning', () => {
    for (const flag of [true, false]) {
      const plates = readBeforeInstallPlates(flag);
      expect(plates).toHaveLength(6);
      expect(plates[0]).toMatchObject({ title: 'SmartScreen will warn you', hot: true });
    }
  });
  it('says the AI server is not bundled while the flag is off', () => {
    const titles = readBeforeInstallPlates(false).map((p) => p.title);
    expect(titles).toContain('AI server not bundled yet');
    expect(titles).not.toContain('AI needs a first-run download');
  });
  it('switches to first-run download text when the server ships', () => {
    const titles = readBeforeInstallPlates(true).map((p) => p.title);
    expect(titles).toContain('AI needs a first-run download');
    expect(titles).not.toContain('AI server not bundled yet');
  });
  it('always warns that the app interface is in Brazilian Portuguese', () => {
    expect(readBeforeInstallPlates(false).map((p) => p.title)).toContain('Interface in Brazilian Portuguese');
  });
});
```

Run: `npx vitest run`
Esperado: FAIL nos 4 arquivos novos (módulos inexistentes). `url.test.ts` continua passando.

- [ ] **Step 2: Implementar `src/lib/channels.ts`**

```ts
export interface Channel {
  id: string;
  label: string;
  value: string;
  href: string;
  icon: string;
}

// Canal só aparece com link utilizável: mailto válido ou https.
export function visibleChannels(list: readonly Channel[]): Channel[] {
  return list.filter((c) => {
    const href = c.href.trim();
    return /^mailto:[^\s@]+@[^\s@]+\.[^\s@]+$/.test(href) || /^https:\/\/\S+$/.test(href);
  });
}
```

- [ ] **Step 3: Implementar `src/lib/release.ts`**

```ts
export interface ReleaseInfo {
  file: string;
  bytes: number;
  sha256: string;
  version: string;
  builtAt: string;
}

export type ReleaseView =
  | { state: 'ready'; url: string; file: string; sizeLabel: string; sha256: string }
  | { state: 'pending' };

export function isReleaseInfo(raw: unknown): raw is ReleaseInfo {
  if (typeof raw !== 'object' || raw === null) return false;
  const r = raw as Record<string, unknown>;
  return (
    typeof r.file === 'string' && r.file.endsWith('.exe') &&
    typeof r.bytes === 'number' && Number.isInteger(r.bytes) && r.bytes > 0 &&
    typeof r.sha256 === 'string' && /^[0-9a-f]{64}$/.test(r.sha256) &&
    typeof r.version === 'string' && typeof r.builtAt === 'string'
  );
}

export function formatBytes(bytes: number): string {
  const mb = 1024 * 1024;
  return bytes < mb ? `${Math.round(bytes / 1024)} KB` : `${(bytes / mb).toFixed(1)} MB`;
}

// Sem instalador válido desta versão, o site mostra "coming soon" em vez de link quebrado.
export function releaseView(raw: unknown, site: { version: string; releaseBaseUrl: string }): ReleaseView {
  if (!isReleaseInfo(raw) || raw.version !== site.version) return { state: 'pending' };
  return {
    state: 'ready',
    url: `${site.releaseBaseUrl}/v${raw.version}/${raw.file}`,
    file: raw.file,
    sizeLabel: formatBytes(raw.bytes),
    sha256: raw.sha256,
  };
}
```

- [ ] **Step 4: Implementar `src/lib/barcode.ts`**

```ts
export interface Bar {
  x: number;
  width: number;
}

// Código de barras decorativo e determinístico (mesmo desenho a cada build).
export function barcodeBars(seed: number, width: number): Bar[] {
  let s = seed;
  const rand = () => (s = (s * 9301 + 49297) % 233280) / 233280;
  const bars: Bar[] = [];
  let x = 0;
  while (x < width) {
    const w = 1 + Math.floor(rand() * 3.2);
    if (rand() > 0.42 && x + w <= width) bars.push({ x, width: w });
    x += w + 1;
  }
  return bars;
}
```

- [ ] **Step 5: Implementar `src/lib/notices.ts`**

```ts
export interface Plate {
  title: string;
  body: string;
  hot?: boolean;
}

// Placas do "Read before installing". A da IA depende de o servidor neural vir no instalador.
export function readBeforeInstallPlates(neuralServerBundled: boolean): Plate[] {
  const ai: Plate = neuralServerBundled
    ? {
        title: 'AI needs a first-run download',
        body: 'Stem separation and transcription use the bundled MAW Neural Server (Python 3.10 + ffmpeg). The Whisper large-v3 model (about 3 GB) downloads the first time you transcribe.',
      }
    : {
        title: 'AI server not bundled yet',
        body: "Stem separation, transcription and Gemini advice run on the MAW Neural Server, a local Python service that doesn't ship with v1.0.0 yet. Smart Mix, the Advisor's rules, chords, tempo and audio-to-MIDI work out of the box.",
      };
  return [
    {
      title: 'SmartScreen will warn you',
      body: "The installer isn't digitally signed yet. On the blue screen, click “More info”, then “Run anyway”.",
      hot: true,
    },
    { title: 'Windows 64-bit only', body: "Windows 10 or 11. There's no macOS or Linux version yet." },
    {
      title: 'Interface in Brazilian Portuguese',
      body: "MAW's menus and buttons are in Portuguese. This site shows button names exactly as they appear in the app.",
    },
    ai,
    {
      title: 'Your audio stays yours',
      body: "Everything runs on your PC. Only the Advisor's text report goes to Gemini — and only when you press the button.",
    },
    {
      title: 'Version 1.0',
      body: "Actively developed. Known limits today: volume-only automation, AI jobs can't be cancelled, and the master VST3 isn't saved with the project.",
    },
  ];
}
```

Run: `npx vitest run`
Esperado: PASS em todos os arquivos.

- [ ] **Step 6: Dados de texto (inglês)**

`src/data/channels.ts`:
```ts
import type { Channel } from '../lib/channels';
import site from './site.json';

// Canal com href vazio não aparece no site. Preencher quando o perfil existir.
export const channels: Channel[] = [
  { id: 'email', label: 'Official e-mail', value: 'waynerbusiness@outlook.com', href: 'mailto:waynerbusiness@outlook.com', icon: '@' },
  { id: 'instagram', label: 'Instagram', value: '', href: '', icon: 'IG' },
  { id: 'youtube', label: 'YouTube', value: '', href: '', icon: 'YT' },
  { id: 'discord', label: 'Discord', value: '', href: '', icon: 'DC' },
  { id: 'tiktok', label: 'TikTok', value: '', href: '', icon: 'TT' },
  { id: 'source', label: 'Source code', value: 'GNU GPL v3', href: site.sourceCodeUrl, icon: '</>' },
];
```

`src/data/ticker.ts`:
```ts
export const tickerItems: string[] = [
  '32 TRACKS AT 0.29% OF THE AUDIO BLOCK',
  'STEMS IN 2, 4 OR 5 PARTS',
  'SPEECH BECOMES MARKERS',
  'SMART MIX FINDS FREQUENCY CLASHES',
  '3,934 AUTOMATED CHECKS',
  'VST3 + ASIO',
  'WAV · FLAC · OGG · MP3',
  'AUTOTUNE WITH KEY AND SCALE',
];
```

`src/data/tracklist.ts`:
```ts
export interface Track { n: string; title: string; detail: string; key: string }
export interface Side { name: string; subtitle: string; tracks: Track[] }

// Atalhos conferidos no README da MAW (tabela de atalhos) e em Source/UI/MawPianoRoll.h (Ctrl+U).
export const sides: Side[] = [
  {
    name: 'Side A',
    subtitle: 'RECORD & EDIT',
    tracks: [
      { n: '01', title: '24-bit multitrack recording', detail: 'Several tracks at once through ASIO, with input monitoring', key: 'R' },
      { n: '02', title: 'Metronome & count-in', detail: 'Beep, wood or rim sounds, tap tempo, 1 or 2 bars of count-in', key: 'METRO' },
      { n: '03', title: 'Split, fades & crossfades', detail: 'An automatic 5 ms micro-fade on every cut', key: 'S' },
      { n: '04', title: 'Snap grid with triplets', detail: 'From 1/1 to 1/32, with lasso selection and nudge', key: 'G' },
      { n: '05', title: 'Named markers', detail: 'Name your song sections and jump between them', key: 'K' },
      { n: '06', title: 'Piano roll', detail: 'Quantize with strength and swing, velocity and transpose', key: 'Ctrl U' },
      { n: '07', title: 'USB MIDI controllers', detail: 'Picked up automatically, even when plugged in with the app open', key: 'MIDI' },
      { n: '08', title: 'Built-in synth', detail: '7 presets: Sine, Keys, Bass, Lead, Pad, Pluck, Organ', key: 'KEYBOARD' },
    ],
  },
  {
    name: 'Side B',
    subtitle: 'MIX & DELIVER',
    tracks: [
      { n: '09', title: 'Mixer with peak meters', detail: 'Red clip latch, pan, mute, solo, arm and a master fader', key: 'MIXER' },
      { n: '10', title: 'Effects rack + VST3', detail: '7 built-in effects in a chain, with plugin delay compensation', key: 'EFEITO' },
      { n: '11', title: 'AutoTune with key & scale', detail: 'Major, minor, pentatonics and chromatic', key: 'UI' },
      { n: '12', title: 'Volume automation', detail: 'Draw nodes right on the track', key: 'A' },
      { n: '13', title: 'Named undo', detail: '50 levels, including mix and effect changes', key: 'Ctrl Z' },
      { n: '14', title: 'Autosave & recovery', detail: 'Every 3 minutes, with portable project folders', key: 'Ctrl S' },
      { n: '15', title: 'Export with loudness', detail: 'WAV, FLAC, OGG, MP3 — integrated LUFS and true peak', key: 'E' },
      { n: '16', title: 'Stems, one file per track', detail: 'The whole song or just the loop region', key: 'MENU' },
    ],
  },
];
```

`src/data/roadmap.ts`:
```ts
export type TourStatus = 'live' | 'reh' | 'next';

export const stampLabel: Record<TourStatus, string> = { live: 'On the road', reh: 'Rehearsing', next: 'Announced' };

// "Rehearsing" = worktrees em andamento na MAW; "Announced" = trabalhos futuros do README/TCC. Sem datas inventadas.
export const roadmap: { when: string; what: string; status: TourStatus }[] = [
  { when: 'Sep 2026', what: 'Version 1.0 — debut', status: 'live' },
  { when: 'In rehearsal', what: 'Automation for any parameter', status: 'reh' },
  { when: 'In rehearsal', what: 'Sends, buses & sidechain', status: 'reh' },
  { when: 'In rehearsal', what: 'Loop recording, punch-in & take history', status: 'reh' },
  { when: 'In rehearsal', what: 'Time-stretch & track freeze', status: 'reh' },
  { when: 'In rehearsal', what: 'Sampler, sequencer, MIDI learn & CC lanes', status: 'reh' },
  { when: 'In rehearsal', what: 'Guitar string tuner', status: 'reh' },
  { when: 'Next tour', what: 'MAW as a VST3 plugin', status: 'next' },
  { when: 'Next tour', what: 'Tempo map & take comping', status: 'next' },
];
```

`src/data/faq.ts`:
```ts
export const faq: { q: string; a: string }[] = [
  { q: 'Is MAW free?', a: "Yes. The download is free and there's no sign-up." },
  { q: 'Does it run on Mac or Linux?', a: 'Not yet. Version 1.0 runs on Windows 10 and 11, 64-bit only.' },
  { q: 'Is the interface in English?', a: "Not yet — MAW's interface is in Brazilian Portuguese. This site shows button names exactly as they appear in the app, so you can find them." },
  { q: 'Do I need an audio interface?', a: "Not to get started — your PC's sound card works. For low-latency recording, an interface with an ASIO driver is recommended." },
  { q: 'Do my VST3 plugins work?', a: 'Yes. MAW scans the standard VST3 folder, keeps a cache and compensates plugin latency.' },
  { q: 'Does the AI send my music to the internet?', a: "No. Separation, transcription and analysis run on your PC. Only the Advisor's text report goes to Gemini, and only if you ask." },
  { q: 'Why does Windows say the app might be unsafe?', a: "That's SmartScreen: the installer isn't digitally signed yet. Click “More info”, then “Run anyway”." },
  { q: 'Is what I make in MAW mine?', a: 'Yes. Your recordings, mixes, stems and projects belong to you.' },
];
```

`src/data/liner.ts`:
```ts
export const story = {
  lead: 'MAW started as the undergraduate capstone project of Wayner Pires de Moraes in Computer Engineering at Centro Universitário Hermínio Ometto (FHO), in Araras, Brazil.',
  body: 'The question was simple: why does a DAW record your music without understanding any of it? Six months later, the answer was more than 44,000 lines of C++, an audio engine measured block by block and an AI that talks to the timeline.',
  quote: '“A conventional DAW doesn’t understand the music it’s recording.”',
  closing: 'Built for whoever records alone in their bedroom — a guitar, an audio interface, a computer — and wants to sound like a studio.',
};

export const timeline: { when: string; what: string }[] = [
  { when: '31 MAR 2026', what: 'First visual chassis and the MAW purple' },
  { when: '04 APR', what: 'Pitch detection (YIN) — the tuner is born' },
  { when: '14 APR', what: 'Multitrack' },
  { when: '03 MAY', what: 'The .maw project file' },
  { when: 'JUL', what: 'Neural server and stem separation' },
  { when: '16 JUL', what: 'MIDI and the piano roll' },
  { when: 'AUG', what: 'Export, 4- and 5-stem separation, chord detection' },
  { when: 'SEP', what: 'Mixer, undo, the Advisor, Gemini, test suite — v1.0' },
];

export const credits: { role: string; name: string; note?: string }[] = [
  { role: 'Production, code & arrangement', name: 'Wayner Pires de Moraes' },
  { role: 'Institution', name: 'FHO — Araras, Brazil', note: 'Computer Engineering · 2026' },
  { role: 'Audio engine', name: 'JUCE 8', note: 'Raw Material Software · AGPLv3' },
  { role: 'Drivers & plugins', name: 'ASIO SDK · VST3 SDK', note: 'Steinberg Media Technologies' },
  { role: 'Stem separation', name: 'Spleeter', note: 'Deezer · MIT' },
  { role: 'Transcription', name: 'faster-whisper · Whisper large-v3', note: 'SYSTRAN · OpenAI · MIT' },
  { role: 'Neural server', name: 'Flask', note: 'Pallets · BSD-3' },
  { role: 'Advisor (optional)', name: 'Google Gemini API', note: "with the user's own key" },
  { role: 'License', name: 'GNU GPL v3' },
];
```

`src/data/rider.ts`:
```ts
export const riderRows: { ch: string; item: string; min: string; rec: string }[] = [
  { ch: '01', item: 'System', min: 'Windows 10 64-bit', rec: 'Windows 11 64-bit' },
  { ch: '02', item: 'Audio', min: 'PC sound card', rec: 'Interface with an ASIO driver' },
  { ch: '03', item: 'Display', min: '1329 × 620', rec: '1580 px wide or more (full header)' },
  { ch: '04', item: 'MIDI', min: '—', rec: 'USB controller (picked up on plug-in)' },
  { ch: '05', item: 'AI: stems & transcription', min: 'MAW Neural Server (Python 3.10 + ffmpeg)', rec: 'NVIDIA GPU with CUDA' },
  { ch: '06', item: 'Disk', min: 'About 10 MB for MAW', rec: '+ ~3 GB for the Whisper model on first use' },
  { ch: '07', item: 'Advisor with Gemini', min: '— (local rules)', rec: 'Your own Gemini API key' },
  { ch: '08', item: 'Internet', min: 'Not needed to produce', rec: 'Only for AI model downloads and Gemini' },
];

export const riderNote = 'Also required: Microsoft Visual C++ Redistributable (x64). The installer adds it automatically if it is missing.';
```

- [ ] **Step 7: Teste de sanidade dos dados**

`tests/unit/data.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { channels } from '../../src/data/channels';
import { visibleChannels } from '../../src/lib/channels';
import { sides } from '../../src/data/tracklist';
import { roadmap } from '../../src/data/roadmap';
import { faq } from '../../src/data/faq';
import { riderRows } from '../../src/data/rider';

describe('site data', () => {
  it('shows only the e-mail channel at launch', () => {
    expect(visibleChannels(channels).map((c) => c.id)).toEqual(['email']);
  });
  it('has 16 numbered tracks, 8 per side', () => {
    expect(sides.map((s) => s.tracks.length)).toEqual([8, 8]);
    expect(sides.flatMap((s) => s.tracks).map((t) => t.n)).toEqual(
      Array.from({ length: 16 }, (_, i) => String(i + 1).padStart(2, '0')),
    );
  });
  it('has exactly one live stop on the tour', () => {
    expect(roadmap.filter((r) => r.status === 'live')).toHaveLength(1);
  });
  it('has 8 FAQ entries and 8 rider rows', () => {
    expect(faq).toHaveLength(8);
    expect(riderRows).toHaveLength(8);
  });
});
```

Run: `npx vitest run`
Esperado: PASS em todos.

- [ ] **Step 8: Commit**

```bash
git add src/lib src/data tests/unit
git commit -m "feat: regras de canais, release, codigo de barras e avisos, e dados do site em ingles"
```

---

### Task 4: Nav, Hero (capa), faixa de LED e rodapé

**Files:**
- Create: `src/components/Nav.astro`, `src/components/Hero.astro`, `src/components/LedTicker.astro`, `src/components/Footer.astro`
- Modify: `src/pages/index.astro`
- Test: `tests/e2e/hero-nav.spec.ts`

**Interfaces:**
- Consumes: `src/assets/brand/maw-logo-web.png`, `site.json`, `tickerItems`
- Produces: âncora `#top` (hero). O nav aponta para `#stage #tracklist #ai #rider #tour #liner-notes #faq #download`, que as Tasks 5–8 criam.

- [ ] **Step 1: Teste e2e (falha)**

`tests/e2e/hero-nav.spec.ts`:
```ts
import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => page.goto('/'));

test('hero headline is the English tagline', async ({ page }) => {
  await expect(page.locator('.hero h1')).toHaveText(/The DAW that understands\s*the music\s*it records/);
  await expect(page.locator('.hero .ctas a').first()).toHaveText('Download for Windows');
});

test('logo images are never filtered, blended or animated', async ({ page }) => {
  const styles = await page.locator('img[data-logo]').evaluateAll((imgs) =>
    imgs.map((img) => {
      const cs = getComputedStyle(img);
      return { filter: cs.filter, blend: cs.mixBlendMode, anim: cs.animationName };
    }),
  );
  expect(styles.length).toBeGreaterThanOrEqual(3);
  for (const s of styles) expect(s).toEqual({ filter: 'none', blend: 'normal', anim: 'none' });
});

test('ticker repeats items for the loop and hides the copy from screen readers', async ({ page }) => {
  const spans = page.locator('.ticker .track > span');
  const total = await spans.count();
  expect(total % 2).toBe(0);
  expect(await page.locator('.ticker .track > span[aria-hidden="true"]').count()).toBe(total / 2);
});

test('footer states the non-affiliation', async ({ page }) => {
  await expect(page.locator('footer')).toContainText('MAW is not affiliated with any artist or band.');
});

test('mobile menu opens and closes', async ({ page }, info) => {
  test.skip(info.project.name !== 'mobile', 'só no celular');
  const toggle = page.locator('[data-nav-toggle]');
  await expect(page.locator('#nav-links')).toBeHidden();
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('#nav-links')).toBeVisible();
  await page.locator('#nav-links a').first().click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
});
```

Run: `npx playwright test tests/e2e/hero-nav.spec.ts`
Esperado: FAIL (não existe `.hero`).

- [ ] **Step 2: `Nav.astro`**

```astro
---
import logo from '../assets/brand/maw-logo-web.png';

const links = [
  { href: '#stage', label: 'The Stage' },
  { href: '#tracklist', label: 'Tracklist' },
  { href: '#ai', label: 'AI' },
  { href: '#rider', label: 'Requirements' },
  { href: '#tour', label: 'Roadmap' },
  { href: '#liner-notes', label: 'Story' },
  { href: '#faq', label: 'FAQ' },
];
---
<nav class="nav" data-nav aria-label="Main">
  <div class="wrap">
    <a class="logo" href="#top" aria-label="MAW — back to top">
      <img data-logo src={logo.src} width={logo.width} height={logo.height} alt="MAW" />
    </a>
    <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="nav-links" data-nav-toggle>Menu</button>
    <ul id="nav-links">
      {links.map((l) => <li><a href={l.href}>{l.label}</a></li>)}
    </ul>
    <a class="btn btn-rec" href="#download">Download</a>
  </div>
</nav>
<script>
  const nav = document.querySelector('[data-nav]');
  const toggle = document.querySelector('[data-nav-toggle]');
  if (nav && toggle) {
    const close = () => {
      nav.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    };
    toggle.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
    });
    nav.querySelectorAll('#nav-links a').forEach((a) => a.addEventListener('click', close));
  }
</script>
```

- [ ] **Step 3: `Hero.astro`**

```astro
---
import logo from '../assets/brand/maw-logo-web.png';
import site from '../data/site.json';
---
<header class="hero" id="top">
  <div class="wrap hero-grid">
    <div>
      <div class="catalog"><span><b>MAW-001</b></span><span>WINDOWS x64</span><span>v{site.version}</span><span>℗ {site.year}</span></div>
      <h1>
        <span class="chrome">The DAW that understands</span>
        <span class="l2 chrome">the music <span class="bolt" aria-hidden="true"></span> it records</span>
      </h1>
      <p class="lede">MAW — <b>Musical Artificial Workspace</b>. A multitrack music production workstation for Windows, with AI built into the timeline: it separates stems, transcribes vocals, detects chords and advises your mix.</p>
      <div class="ctas">
        <a class="btn btn-rec" href="#download">Download for Windows</a>
        <a class="btn btn-ghost" href="#stage">See MAW in action</a>
      </div>
      <div class="meta">Free download · Windows 10/11 64-bit · Interface in Brazilian Portuguese</div>
    </div>
    <div class="record" aria-hidden="true">
      <div class="vinyl"><div class="label"><img data-logo src={logo.src} alt="" /></div></div>
      <div class="sleeve">
        <img data-logo src={logo.src} alt="" />
        <div class="spine"><span>MUSICAL</span><span>ARTIFICIAL</span><span>WORKSPACE</span></div>
      </div>
      <div class="advisory"><div class="t">LISTENER ADVISORY</div><div class="b">PRODUCTION</div><div class="s">EXPLICITLY MUSICAL</div></div>
    </div>
  </div>
</header>
```

- [ ] **Step 4: `LedTicker.astro` e `Footer.astro`**

`src/components/LedTicker.astro`:
```astro
---
import { tickerItems } from '../data/ticker';
---
<div class="ticker" role="marquee" aria-label="MAW highlights">
  <div class="track">
    {tickerItems.map((t) => <span>{t}<i aria-hidden="true">✦</i></span>)}
    {tickerItems.map((t) => <span aria-hidden="true">{t}<i>✦</i></span>)}
  </div>
</div>
```

`src/components/Footer.astro`:
```astro
---
import logo from '../assets/brand/maw-logo-web.png';
import site from '../data/site.json';
---
<footer>
  <div class="wrap">
    <div class="top">
      <img data-logo src={logo.src} alt="MAW" />
      <span>MAW — {site.fullName} · v{site.version}</span>
    </div>
    <p class="legal">© {site.year} {site.author}. MAW is distributed under the GNU GPL v3. VST and ASIO are registered trademarks of Steinberg Media Technologies GmbH. Windows is a trademark of Microsoft Corporation. Gemini is a trademark of Google LLC. All other trademarks belong to their respective owners. MAW is not affiliated with any artist or band.</p>
  </div>
</footer>
```

- [ ] **Step 5: Montar no `index.astro`**

```astro
---
import Base from '../layouts/Base.astro';
import Nav from '../components/Nav.astro';
import Hero from '../components/Hero.astro';
import LedTicker from '../components/LedTicker.astro';
import Footer from '../components/Footer.astro';
---
<Base>
  <Nav />
  <Hero />
  <LedTicker />
  <main id="content"></main>
  <Footer />
</Base>
```

- [ ] **Step 6: Rodar os testes**

Run: `npx playwright test tests/e2e/hero-nav.spec.ts tests/e2e/smoke.spec.ts`
Esperado: PASS (o teste do menu é pulado no desktop).

- [ ] **Step 7: Commit**

```bash
git add src/components/Nav.astro src/components/Hero.astro src/components/LedTicker.astro src/components/Footer.astro src/pages/index.astro tests/e2e/hero-nav.spec.ts
git commit -m "feat: capa do disco, navegacao, faixa de LED e rodape"
```

---

### Task 5: The Stage (prints em abas)

**Files:**
- Create: `src/data/stage.ts`, `src/components/Stage.astro`
- Modify: `src/pages/index.astro`
- Test: `tests/e2e/stage.spec.ts`

**Interfaces:**
- Produces: `stageShots: { id: string; label: string; image: ImageMetadata; alt: string }[]` e a seção `#stage` com `role="tablist"`, `role="tab"` (id `tab-<id>`) e `role="tabpanel"` (id `panel-<id>`)

- [ ] **Step 1: Teste e2e (falha)**

`tests/e2e/stage.spec.ts`:
```ts
import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => page.goto('/#stage'));

test('starts on the arrangement screenshot', async ({ page }) => {
  await expect(page.locator('#tab-arrangement')).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('#panel-arrangement img')).toBeVisible();
  await expect(page.locator('#panel-mixer')).toBeHidden();
});

test('clicking a tab swaps the screenshot', async ({ page }) => {
  await page.locator('#tab-mixer').click();
  await expect(page.locator('#tab-mixer')).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('#panel-mixer img')).toBeVisible();
  await expect(page.locator('#panel-arrangement')).toBeHidden();
});

test('arrow keys move between tabs', async ({ page }) => {
  await page.locator('#tab-arrangement').focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#tab-mixer')).toBeFocused();
  await expect(page.locator('#panel-mixer')).toBeVisible();
  await page.keyboard.press('ArrowLeft');
  await expect(page.locator('#tab-arrangement')).toBeFocused();
});

test('screenshots are optimized and described', async ({ page }) => {
  const sources = await page.locator('#stage picture source').evaluateAll((s) => s.map((x) => x.getAttribute('type')));
  expect(sources).toContain('image/avif');
  const alts = await page.locator('#stage img').evaluateAll((imgs) => imgs.map((i) => i.getAttribute('alt') ?? ''));
  expect(alts).toHaveLength(4);
  for (const a of alts) expect(a.length).toBeGreaterThan(20);
});
```

Run: `npx playwright test tests/e2e/stage.spec.ts`
Esperado: FAIL.

- [ ] **Step 2: `src/data/stage.ts`**

```ts
import type { ImageMetadata } from 'astro';
import arrangement from '../assets/screens/maw-arranjo.png';
import mixer from '../assets/screens/maw-mixer.png';
import pianoRoll from '../assets/screens/maw-pianoroll.png';
import midi from '../assets/screens/maw-midi.png';

export const stageShots: { id: string; label: string; image: ImageMetadata; alt: string }[] = [
  { id: 'arrangement', label: 'Arrangement', image: arrangement, alt: 'MAW arrangement view playing the chorus of the demo song, with section markers, chord tags on the guitar clips and the vocal effects rack' },
  { id: 'mixer', label: 'Mixer', image: mixer, alt: 'MAW mixer with seven channel strips, live peak meters and the master fader' },
  { id: 'piano-roll', label: 'Piano Roll', image: pianoRoll, alt: 'MAW piano roll editing a keyboard arpeggio note by note' },
  { id: 'midi', label: 'MIDI + Audio', image: midi, alt: 'MIDI synth pad and keys clips next to audio tracks in the MAW arrangement' },
];
```

- [ ] **Step 3: `src/components/Stage.astro`**

```astro
---
import { Picture } from 'astro:assets';
import { stageShots } from '../data/stage';
---
<section class="sec stage" id="stage" data-stage>
  <div class="beam b1" aria-hidden="true"></div>
  <div class="beam b2" aria-hidden="true"></div>
  <div class="beam b3" aria-hidden="true"></div>
  <div class="smoke" aria-hidden="true"></div>
  <div class="wrap">
    <div class="sec-head">
      <div class="eyebrow">Real screenshots · demo project “Noite Roxa”</div>
      <h2 class="h-goth">The Stage</h2>
      <p class="lede">Arrangement, mixer, piano roll and MIDI in one dark window, with studio-console labels. Everything is drawn as vectors — the way MAW is built.</p>
    </div>
    <div class="tabs" role="tablist" aria-label="MAW screens">
      {stageShots.map((s, i) => (
        <button
          type="button"
          role="tab"
          id={`tab-${s.id}`}
          aria-controls={`panel-${s.id}`}
          aria-selected={i === 0 ? 'true' : 'false'}
          tabindex={i === 0 ? 0 : -1}
          class={i === 0 ? 'on' : undefined}
        >{s.label}</button>
      ))}
    </div>
    <div class="screen">
      {stageShots.map((s, i) => (
        <div role="tabpanel" id={`panel-${s.id}`} aria-labelledby={`tab-${s.id}`} hidden={i !== 0}>
          <Picture
            src={s.image}
            formats={['avif', 'webp']}
            widths={[640, 960, 1280, 1920]}
            sizes="(max-width: 1240px) 100vw, 1220px"
            quality={88}
            loading={i === 0 ? 'eager' : 'lazy'}
            alt={s.alt}
          />
        </div>
      ))}
    </div>
  </div>
</section>
<script>
  const root = document.querySelector('[data-stage]');
  if (root) {
    const tabs = Array.from(root.querySelectorAll<HTMLButtonElement>('[role="tab"]'));
    const panels = Array.from(root.querySelectorAll<HTMLElement>('[role="tabpanel"]'));
    const select = (index: number, focus = false) => {
      tabs.forEach((tab, j) => {
        const on = j === index;
        tab.setAttribute('aria-selected', String(on));
        tab.tabIndex = on ? 0 : -1;
        tab.classList.toggle('on', on);
        if (on && focus) tab.focus();
      });
      panels.forEach((panel, j) => { panel.hidden = j !== index; });
    };
    tabs.forEach((tab, i) => {
      tab.addEventListener('click', () => select(i));
      tab.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight') select((i + 1) % tabs.length, true);
        if (e.key === 'ArrowLeft') select((i - 1 + tabs.length) % tabs.length, true);
      });
    });
  }
</script>
```

- [ ] **Step 4: Montar no `index.astro`**

Acrescentar `import Stage from '../components/Stage.astro';` junto dos imports e trocar `<main id="content"></main>` por:
```astro
  <main id="content">
    <Stage />
  </main>
```

- [ ] **Step 5: Rodar os testes**

Run: `npx playwright test tests/e2e/stage.spec.ts`
Esperado: PASS (desktop e mobile).

- [ ] **Step 6: Commit**

```bash
git add src/data/stage.ts src/components/Stage.astro src/pages/index.astro tests/e2e/stage.spec.ts
git commit -m "feat: secao The Stage com prints reais em abas acessiveis"
```

---

### Task 6: Tracklist, AI, Rack e Backstage

**Files:**
- Create: `src/data/ai.ts`, `src/data/rack.ts`, `src/data/backstage.ts`
- Create: `src/components/Tracklist.astro`, `src/components/AiSection.astro`, `src/components/Rack.astro`, `src/components/Backstage.astro`
- Modify: `src/pages/index.astro`
- Test: `tests/e2e/sections.spec.ts`

**Interfaces:**
- Consumes: `sides` (Task 3), `barcodeBars` (Task 3), `site.json`
- Produces:
  - `type Runtime = 'app' | 'server'`, `runtimeLabel: Record<Runtime, string>`
  - `aiCards: AiCard[]`
  - `pedals: { name: string; color: string; ink?: string; knobs: number[] }[]`
  - `rackShots` e `backstageShots`: `{ image: ImageMetadata; alt: string; caption: string }[]`
  - `stats: { value: string; label: string; sub: string; purple?: boolean }[]`
- Produces: seções `#tracklist`, `#ai`, `#rack`, `#backstage`

- [ ] **Step 1: Teste e2e (falha)**

`tests/e2e/sections.spec.ts`:
```ts
import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => page.goto('/'));

test('tracklist has 16 tracks with real MAW keys', async ({ page }) => {
  await expect(page.locator('#tracklist .trk')).toHaveCount(16);
  const keys = await page.locator('#tracklist .trk .kbd').allTextContents();
  expect(keys).toEqual(['R', 'METRO', 'S', 'G', 'K', 'Ctrl U', 'MIDI', 'KEYBOARD', 'MIXER', 'EFEITO', 'UI', 'A', 'Ctrl Z', 'Ctrl S', 'E', 'MENU']);
  expect(await page.locator('#tracklist .barcode rect').count()).toBeGreaterThan(20);
});

test('every AI card says where it runs', async ({ page }) => {
  const cards = page.locator('#ai .card');
  await expect(cards).toHaveCount(5);
  await expect(page.locator('#ai .runtime.app')).toHaveCount(3);
  await expect(page.locator('#ai .runtime.server')).toHaveCount(2);
  await expect(page.locator('#ai .card', { hasText: 'Stem separation' }).locator('.runtime')).toHaveText('Needs the MAW Neural Server');
});

test('rack shows the seven built-in effects as pedals', async ({ page }) => {
  const names = await page.locator('#rack .pedal .name').allTextContents();
  expect(names.map((n) => n.replace(/\u00ad/g, ''))).toEqual(['Noise Gate', 'Distortion', 'Equalizer', 'Compressor', 'Reverb', 'Delay', 'AutoTune']);
  await expect(page.locator('#rack figure.shot')).toHaveCount(3);
});

test('backstage shows the measured numbers', async ({ page }) => {
  await expect(page.locator('#backstage .stat .v')).toHaveText(['0.29%', '3,934', '24', '50']);
  await expect(page.locator('#backstage figure.shot')).toHaveCount(2);
});
```

Run: `npx playwright test tests/e2e/sections.spec.ts`
Esperado: FAIL.

- [ ] **Step 2: Dados com imagens**

`src/data/ai.ts`:
```ts
import type { ImageMetadata } from 'astro';
import smartMix from '../assets/screens/det-smartmix.png';
import advisor from '../assets/screens/det-conselheiro.png';
import aiMenu from '../assets/screens/det-ia-menu.png';

export type Runtime = 'app' | 'server';

export const runtimeLabel: Record<Runtime, string> = {
  app: 'Runs in the app',
  server: 'Needs the MAW Neural Server',
};

export interface AiCard {
  id: string;
  size: 'c-a' | 'c-b' | 'c-c' | 'c-d' | 'c-e';
  hud: string;
  title: string;
  text: string;
  runtime: Runtime;
  image?: ImageMetadata;
  alt?: string;
  tall?: boolean;
  keys?: { key: string; label: string }[];
}

// "Runs in the app" foi confirmado rodando a MAW sem o servidor neural (27/09/2026).
export const aiCards: AiCard[] = [
  {
    id: 'smart-mix', size: 'c-a', hud: '// SMART MIX · EQ CLASHES', title: 'Smart Mix', runtime: 'app',
    text: "Finds which tracks fight over the same frequency band — and for how long they actually play together. Then it writes the cuts into each track's equalizer.",
    image: smartMix, alt: 'Smart Mix report listing frequency clashes between drums, bass, guitars and vocals', tall: true,
  },
  {
    id: 'advisor', size: 'c-b', hud: '// PRODUCTION ADVISOR · RULES + GEMINI', title: 'Production Advisor', runtime: 'app',
    text: 'Measures the project and points at what matters: a master about to clip, AutoTune set to the wrong key, clashing tracks, loudness. Asking Gemini for a second opinion needs the Neural Server.',
    image: advisor, alt: 'Production Advisor window warning that the vocal AutoTune is not in the key of the song',
  },
  {
    id: 'stems', size: 'c-c', hud: '// STEMS · 2 · 4 · 5 PARTS', title: 'Stem separation', runtime: 'server',
    text: "Vocals, drums, bass, piano and the rest — or let MAW decide what's actually in the song.",
    image: aiMenu, alt: 'AI assistant menu with stem separation, Smart Mix, Advisor and transcription options',
  },
  {
    id: 'whisper', size: 'c-d', hud: '// WHISPER · PT · EN', title: 'Speech becomes markers', runtime: 'server',
    text: 'Transcribes the speech in the selected clip and turns every segment into a marker on the timeline. Portuguese, English or auto-detect.',
  },
  {
    id: 'keys', size: 'c-e', hud: '// LOCAL ANALYSIS · NO INTERNET', title: 'Keys that listen', runtime: 'app',
    keys: [{ key: 'C', label: 'chords' }, { key: 'T', label: 'tempo' }, { key: 'M', label: 'audio → MIDI' }],
    text: 'Chords are stored in the clip — like the Em, C, G, D tags in the screenshots above.',
  },
];
```

`src/data/rack.ts`:
```ts
import type { ImageMetadata } from 'astro';
import autotune from '../assets/screens/det-autotune.png';
import eq from '../assets/screens/det-eq.png';
import metro from '../assets/screens/det-metro.png';

export const pedals: { name: string; color: string; ink?: string; knobs: number[] }[] = [
  { name: 'Noise Gate', color: '#2a2a31', knobs: [-40, 30] },
  { name: 'Distor\u00adtion', color: '#c2410c', knobs: [70, -20] },
  { name: 'Equal\u00adizer', color: '#d8d3c4', ink: '#111', knobs: [30, -60, 10] },
  { name: 'Compres\u00adsor', color: '#1d4ed8', knobs: [-30, 50] },
  { name: 'Reverb', color: '#6A00AD', knobs: [40, 30] },
  { name: 'Delay', color: '#0f766e', knobs: [-70, 20] },
  { name: 'Auto\u00adTune', color: '#9D00FF', knobs: [90, -10] },
];

export const rackShots: { image: ImageMetadata; alt: string; caption: string }[] = [
  { image: autotune, alt: 'AutoTune panel with amount, speed, key and scale controls', caption: 'AUTOTUNE — AMOUNT, SPEED, KEY, SCALE' },
  { image: eq, alt: 'Equalizer panel with high-pass, low-pass and three peak bands cut by Smart Mix', caption: 'EQUALIZER — HIGH-PASS, LOW-PASS, 3 PEAK BANDS (SMART MIX CUTS)' },
  { image: metro, alt: 'Metronome window with beat lights, tap tempo, sound, subdivision and count-in', caption: 'METRONOME — SOUND, SUBDIVISION, COUNT-IN, TAP' },
];
```

`src/data/backstage.ts`:
```ts
import type { ImageMetadata } from 'astro';
import performance from '../assets/screens/det-desempenho.png';
import tests from '../assets/screens/det-testes.png';

// Números do README da MAW (benchmark e suíte de testes).
export const stats: { value: string; label: string; sub: string; purple?: boolean }[] = [
  { value: '0.29%', label: 'of the audio block', sub: '32 tracks · 48 kHz · 512 samples' },
  { value: '3,934', label: 'automated checks', sub: 'in 396 built-in test blocks', purple: true },
  { value: '24', label: 'bit recording', sub: 'ASIO, several tracks at once' },
  { value: '50', label: 'undo levels', sub: 'each one named after its action', purple: true },
];

export const backstageShots: { image: ImageMetadata; alt: string; caption: string }[] = [
  { image: performance, alt: 'Audio engine performance window showing block load, callback times and sample rate', caption: 'AUDIO ENGINE PERFORMANCE WINDOW (MENU)' },
  { image: tests, alt: 'Built-in automated test suite report with every check passing', caption: 'BUILT-IN TEST SUITE (MENU) · EVERY CHECK PASSED' },
];
```

- [ ] **Step 3: `Tracklist.astro`**

```astro
---
import { sides } from '../data/tracklist';
import { barcodeBars } from '../lib/barcode';
import site from '../data/site.json';

const bars = barcodeBars(7, 186);
---
<section class="sec tracklist" id="tracklist">
  <div class="wrap">
    <div class="sec-head">
      <div class="eyebrow">Tracklist</div>
      <h2 class="chrome h-rock">Record <span class="bolt" aria-hidden="true"></span> Edit <span class="bolt" aria-hidden="true"></span> Mix <span class="bolt" aria-hidden="true"></span> Deliver</h2>
    </div>
    <div class="tl-grid">
      {sides.map((side) => (
        <div class="side">
          <h3>{side.name} <small>{side.subtitle}</small></h3>
          <ol class="tracks">
            {side.tracks.map((t) => (
              <li class="trk">
                <span class="n">{t.n}</span>
                <span class="t">{t.title}<em>{t.detail}</em></span>
                <span class="kbd">{t.key}</span>
              </li>
            ))}
          </ol>
        </div>
      ))}
    </div>
    <div class="backcover-foot">
      <div>MAW-001 · ℗ &amp; © {site.year} {site.author} · Your music is yours.<br />Recorded, mixed and compiled in Araras, Brazil.</div>
      <div class="barcode" aria-hidden="true">
        <svg width="190" height="52" viewBox="0 0 190 52">
          {bars.map((b) => <rect x={b.x} y="0" width={b.width} height="52" fill="#000" />)}
        </svg>
        <div>7 891000 202601</div>
      </div>
    </div>
  </div>
</section>
```

- [ ] **Step 4: `AiSection.astro`**

```astro
---
import { Picture } from 'astro:assets';
import { aiCards, runtimeLabel } from '../data/ai';
---
<section class="sec ia" id="ai">
  <svg class="sigil" viewBox="0 0 760 760" fill="none" stroke="#b84dff" aria-hidden="true">
    <g class="rot">
      <circle cx="380" cy="380" r="370" stroke-width=".8" />
      <circle cx="380" cy="380" r="352" stroke-width=".5" stroke-dasharray="2 7" />
      <polygon points="380,28 684.8,556 75.2,556" stroke-width=".9" />
      <polygon points="380,732 75.2,204 684.8,204" stroke-width=".9" />
      <circle cx="380" cy="380" r="176" stroke-width=".6" />
      <circle cx="380" cy="204" r="176" stroke-width=".35" />
      <circle cx="380" cy="556" r="176" stroke-width=".35" />
      <circle cx="227.6" cy="292" r="176" stroke-width=".35" />
      <circle cx="532.4" cy="292" r="176" stroke-width=".35" />
      <circle cx="227.6" cy="468" r="176" stroke-width=".35" />
      <circle cx="532.4" cy="468" r="176" stroke-width=".35" />
    </g>
    <line x1="380" y1="0" x2="380" y2="760" stroke-width=".4" />
    <line x1="0" y1="380" x2="760" y2="380" stroke-width=".4" />
  </svg>
  <div class="wrap">
    <div class="eyebrow">AI Assistant</div>
    <h2 class="h-wide"><span class="glitch" data-t="Intelligence">Intelligence</span><br />that listens</h2>
    <p class="quote">A generic analyzer says there's energy at 250 Hz. MAW says <b>track 2 and track 5 are fighting over 250 Hz for the 6.4 seconds they play together</b> — and fixes it in one click.</p>
    <div class="ia-grid">
      {aiCards.map((c) => (
        <article class={`card ${c.size}`}>
          <div class="hud">{c.hud}</div>
          <span class={`runtime ${c.runtime}`}>{runtimeLabel[c.runtime]}</span>
          <h3>{c.title}</h3>
          {c.keys && (
            <div class="keys">
              {c.keys.map((k) => <span><span class="kbd">{k.key}</span> {k.label}</span>)}
            </div>
          )}
          <p>{c.text}</p>
          {c.image && c.alt && (
            <Picture
              src={c.image}
              formats={['avif', 'webp']}
              widths={[480, 960]}
              sizes="(max-width: 980px) 100vw, 700px"
              quality={88}
              alt={c.alt}
              class={c.tall ? 'tall' : undefined}
            />
          )}
        </article>
      ))}
    </div>
  </div>
</section>
```

- [ ] **Step 5: `Rack.astro` e `Backstage.astro`**

`src/components/Rack.astro`:
```astro
---
import { Picture } from 'astro:assets';
import { pedals, rackShots } from '../data/rack';
---
<section class="sec rack" id="rack">
  <div class="wrap">
    <div class="sec-head">
      <div class="eyebrow">The Rack</div>
      <h2 class="chrome h-rock">Seven pedals <span class="bolt" aria-hidden="true"></span> and your VST3s</h2>
      <p class="lede mt">Effects in a chain, each with BYPASS, its own panel and ▲▼ reordering. VST3 plugins join the same rack, with latency compensation.</p>
    </div>
    <ul class="board" aria-label="Built-in effects">
      {pedals.map((p) => (
        <li class="pedal" style={`--c:${p.color};${p.ink ? `--ink2:${p.ink};` : ''}`}>
          <div class="led"></div>
          <div class="knobs">{p.knobs.map((r) => <div class="knob" style={`--r:${r}deg`}></div>)}</div>
          <div class="name">{p.name}</div>
          <div class="sw"></div>
        </li>
      ))}
    </ul>
    <div class="rack-foot">
      {rackShots.map((s) => (
        <figure class="shot">
          <Picture src={s.image} formats={['avif', 'webp']} widths={[400, 800]} sizes="(max-width: 980px) 100vw, 400px" quality={88} alt={s.alt} />
          <figcaption>{s.caption}</figcaption>
        </figure>
      ))}
    </div>
  </div>
</section>
```

Acrescentar ao fim de `src/styles/global.css` (a `ul.board` precisa perder o estilo de lista):
```css
ul.board { list-style: none; }
```

`src/components/Backstage.astro`:
```astro
---
import { Picture } from 'astro:assets';
import { backstageShots, stats } from '../data/backstage';
---
<section class="sec engine" id="backstage">
  <div class="wrap">
    <div class="sec-head">
      <div class="eyebrow">Backstage</div>
      <h2 class="h-goth md">An engine that doesn't choke</h2>
      <p class="lede mt">No MAW locks on the playback path. Measured, not promised — and you can reproduce it on your own PC.</p>
    </div>
    <div class="stats">
      {stats.map((s) => (
        <div class="stat">
          <div class={s.purple ? 'v p' : 'v'}>{s.value}</div>
          <div class="l">{s.label}</div>
          <div class="s">{s.sub}</div>
        </div>
      ))}
    </div>
    <div class="two">
      {backstageShots.map((s) => (
        <figure class="shot">
          <Picture src={s.image} formats={['avif', 'webp']} widths={[600, 1000]} sizes="(max-width: 980px) 100vw, 610px" quality={88} alt={s.alt} />
          <figcaption>{s.caption}</figcaption>
        </figure>
      ))}
    </div>
  </div>
</section>
```

- [ ] **Step 6: Montar no `index.astro`**

Acrescentar os imports:
```astro
import Tracklist from '../components/Tracklist.astro';
import AiSection from '../components/AiSection.astro';
import Rack from '../components/Rack.astro';
import Backstage from '../components/Backstage.astro';
```
E, dentro de `<main>`, logo depois de `<Stage />`:
```astro
    <Tracklist />
    <AiSection />
    <Rack />
    <Backstage />
```

- [ ] **Step 7: Rodar os testes**

Run: `npx playwright test tests/e2e/sections.spec.ts`
Esperado: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/data/ai.ts src/data/rack.ts src/data/backstage.ts src/components/Tracklist.astro src/components/AiSection.astro src/components/Rack.astro src/components/Backstage.astro src/pages/index.astro src/styles/global.css tests/e2e/sections.spec.ts
git commit -m "feat: tracklist, IA com selo de onde roda, pedalboard e bastidores do motor"
```

---

### Task 7: Tech Rider, Read before installing e Download (ALL ACCESS)

**Files:**
- Create: `src/components/TechRider.astro`, `src/components/ReadBeforeInstall.astro`, `src/components/Download.astro`
- Modify: `src/pages/index.astro`
- Test: `tests/e2e/install.spec.ts`

**Interfaces:**
- Consumes: `riderRows`, `riderNote`, `readBeforeInstallPlates`, `releaseView`, `site.json`, `src/data/release.json` (opcional, via `import.meta.glob`)
- Produces: seções `#rider`, `#read-before-install` e `#download`. O botão de download tem `data-download`.

- [ ] **Step 1: Teste e2e (falha)**

`tests/e2e/install.spec.ts`:
```ts
import { existsSync, readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => page.goto('/'));

test('tech rider lists 8 channels and the VC++ runtime note', async ({ page }) => {
  await expect(page.locator('#rider tbody tr')).toHaveCount(8);
  await expect(page.locator('#rider .rider-note')).toContainText('Visual C++ Redistributable');
});

test('read-before-install shows six plates, SmartScreen first', async ({ page }) => {
  await expect(page.locator('#read-before-install .plate')).toHaveCount(6);
  await expect(page.locator('#read-before-install .plate').first()).toHaveClass(/hot/);
  const site = JSON.parse(readFileSync('src/data/site.json', 'utf8'));
  const aiTitle = site.neuralServerBundled ? 'AI needs a first-run download' : 'AI server not bundled yet';
  await expect(page.locator('#read-before-install h3', { hasText: aiTitle })).toHaveCount(1);
});

test('download button matches the real release state', async ({ page }) => {
  const button = page.locator('#download [data-download]');
  if (existsSync('src/data/release.json')) {
    const release = JSON.parse(readFileSync('src/data/release.json', 'utf8'));
    await expect(button).toHaveAttribute('href', new RegExp(`/v${release.version}/${release.file}$`));
    await expect(page.locator('#download .hash')).toContainText(release.sha256);
  } else {
    await expect(button).toHaveText('Installer coming soon');
    await expect(button).toHaveAttribute('aria-disabled', 'true');
    await expect(button).not.toHaveAttribute('href', /.+/);
  }
});

test('source code link only appears when configured', async ({ page }) => {
  const site = JSON.parse(readFileSync('src/data/site.json', 'utf8'));
  await expect(page.locator('#download .source-link')).toHaveCount(site.sourceCodeUrl ? 1 : 0);
});
```

Run: `npx playwright test tests/e2e/install.spec.ts`
Esperado: FAIL.

- [ ] **Step 2: `TechRider.astro`**

```astro
---
import { riderNote, riderRows } from '../data/rider';
import site from '../data/site.json';
---
<section class="sec rider" id="rider">
  <div class="wrap">
    <div class="sec-head">
      <div class="eyebrow">System requirements</div>
      <h2 class="h-stencil white">Tech rider</h2>
    </div>
    <div class="sheet">
      <div class="sheet-top"><span>MAW {site.version} — TECH RIDER</span><span>REV. 09/2026</span></div>
      <table class="input">
        <thead>
          <tr><th scope="col">CH</th><th scope="col">ITEM</th><th scope="col">MINIMUM</th><th scope="col">RECOMMENDED</th></tr>
        </thead>
        <tbody>
          {riderRows.map((r) => (
            <tr><td>{r.ch}</td><td>{r.item}</td><td>{r.min}</td><td>{r.rec}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
    <p class="rider-note">{riderNote}</p>
  </div>
</section>
```

- [ ] **Step 3: `ReadBeforeInstall.astro`**

```astro
---
import site from '../data/site.json';
import { readBeforeInstallPlates } from '../lib/notices';

const plates = readBeforeInstallPlates(site.neuralServerBundled);
---
<section class="warn" id="read-before-install">
  <div class="wrap">
    <div class="eyebrow">Read before installing</div>
    <h2 class="h-stencil">Fragile. Handle<br />with care.</h2>
    <div class="plates">
      {plates.map((p) => (
        <article class={p.hot ? 'plate hot' : 'plate'}>
          <h3>{p.title}</h3>
          <p>{p.body}</p>
        </article>
      ))}
    </div>
  </div>
</section>
```

- [ ] **Step 4: `Download.astro`**

```astro
---
import logo from '../assets/brand/maw-logo-web.png';
import site from '../data/site.json';
import { releaseView } from '../lib/release';

// release.json só existe depois do build do instalador (Task 10); sem ele, o botão fica "coming soon".
const found = import.meta.glob('../data/release.json', { eager: true, import: 'default' });
const release = releaseView(Object.values(found)[0], site);
const fileName = `MAW-Setup-${site.version}.exe`;
---
<section class="sec dl" id="download">
  <div class="wrap dl-grid">
    <div class="lanyard" aria-hidden="true">
      <div class="strap"></div>
      <div class="pass">
        <div class="hole"></div>
        <div class="logo-row"><img data-logo src={logo.src} alt="" /></div>
        <div class="aa">ALL ACCESS</div>
        <div class="body">
          <dl>
            <dt>VERSION</dt><dd>{site.version}</dd>
            <dt>PLATFORM</dt><dd>Windows 10/11 · x64</dd>
            <dt>FILE</dt><dd>{fileName}</dd>
            <dt>LICENSE</dt><dd>GNU GPL v3</dd>
          </dl>
          <div class="holo"><img data-logo src={logo.src} alt="" /></div>
        </div>
      </div>
    </div>
    <div>
      <div class="eyebrow">Download</div>
      <h2 class="chrome h-rock xl">Your backstage<br />pass</h2>
      <p class="lede">The official MAW installer for Windows. Free, no sign-up.</p>
      <ol class="steps">
        <li><span>Download <b>{fileName}</b>.</span></li>
        <li><span>If Windows shows SmartScreen, click <b>More info → Run anyway</b>.</span></li>
        <li><span>Follow the installer: it adds a Start Menu shortcut, an uninstaller and the Visual C++ runtime if it's missing.</span></li>
        <li><span>Open MAW and pick your audio interface at <b>MENU → ASIO Audio Setup</b>.</span></li>
      </ol>
      {release.state === 'ready' ? (
        <Fragment>
          <a class="btn btn-rec" href={release.url} data-download>Download MAW {site.version} · Windows</a>
          <div class="hash">SHA-256: {release.sha256} · {release.sizeLabel}</div>
        </Fragment>
      ) : (
        <Fragment>
          <span class="btn btn-rec" role="link" aria-disabled="true" data-download>Installer coming soon</span>
          <div class="hash">The installer is being pressed. Check back soon.</div>
        </Fragment>
      )}
      {site.sourceCodeUrl && <a class="source-link" href={site.sourceCodeUrl}>Source code (GNU GPL v3)</a>}
    </div>
  </div>
</section>
```

- [ ] **Step 5: Montar no `index.astro`**

Imports:
```astro
import TechRider from '../components/TechRider.astro';
import ReadBeforeInstall from '../components/ReadBeforeInstall.astro';
import Download from '../components/Download.astro';
```
Dentro de `<main>`, depois de `<Backstage />`:
```astro
    <TechRider />
    <ReadBeforeInstall />
    <Download />
```

- [ ] **Step 6: Rodar os testes**

Run: `npx playwright test tests/e2e/install.spec.ts`
Esperado: PASS no estado atual (sem `release.json`, o botão mostra "Installer coming soon").

- [ ] **Step 7: Commit**

```bash
git add src/components/TechRider.astro src/components/ReadBeforeInstall.astro src/components/Download.astro src/pages/index.astro tests/e2e/install.spec.ts
git commit -m "feat: rider tecnico, avisos antes de instalar e credencial de download com estado do release"
```

---

### Task 8: World Tour, Liner notes + Credits, FAQ, Contato e kit de imprensa

**Files:**
- Create: `src/components/WorldTour.astro`, `src/components/LinerNotes.astro`, `src/components/Faq.astro`, `src/components/Contact.astro`, `tools/press-kit.mjs`
- Modify: `src/pages/index.astro`, `package.json` (script `prebuild`, dependência `fflate`)
- Test: `tests/e2e/story-contact.spec.ts`

**Interfaces:**
- Consumes: `roadmap`, `stampLabel`, `story`, `timeline`, `credits`, `faq`, `channels`, `visibleChannels`, `withBase`
- Produces: seções `#tour`, `#liner-notes` (com `#credits`), `#faq` e `#contact`, e o arquivo `public/press/maw-screenshots.zip`, gerado no `prebuild`

- [ ] **Step 1: Teste e2e (falha)**

`tests/e2e/story-contact.spec.ts`:
```ts
import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => page.goto('/'));

test('world tour stamps every stop with a status', async ({ page }) => {
  await expect(page.locator('#tour .date')).toHaveCount(9);
  await expect(page.locator('#tour .stamp.live')).toHaveText(['On the road']);
});

test('liner notes tell the story and credit JUCE and Spleeter', async ({ page }) => {
  await expect(page.locator('#liner-notes h2')).toContainText('Born in a');
  await expect(page.locator('#credits .credit')).toHaveCount(9);
  await expect(page.locator('#credits')).toContainText('JUCE 8');
  await expect(page.locator('#credits')).toContainText('Spleeter');
});

test('FAQ has 8 questions with the first one open', async ({ page }) => {
  await expect(page.locator('#faq details')).toHaveCount(8);
  await expect(page.locator('#faq details').first()).toHaveAttribute('open', '');
});

test('only the e-mail channel is shown at launch', async ({ page }) => {
  await expect(page.locator('#contact .chan')).toHaveCount(1);
  await expect(page.locator('#contact .chan')).toHaveAttribute('href', 'mailto:waynerbusiness@outlook.com');
});

test('press kit files are downloadable', async ({ page, request }) => {
  const hrefs = await page.locator('#contact .press a').evaluateAll((as) => as.map((a) => a.getAttribute('href')!));
  expect(hrefs).toHaveLength(4);
  for (const href of hrefs) {
    const res = await request.get(href);
    expect(res.status(), href).toBe(200);
  }
});
```

Run: `npx playwright test tests/e2e/story-contact.spec.ts`
Esperado: FAIL.

- [ ] **Step 2: Kit de imprensa (ZIP no prebuild)**

```bash
npm install -D fflate@^0.8.3
```

`tools/press-kit.mjs`:
```js
// Empacota os prints da MAW para o kit de imprensa. Roda antes de cada build (npm prebuild).
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { zipSync } from 'fflate';

const dir = 'src/assets/screens';
const files = {};
for (const name of readdirSync(dir).filter((n) => n.endsWith('.png')).sort()) {
  files[`maw-screenshots/${name}`] = [readFileSync(`${dir}/${name}`), { level: 0 }];
}
mkdirSync('public/press', { recursive: true });
writeFileSync('public/press/maw-screenshots.zip', zipSync(files));
console.log(`press kit: ${Object.keys(files).length} prints em public/press/maw-screenshots.zip`);
```

Em `package.json`, acrescentar em `scripts`:
```json
"prebuild": "node tools/press-kit.mjs",
```

- [ ] **Step 3: `WorldTour.astro`**

```astro
---
import { roadmap, stampLabel } from '../data/roadmap';
---
<section class="sec tour" id="tour">
  <div class="wrap">
    <div class="eyebrow">Roadmap</div>
    <h2 class="h-tour chrome">MAW World Tour</h2>
    <div class="years">2026 — 2027</div>
    <ol class="dates">
      {roadmap.map((d) => (
        <li class="date">
          <span class="when">{d.when}</span>
          <span class="what">{d.what}</span>
          <span class={`stamp ${d.status}`}>{stampLabel[d.status]}</span>
        </li>
      ))}
    </ol>
  </div>
</section>
```

- [ ] **Step 4: `LinerNotes.astro`**

```astro
---
import { credits, story, timeline } from '../data/liner';
---
<section class="sec liner" id="liner-notes">
  <svg class="grain" width="100%" height="100%" aria-hidden="true">
    <filter id="gr">
      <feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="3" stitchTiles="stitch" />
      <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .55 0" />
    </filter>
    <rect width="100%" height="100%" filter="url(#gr)" />
  </svg>
  <div class="wrap">
    <div class="eyebrow">Liner notes</div>
    <h2 class="h-liner">Born in a <span class="red">thesis</span>,<br />built to play loud</h2>
    <div class="liner-grid">
      <div>
        <p>{story.lead}</p>
        <p>{story.body}</p>
        <blockquote>{story.quote}</blockquote>
        <p>{story.closing}</p>
      </div>
      <ol class="timeline">
        {timeline.map((t) => <li><b>{t.when}</b><span>{t.what}</span></li>)}
      </ol>
    </div>
    <section class="credits" id="credits" aria-labelledby="credits-title">
      <h3 id="credits-title">Credits</h3>
      {credits.map((c) => (
        <dl class="credit">
          <dt>{c.role}</dt>
          <dd>{c.name}{c.note && <small>{c.note}</small>}</dd>
        </dl>
      ))}
    </section>
  </div>
</section>
```

- [ ] **Step 5: `Faq.astro` e `Contact.astro`**

`src/components/Faq.astro`:
```astro
---
import { faq } from '../data/faq';
---
<section class="sec faq" id="faq">
  <div class="wrap faq-grid">
    <div>
      <div class="eyebrow">FAQ</div>
      <h2 class="h-goth md">Questions from the crowd</h2>
    </div>
    <div>
      {faq.map((f, i) => (
        <details open={i === 0}>
          <summary>{f.q}</summary>
          <p>{f.a}</p>
        </details>
      ))}
    </div>
  </div>
</section>
```

`src/components/Contact.astro`:
```astro
---
import logo from '../assets/brand/maw-logo-web.png';
import { channels } from '../data/channels';
import { visibleChannels } from '../lib/channels';
import { withBase } from '../lib/url';

const shown = visibleChannels(channels);
const press = [
  { href: withBase('press/logo_MAW.png'), label: 'Official logo (PNG)' },
  { href: logo.src, label: 'Web logo (transparent PNG)' },
  { href: withBase('press/icon_MAW.png'), label: 'App icon (PNG)' },
  { href: withBase('press/maw-screenshots.zip'), label: 'Screenshots (ZIP)' },
];
---
<section class="sec contact" id="contact">
  <div class="wrap">
    <div class="sec-head">
      <div class="eyebrow">Official channels</div>
      <h2 class="chrome h-rock sm">Talk to MAW</h2>
    </div>
    <div class="contact-grid">
      {shown.map((c) => (
        <a class="chan" href={c.href} data-channel={c.id}>
          <div class="ic" aria-hidden="true">{c.icon}</div>
          <div><b>{c.label}</b><span>{c.value}</span></div>
        </a>
      ))}
    </div>
    <nav class="press" aria-label="Press kit">
      {press.map((p) => <a href={p.href} download>{p.label}</a>)}
    </nav>
  </div>
</section>
```

- [ ] **Step 6: Montar no `index.astro`**

Imports:
```astro
import WorldTour from '../components/WorldTour.astro';
import LinerNotes from '../components/LinerNotes.astro';
import Faq from '../components/Faq.astro';
import Contact from '../components/Contact.astro';
```
Dentro de `<main>`, depois de `<Download />`:
```astro
    <WorldTour />
    <LinerNotes />
    <Faq />
    <Contact />
```

- [ ] **Step 7: Rodar os testes**

Run: `npm run build && npx playwright test tests/e2e/story-contact.spec.ts`
Esperado: o build imprime "press kit: 19 prints…" e os testes passam.

- [ ] **Step 8: Commit**

```bash
git add src/components/WorldTour.astro src/components/LinerNotes.astro src/components/Faq.astro src/components/Contact.astro tools/press-kit.mjs src/pages/index.astro package.json package-lock.json tests/e2e/story-contact.spec.ts
git commit -m "feat: world tour, encarte com creditos, FAQ, canais e kit de imprensa"
```

---

### Task 9: Portões de qualidade (inglês, base path, celular, movimento, SEO)

**Files:**
- Create: `tools/lib/portuguese.mjs`, `tools/check-portuguese.mjs`, `tools/lib/base-links.mjs`, `tools/check-base-links.mjs`, `tools/og-image.mjs`, `src/pages/robots.txt.ts`
- Create (gerado e commitado): `public/og-image.png`
- Modify: `package.json` (scripts `check:pt`, `check:links`, `check:dist`, `og-image`)
- Test: `tests/unit/portuguese.test.ts`, `tests/unit/base-links.test.ts`, `tests/e2e/quality.spec.ts`

**Interfaces:**
- Produces: `extractText(html: string): string` e `findPortuguese(html: string, allow?: string[]): string[]` em `tools/lib/portuguese.mjs`
- Produces: `localRefs(html: string): string[]` e `brokenRefs(html: string, base: string, exists: (rel: string) => boolean): string[]` em `tools/lib/base-links.mjs`
- Produces: CLIs `node tools/check-portuguese.mjs <dir>` e `node tools/check-base-links.mjs <dir>` (este lê `BASE_PATH`); os dois saem com código 1 se acharem problema

- [ ] **Step 1: Testes unitários dos verificadores (falham)**

`tests/unit/portuguese.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { findPortuguese } from '../../tools/lib/portuguese.mjs';

describe('findPortuguese', () => {
  it('finds Portuguese words in visible text', () => {
    expect(findPortuguese('<p>A música que você grava</p>')).toEqual(['música', 'você']);
  });
  it('finds Portuguese hidden in attributes', () => {
    expect(findPortuguese('<img alt="Tela do mixer mostrando trilhas">')).toEqual(['trilhas']);
  });
  it('ignores scripts, styles, URLs and e-mails', () => {
    const html = '<script>const para = 1</script><style>.nao{}</style><a href="https://x.com/para">Mail</a> me@site.com';
    expect(findPortuguese(html)).toEqual([]);
  });
  it('ignores allowed phrases such as the demo project name', () => {
    expect(findPortuguese('<p>demo project “Noite Roxa”</p>', ['Noite Roxa'])).toEqual([]);
  });
  it('accepts plain English', () => {
    expect(findPortuguese('<h1>The DAW that understands the music it records</h1>')).toEqual([]);
  });
});
```

`tests/unit/base-links.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { brokenRefs, localRefs } from '../../tools/lib/base-links.mjs';

const exists = (files: string[]) => (rel: string) => files.includes(rel);

describe('localRefs', () => {
  it('collects src, href and every srcset candidate, skipping external and protocol-relative', () => {
    const html = '<img src="/a.png" srcset="/a-1.avif 640w, /a-2.avif 960w"><a href="https://x.com"></a><a href="//cdn.x/y"></a><a href="#faq"></a>';
    expect(localRefs(html)).toEqual(['/a.png', '/a-1.avif', '/a-2.avif']);
  });
});

describe('brokenRefs', () => {
  it('accepts refs under the root base that exist', () => {
    expect(brokenRefs('<img src="/_astro/a.png">', '/', exists(['_astro/a.png']))).toEqual([]);
  });
  it('flags refs that ignore a sub-path base', () => {
    expect(brokenRefs('<img src="/_astro/a.png">', '/Site-oficial-MAW', exists(['_astro/a.png']))).toEqual(['/_astro/a.png']);
  });
  it('flags missing files under the base', () => {
    expect(brokenRefs('<a href="/Site-oficial-MAW/press/x.zip">', '/Site-oficial-MAW/', exists([]))).toEqual(['/Site-oficial-MAW/press/x.zip']);
  });
  it('maps the base itself to index.html', () => {
    expect(brokenRefs('<a href="/Site-oficial-MAW/">', '/Site-oficial-MAW', exists(['index.html']))).toEqual([]);
  });
});
```

Run: `npx vitest run tests/unit/portuguese.test.ts tests/unit/base-links.test.ts`
Esperado: FAIL (módulos inexistentes).

- [ ] **Step 2: Implementar `tools/lib/portuguese.mjs`**

```js
// Palavras que só aparecem em português; se surgirem no site, alguma frase escapou da tradução.
export const PT_WORDS = [
  'você', 'voce', 'não', 'nao', 'para', 'música', 'musica', 'uma', 'também', 'tambem', 'está', 'esta',
  'trilha', 'trilhas', 'gravação', 'gravacao', 'mixagem', 'baixar', 'recursos', 'requisitos', 'história',
  'historia', 'perguntas', 'canais', 'seu', 'sua', 'com', 'sem', 'pelo', 'pela', 'então', 'entao', 'porque',
  'quando', 'ainda', 'aqui', 'grave', 'edite', 'mixe', 'entregue', 'leia', 'antes', 'instalar',
];

export function extractText(html) {
  const noCode = html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ');
  const attrs = [...noCode.matchAll(/\s(?:alt|title|aria-label|content|placeholder)="([^"]*)"/gi)].map((m) => m[1]);
  const text = noCode.replace(/<[^>]+>/g, ' ');
  return [text, ...attrs].join('\n');
}

export function findPortuguese(html, allow = []) {
  let text = extractText(html)
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, ' ');
  for (const phrase of allow) text = text.split(phrase).join(' ');
  const re = new RegExp(`(?<!\\p{L})(${PT_WORDS.join('|')})(?!\\p{L})`, 'giu');
  return [...new Set([...text.matchAll(re)].map((m) => m[1].toLowerCase()))];
}
```

- [ ] **Step 3: Implementar `tools/lib/base-links.mjs`**

```js
// Todo recurso local precisa começar pelo base (GitHub Pages usa /Site-oficial-MAW) e existir no dist.
export function localRefs(html) {
  const refs = [];
  for (const m of html.matchAll(/\s(?:src|href)="([^"]+)"/g)) refs.push(m[1]);
  for (const m of html.matchAll(/\ssrcset="([^"]+)"/g)) {
    for (const part of m[1].split(',')) refs.push(part.trim().split(/\s+/)[0]);
  }
  return refs.filter((r) => r.startsWith('/') && !r.startsWith('//'));
}

export function brokenRefs(html, base, exists) {
  const b = base.endsWith('/') ? base : `${base}/`;
  return localRefs(html).filter((ref) => {
    const clean = ref.split('#')[0].split('?')[0];
    if (clean === b || clean === b.slice(0, -1)) return !exists('index.html');
    if (!clean.startsWith(b)) return true;
    const rel = clean.slice(b.length);
    return !exists(decodeURIComponent(rel.endsWith('/') ? `${rel}index.html` : rel));
  });
}
```

Run: `npx vitest run tests/unit/portuguese.test.ts tests/unit/base-links.test.ts`
Esperado: PASS (9 testes).

- [ ] **Step 4: CLIs dos verificadores**

`tools/check-portuguese.mjs`:
```js
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { findPortuguese } from './lib/portuguese.mjs';

// Exceções do spec: nomes de botões do app, projeto demo e nomes próprios.
const ALLOW = ['Noite Roxa', 'Centro Universitário Hermínio Ometto', 'Hermínio Ometto', 'EFEITO', 'ASSISTENTE IA', 'Wayner Pires de Moraes', 'Araras'];

const walk = (dir) => readdirSync(dir).flatMap((n) => {
  const p = join(dir, n);
  return statSync(p).isDirectory() ? walk(p) : p.endsWith('.html') ? [p] : [];
});

let problems = 0;
for (const file of walk(process.argv[2] ?? 'dist')) {
  const hits = findPortuguese(readFileSync(file, 'utf8'), ALLOW);
  if (hits.length) {
    problems++;
    console.error(`${file}: ${hits.join(', ')}`);
  }
}
console.log(problems ? `português encontrado em ${problems} arquivo(s)` : 'nenhum português no site');
process.exit(problems ? 1 : 0);
```

`tools/check-base-links.mjs`:
```js
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { brokenRefs } from './lib/base-links.mjs';

const dist = process.argv[2] ?? 'dist';
const base = process.env.BASE_PATH ?? '/';
const walk = (dir) => readdirSync(dir).flatMap((n) => {
  const p = join(dir, n);
  return statSync(p).isDirectory() ? walk(p) : p.endsWith('.html') ? [p] : [];
});

let broken = 0;
for (const file of walk(dist)) {
  for (const ref of brokenRefs(readFileSync(file, 'utf8'), base, (rel) => existsSync(join(dist, rel)))) {
    broken++;
    console.error(`${file}: ${ref}`);
  }
}
console.log(broken ? `${broken} link(s) quebrado(s) com base ${base}` : `todos os links locais ok com base ${base}`);
process.exit(broken ? 1 : 0);
```

Em `package.json`, acrescentar em `scripts`:
```json
"check:pt": "node tools/check-portuguese.mjs dist",
"check:links": "node tools/check-base-links.mjs dist",
"check:dist": "npm run check:pt && npm run check:links",
"og-image": "node tools/og-image.mjs"
```

Run: `npm run build && npm run check:dist`
Esperado: "nenhum português no site" e "todos os links locais ok com base /". Se aparecer português, corrigir o texto na fonte (dados ou componente) e repetir.

- [ ] **Step 5: Base path do GitHub Pages**

Run (bash):
```bash
MSYS_NO_PATHCONV=1 BASE_PATH=/Site-oficial-MAW npm run build && MSYS_NO_PATHCONV=1 BASE_PATH=/Site-oficial-MAW npm run check:links
```
(`MSYS_NO_PATHCONV=1` impede o Git Bash de transformar `/Site-oficial-MAW` num caminho do Windows. No PowerShell: `$env:BASE_PATH='/Site-oficial-MAW'; npm run build; npm run check:links; Remove-Item Env:BASE_PATH`.)
Esperado: "todos os links locais ok com base /Site-oficial-MAW". Depois, reconstruir com o base padrão: `npm run build`.

- [ ] **Step 6: `robots.txt`**

`src/pages/robots.txt.ts`:
```ts
import type { APIRoute } from 'astro';
import { withBase } from '../lib/url';

export const GET: APIRoute = ({ site }) => {
  const sitemap = new URL(withBase('sitemap-index.xml'), site).href;
  return new Response(`User-agent: *\nAllow: /\n\nSitemap: ${sitemap}\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
```

- [ ] **Step 7: Teste e2e de qualidade (roda contra o site todo)**

`tests/e2e/quality.spec.ts`:
```ts
import { expect, test } from '@playwright/test';

test('no heading, paragraph or button spills outside the screen', async ({ page }) => {
  await page.goto('/');
  const spills = await page.evaluate(() => {
    const w = window.innerWidth;
    return Array.from(document.querySelectorAll('h1, h2, h3, p, .btn, .trk, .plate, .date, .chan, td'))
      .filter((el) => !el.closest('.ticker'))
      .map((el) => ({ el, r: el.getBoundingClientRect() }))
      .filter(({ r }) => r.width > 0 && (r.left < -1 || r.right > w + 1))
      .map(({ el, r }) => `${el.tagName}.${(el as HTMLElement).className} ${Math.round(r.left)}..${Math.round(r.right)} "${el.textContent?.trim().slice(0, 40)}"`);
  });
  expect(spills).toEqual([]);
});

test('reduced motion stops every animation', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const animated = await page.evaluate(() =>
    Array.from(document.querySelectorAll('*'))
      .filter((el) => [null, '::before', '::after'].some((p) => getComputedStyle(el, p).animationName !== 'none'))
      .map((el) => `${el.tagName}.${(el as HTMLElement).className}`),
  );
  expect(animated).toEqual([]);
  const vinyl = await page.locator('.vinyl').evaluate((el) => getComputedStyle(el).transform);
  expect(vinyl).not.toBe('none');
});

test('every image has an alt attribute and content images describe themselves', async ({ page }) => {
  await page.goto('/');
  const missing = await page.locator('img:not([alt])').count();
  expect(missing).toBe(0);
  const emptyContent = await page.locator('.screen img[alt=""], .card img[alt=""], .shot img[alt=""]').count();
  expect(emptyContent).toBe(0);
});

test('every in-page anchor points to an existing section', async ({ page }) => {
  await page.goto('/');
  const targets = await page.locator('a[href^="#"]').evaluateAll((as) => as.map((a) => a.getAttribute('href')!.slice(1)));
  for (const id of new Set(targets)) expect(await page.locator(`[id="${id}"]`).count(), `#${id}`).toBe(1);
});

test('external links only go to the official e-mail or the GitHub account', async ({ page }) => {
  await page.goto('/');
  const hrefs = await page.locator('a[href]').evaluateAll((as) => as.map((a) => a.getAttribute('href')!));
  for (const h of hrefs.filter((x) => /^[a-z][a-z0-9+.-]*:/i.test(x))) {
    expect(h, h).toMatch(/^(mailto:waynerbusiness@outlook\.com|https:\/\/github\.com\/WaynerMoraes12\/)/);
  }
});

test('robots, sitemap and OG image are served', async ({ request }) => {
  expect((await request.get('/robots.txt')).status()).toBe(200);
  expect((await request.get('/sitemap-index.xml')).status()).toBe(200);
  const og = await request.get('/og-image.png');
  expect(og.status()).toBe(200);
  const buf = await og.body();
  expect([buf.readUInt32BE(16), buf.readUInt32BE(20)]).toEqual([1200, 630]);
});
```

- [ ] **Step 8: Imagem de compartilhamento (OG)**

`tools/og-image.mjs`:
```js
// Tira um print 1200x630 da capa do site para o Open Graph. Precisa do preview rodando.
import { chromium } from '@playwright/test';

const url = process.argv[2] ?? 'http://127.0.0.1:4321/';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await page.emulateMedia({ reducedMotion: 'reduce' });
await page.goto(url, { waitUntil: 'networkidle' });
await page.addStyleTag({ content: '.nav{display:none!important} .hero{min-height:630px!important;padding:36px 0!important}' });
await page.screenshot({ path: 'public/og-image.png' });
await browser.close();
console.log('escrito public/og-image.png');
```

Run (dois terminais, ou em background):
```bash
npm run build && npm run preview -- --host 127.0.0.1 --port 4321
npm run og-image
```
Esperado: "escrito public/og-image.png". Olhar a imagem gerada: a capa (título + disco) precisa aparecer inteira. Parar o preview.

- [ ] **Step 9: Rodar tudo**

Run: `npx vitest run && npx playwright test`
Esperado: todos os testes passam em desktop e mobile. Se o teste de vazamento no celular apontar algum elemento, corrigir no `global.css` (dentro do `@media (max-width: 560px)` dos acréscimos) e repetir. Não mudar a estética do desktop.

- [ ] **Step 10: Lighthouse (celular)**

```bash
npm run preview -- --host 127.0.0.1 --port 4321
```
Em outro terminal (bash):
```bash
export CHROME_PATH="$(node -e "import('@playwright/test').then(m=>console.log(m.chromium.executablePath()))")"
npx -y lighthouse http://127.0.0.1:4321/ --form-factor=mobile --only-categories=performance,accessibility,best-practices,seo --chrome-flags="--headless=new" --output=json --output-path=./.lighthouse.json --quiet
node -e "const r=require('./.lighthouse.json');for(const [k,v] of Object.entries(r.categories))console.log(k, Math.round(v.score*100))"
```
Esperado: performance ≥ 90, accessibility ≥ 95, best-practices ≥ 95. Se a performance ficar abaixo, tentar nesta ordem:
1. `loading="lazy"` nos prints abaixo da dobra (já vem no Picture);
2. reduzir `widths` do Stage para `[640, 960, 1280]`;
3. tirar o peso 400 da Grenze Gotisch (usar 900 no blockquote).

Parar o preview.

- [ ] **Step 11: Comparação visual com o mockup**

Tirar prints do site construído em 1440, 1280, 768 e 390 px, seção por seção, com o Playwright MCP ou `npx playwright screenshot --viewport-size=1440,900 http://127.0.0.1:4321/ .shots/desktop.png --full-page`. Comparar lado a lado com `docs/superpowers/mockups/site-v2.html` servido pelo visual companion. Diferença aceitável: só texto (inglês) e as correções da seção 3.4 do spec.

- [ ] **Step 12: Commit**

```bash
git add tools/lib tools/check-portuguese.mjs tools/check-base-links.mjs tools/og-image.mjs src/pages/robots.txt.ts public/og-image.png package.json tests/unit/portuguese.test.ts tests/unit/base-links.test.ts tests/e2e/quality.spec.ts src/styles/global.css
git commit -m "test: portoes de ingles, base path, celular, reduced motion e SEO"
```

---

### Task 10: Instalador Windows (Inno Setup) e `release.json`

> **PARAR antes do Step 1 e pedir ao usuário:**
> 1. OK para instalar o Inno Setup com `winget install --id JRSoftware.InnoSetup -e`;
> 2. OK para rodar o instalador gerado neste PC, instalar, abrir a MAW e desinstalar.
>
> Também conferir no repo da MAW se o bug #1 (`C:\MAW_DEVELOPER`) já foi corrigido:
> ```bash
> grep -rn "MAW_DEVELOPER" C:/Users/User/MAW/Source --include=*.cpp
> ```
> Se não houver ocorrência, avisar o usuário. O `server_mapp.py` pode entrar no instalador e `neuralServerBundled` passa a `true`, mas isso é uma decisão dele e não faz parte deste plano.

**Files:**
- Create: `installer/MAW.iss`, `scripts/lib/release-info.mjs`, `scripts/build-installer.mjs`
- Create (gerado e commitado): `src/data/release.json`
- Modify: `package.json` (script `installer`)
- Test: `tests/unit/release-info.test.ts`

**Interfaces:**
- Produces:
  - `sha256File(path: string): Promise<string>`
  - `buildReleaseInfo(i: { file: string; bytes: number; sha256: string; version: string; builtAt: string }): ReleaseInfo` (lança erro se inválido)
  - `findIscc(candidates: (string | undefined)[], exists?: (p: string) => boolean): string | null`
- Produces: `src/data/release.json` no formato `ReleaseInfo` (Task 3), que o `Download.astro` passa a mostrar como "ready"
- Consumes: `C:\Users\User\MAW\Builds\VisualStudio2022\x64\Release\App\MAW_APP.exe` (sobrescrever com `MAW_EXE`), `C:\Users\User\MAW\LICENSE`, `C:\Users\User\MAW\LICENSE-THIRD-PARTY.md` (sobrescrever com `MAW_REPO`), `installer/maw.ico` (Task 2)

- [ ] **Step 1: Testes (falham)**

`tests/unit/release-info.test.ts`:
```ts
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildReleaseInfo, findIscc, sha256File } from '../../scripts/lib/release-info.mjs';
import { isReleaseInfo } from '../../src/lib/release';

describe('sha256File', () => {
  it('hashes a file like sha256sum does', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'maw-'));
    const file = join(dir, 'abc.txt');
    writeFileSync(file, 'abc');
    expect(await sha256File(file)).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  });
});

describe('buildReleaseInfo', () => {
  const ok = { file: 'MAW-Setup-1.0.0.exe', bytes: 10, sha256: 'b'.repeat(64), version: '1.0.0', builtAt: '2026-09-28T00:00:00.000Z' };
  it('returns data the site accepts', () => {
    expect(isReleaseInfo(buildReleaseInfo(ok))).toBe(true);
  });
  it('refuses a bad hash or an empty file', () => {
    expect(() => buildReleaseInfo({ ...ok, sha256: 'nope' })).toThrow(/sha256/);
    expect(() => buildReleaseInfo({ ...ok, bytes: 0 })).toThrow(/bytes/);
  });
});

describe('findIscc', () => {
  it('returns the first candidate that exists', () => {
    expect(findIscc([undefined, 'C:/a/ISCC.exe', 'C:/b/ISCC.exe'], (p) => p === 'C:/b/ISCC.exe')).toBe('C:/b/ISCC.exe');
  });
  it('returns null when Inno Setup is not installed', () => {
    expect(findIscc(['C:/a/ISCC.exe'], () => false)).toBeNull();
  });
});
```

Run: `npx vitest run tests/unit/release-info.test.ts`
Esperado: FAIL.

- [ ] **Step 2: `scripts/lib/release-info.mjs`**

```js
import { createHash } from 'node:crypto';
import { createReadStream, existsSync } from 'node:fs';

export function sha256File(path) {
  return new Promise((resolve, reject) => {
    const hash = createHash('sha256');
    createReadStream(path)
      .on('data', (chunk) => hash.update(chunk))
      .on('end', () => resolve(hash.digest('hex')))
      .on('error', reject);
  });
}

// Mesmo formato que src/lib/release.ts aceita (isReleaseInfo).
export function buildReleaseInfo({ file, bytes, sha256, version, builtAt }) {
  if (!file.endsWith('.exe')) throw new Error(`file inválido: ${file}`);
  if (!Number.isInteger(bytes) || bytes <= 0) throw new Error(`bytes inválido: ${bytes}`);
  if (!/^[0-9a-f]{64}$/.test(sha256)) throw new Error(`sha256 inválido: ${sha256}`);
  return { file, bytes, sha256, version, builtAt };
}

export function findIscc(candidates, exists = existsSync) {
  return candidates.find((c) => c && exists(c)) ?? null;
}
```

Run: `npx vitest run tests/unit/release-info.test.ts`
Esperado: PASS (5 testes).

- [ ] **Step 3: `installer/MAW.iss`**

```iss
; Instalador oficial da MAW. Compilado por scripts/build-installer.mjs, que passa
; AppVersion, SourceExe (MAW_APP.exe de Release) e MawRepo (para LICENSE e créditos).
#ifndef AppVersion
  #define AppVersion "1.0.0"
#endif
#ifndef SourceExe
  #error SourceExe precisa ser definido (/DSourceExe=...)
#endif
#ifndef MawRepo
  #error MawRepo precisa ser definido (/DMawRepo=...)
#endif

[Setup]
AppId={{DD0F02F2-3F2C-48E1-A02E-F3A0C7F76221}
AppName=MAW
AppVersion={#AppVersion}
AppVerName=MAW {#AppVersion}
AppPublisher=Wayner Pires de Moraes
AppPublisherURL=https://github.com/WaynerMoraes12/Site-oficial-MAW
DefaultDirName={autopf}\MAW
DefaultGroupName=MAW
DisableProgramGroupPage=yes
LicenseFile={#MawRepo}\LICENSE
OutputDir=output
OutputBaseFilename=MAW-Setup-{#AppVersion}
SetupIconFile=maw.ico
UninstallDisplayIcon={app}\MAW.exe
Compression=lzma2/max
SolidCompression=yes
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible
MinVersion=10.0
WizardStyle=modern
PrivilegesRequired=admin

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"
Name: "brazilianportuguese"; MessagesFile: "compiler:Languages\BrazilianPortuguese.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked

[Files]
Source: "{#SourceExe}"; DestDir: "{app}"; DestName: "MAW.exe"; Flags: ignoreversion
Source: "{#MawRepo}\LICENSE"; DestDir: "{app}"; DestName: "LICENSE.txt"; Flags: ignoreversion
Source: "{#MawRepo}\LICENSE-THIRD-PARTY.md"; DestDir: "{app}"; Flags: ignoreversion
Source: "redist\vc_redist.x64.exe"; DestDir: "{tmp}"; Flags: deleteafterinstall

[Icons]
Name: "{group}\MAW"; Filename: "{app}\MAW.exe"
Name: "{group}\{cm:UninstallProgram,MAW}"; Filename: "{uninstallexe}"
Name: "{autodesktop}\MAW"; Filename: "{app}\MAW.exe"; Tasks: desktopicon

[Run]
; O MAW_APP.exe é /MD (MultiThreadedDLL): precisa do runtime. O instalador da Microsoft
; não faz nada se a mesma versão ou uma mais nova já estiver instalada.
Filename: "{tmp}\vc_redist.x64.exe"; Parameters: "/install /quiet /norestart"; StatusMsg: "Installing the Microsoft Visual C++ runtime..."; Flags: waituntilterminated
Filename: "{app}\MAW.exe"; Description: "{cm:LaunchProgram,MAW}"; Flags: nowait postinstall skipifsilent
```

- [ ] **Step 4: `scripts/build-installer.mjs`**

```js
// Compila installer/MAW.iss e grava src/data/release.json (arquivo, tamanho, SHA-256).
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildReleaseInfo, findIscc, sha256File } from './lib/release-info.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const site = JSON.parse(readFileSync(join(root, 'src/data/site.json'), 'utf8'));
const mawRepo = process.env.MAW_REPO ?? 'C:\\Users\\User\\MAW';
const sourceExe = process.env.MAW_EXE ?? join(mawRepo, 'Builds', 'VisualStudio2022', 'x64', 'Release', 'App', 'MAW_APP.exe');

if (!existsSync(sourceExe)) throw new Error(`MAW_APP.exe não encontrado: ${sourceExe}`);

const redist = join(root, 'installer', 'redist', 'vc_redist.x64.exe');
if (!existsSync(redist)) {
  mkdirSync(dirname(redist), { recursive: true });
  let res = await fetch('https://aka.ms/vc14/vc_redist.x64.exe');
  if (!res.ok) res = await fetch('https://aka.ms/vs/17/release/vc_redist.x64.exe');
  if (!res.ok) throw new Error(`download do VC++ Redistributable falhou: HTTP ${res.status}`);
  writeFileSync(redist, Buffer.from(await res.arrayBuffer()));
  console.log(`baixado ${redist}`);
}

const iscc = findIscc([
  process.env.ISCC,
  'C:\\Program Files (x86)\\Inno Setup 6\\ISCC.exe',
  process.env.LOCALAPPDATA && join(process.env.LOCALAPPDATA, 'Programs', 'Inno Setup 6', 'ISCC.exe'),
]);
if (!iscc) throw new Error('ISCC.exe não encontrado: instale o Inno Setup 6 ou defina ISCC');

execFileSync(iscc, [`/DAppVersion=${site.version}`, `/DSourceExe=${sourceExe}`, `/DMawRepo=${mawRepo}`, join(root, 'installer', 'MAW.iss')], { stdio: 'inherit' });

const file = `MAW-Setup-${site.version}.exe`;
const out = join(root, 'installer', 'output', file);
const info = buildReleaseInfo({ file, bytes: statSync(out).size, sha256: await sha256File(out), version: site.version, builtAt: new Date().toISOString() });
writeFileSync(join(root, 'src', 'data', 'release.json'), `${JSON.stringify(info, null, 2)}\n`);
console.log(`release.json: ${file} · ${info.bytes} bytes · ${info.sha256}`);
```

Em `package.json`, acrescentar em `scripts`: `"installer": "node scripts/build-installer.mjs"`.

- [ ] **Step 5: Instalar o Inno Setup (só com o OK do usuário)**

```bash
winget install --id JRSoftware.InnoSetup -e --accept-source-agreements --accept-package-agreements
```
Esperado: ISCC.exe em `C:\Program Files (x86)\Inno Setup 6\` ou em `%LOCALAPPDATA%\Programs\Inno Setup 6\`.

- [ ] **Step 6: Gerar o instalador**

Run: `npm run installer`
Esperado: o ISCC termina com "Successful compile"; aparecem `installer/output/MAW-Setup-1.0.0.exe` e `src/data/release.json`. Conferir o hash:
```bash
sha256sum installer/output/MAW-Setup-1.0.0.exe
node -e "console.log(require('./src/data/release.json').sha256)"
```
Esperado: os dois iguais.

- [ ] **Step 7: Testar instalação e desinstalação (só com o OK do usuário)**

1. Rodar `installer/output/MAW-Setup-1.0.0.exe`, instalar com as opções padrão.
2. Conferir: `Test-Path "$env:ProgramFiles\MAW\MAW.exe"` → `True`; atalho "MAW" no Menu Iniciar.
3. Abrir a MAW pelo atalho. A janela "MAW - projeto novo" aparece (confirma que o runtime VC++ está ok). Fechar.
4. Desinstalar por "Adicionar ou remover programas" → MAW. Conferir: `Test-Path "$env:ProgramFiles\MAW"` → `False`.

- [ ] **Step 8: O site passa a oferecer o download**

Run: `npx vitest run && npx playwright test tests/e2e/install.spec.ts`
Esperado: PASS. Agora o teste segue o ramo "release.json existe": `href` termina em `/v1.0.0/MAW-Setup-1.0.0.exe` e o hash aparece.

- [ ] **Step 9: Commit (o .exe não entra no git)**

```bash
git add installer/MAW.iss scripts src/data/release.json package.json tests/unit/release-info.test.ts
git commit -m "feat: instalador Inno Setup com runtime VC++ e release.json com SHA-256"
```

> **Publicar o release** (`gh release create v1.0.0 installer/output/MAW-Setup-1.0.0.exe --repo WaynerMoraes12/Site-oficial-MAW`) **não faz parte deste plano.** Depende da decisão da GPL e de autorização explícita do usuário.

---

### Task 11: Deploy (desligado), ferramentas de prints, README e verificação final

**Files:**
- Create: `.github/workflows/deploy.yml`, `README.md`, `tools/screenshots/make_demo.py`, `tools/screenshots/maw.ps1`, `tools/screenshots/README.md`

**Interfaces:**
- Consumes: scripts `build`, `test`, `test:e2e`, `check:dist`; variáveis `SITE_URL` e `BASE_PATH`

- [ ] **Step 1: Workflow de deploy, só manual**

`.github/workflows/deploy.yml`:
```yaml
# Só roda quando alguém dispara manualmente (Actions → Deploy → Run workflow).
# Não é ativado até o usuário decidir a questão da GPL e tornar o repo público.
name: Deploy site to GitHub Pages

on:
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    env:
      SITE_URL: https://waynermoraes12.github.io
      BASE_PATH: /Site-oficial-MAW
    steps:
      - uses: actions/checkout@v5
      - uses: actions/setup-node@v5
        with:
          node-version: 24
          cache: npm
      - run: npm ci
      - run: npm test
      - run: npm run build
      - run: npm run check:dist
      - uses: actions/upload-pages-artifact@v4
        with:
          path: dist
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 2: Ferramentas para refazer os prints**

```bash
S="C:/Users/User/AppData/Local/Temp/claude/c--Users-User-Site-oficial-MAW/1e3f96e5-e5c5-41c9-9d39-61eb4bf6e8e0/scratchpad/demo"
mkdir -p tools/screenshots
cp "$S/make_demo.py" "$S/maw.ps1" tools/screenshots/
```

`tools/screenshots/README.md`:
````markdown
# Prints da MAW para o site

Refaz os prints de `src/assets/screens/` com o projeto demo "Noite Roxa".

**Atenção:** a automação toma o mouse e o teclado do PC por uns 10 minutos, e a MAW cria `%APPDATA%\MAW\MAW.settings`.

1. `python tools/screenshots/make_demo.py`: gera o áudio sintetizado e `Noite Roxa.maw`, em `Music\MAW Demo` (um WAV por clipe, offset 0).
2. Abrir a MAW de Release. `tools/screenshots/maw.ps1` tem as ações `launch`, `click -X -Y`, `keys`, `scroll`, `capture -Out` e `kill`. As coordenadas são físicas e valem para uma tela 1920×1080 com escala de 125%.
3. Carregar o projeto (MENU → Load Project), ajustar o zoom (MENU → Ajustar zoom ao projeto) e capturar as telas:
   - arranjo tocando o refrão
   - mixer
   - piano roll das TECLAS
   - painel do AutoTune
   - EQ depois do Smart Mix
   - Smart Mix
   - Conselheiro
   - menu da IA
   - METRO
   - exportação
   - desempenho do motor
   - testes (**depois** dos testes a MAW perde o visual, então reinicie)
4. Recortar: janelas inteiras `(0, 0, 1920, 1020)`; os diálogos, pelas caixas usadas em 27/09/2026 (ver histórico do repo).
5. Copiar para `src/assets/screens/` com os mesmos nomes e rodar `npm run build`.

Enquanto a MAW não corrigir os bugs 4 (BPM ao abrir projeto) e 6 ("TOCANDO" cortado), o campo de BPM e o estado do relógio podem sair errados nos prints.
````

- [ ] **Step 3: README do repo**

`README.md`:
````markdown
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
````

- [ ] **Step 4: Verificação final completa**

```bash
python -m unittest tools/tests/test_brand.py
python tools/logo_web.py --check
npx vitest run
npx playwright test
npm run build && npm run check:dist
MSYS_NO_PATHCONV=1 BASE_PATH=/Site-oficial-MAW npm run build && MSYS_NO_PATHCONV=1 BASE_PATH=/Site-oficial-MAW npm run check:links && npm run build
grep -rn "filter\|mix-blend-mode" src/components | grep -i logo
```
Esperado:
- tudo passa;
- "logo intacto";
- o último `grep` não imprime nada (nenhum filtro ou blend aplicado a logo).

- [ ] **Step 5: Commit**

```bash
git add .github/workflows/deploy.yml README.md tools/screenshots
git commit -m "chore: deploy manual para Pages, README e ferramentas para refazer os prints"
```

- [ ] **Step 6: Entregar**

Seguir `superpowers:finishing-a-development-branch`: apresentar as opções de integração do branch `feat/site-v1` (merge na `main`, PR ou manter). Push só com autorização. Publicação (Pages/Release) fica fora, conforme as Global Constraints.
