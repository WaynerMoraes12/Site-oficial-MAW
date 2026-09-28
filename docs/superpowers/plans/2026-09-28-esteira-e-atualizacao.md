# Esteira de releases e atualização automática — plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cada PR mergeado na `main` da MAW vira um instalador completo (com a IA) num release privado; a MAW instalada avisa quando há versão nova e se atualiza; o site acompanha o último release.

**Architecture:** Workflow do GitHub Actions no repositório da MAW compila, testa, monta o Python/ffmpeg, empacota com Inno Setup (`installer/` passa a morar na MAW) e publica `vX.Y.Z` com `release.json`. Na MAW, funções puras (versão, manifesto, decisão) + um atualizador que consulta o último release, baixa, confere o SHA-256 e roda o instalador com `/UPDATE`. No site, `npm run tour` também lê o último release e o World Tour passa a contar recursos entregues.

**Tech Stack:** C++17/JUCE 8 (MSBuild, VS 2022 BuildTools), `--run-tests` (juce::UnitTest), Inno Setup 6, PowerShell 5.1, GitHub Actions (windows-latest), NuGet `python` 3.10, Node 24/Vitest (site).

**Spec:** `docs/superpowers/specs/2026-09-28-esteira-e-atualizacao-design.md`

## Global Constraints

- Trabalho da MAW no worktree `C:\Users\User\MAW_esteira`, branch `feature/esteira-e-atualizacao` (a partir de `origin/main` 12327e7). O working copy `C:\Users\User\MAW` do usuário não é tocado.
- Nada público: release privado, sem Pages, sem tornar repo público. O PR da MAW é aberto para o usuário revisar; **não** fazer merge.
- Comentários e mensagens da MAW em português sem acento nos .cpp/.h (como o resto do código); textos de interface como os que já existem.
- Versão: `MAJOR.MINOR.PATCH`; build de desenvolvimento = `0.0.0-dev` e nunca se oferece atualização a ele.
- Instalador: mesmo `AppId` `{DD0F02F2-3F2C-48E1-A02E-F3A0C7F76221}`; VC++ Redistributable só com assinatura válida da Microsoft; `release.json` no formato que o site valida (`file = MAW-Setup-<versão>.exe`, `sha256` 64 hex, `bytes`, `version`, `builtAt`, `installedBytes`, `mawCommit`).
- Não ler `%APPDATA%\MAW\gemini_api_key.txt`; não mexer no `MAW.settings` real para testes (usar variável de ambiente).
- Commits com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. Build de desenvolvimento (`0.0.0-dev`) ou versão ilegível nunca oferece atualização.
2. `release.json` com hash, nome ou versão fora do padrão → nada é baixado nem executado.
3. Oferta de atualização durante gravação/reprodução → espera o transporte parar.
4. Rajada de merges → só um release (o do commit mais novo), sem versões puladas ou repetidas.
5. Sem token (fase privada) → a MAW abre normalmente, sem erro na cara da pessoa.

---

### Task 1: versão carimbada e funções puras de atualização (MAW)

**Files:** Create `Source/MawVersion.h`, `Source/MawUpdate.h`; Modify `Source/Main.cpp` (versão), `Source/Tests/MawUnitTests.cpp` (nova classe `MawUpdateTests`).

**Interfaces (Produces):**
- `#define MAW_VERSION "0.0.0-dev"` (CI sobrescreve).
- `namespace MawUpdate`: `struct Version { int major, minor, patch; }`, `std::optional<Version> parseVersion(const juce::String&)` (só `X.Y.Z` numérico), `bool isNewer(const Version& candidate, const Version& current)`, `struct Manifest { juce::String version, file, sha256; juce::int64 bytes; }`, `std::optional<Manifest> parseManifest(const juce::var& json)` (mesmas regras do site), `bool shouldOffer(const juce::String& currentVersion, const Manifest&)` (falso se a atual não é `X.Y.Z`).

