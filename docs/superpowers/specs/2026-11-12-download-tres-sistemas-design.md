# Download da MAW no site, em Windows, macOS e Linux — design

12/11/2026. Continuação de `2026-09-28-esteira-e-atualizacao-design.md` (a esteira que gera o instalador do Windows
a cada merge e a atualização automática dentro da MAW).

> **Mudança no mesmo dia (vale sobre as seções 3 a 5):** o usuário pediu **custo zero e o site funcionando hoje**.
> Nada muda na esteira privada da MAW. A cópia pública sai **deste PC** (`npm run publish-release`, com o `gh` daqui,
> sem token novo: ele preferiu não criar um, e não dá para criar por ele) e inclui o zip do código-fonte sem
> `entregas/`, os arquivos do TCC e `docs/superpowers/`. **macOS e Linux são compilados no repositório do site**
> (público: minutos de graça, Mac incluído), a partir do zip do código-fonte publicado, pelo workflow
> `build-mac-linux.yml`, que anexa os pacotes ao release, atualiza o `platforms.json` e dispara o deploy. A
> sincronização diária publica a cópia antes de adotar a versão, e só adota com a cópia pública no ar. Ficam para
> depois, num PR da MAW: apontar a atualização automática e os links de fonte do FFmpeg/PyAV para o repositório
> público (o instalador 1.0.7 ainda aponta para o privado).

## 1. O que o usuário quer, e por quê

"Chegou o dia": o instalador da MAW vai para o site, dividido entre Windows, macOS e Linux. Até hoje o site mostra
"em breve" porque os releases da MAW são privados (o deploy baixa o instalador e confere o SHA-256 antes de mostrar o
botão; sem acesso público, cai em "em breve").

Decisões dele (12/11):

- **A MAW continua privada.** Cada versão ganha uma **cópia pública nos releases do repositório do site**
  (`WaynerMoraes12/Site-oficial-MAW`, que já é público), junto com o **código-fonte daquela versão** — o mínimo que a
  GPL v3 pede para distribuir o binário. Histórico, issues e TCC continuam fechados. Ele sabe que a esteira continua
  gastando minutos do GitHub (repo privado).
- **Os três sistemas entram já**, cada um com o seu botão e o seu passo a passo.

Dá certo quando: quem entra no site baixa, sem login, a versão atual para o seu sistema, num arquivo conferido; cada
merge na MAW chega ao site sozinho, nos três sistemas; e quem instalou no Windows recebe a atualização dentro do app.

## 2. Objetivos, não objetivos e o que seria fracasso

**Objetivos**

1. Cada release `vX.Y.Z` da MAW sai com: o instalador do Windows (como hoje), o `MAW.app` universal do macOS (zip), o
   pacote do Linux x86-64 (tar.gz), o código-fonte da MAW daquele commit (zip), as fontes do FFmpeg e do PyAV (como
   hoje) e um `release.json` que descreve os três sistemas.
2. A esteira copia esse release, com a mesma tag e os mesmos arquivos, para os releases do `Site-oficial-MAW`.
3. O site mostra três blocos — Windows, macOS, Linux — cada um com botão, nome do arquivo, tamanho, SHA-256 e passo a
   passo. O bloco do sistema de quem visita vem em destaque.
4. A MAW no Windows passa a procurar atualização no repositório público (hoje procura no privado: quem instala pelo
   site, sem token, nunca seria atualizado).
5. O link "Código-fonte (GNU GPL v3)" do site aponta para o zip do código da versão no ar.

**Não objetivos** (agora)

- Assinar o instalador do Windows ou assinar/notarizar o app do Mac (os avisos de primeira abertura continuam, e o site
  ensina a passar por eles, como já faz).
- AppImage, Flatpak, `.deb`, Homebrew.
- A IA embutida no Mac e no Linux (continua instalada à parte; o site já diz isso).
- Atualização automática no Mac e no Linux (hoje é só Windows, `#if JUCE_WINDOWS`; continua assim).
- Tornar o repositório da MAW público.
- Publicar as versões antigas (1.0.1 a 1.0.7). A primeira versão pública é a primeira que sair da esteira nova.

**Seria fracasso, mesmo funcionando**

- Um botão que leva a 404, ou a um arquivo diferente do que o site conferiu.
- Publicar binário sem o código-fonte correspondente no mesmo release.
- Vazar para o público qualquer coisa do repositório da MAW além dos arquivos do release (histórico, issues, TCC,
  tokens, chaves).
