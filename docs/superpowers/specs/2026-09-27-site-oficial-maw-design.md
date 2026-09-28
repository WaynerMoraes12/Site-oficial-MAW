# Site oficial da MAW — spec de design

**Data:** 27/09/2026
**Repo:** `Site oficial MAW` → GitHub `WaynerMoraes12/Site-oficial-MAW` (privado)
**Produto:** MAW — Musical Artificial Workspace, DAW para Windows (repo `C:\Users\User\MAW`, versão 1.0.0)
**Estado:** design aprovado pelo usuário (mockup v2). Este documento fecha o que será construído.

---

## 1. Objetivo

Um site oficial, informativo e descritivo da MAW, que:

1. Deixe claro, à primeira vista, que a MAW é **um app de produção musical** (uma DAW), e não uma banda.
2. Tenha o **DNA da MAW**: logo oficial, roxo `#9D00FF`, interface escura, rótulos de console de estúdio.
3. Use a **linguagem gráfica dos álbuns** de Avenged Sevenfold, Bring Me The Horizon, AC/DC e Guns N' Roses, com tipografia, composição de capa e texturas. Não usa logos nem capas reais das bandas.
4. Tenha **todas as seções de um site de produto**: prints reais, recursos, IA, requisitos, informativos importantes, download do instalador, roadmap, história, créditos e licença, FAQ, canais oficiais e kit de imprensa.
5. Ofereça o **instalador de verdade** da MAW para Windows.

**Público:** produtores iniciantes e músicos que gravam sozinhos no quarto, com uma guitarra, uma interface e um PC Windows. Também quem já conhece as convenções de DAWs.

---

## 2. Decisões já tomadas com o usuário

| Tema | Decisão |
|---|---|
| Idioma | **Todo o texto visível do site em inglês.** A estética não muda. Os prints continuam mostrando a MAW em português (são imagens reais). Nomes de botões do app (MIXER, EFEITO, PIANO ROLL, atalhos) ficam como estão no app, com a explicação em inglês ao lado. |
| Estética | Mockup v2, "o site como um disco", aprovado sem mudanças ("não mudaria nada na estética"). |
| Logo | **Nunca alterado.** Sem filtro, brilho, glitch, recolorir ou redesenhar. Na web, só o fundo preto (máx. canal ≤ 12) vira transparente, e um script garante que os pixels do desenho são idênticos ao original. O PNG original vai intacto no kit de imprensa. |
| Emblemas | Nada de ilustração desenhada à mão (brasões, asas, rosas, microfones). A força vem de tipografia, composição e formatos da indústria musical. |
| Bandas | A inspiração não é citada no site. O rodapé diz que a MAW não é afiliada a nenhum artista ou banda. |
| Download | Instalador de verdade com **Inno Setup**, hospedado no **GitHub Releases** do repo do site. |
| Código-fonte (GPL) | O usuário decide depois se o repo da MAW fica público ou se o código vai anexado ao release. **Nada é publicado antes dessa decisão.** O botão "Source code" existe, mas fica desligado por configuração. |
| Canais | Seção montada a partir de um arquivo de dados. Só aparece o que tiver link. No lançamento: e-mail `waynerbusiness@outlook.com`. Instagram, YouTube, Discord e TikTok ficam prontos e escondidos. |
| Prints | Tirados da MAW real (Release de 23/09/2026) com o projeto demo "Noite Roxa". |

---

## 3. Direção visual (aprovada)

Referência viva: o mockup `site-v2.html` (servido pelo visual companion em `.superpowers/brainstorm/…/content/`). A implementação reproduz esse mockup, com o texto em inglês e as correções da seção 3.4.

### 3.1 Tokens

| Token | Valor | Uso |
|---|---|---|
| `--black` | `#000000` | fundo base, capa |
| `--ink` | `#0E0E11` | fundo da MAW |
| `--panel` / `--raised` / `--sunken` | `#16161A` / `#1E1E24` / `#0A0A0C` | cartões e painéis |
| `--line` / `--line-strong` | `#26262E` / `#34343F` | divisórias |
| `--text` / `--dim` | `#E8E6EF` / `#8E8A9C` | textos |
| `--maw` / `--maw-bright` / `--maw-deep` | `#9D00FF` / `#B84DFF` / `#6A00AD` | roxo MAW |
| `--rec` | `#FF2D55` | ponto de REC, avisos |
| `--led-g` / `--led-y` / `--led-r` | `#3FE0A0` / `#E0C93F` / `#FF4D4D` | medidores e displays |
| `--bone` / `--bone-ink` / `--blood` | `#E9E1CF` / `#1B1714` / `#B0001E` | encarte |
| `--hazard` | `#F2C200` | fita zebrada |