- [ ] Step 1: testes em `MawUnitTests.cpp` (classe `MawUpdateTests`, categoria "MAW"): parse de versões válidas/inválidas (`1.0.10`, `1.0`, `1.0.0-dev`, `v1.0.1`), `isNewer` (1.0.10 > 1.0.9; 1.1.0 > 1.0.99; igual não), `parseManifest` aceita o release.json real e recusa hash curto, nome que não bate com a versão, bytes 0; `shouldOffer` falso para `0.0.0-dev` e para versão igual/mais velha, verdadeiro para mais nova.
- [ ] Step 2: compilar e rodar `MAW_APP.exe --run-tests` → falha de compilação (cabeçalho inexistente) = RED.
- [ ] Step 3: implementar `MawVersion.h`, `MawUpdate.h` (header-only, puro); `getApplicationVersion()` retorna `MAW_VERSION`.
- [ ] Step 4: compilar, `--run-tests` → exit 0.
- [ ] Step 5: commit `feat(atualizacao): versao carimbada e regras puras da atualizacao`.

### Task 2: Python e ffmpeg que vêm na pasta da MAW

**Files:** Modify `Source/MawSettings.h` (`pythonServerCommand`, novo `bundledFfmpegFolder`), `Source/Main.cpp` (PATH na partida), `Source/Tests/MawUnitTests.cpp` (teste de portabilidade).

- [ ] Step 1: teste: com `python\python.exe` ao lado do script (Windows), o comando padrão é esse python + script; `pythonPath` configurado continua vencendo; `bundledFfmpegFolder(script)` devolve a pasta `ffmpeg` quando existe `ffmpeg\ffmpeg.exe` e vazio quando não.
- [ ] Step 2: `--run-tests` → falha (comando ainda é `py -3.10`; função inexistente).
- [ ] Step 3: implementar; na partida (Windows), se `bundledFfmpegFolder` achar a pasta, pôr na frente do `PATH` do processo (`SetEnvironmentVariableW`).
- [ ] Step 4: `--run-tests` → exit 0. Step 5: commit `feat(ia): usar o Python e o ffmpeg que vem com a MAW`.

### Task 3: atualizador (MAW)

**Files:** Create `Source/MawUpdater.h/.cpp`; Modify `Source/MainComponent.h/.cpp`, `Source/Main.cpp` (`--check-update`), `Builds/VisualStudio2022/MAW_APP_App.vcxproj(+.filters)` e `MAW_APP.jucer` (novo .cpp).

- Fonte: `MAW_UPDATE_FEED` (URL de um `release.json`; o instalador fica na mesma pasta) ou chave `updateFeedUrl` do `MAW.settings`; senão `https://api.github.com/repos/WaynerMoraes12/MAW/releases/latest` → asset `release.json` e asset do instalador (download pela API com `Accept: application/octet-stream`). Token: `MAW_GITHUB_TOKEN` ou `%APPDATA%\MAW\github_token.txt` (header `Authorization: Bearer`). Qualquer falha de rede/404: silêncio (log), a MAW segue.
- UI: checagem em thread na partida; oferta pelo `MessageManager`; se `engine.getIsRecording()` ou tocando, tenta de novo a cada 2 s até parar; `AlertWindow` "Versao X disponivel" com "Atualizar agora"/"Depois"; "Atualizar agora" → `confirmDiscardUnsavedWork("atualizar a MAW", …)` → `ThreadWithProgressWindow` baixa para a pasta temporária, confere `juce::SHA256` e tamanho → `installer.startAsProcess("/SILENT /SUPPRESSMSGBOXES /NORESTART /UPDATE")` → `JUCEApplication::quit()`. Hash/tamanho errado: mensagem e nada roda.
- `--check-update` (modo console, como `--run-tests`): consulta a fonte e sai com 0 = atualizado/sem fonte, 10 = há versão nova (imprime a versão), 1 = erro de manifesto.
- [ ] Step 1: teste manual preparado: servidor local (`python -m http.server`) servindo um `release.json` 9.9.9 válido; `MAW_UPDATE_FEED` apontando para ele.
- [ ] Step 2: antes da implementação, `MAW_APP.exe --check-update` não existe (abre o app) = RED.
- [ ] Step 3: implementar.
- [ ] Step 4: `--check-update` com a fonte 9.9.9 → sai 10; com a fonte na mesma versão → 0; com hash inválido → 1; sem fonte e sem token → 0. `--run-tests` → 0.
- [ ] Step 5: commit `feat(atualizacao): a MAW avisa da versao nova e se atualiza`.