- Um release público pela metade (faltando um sistema ou a fonte): ou entra completo, ou fica em rascunho.
- Quebrar a atualização de quem já tem a MAW instalada.

## 3. Restrições

- **Token entre repositórios.** O `GITHUB_TOKEN` da esteira da MAW só escreve no próprio repositório. A cópia precisa
  de um token fino (*fine-grained personal access token*) com acesso **só** ao `Site-oficial-MAW` e só a
  **Contents: Read and write**, guardado na MAW como o secret `SITE_RELEASE_TOKEN`. Só o usuário pode criar. Nunca
  gravar token em arquivo, log ou commit.
- **Cota do GitHub** (repo privado): minuto de Mac conta 10×, de Windows 2×, de Linux 1×. O armazenamento de artefatos
  do plano grátis é pequeno (500 MB) — por isso o instalador do Windows (~480 MB) nunca vira artefato (vai direto do
  job para o release, como hoje). Os pacotes de Mac e Linux podem viajar entre jobs como artefato com retenção de 1 dia.
- **Versão carimbada nos três.** O build com `MAW_VERSION "0.0.0-dev"` se comporta como build de desenvolvimento
  (procura o servidor da IA nas pastas acima do executável). Os pacotes de Mac e Linux saem com a mesma versão do
  release, carimbada em `Source/MawVersion.h` como o Windows já faz.
- **`release.json` compatível.** Os campos de hoje (`file`, `bytes`, `sha256`, `version`, `builtAt`, `installedBytes`,
  `mawCommit`, `ffmpeg`, `pyav`) continuam iguais no topo e descrevendo o Windows, porque a MAW instalada
  (`MawUpdate::parseManifest` exige `file == MAW-Setup-<versão>.exe`) e o site já leem assim. Mac, Linux e o
  código-fonte entram como campos novos.
- **O site só mostra botão conferido.** O deploy continua baixando cada arquivo e conferindo o SHA-256 antes de mostrar
  o botão.
- Contato público: waynerbusiness@outlook.com. Logo da MAW nunca alterado. Textos nas três línguas (EN, PT, ES).

## 4. Como (decidido)

### 4.1 Esteira da MAW (`.github/workflows/`)

- **Versão primeiro.** Um passo/job no início calcula a versão com a regra de hoje (`installer/next-version.ps1`) e a
  entrega aos três builds.
- **Linux e macOS** compilam com a versão carimbada, rodam a suíte (`--run-tests`) e empacotam como o
  `linux-e-macos.yml` já faz, com a versão no nome: `MAW-X.Y.Z-linux-x86_64.tar.gz` e `MAW-X.Y.Z-macos-universal.zip`
  (cada um com o programa, `server_mapp.py`, `requirements.txt` e os modelos que já iam).
- **O job do Windows** (o de hoje) só publica quando os dois terminaram bem: junta os pacotes, acrescenta ao
  `release.json` a descrição de cada um (arquivo, bytes, SHA-256) e a do zip do código-fonte, e publica o release
  **privado** com tudo, no mesmo esquema de hoje: rascunho → conferência de nomes e tamanhos → público.
- **Código-fonte:** `MAW-X.Y.Z-source.zip`, um `git archive` do commit do release (o repositório inteiro naquele
  commit, inclusive `JuceLibraryCode` e os scripts de build).
- **Cópia pública:** depois do release privado, um passo/job separado baixa os arquivos do release privado e cria o
  mesmo `vX.Y.Z` no `Site-oficial-MAW` — rascunho → conferência → público — com notas dizendo a licença (GPL v3), onde
  está o código-fonte e as fontes de terceiros. Falha aqui não desfaz o release privado e pode ser rodada de novo
  sozinha. Sem o secret, falha com mensagem clara (não pula em silêncio).
- **PR que mexe na esteira:** compila e testa os três e não publica nada, como hoje.
- Merges em rajada: o comportamento de hoje (o merge novo cancela o anterior; a versão não pula) vale para o conjunto.

### 4.2 MAW (o app)

- `MawUpdater::latestReleaseApi` passa a apontar para os releases do `Site-oficial-MAW` (público: sem token). O download
  continua conferindo o SHA-256 do `release.json`.
- As cópias já instaladas (1.0.1 a 1.0.7, só no PC do autor, com token) continuam olhando o repositório privado, que
  continua recebendo todos os releases: elas se atualizam para a primeira versão nova e dali em diante olham o público.

### 4.3 Site

