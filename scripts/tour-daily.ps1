# Tarefa diária do Agendador do Windows (registrada por scripts/register-tour-task.ps1):
# sincroniza o World Tour e o último release da MAW e, se mudou, commita só os dados do site que a sincronização gera (tour.json, release.json, site.json) e sobe.
# Log em %LOCALAPPDATA%\MAW-site\tour-sync.log.
$repo = Split-Path -Parent $PSScriptRoot
$logDir = Join-Path $env:LOCALAPPDATA 'MAW-site'
$log = Join-Path $logDir 'tour-sync.log'
$subject = 'chore: World Tour sincronizado com a MAW'
# o que a sincronização gera; release.json e site.json mudam quando a esteira da MAW publica versão nova
$synced = @('src/data/release.json', 'src/data/site.json')
$all = @('src/data/tour.json') + $synced
New-Item -ItemType Directory -Force $logDir | Out-Null

function Log([string]$message) {
  Add-Content -Encoding utf8 -Path $log -Value "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') $message"
}

# comandos externos pelo cmd: no PowerShell 5.1 a saída de erro deles (npm, git push) vira exceção
function Run([string]$command) {
  cmd /c "$command >> `"$log`" 2>&1"
  return $LASTEXITCODE
}

Set-Location $repo
Log "início em $repo"

$branch = git symbolic-ref -q --short HEAD
if (-not $branch) { Log 'repo fora de um branch (rebase ou HEAD solto); pulei'; exit 0 }
foreach ($state in 'MERGE_HEAD', 'CHERRY_PICK_HEAD', 'REVERT_HEAD', 'rebase-merge', 'rebase-apply') {
  if (Test-Path (git rev-parse --git-path $state)) { Log "operação do git em andamento ($state); pulei"; exit 0 }
}
# mudança à mão ainda não commitada no snapshot: não mexe, para não misturar nem perder
if (git status --porcelain -- src/data/tour.json) { Log 'src/data/tour.json tem mudanças não commitadas; pulei'; exit 0 }
# instalador novo ainda não commitado: o tour seria de um instalador que o GitHub não tem
if (git status --porcelain -- $synced) { Log 'dados do site (release.json ou site.json) com mudanças não commitadas; pulei até serem commitados'; exit 0 }

if ((Run 'npm run tour') -ne 0) {
  # snapshot incompleto (ex.: o Claude não respondeu): desfaz, amanhã tenta de novo
  Run "git checkout -- $($all -join ' ')" | Out-Null
  Log 'npm run tour falhou; nada commitado'
  exit 1
}

if (git status --porcelain -- $all) {
  $message = "-m `"$subject`" -m `"Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`""
  if ((Run "git commit $message -- $($all -join ' ')") -ne 0) {
    Run "git checkout -- $($all -join ' ')" | Out-Null
    Log 'commit falhou; dados desfeitos, amanhã tenta de novo'
    exit 1
  }
  Log "commit feito ($branch)"
} else {
  Log 'sem mudanças'
}

# sobe se houver commit do World Tour ainda não enviado (inclusive de um dia em que o push falhou)
$upstream = git rev-parse --abbrev-ref '@{u}' 2>$null
if (-not $upstream) { Log "branch $branch sem upstream; nada enviado"; exit 0 }
$pending = git log '@{u}..HEAD' --format=%s
if ($pending -contains $subject) {
  if ((Run 'git push') -ne 0) { Log "push falhou; tenta de novo amanhã ($branch)"; exit 1 }
  Log "enviado ($branch)"
}