### Task 4: instalador dentro da MAW

**Files:** Create `installer/MAW.iss` (a partir do do site), `installer/build.ps1`, `installer/README.md`; Modify `.gitignore`.

- `build.ps1 -Version X.Y.Z [-SkipCompile]`: acha o `MAW_APP.exe` de Release; monta `installer\stage\` com `MAW.exe`, licenças, `server_mapp.py`, `pretrained_models\2stems`, `python\` (NuGet `python` 3.10.11 + `pip install -r requirements.txt`, com cache em `installer\cache\`), `ffmpeg\ffmpeg.exe` (zip fixo, SHA-256 conferido); baixa o VC++ Redistributable e confere a assinatura da Microsoft; roda o ISCC com `AppVersion` e versão do redist; grava `installer\output\release.json` (formato do site; `installedBytes` = tamanho do stage + desinstalador; `mawCommit` = `git rev-parse HEAD`).
- `MAW.iss`: `[Files]` do stage inteiro; `CloseApplications=force`; `/UPDATE` → `[Run]` reabre `MAW.exe` (Check `IsUpdate`), o de sempre continua `postinstall skipifsilent`.
- [ ] Step 1: rodar `build.ps1 -Version 1.0.99` neste PC → Expected: instalador em `installer\output\MAW-Setup-1.0.99.exe` + `release.json` válido; `python\python.exe -c "import spleeter, faster_whisper, flask"` no stage roda.
- [ ] Step 2: commit `feat(instalador): o instalador completo, com a IA, mora na MAW`.

### Task 5: esteira no GitHub Actions

**Files:** Create `.github/workflows/windows-release.yml`, `installer/next-version.ps1`.

- `next-version.ps1`: última tag `vX.Y.Z` (sem tag → 1.0.0) + etiquetas `versao:minor`/`versao:major` dos PRs mergeados desde ela → próxima versão; testado localmente com entradas de exemplo (`-Latest 1.0.9 -Labels versao:minor` → 1.1.0).
- Workflow: `push` na `main` (publica), `workflow_dispatch` (publica), `pull_request` com `paths` da esteira (não publica); `concurrency: maw-release` com `cancel-in-progress` na `main`; passos: checkout (com tags), versão, `MawVersion.h`, MSBuild, `--run-tests`, cache do Python, `build.ps1`, `gh release create vX.Y.Z` com os dois assets (privado, `--latest`).
- [ ] Step 1: `next-version.ps1` com os exemplos → saídas esperadas.
- [ ] Step 2: commit; push do branch; abrir o PR na MAW (para o usuário revisar) → o workflow roda em modo PR (sem publicar) → Expected: verde. Corrigir até ficar verde.

### Task 6: site acompanha o último release

**Files:** Modify `tools/lib/tour.mjs`, `tools/tour.mjs`, `src/data/site.json` (`releaseBaseUrl` → releases da MAW), `tests/unit/tour.test.ts`, README.

- `classifyStops`: `live` = parada da versão mais nova (texto "Version X.Y.Z" só com a mais nova) + PRs de recurso mergeados na main depois da estreia (`debutUntil`) até o commit do último release; `reh` = abertos, branches com trabalho, e mergeados depois do último release; `next` = issues. Limite 14: versão + anunciados + ensaiando primeiro, recursos entregues preenchem.
- `tour.mjs`: se existe release na MAW (`gh release view -R WaynerMoraes12/MAW --json …`), baixa o `release.json` dele (`gh release download`) e grava em `src/data/release.json`; senão mantém o atual.
- [ ] Testes RED→GREEN para as regras novas; `npm run tour` real; suíte do site.
- [ ] Commit `feat: World Tour e download seguem o ultimo release da MAW`.

### Task 7: revisão final

- [ ] Revisão independente dos dois repositórios (MAW: diff do branch; site: intervalo desde o spec), correções com teste, push do branch do site, relatório ao usuário com o link do PR da MAW.