- `releaseBaseUrl` → `https://github.com/WaynerMoraes12/Site-oficial-MAW/releases/download`.
- A página e a conferência do deploy (`src/lib/release.ts`, `tools/lib/release-check.mjs`) entendem os campos novos.
  Cada sistema é conferido sozinho: o que não estiver público ou não bater o SHA fica "em breve" **só naquele sistema**.
  Sem o Windows conferido, segue a regra de hoje (o site inteiro mostra "em breve").
- **Download:** três blocos, cada um com o nome do sistema e o requisito, o botão `Download MAW X.Y.Z · <sistema>` (ou
  "em breve"), arquivo · tamanho · SHA-256 e o passo a passo:
  - Windows: baixar, SmartScreen (Mais informações → Executar assim mesmo), seguir o instalador, escolher a placa em
    MENU → Configurar placa de audio (ASIO). (Hoje.)
  - macOS: baixar e descompactar, arrastar o `MAW.app` para Aplicativos, primeira abertura em Ajustes do Sistema →
    Privacidade e Segurança → Abrir Mesmo Assim; a IA (Python 3.10) é instalada à parte; nos Macs com chip Apple a
    separação de stems ainda não funciona.
  - Linux: baixar e extrair, instalar as dependências pelo `apt` (as do README da MAW, incluindo `ffmpeg`), rodar
    `./MAW`; áudio por ALSA/JACK; a IA é instalada à parte; Ubuntu 24.04 ou mais novo (o pacote é compilado lá).
- O bloco do sistema de quem visita vem primeiro e destacado (detecção no navegador). Sem JavaScript, a ordem é fixa:
  Windows, macOS, Linux.
- O link "Código-fonte (GNU GPL v3)" aponta para o `MAW-X.Y.Z-source.zip` da versão no ar.
- A sincronização diária (`npm run tour`) continua lendo o `release.json` do release privado (o `gh` do PC tem acesso)
  e o site continua no ar sozinho a cada versão nova.

### 4.4 Ordem de entrada

1. PR na MAW: esteira dos três + cópia pública + updater apontando para o público.
2. O usuário cria o token e o secret `SITE_RELEASE_TOKEN` (passo a passo dado a ele).
3. O usuário mergeia → sai a primeira versão com os três sistemas, privada e na cópia pública.
4. Site com os três blocos (pode ir ao ar antes do passo 3: sem a cópia pública, segue em "em breve").
5. `npm run tour` adota a versão nova → deploy confere os três arquivos → botões no ar.

## 5. Deixado para quem constrói

- Nomes de jobs e passos; se Linux e Mac viram jobs do mesmo workflow do Windows ou outro arranjo, desde que o release
  só publique com os três prontos e o instalador do Windows nunca vire artefato.
- A forma exata dos campos novos do `release.json` (com o Windows igual no topo).
- O desenho dos três blocos, no estilo do site (crachá ALL ACCESS, cartões, cenários), e a detecção de sistema.
- O texto das notas dos releases.
- Se o build do Mac estiver quebrado hoje (o código cresceu desde setembro: câmera com AVFoundation, FFmpeg), corrigir
  no mesmo PR; se a correção for grande, parar e avisar.

## 6. Verificação

- **PR da MAW:** os três builds e as três suítes verdes; o `release.json` gerado descreve os três e o código-fonte.
- **Depois do merge:** o release privado tem todos os arquivos; a cópia pública baixa **sem login** (pedido anônimo) e
  cada arquivo bate o SHA-256 do `release.json`; o zip do código-fonte abre e corresponde ao commit; nada além dos
  arquivos do release ficou público.
- **Atualização:** o executável novo, sem token, encontra a versão no repositório público
  (`MAW_APP.exe --check-update 1.0.0` → oferece a versão nova).
- **Site:** testes unitários e e2e; o deploy confere os três arquivos; no site real, cada botão baixa o arquivo certo,
  nas três línguas, no computador e no celular.

## 7. Riscos conhecidos

- **Custo de minutos:** o build do Mac conta 10× na cota de repo privado. O tempo real só se sabe no primeiro build
  completo; o usuário recebe o número e decide se quer manter o Mac a cada versão.
- **Build do Mac pode estar quebrado** (último build completo em setembro).
- **Linux:** compilado no Ubuntu 24.04, só roda em distribuições com glibc igual ou mais nova (Ubuntu 24.04+, Debian
  13, Fedora 40+); o site diz isso.
- **Ninguém usou a MAW num Mac com interface de áudio ainda** — o site já avisa nos limites conhecidos.
