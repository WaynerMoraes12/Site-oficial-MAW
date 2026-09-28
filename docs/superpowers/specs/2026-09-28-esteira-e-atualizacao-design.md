# Esteira de releases e atualização automática da MAW — design

Data: 28/09/2026. Pedido do usuário: "toda vez que o GitHub for atualizado, preciso atualizar o instalador do projeto também, pra ele funcionar exatamente como deve e a pessoa baixar na casa dela; e depois de instalado, quando houver uma atualização no GitHub, precisa atualizar na máquina do usuário também".

Contexto dito por ele: a MAW evolui só por PRs mergeados no repositório dela (`WaynerMoraes12/MAW`); o site é o canal de quem usa — instalar, ver o que já foi feito e o que está vindo, tirar dúvidas (FAQ + e-mail bastam) e vitrine.

## 1. Decisões do usuário (28/09)

| Tema | Decisão |
|---|---|
| Publicar | **Ainda não.** Tudo funciona, mas privado; nada público até ele decidir a questão da GPL |
| Onde compila | **GitHub Actions**, no repositório da MAW |
| Gatilho | cada PR mergeado na `main` da MAW |
| Versão | **automática**: cada build publicado sobe o patch (1.0.1, 1.0.2…); etiqueta `versao:minor` ou `versao:major` no PR pede 1.1.0 / 2.0.0 |
| Atualização no PC | **avisa e a pessoa escolhe** ("Atualizar agora / Depois"); nunca durante gravação; salva o projeto antes |
| Dúvidas | FAQ + e-mail (sem mudança) |
| IA | **instalador completo**: servidor Python com Python 3.10, dependências e ffmpeg |
| Onde mexer | pode mexer no repositório da MAW deste PC, num branch novo, com PR para ele revisar (como ele trabalha) |

## 2. Esteira (repositório da MAW)

Workflow `.github/workflows/windows-release.yml`:

- **Dispara** em `push` na `main` e em `workflow_dispatch`. Em `pull_request` só quando o PR mexe na própria esteira (`installer/**`, o workflow, `requirements.txt`): compila e empacota, mas **não publica** (serve para testar a esteira no PR dela).
- **Agrupa rajadas**: `concurrency` com `cancel-in-progress` na `main`; quando vários PRs entram em seguida, só o mais novo termina e vira release. Motivo: 25 PRs em 7 dias; com cota grátis de repositório privado (2.000 min/mês, Windows conta em dobro), um build por PR não caberia.
- **Versão**: pega a última tag `vX.Y.Z` (sem tag: parte da 1.0.0 do instalador atual → primeira é 1.0.1); olha as etiquetas dos PRs mergeados desde a tag anterior; sobe patch, minor ou major.
- **Carimbo**: grava `Source/MawVersion.h` com a versão (o arquivo versionado diz `0.0.0-dev`); `getApplicationVersion()` passa a ler dele.
- **Compila** `Builds/VisualStudio2022/MAW_APP.sln` (Release x64) com MSBuild e roda `MAW_APP.exe --run-tests` (a suíte da própria MAW); falhou, não publica.
- **IA**: Python 3.10 relocável (pacote NuGet `python` 3.10.x), `pip install -r requirements.txt` dentro dele, ffmpeg (build estático com SHA-256 fixo no script). Cache do Python pronto, chaveado pelo `requirements.txt`.
- **Instalador**: `installer/MAW.iss` passa a morar no repositório da MAW (o produto se empacota); `installer/build.ps1` faz o mesmo na nuvem e neste PC. O VC++ Redistributable continua conferido pela assinatura da Microsoft e instalado só se faltar.
- **Publica** (só no `push` da `main`): release `vX.Y.Z` **privado**, com `MAW-Setup-X.Y.Z.exe` e `release.json` (`file`, `bytes`, `sha256`, `version`, `builtAt`, `installedBytes`, `mawCommit`) — o mesmo formato que o site já valida. O GitHub anexa o código-fonte do commit ao release (o que atende a GPL quando for público).

## 3. Instalador