Todas as cores vêm de `Source/MawLookAndFeel.h` da MAW, exceto `bone`, `blood` e `hazard`.

### 3.2 Tipografia

As fontes são servidas pelo próprio site (pacotes `@fontsource`), sem depender do Google Fonts em runtime:

- **Anton**: letreiro de rock cromado (títulos grandes).
- **Grenze Gotisch**: gótico (O Palco, Bastidores, FAQ, Encarte).
- **Syncopate**: rótulos largos e o título da IA.
- **Barlow / Barlow Condensed**: texto corrido e rótulos condensados.
- **JetBrains Mono**: técnico (rider, HUD, catálogo).
- **Share Tech Mono**: displays de LED e de 7 segmentos.
- **Big Shoulders Stencil Display**: estêncil de case de turnê.

### 3.3 Linguagem gráfica por seção

| Seção | Formato da indústria | Gráfica |
|---|---|---|
| Hero | Capa de LP preta com logo, vinil saindo da capa, selo estilo "Parental Advisory" | AC/DC (*Back in Black*, letreiro cromado, raio entre palavras) |
| Faixa de LED | Painel de LED de palco | — |
| The Stage | Prints reais em "telão" com abas | A7X (gótico, fumaça, feixes de luz) |
| Tracklist | Contracapa: Side A / Side B, código de barras, ℗ | AC/DC (tipografia condensada de pôster) |
| AI | Cartões com prints reais | BMTH (geometria sagrada de linha fina, glitch **só no texto**) |
| The Rack | Pedalboard dos 7 efeitos internos + painéis reais | — |
| Backstage | Números em 7 segmentos | DNA da interface MAW |
| Tech Rider | "Input list" de show | — |
| Read before installing | Etiquetas de case de turnê, fita zebrada, estêncil | — |
| Download | Credencial ALL ACCESS com cordão e selo holográfico | — |
| World Tour | Costas de camiseta de turnê com carimbos de status | hard rock |
| Liner notes + Credits | Encarte de papel com fotocópia, créditos de álbum | GN'R (*Appetite*, letreiro gótico preto e vermelho) |

### 3.4 Correções em relação ao mockup

- As etiquetas de "referência das bandas" e o botão que as mostra **não vão para o site**.
- O `.chrome` mantém `padding-top` + `box-decoration-break: clone`, senão os acentos são cortados (bug visto no mockup).
- Os passos do download usam `<span>` dentro de cada `<li>` (bug do grid visto no mockup).
- O subtítulo do "Read before installing" ganha respiro antes do título em estêncil.
- Os feixes de luz do "The Stage" podem ficar um pouco mais visíveis. É um ajuste fino, sem mudar a direção.

---

## 4. Estrutura da página e conteúdo (em inglês)

É uma página única (`/`), com navegação por âncoras. Abaixo estão os títulos e textos-chave **em inglês** e de onde vem cada informação. O texto corrido final é escrito na implementação, seguindo este tom:

- confiante e direto
- honesto como a documentação da MAW: medido, não prometido
- sem exageros que o app não entrega

**Navegação:** logo · The Stage · Tracklist · AI · Requirements · Roadmap · Story · FAQ · botão **Download**.

