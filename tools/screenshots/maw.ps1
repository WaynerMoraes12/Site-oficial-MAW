param(
    [Parameter(Mandatory = $true)][ValidateSet('launch', 'capture', 'click', 'rclick', 'dblclick', 'move', 'keys', 'key', 'info', 'kill', 'drag', 'scroll')][string]$Action,
    [string]$Out,
    [int]$X, [int]$Y, [int]$X2, [int]$Y2,
    [string]$Keys,
    [int]$Delta = -120,
    [int]$WaitMs = 600
)

Add-Type -AssemblyName System.Drawing
Add-Type -AssemblyName System.Windows.Forms
if (-not ([System.Management.Automation.PSTypeName]'MawWin2').Type) {
Add-Type @"
using System;
using System.Runtime.InteropServices;
public static class MawWin2 {
    [DllImport("user32.dll")] public static extern bool SetProcessDPIAware();
    [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr h);
    [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr h, int c);
    [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr h, out RECT r);
    [DllImport("user32.dll")] public static extern bool SetCursorPos(int x, int y);
    [DllImport("user32.dll")] public static extern void mouse_event(uint f, int dx, int dy, int d, UIntPtr e);
    [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
    [DllImport("user32.dll")] public static extern bool IsIconic(IntPtr h);
    [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr h, out uint pid);
    [StructLayout(LayoutKind.Sequential)] public struct RECT { public int L, T, R, B; }
}
"@
}
[MawWin2]::SetProcessDPIAware() | Out-Null

$exe = 'C:\Users\User\MAW\Builds\VisualStudio2022\x64\Release\App\MAW_APP.exe'

function Get-MawProc { Get-Process MAW_APP -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowHandle -ne 0 } | Select-Object -First 1 }

function Focus-Maw {
    $p = Get-MawProc
    if (-not $p) { throw 'MAW nao esta aberta' }
    $h = $p.MainWindowHandle
    $fgPid = 0; [MawWin2]::GetWindowThreadProcessId([MawWin2]::GetForegroundWindow(), [ref]$fgPid) | Out-Null
    if ($fgPid -eq $p.Id) { return $h }
    if ([MawWin2]::IsIconic($h)) { [MawWin2]::ShowWindow($h, 9) | Out-Null }
    # truque do ALT para o Windows liberar o SetForegroundWindow
    [System.Windows.Forms.SendKeys]::SendWait('%')
    [MawWin2]::SetForegroundWindow($h) | Out-Null
    Start-Sleep -Milliseconds 250
    return $h
}

function Mouse($flagsDown, $flagsUp) {
    [MawWin2]::mouse_event($flagsDown, 0, 0, 0, [UIntPtr]::Zero)
    Start-Sleep -Milliseconds 40
    [MawWin2]::mouse_event($flagsUp, 0, 0, 0, [UIntPtr]::Zero)
}

switch ($Action) {
    'launch' {
        if (-not (Get-MawProc)) {
            Start-Process -FilePath $exe -WorkingDirectory (Split-Path $exe)
            $deadline = (Get-Date).AddSeconds(40)
            while (-not (Get-MawProc) -and (Get-Date) -lt $deadline) { Start-Sleep -Milliseconds 500 }
        }
        $p = Get-MawProc
        if ($p) { "pid=$($p.Id) title='$($p.MainWindowTitle)'" } else { 'janela nao apareceu' }
    }
    'info' {
        Get-Process MAW_APP -ErrorAction SilentlyContinue | ForEach-Object {
            $r = New-Object MawWin2+RECT; [MawWin2]::GetWindowRect($_.MainWindowHandle, [ref]$r) | Out-Null
            "pid=$($_.Id) hwnd=$($_.MainWindowHandle) title='$($_.MainWindowTitle)' rect=$($r.L),$($r.T),$($r.R),$($r.B)"
        }
        $fg = [MawWin2]::GetForegroundWindow(); "foreground=$fg"
    }
    'capture' {
        Focus-Maw | Out-Null
        Start-Sleep -Milliseconds $WaitMs
        $b = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds
        $bmp = New-Object System.Drawing.Bitmap $b.Width, $b.Height
        $g = [System.Drawing.Graphics]::FromImage($bmp)
        $g.CopyFromScreen($b.X, $b.Y, 0, 0, $bmp.Size)
        $g.Dispose()
        $bmp.Save($Out, [System.Drawing.Imaging.ImageFormat]::Png)
        $bmp.Dispose()
        "saved $Out ($($b.Width)x$($b.Height))"
    }
    'move' { [MawWin2]::SetCursorPos($X, $Y) | Out-Null; 'ok' }
    'click' { Focus-Maw | Out-Null; [MawWin2]::SetCursorPos($X, $Y) | Out-Null; Start-Sleep -Milliseconds 80; Mouse 0x0002 0x0004; Start-Sleep -Milliseconds $WaitMs; 'ok' }
    'rclick' { Focus-Maw | Out-Null; [MawWin2]::SetCursorPos($X, $Y) | Out-Null; Start-Sleep -Milliseconds 80; Mouse 0x0008 0x0010; Start-Sleep -Milliseconds $WaitMs; 'ok' }
    'dblclick' { Focus-Maw | Out-Null; [MawWin2]::SetCursorPos($X, $Y) | Out-Null; Start-Sleep -Milliseconds 80; Mouse 0x0002 0x0004; Start-Sleep -Milliseconds 60; Mouse 0x0002 0x0004; Start-Sleep -Milliseconds $WaitMs; 'ok' }
    'drag' {
        Focus-Maw | Out-Null
        [MawWin2]::SetCursorPos($X, $Y) | Out-Null; Start-Sleep -Milliseconds 80
        [MawWin2]::mouse_event(0x0002, 0, 0, 0, [UIntPtr]::Zero)
        for ($i = 1; $i -le 20; $i++) { [MawWin2]::SetCursorPos([int]($X + ($X2 - $X) * $i / 20), [int]($Y + ($Y2 - $Y) * $i / 20)) | Out-Null; Start-Sleep -Milliseconds 15 }
        [MawWin2]::mouse_event(0x0004, 0, 0, 0, [UIntPtr]::Zero)
        Start-Sleep -Milliseconds $WaitMs; 'ok'
    }
    'scroll' { Focus-Maw | Out-Null; [MawWin2]::SetCursorPos($X, $Y) | Out-Null; [MawWin2]::mouse_event(0x0800, 0, 0, $Delta, [UIntPtr]::Zero); Start-Sleep -Milliseconds $WaitMs; 'ok' }
    'keys' { Focus-Maw | Out-Null; [System.Windows.Forms.SendKeys]::SendWait($Keys); Start-Sleep -Milliseconds $WaitMs; 'ok' }
    'key' { [System.Windows.Forms.SendKeys]::SendWait($Keys); Start-Sleep -Milliseconds $WaitMs; 'ok' }
    'kill' { Get-Process MAW_APP -ErrorAction SilentlyContinue | ForEach-Object { $_.CloseMainWindow() | Out-Null }; Start-Sleep -Seconds 2; Get-Process MAW_APP -ErrorAction SilentlyContinue | Stop-Process; 'closed' }
}
