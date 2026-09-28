# Tarefa diária do Agendador do Windows (registrada por scripts/register-tour-task.ps1):
# sincroniza o World Tour com o GitHub da MAW e, se mudou, commita só o src/data/tour.json e sobe.
# Log em %LOCALAPPDATA%\MAW-site\tour-sync.log.
$repo = Split-Path -Parent $PSScriptRoot
$logDir = Join-Path $env:LOCALAPPDATA 'MAW-site'
$log = Join-Path $logDir 'tour-sync.log'
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
# mudança à mão ainda não commitada no snapshot: não mexe, para não misturar nem perder
if (git status --porcelain -- src/data/tour.json) { Log 'src/data/tour.json tem mudanças não commitadas; pulei'; exit 0 }

if ((Run 'npm run tour') -ne 0) {
  # snapshot incompleto (ex.: o Claude não respondeu): desfaz, amanhã tenta de novo
  Run 'git checkout -- src/data/tour.json' | Out-Null
  Log 'npm run tour falhou; nada commitado'
  exit 1
}
if (-not (git status --porcelain -- src/data/tour.json)) { Log 'sem mudanças'; exit 0 }

$message = '-m "chore: World Tour sincronizado com a MAW" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"'
if ((Run "git commit $message -- src/data/tour.json") -ne 0) { Log 'commit falhou'; exit 1 }
if ((Run 'git push') -ne 0) { Log "push falhou; o commit ficou só no PC ($branch)"; exit 1 }
Log "sincronizado e enviado ($branch)"