### 4.1 Hero, a capa
- Catálogo: `MAW-001 · WINDOWS x64 · v1.0.0 · ℗ 2026`
- H1 (letreiro cromado, raio entre "music" e "it records"): **"The DAW that understands the music it records"**, frase do argumento central do TCC.
- Lede: *MAW — Musical Artificial Workspace. A multitrack music production workstation for Windows, with AI built into the timeline: it separates stems, transcribes vocals, detects chords and advises your mix.*
- Botões: **Download for Windows** (âncora #download) · **See MAW in action** (âncora #stage).
- Meta: *Free download · Windows 10/11 64-bit · Interface in Brazilian Portuguese*
- Selo estilo Parental Advisory: **LISTENER ADVISORY / PRODUCTION / EXPLICITLY MUSICAL**.
- Capa com o logo, vinil com o logo no rótulo, lombada "MUSICAL · ARTIFICIAL · WORKSPACE".

### 4.2 Faixa de LED
Itens: 32 TRACKS AT 0.29% OF THE AUDIO BLOCK · STEMS IN 2, 4 OR 5 PARTS · SPEECH BECOMES MARKERS · SMART MIX FINDS FREQUENCY CLASHES · 3,934 AUTOMATED CHECKS · VST3 + ASIO · WAV · FLAC · OGG · MP3 · AUTOTUNE WITH KEY AND SCALE.

### 4.3 The Stage (prints)
- Eyebrow: *Real screenshots · demo project "Noite Roxa"*
- H2 gótico: **The Stage**
- Abas: Arrangement / Mixer / Piano Roll / MIDI + Audio → `maw-arranjo`, `maw-mixer`, `maw-pianoroll`, `maw-midi`.

### 4.4 Tracklist (recursos)
H2: **Record ⚡ Edit ⚡ Mix ⚡ Deliver**

**Side A — Record & Edit**
1. 24-bit multitrack recording, via ASIO · `REC`
2. Metronome & count-in · `METRO`
3. Split, fades & crossfades · `S`
4. Snap grid with triplets · `Ctrl A`
5. Named markers · `K`
6. Piano roll with strength & swing quantize · `Ctrl U`
7. USB MIDI controllers, hot-plug · `MIDI`
8. Built-in synth, 7 presets · `KEYBOARD`

**Side B — Mix & Deliver**
9. Mixer with peak meters & clip latch · `MIXER`
10. Effects rack + VST3 · `EFEITO`
11. AutoTune with key & scale · `UI`
12. Volume automation · `A`
13. Named undo, 50 levels · `Ctrl Z`
14. Autosave & recovery · `Ctrl S`
15. Export with loudness (LUFS, true peak) · `E`
16. Stems, one file per track · `MENU`

**Todos os atalhos são conferidos contra o README e o código da MAW na implementação.** Atalho não confirmado sai da lista.

Rodapé da contracapa: `MAW-001 · ℗ & © 2026 Wayner Pires de Moraes · Your music is yours.` + código de barras decorativo.

### 4.5 AI
- H2: **Intelligence that listens** (glitch só no texto)
- Citação: *A generic analyzer says there's energy at 250 Hz. MAW says track 2 and track 5 are fighting over 250 Hz for the 6.4 seconds they play together — and fixes it in one click.*
- Cartões:
  - **Smart Mix** (print `det-smartmix`)
  - **Production Advisor** (print `det-conselheiro`)
  - **Stem separation** (print `det-ia-menu`)
  - **Speech becomes markers** (Whisper)
  - **Keys that listen**: `C` chords · `T` tempo · `M` audio → MIDI
- Cada cartão tem um selo que diz onde o recurso roda:
  - **Runs in the app:** Smart Mix, Advisor (regras), acordes, andamento, áudio → MIDI. Confirmado rodando neste PC sem o servidor.
  - **Needs the MAW Neural Server:** separação de stems, transcrição e "Ask Gemini". Ver 4.9 e 7.

### 4.6 The Rack
- H2: **Seven pedals ⚡ and your VST3s**
- Pedalboard: Noise Gate, Distortion, Equalizer, Compressor, Reverb, Delay, AutoTune.
- Prints: `det-autotune`, `det-eq`, `det-metro`.

### 4.7 Backstage (motor)
- H2 gótico: **An engine that doesn't choke**
- Displays:
  - **0.29%** of the audio block (32 tracks · 48 kHz · 512 samples)
  - **3,934** checks (396 test blocks)
  - **24**-bit recording
  - **50** undo levels
- Prints: `det-desempenho`, `det-testes`.

### 4.8 Tech Rider (requisitos)

| CH | Item | Minimum | Recommended |
|---|---|---|---|
| 01 | System | Windows 10 64-bit | Windows 11 64-bit |
| 02 | Audio | PC sound card | Interface with ASIO driver |
| 03 | Display | 1329 × 620 | 1580 px wide or more |
| 04 | MIDI | — | USB controller |
| 05 | AI: stems & transcription | MAW Neural Server (Python 3.10 + ffmpeg) | NVIDIA GPU with CUDA |
| 06 | Disk | tamanho real do instalado (vem do build) | + ~3 GB for the Whisper model on first use |
| 07 | Advisor + Gemini | — (local rules) | Your own Gemini API key |
| 08 | Internet | Not needed to produce | Only for AI model downloads and Gemini |

Mais o **Visual C++ Redistributable x64**, que o instalador instala sozinho se faltar.

### 4.9 Read before installing
H2 estêncil: **Fragile. Handle with care.** Placas:

1. **SmartScreen will warn you**: o instalador não é assinado. *More info → Run anyway*.
2. **Windows 64-bit only**: 10 ou 11. Sem macOS/Linux por enquanto.
3. **Interface in Brazilian Portuguese**: menus e botões do app estão em português.
4. **AI server setup**:
   - O texto depende do estado do bug #1 da MAW (caminhos fixos), controlado pela flag `neuralServerBundled` em `site.config`.
   - `false` (hoje): *Stem separation, transcription and Gemini advice run on the MAW Neural Server, a local Python service that is not bundled with v1.0.0 yet. Smart Mix, the Advisor's rules, chords, tempo and audio-to-MIDI work out of the box.*
   - `true`: instruções de setup com Python 3.10, ffmpeg e ~3 GB no primeiro uso.
5. **Your audio stays yours**: tudo local. Só o texto do relatório vai ao Gemini, e só quando você pede.
6. **Version 1.0**: desenvolvimento ativo. Limitações conhecidas: automação só de volume, IA sem botão de cancelar, VST3 do master não é salvo no projeto.

### 4.10 Download: ALL ACCESS
- Credencial: versão, plataforma, arquivo, licença (GNU GPL v3), selo holográfico com o logo.
- H2: **Your backstage pass**
- Passos:
  1. Download `MAW-Setup-1.0.0.exe`.
  2. If SmartScreen appears, *More info → Run anyway*.
  3. Follow the installer (Start Menu shortcut, uninstaller, VC++ runtime if missing).
  4. Open MAW and pick your interface at **MENU → ASIO Audio Setup**.
- Botão com o link do asset no GitHub Releases. Tamanho e **SHA-256** vêm de `release.json`, gerado pelo build do instalador.
- Link **Source code**: aparece só quando `sourceCodeUrl` estiver definido (decisão da GPL).

### 4.11 World Tour (roadmap)
- H2: **MAW World Tour** · 2026 — 2027
- Carimbos: **On the road** (lançado) · **Rehearsing** (em desenvolvimento) · **Announced** (planejado).
- Itens:
  - On the road: v1.0 (Sep 2026).
  - Rehearsing, vindos dos worktrees atuais da MAW: automação completa; sends, barramentos e sidechain; gravação em loop, punch-in e histórico; time-stretch e congelar trilha; sampler/sequenciador, MIDI learn e faixas de CC; afinador de cordas.
  - Announced, vindos do README/TCC: MAW como plugin VST3; tempo map e comping de takes.
- **Sem datas inventadas.** O usuário confirma essa lista na revisão do spec.

### 4.12 Liner notes + Credits
- H2 gótico: **Born in a thesis, built to play loud**
- História: TCC de Engenharia de Computação de Wayner Pires de Moraes na FHO (Centro Universitário Hermínio Ometto), Araras-SP, 2026. A pergunta "por que uma DAW grava sua música sem entender nada dela?", 44 mil linhas de C++ e o público do quarto.
- Linha do tempo, de `docs/TCC.md` da MAW: 31 Mar (chassi visual) → 04 Apr (YIN) → 14 Apr (multitrack) → 03 May (`.maw`) → Jul (servidor neural, stems) → 16 Jul (MIDI) → Aug (export, 4/5 stems, acordes) → Sep (mixer, undo, Advisor, Gemini, testes, v1.0).
- **Credits**:
  - Production, code & arrangement — Wayner Pires de Moraes
  - Institution — FHO, Araras-SP
  - Audio engine — JUCE 8 (AGPLv3)
  - ASIO SDK · VST3 SDK — Steinberg
  - Spleeter — Deezer (MIT)
  - faster-whisper / Whisper large-v3 (MIT)
  - Flask (BSD-3)
  - Google Gemini API (sua chave)
  - License — GNU GPL v3
- O nome do orientador **fica de fora**, porque o sobrenome não está confirmado.

### 4.13 FAQ: "Questions from the crowd"
Is MAW free? · Does it run on Mac or Linux? · Do I need an audio interface? · Do my VST3 plugins work? · Does the AI send my music to the internet? · Why does Windows say the app may be unsafe? · Is the interface in English? · Is what I make in MAW mine?

### 4.14 Official channels + Press kit
- H2: **Talk to MAW**
- Canais vêm de `src/data/channels.ts`. Só renderiza quem tem URL.
- Press kit:
  - logo original (PNG intacto)
  - logo para web (fundo transparente)
  - ícone
  - prints em alta (ZIP gerado no build)

### 4.15 Footer
Logo · `MAW — Musical Artificial Workspace · v1.0.0` · © 2026 Wayner Pires de Moraes · GNU GPL v3 · avisos de marca: VST/ASIO (Steinberg), Windows (Microsoft), Gemini (Google). A MAW não é afiliada a nenhum artista ou banda.

---

## 5. Arquitetura técnica

### 5.1 Stack
- **Astro** gerando site estático (`output: 'static'`). Cada seção é um componente `.astro`. JS no cliente só onde precisa: abas do The Stage, faixa de LED e código de barras, em scripts pequenos inline.
- CSS: um arquivo global com os tokens, mais CSS com escopo por componente.
- Imagens: `astro:assets` gera AVIF/WebP em várias larguras a partir dos PNGs dos prints, com `loading="lazy"` fora do hero.
- Fontes: `@fontsource/*`, servidas localmente.
- Sem framework de UI, sem analytics, sem cookies.

### 5.2 Estrutura de pastas
```
src/
  pages/index.astro
  layouts/Base.astro            (head, SEO, fontes, tokens)
  components/                   (Nav, Hero, LedTicker, Stage, Tracklist, AiSection,
                                 Rack, Backstage, TechRider, ReadBeforeInstall,
                                 Download, WorldTour, LinerNotes, Faq, Contact, Footer)
  data/
    site.config.ts              (version, flags: neuralServerBundled, sourceCodeUrl, releaseUrl)
    channels.ts                 (canais oficiais; vazios não renderizam)
    roadmap.ts, faq.ts, tracklist.ts, credits.ts
    release.json                (gerado pelo build do instalador: arquivo, tamanho, sha256, data)
  assets/
    screens/                    (prints PNG da MAW)
    brand/                      (maw-logo-web.png)
  styles/global.css
public/
  press/                        (logo_MAW.png original, icon_MAW.png, maw-screens.zip)
  favicon.png, og-image.png
installer/
  MAW.iss                       (script do Inno Setup)
  redist/                       (vc_redist.x64.exe, baixado pelo script, fora do git)
tools/
  logo-web.py                   (gera maw-logo-web.png e prova pixels idênticos)
  screenshots/                  (gerador do projeto demo + automação dos prints, para refazer)
scripts/
  build-installer.ps1           (compila o .iss, calcula tamanho/SHA-256, escreve release.json)
.github/workflows/deploy.yml    (build + GitHub Pages; só é ativado quando o usuário decidir publicar)
```

### 5.3 SEO, acessibilidade e desempenho
- `<title>`, meta description, Open Graph e Twitter card (`og-image.png`, 1200×630, gerada a partir da capa), `lang="en"`, favicon do `icon_MAW.png`, `sitemap.xml`, `robots.txt`.
- Acessibilidade:
  - `alt` descritivo em todos os prints
  - contraste AA nos textos
  - FAQ com `<details>`
  - foco visível
  - **`prefers-reduced-motion`** desliga vinil girando, faixa de LED, glitch, feixes de luz e sigilo girando
- Responsivo, validado em 390 px, 768 px, 1280 px e 1440 px:
  - no celular a navegação vira um menu compacto
  - grids de 2 ou 3 colunas viram 1
  - o pedalboard fica com 4 colunas
- Desempenho:
  - Lighthouse (mobile) com Performance ≥ 90, Accessibility ≥ 95 e Best Practices ≥ 95
  - hero sem imagens pesadas (o logo é um PNG pequeno)

### 5.4 Base path e deploy
- `astro.config` lê `SITE_URL` e `BASE_PATH`. Funciona em `https://waynermoraes12.github.io/Site-oficial-MAW/` ou num domínio próprio.
- O workflow do GitHub Pages fica pronto, mas **não é ativado nem publicado** até o usuário decidir a questão da GPL. O GitHub Pages grátis também exige repo público.

---

## 6. Instalador (Inno Setup)

- **Entrada:** `C:\Users\User\MAW\Builds\VisualStudio2022\x64\Release\App\MAW_APP.exe`. O caminho é configurável no `build-installer.ps1`.
- **Pacote:**
  - `MAW.exe` (renomeado de `MAW_APP.exe`)
  - `LICENSE` (GPLv3) e `LICENSE-THIRD-PARTY.md` da MAW, obrigatórios pela GPL
  - `vc_redist.x64.exe`: o exe usa `/MD` (`MultiThreadedDLL`), então precisa do runtime
- **Comportamento:**
  - instala em `{autopf}\MAW`
  - atalho no Menu Iniciar e atalho opcional na Área de Trabalho
  - ícone do `icon_MAW.png` convertido para `.ico`
  - desinstalador
  - instala o VC++ Redistributable em silêncio se a chave `HKLM\SOFTWARE\Microsoft\VisualStudio\14.0\VC\Runtimes\x64` (Installed=1) não existir
  - AppId fixo para upgrades futuros
  - versão lida do `site.config`
- **Não inclui ainda** o servidor neural (`server_mapp.py`) nem os modelos. Enquanto o bug #1 da MAW não for corrigido, o app só procura o servidor em `C:\MAW_DEVELOPER\…`. Quando for corrigido, o instalador passa a levar o servidor, e a flag `neuralServerBundled` muda o texto do site.
- **Assinatura digital:** nenhuma, e o site avisa sobre o SmartScreen.
- **Saída:**
  - `installer/output/MAW-Setup-1.0.0.exe`
  - `src/data/release.json` com `file`, `bytes`, `sha256` e `builtAt`
- **Ferramenta:** o Inno Setup 6 não está instalado neste PC. Instalar com `winget install JRSoftware.InnoSetup` **precisa do OK do usuário** na hora.
- **Publicação:** criar o GitHub Release e subir o `.exe` **só com autorização explícita**, depois da decisão da GPL.

---

## 7. Dependências externas e itens abertos

| Item | Situação | Como o site lida |
|---|---|---|
| Bug #1 da MAW (caminhos `C:\MAW_DEVELOPER`) | aberto, repassado pelo usuário | flag `neuralServerBundled=false` e texto honesto |
| Decisão da GPL (repo público ou código no release) | aberta | `sourceCodeUrl` vazio, nada publicado |
| Redes sociais | não existem | `channels.ts`, só o e-mail aparece |
| Lista do roadmap | inferida dos worktrees | usuário confirma na revisão deste spec |
| Tamanho e SHA-256 do instalador | gerados no build | `release.json` |
| Prints com "TOCAND" cortado e BPM desatualizado (bugs #4 e #6) | cosmético | refazer os prints com `tools/screenshots/` quando a MAW for corrigida (opcional) |

---

## 8. Verificação (o que prova que está pronto)

1. `npm run build` sem erros nem avisos.
2. **Sem português no front:** um script varre `dist/` procurando palavras comuns em PT ("você", "não", "para", "música" etc.) fora das exceções permitidas (nomes de botões do app, "Noite Roxa", nomes próprios e a instituição).
3. **Logo intacto:** `tools/logo-web.py --check` compara os pixels do desenho com `C:\Users\User\MAW\Source\logo_MAW.png`. Nenhum CSS aplica `filter`, `mix-blend-mode` ou animação em `img` de logo (conferido com grep).
4. **Visual:** screenshots do Playwright do site construído em 1440 px e 390 px, seção por seção, comparados com o mockup v2.
5. **Links:** todas as âncoras e links internos resolvem. Os externos só são os permitidos (mailto e GitHub Releases).
6. **Lighthouse (mobile):** metas da seção 5.3.
7. **Reduced motion:** com `prefers-reduced-motion: reduce` emulado, nada anima.
8. **Instalador** (com OK do usuário): instala neste PC, o atalho abre a MAW, o desinstalador remove tudo, e o `release.json` bate com o arquivo (SHA-256 recalculado).

---

## 9. Fora de escopo

- Corrigir os bugs da MAW (repassados ao usuário em 27/09/2026).
- Versão em português do site, blog, newsletter, analytics, formulário de contato com backend.
- Versões para macOS e Linux.
- Assinatura de código do instalador.
- Publicar (Pages ou Release) sem autorização explícita.

---

## 10. Adendo (28/09/2026): tradução automática

Mudança pedida pelo usuário depois da implementação: o site nasce em inglês e **abre na língua do PC da pessoa**. Opção escolhida: "tradução nossa + automático".

- **Idiomas:** inglês (`/`, padrão e fonte), português do Brasil (`/pt/`) e espanhol (`/es/`). As traduções são escritas por nós, não por máquina. Estrutura e estética são as mesmas nas três.
- **Detecção automática:** na raiz em inglês, um script inline no `<head>` lê `navigator.languages` e segue a primeira língua suportada da lista: `pt*` → `/pt/`, `es*` → `/es/`, `en*` → fica. Se nenhuma for suportada, fica em inglês. Se a pessoa já escolheu uma língua pelo seletor (preferência em `localStorage` `maw-lang`), vale a escolha: `pt`/`es` vão para a página dela e `en` fica (ajuste de 28/09: antes só redirecionava sem escolha gravada, o que mandava para o inglês quem tinha escolhido português). Sem `localStorage` não redireciona.
- **Seletor** EN · PT · ES na barra de navegação, também no celular. Os links levam `?lang=xx`; um script no `<head>` de toda página grava a preferência e tira o parâmetro da barra de endereço, então a escolha vale também em aba nova ou clique do meio.
- **Outras línguas:** o tradutor do navegador (Chrome/Edge/Safari) continua disponível. Nomes da MAW, botões do app, atalhos, nomes dos efeitos e "Noite Roxa" levam `translate="no"`.
- **SEO:** `<html lang>` por página (`en`, `pt-BR`, `es`), `<link rel="alternate" hreflang>` para as três mais `pt` (Portugal e outros também caem em `/pt/`) e `x-default`, `<link rel="canonical">` com o endereço limpo de cada página, e `og:locale`.
- **Texto:** todo o texto sai dos dicionários `src/i18n/{en,pt,es}.ts`, com o mesmo formato (`Dictionary`). Os arquivos de dados guardam só o que não é texto (imagens, atalhos, cores, números, status).
- **Verificação:**
  - dicionários com a mesma forma e o mesmo tamanho de listas;
  - PT/ES sem frase idêntica ao inglês, fora os termos universais;
  - `pickLocale` testado;
  - e2e: redirecionamento com navegador em `pt-BR`/`es-AR`, sem redirecionamento em `en-US` ou com preferência gravada, seletor, `lang` e `hreflang`;
  - o verificador de português passa a olhar só as páginas em inglês.
- **Exceção à regra da seção 2** ("todo o texto em inglês"): vale para a página padrão `/`. As páginas `/pt/` e `/es/` são traduções.

## 11. Adendo (28/09/2026): World Tour sincronizado com a MAW e ícone oficial

Pedido do usuário: "sempre que o projeto vai atualizando, ele precisa atualizar também, o que está na estrada, o que está ensaiando e o que está anunciado". O roadmap escrito à mão já estava velho: dos 6 itens "ensaiando", 5 foram mergeados na MAW entre 24 e 28/09, junto com o porte para Linux.

Decisões do usuário (28/09): "Na estrada" = está no instalador publicado; "Anunciado" = issues da MAW com a etiqueta `roadmap`; ícone da aba = ícone oficial do app.

### 11.1 Fonte e regras de status

Fonte única: o GitHub da MAW (`WaynerMoraes12/MAW`), lido pelo `gh` já autenticado neste PC.

| Status | Entra | Sai |
|---|---|---|
| **Na estrada** | a versão do instalador do site (`release.json`: versão, data do build e o novo campo `mawCommit`). Uma parada por versão publicada: "Version 1.0 — debut", depois "Version 1.1 — …" | nunca (histórico) |
| **Ensaiando** | PR de recurso (branch `feature/*` ou título `feat…`) mergeado na `main` **depois** do `mawCommit` do instalador; PR de recurso aberto; branch `feature/*` no GitHub com commits fora da `main` e sem PR | quando entra num instalador novo (vira parte da parada da versão) |
| **Anunciado** | issue aberta com a etiqueta `roadmap` | quando um PR ou branch a referencia (`#N` no PR, ou branch criado pela issue, `N-…`): vira Ensaiando; issue fechada some |

- `fix/*`, `docs/*` e PR sem `feat` ficam de fora: o tour mostra recursos, não correções.
- Branch cujo PR foi fechado sem merge (ex.: `feature/automacao-completa`, PR #59, conteúdo entregue no #60) fica de fora.
- Ordem: Na estrada (versão mais antiga primeiro), Ensaiando (merge ou último commit mais recente primeiro), Anunciado (ordem de criação). Até 14 paradas; se passar, cortam-se os Ensaiando mais antigos.
- Instalador atual: `mawCommit` = `5433daa` (reflog da MAW: `main` em 5433daa às 11:46 de 23/09; `MAW_APP.exe` compilado às 11:49). Hoje isso dá 1 parada Na estrada, 10 Ensaiando (#58, #60–#67, #70) e 0 Anunciado.

### 11.2 Textos nas três línguas

Cada parada precisa de um título curto (até ~48 caracteres, no tom das paradas atuais) em EN, PT e ES. O `npm run tour` pede ao Claude CLI (`claude -p`, já logado neste PC) o título nas três línguas a partir do título e da descrição do PR/issue, **só para itens novos**. Tudo fica em `src/data/tour.json`, commitado: dá para revisar e editar à mão, e uma edição manual nunca é sobrescrita. A coluna da esquerda: Na estrada = mês e ano do build da versão; Ensaiando = "In rehearsal"; Anunciado = "Next tour" (rótulos dos dicionários).

### 11.3 Build, verificação e deploy

- O build **não** acessa a rede: lê o `src/data/tour.json`. `npm run tour` é o único passo que fala com o GitHub e com o Claude.
- `check:tour` (entra no `check:dist` e, portanto, no deploy) falha se: alguma parada não tem texto em alguma língua; o snapshot foi feito com outro instalador (`mawCommit` diferente do `release.json`). O verificador de português continua cobrindo a página em inglês.
- `build-installer` passa a gravar `mawCommit` (HEAD do repo da MAW) e para se o `MAW_APP.exe` for mais velho que esse commit (exe desatualizado em relação ao código).

### 11.4 Quando sincroniza (gatilho)

Recomendado: **tarefa agendada no Windows deste PC**, uma vez por dia: roda `npm run tour`; se algo mudou, faz commit ("chore: World Tour sincronizado com a MAW") e push no branch atual do site. Usa o `gh` e o Claude já logados aqui, sem criar segredo novo. Depende do PC ligado; se ficar dias desligado, o `check:tour` não trava (o snapshot continua coerente com o instalador), só fica atrasado.

Alternativas: GitHub Actions diário (não depende do PC, mas exige criar dois segredos: token de leitura da MAW e chave da API da Anthropic); ou só manual (`npm run tour`).

### 11.5 Ícone oficial (feito)

A aba usa `public/favicon.ico` com os quadros de 16/32/48 px do `icon.ico` oficial da MAW; o apple-touch-icon é o `icon_MAW.png` oficial reduzido; o instalador usa o `icon.ico` oficial sem mudança (`tools/make_icons.py`).

### 11.6 Verificação

- Unitário: classificação de status (PR antes/depois do instalador, PR aberto, branch sem PR, PR fechado, issue referenciada, fix fora), preservação de texto editado à mão, `check:tour`.
- e2e: as paradas do snapshot aparecem nas três línguas com o selo certo.
- Execução real: `npm run tour` contra o GitHub da MAW produz as 11 paradas descritas em 11.1.