- Mesmo `AppId` de hoje: instalar a versão nova por cima atualiza.
- Leva: `MAW.exe`, licenças, `server_mapp.py`, `pretrained_models/2stems`, `python\` (o Python 3.10 com as dependências), `ffmpeg\ffmpeg.exe`.
- `/UPDATE` na linha de comando (usado pela MAW): roda silencioso, fecha a MAW se estiver aberta e a reabre no fim.
- Continua instalando para a máquina toda (admin): cada atualização mostra o aviso de permissão do Windows (UAC). Instalação por usuário (sem UAC) exigiria tirar a dependência do VC++ Redistributable; fica para depois.
- Sem assinatura de código: o SmartScreen continua aparecendo.

## 4. MAW: usar o que vem na pasta dela

- `MawSettings::pythonServerCommand`: no Windows, se existe `python\python.exe` ao lado do `server_mapp.py`, é ele que roda o servidor (antes do `py -3.10`); o `pythonPath` do `MAW.settings` continua valendo primeiro.
- Na partida, se existe `ffmpeg\ffmpeg.exe` ao lado do servidor, essa pasta entra na frente do `PATH` do processo (o servidor e a exportação em mp3 herdam).

## 5. MAW: atualização

- Na partida, numa thread, a MAW consulta o último release: `https://api.github.com/repos/WaynerMoraes12/MAW/releases/latest`, lê o asset `release.json` e compara a versão com a dela. A chave `updateFeedUrl` do `MAW.settings` troca a fonte (para testar com um `release.json` servido localmente).
- **Fase privada**: sem token a API responde 404 e a MAW não faz nada. Com um token do GitHub em `%APPDATA%\MAW\github_token.txt` (ou `MAW_GITHUB_TOKEN`), ela consegue ler os releases privados — só no PC do dono. Quando o repositório for público, ninguém precisa de token.
- Versão mais nova → diálogo "Versão X.Y.Z disponível — Atualizar agora / Depois". Durante gravação ou reprodução o aviso espera o transporte parar. "Depois" pergunta de novo na próxima vez que a MAW abrir.
- "Atualizar agora": salva o projeto aberto (o mesmo caminho do Ctrl+S; projeto nunca salvo pede o nome antes), baixa o instalador com progresso, confere o SHA-256 do `release.json`, roda `MAW-Setup-X.Y.Z.exe /SILENT /SUPPRESSMSGBOXES /NORESTART /UPDATE` e fecha a MAW. Download ou hash errado: mensagem clara, nada é executado.
- Partes puras (comparar versões, ler o `release.json`, decidir se oferece) com testes na suíte da MAW (`--run-tests`).

## 6. Site

- `npm run tour` (e a tarefa diária) também pega o último release da MAW e atualiza `src/data/release.json`; o botão de download aponta para os releases da MAW (`releaseBaseUrl`). Enquanto privado, o deploy continua travado pelo `check-release` (o link não é público) — é o comportamento certo.
- **World Tour**, novo sentido com um instalador por PR:
  - **Na estrada**: a versão mais nova ("Version 1.0.7") e os recursos que já estão num release (PRs de recurso mergeados depois do instalador de estreia até o commit do último release), mais recentes primeiro.
  - **Ensaiando**: PR de recurso aberto, branch com trabalho e sem PR, e PR mergeado cujo release ainda está sendo feito.
  - **Anunciado**: issues `roadmap` (sem mudança).
  - Limite de 14: anunciados e ensaiando primeiro, depois os recursos mais recentes; a parada da versão fica sempre.
- `installer/` e `npm run installer` do site saem depois que a esteira da MAW publicar o primeiro release.

## 7. Verificação

- MAW: compila neste PC (MSBuild) e `--run-tests` passa com os testes novos (versão, manifesto, decisão de oferecer, comando do Python embutido).
- `installer/build.ps1` roda de ponta a ponta neste PC e gera um instalador com a IA dentro.
- PR da MAW com a esteira: o workflow roda no PR (sem publicar) e passa.
- Site: testes do tour com as regras novas; `npm run tour` contra a MAW real.
- Fica para o usuário: instalar e aceitar uma atualização de verdade (pede UAC), e, se quiser testar a atualização na fase privada, criar o token.

## 8. Fora de escopo

Publicar (Pages, release público), assinatura de código, instalação por usuário, Linux/macOS na esteira (o workflow de Linux/macOS que já existe continua como está), canal de dúvidas novo.
