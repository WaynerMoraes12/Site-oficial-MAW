# Registra (ou regrava) a tarefa diária que sincroniza o World Tour do site com a MAW.
# Roda todo dia às 09:00; se o PC estava desligado nesse horário, roda quando ele ligar.
# Para remover: Unregister-ScheduledTask -TaskName 'MAW Site - World Tour' -Confirm:$false
$name = 'MAW Site - World Tour'
$script = Join-Path $PSScriptRoot 'tour-daily.ps1'
$action = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$script`""
$trigger = New-ScheduledTaskTrigger -Daily -At 9am
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -ExecutionTimeLimit (New-TimeSpan -Minutes 30)
Register-ScheduledTask -TaskName $name -Action $action -Trigger $trigger -Settings $settings -Force `
  -Description 'Sincroniza o World Tour do site oficial da MAW com o GitHub da MAW (npm run tour) e sobe se mudou.' | Out-Null
Get-ScheduledTask -TaskName $name | Get-ScheduledTaskInfo | Select-Object TaskName, NextRunTime
