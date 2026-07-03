# Registers a Scheduled Task that keeps the Agentic OS cron daemon alive without depending on a
# terminal window. It:
#   - starts the daemon at logon (covers reboots / fresh logins), and
#   - re-checks every 15 minutes and restarts it if it died. The daemon's `start` is idempotent
#     (no-ops if one is already leading), and the daemon catches up any missed scheduled jobs.
# This is the fix for the failure where the in-process runtime died on an uncaught `write EPIPE`
# (console closed) and nothing brought it back.
#
# Run once:  powershell -NoProfile -ExecutionPolicy Bypass -File C:/Claude/agent-os-v3/agentic-os/scripts/install-cron-autostart.ps1
# Remove:    Unregister-ScheduledTask -TaskName "AgenticOS Cron Daemon" -Confirm:$false
[CmdletBinding()]
param([string]$TaskName = "AgenticOS Cron Daemon")

$ErrorActionPreference = "Stop"

$RepoRoot = Split-Path -Parent $PSScriptRoot
$Daemon   = Join-Path $RepoRoot "command-centre\scripts\cron-daemon.cjs"
$NodeExe  = (Get-Command node -ErrorAction Stop).Source
if (-not (Test-Path $Daemon)) { throw "Daemon not found: $Daemon" }
$User = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name

# Idempotent start - spawns the detached daemon only if one isn't already leading.
$action = New-ScheduledTaskAction -Execute $NodeExe -Argument "`"$Daemon`" start" -WorkingDirectory $RepoRoot

$triggers = @( New-ScheduledTaskTrigger -AtLogOn )

# 15-minute watchdog. The trigger's .Repetition is empty on some builds, so build the repetition
# pattern from its CIM class and assign it (assigning a fresh instance avoids reading off a null).
# If the build won't allow it, fall back to at-logon only so the task still registers.
$watchOk = $false
try {
    $watch = New-ScheduledTaskTrigger -Once -At ((Get-Date).AddMinutes(1))
    $repClass = Get-CimClass -Namespace ROOT/Microsoft/Windows/TaskScheduler -ClassName MSFT_TaskRepetitionPattern
    $rep = New-CimInstance -CimClass $repClass -ClientOnly
    $rep.Interval = "PT15M"
    $rep.StopAtDurationEnd = $false
    $watch.Repetition = $rep
    $triggers += $watch
    $watchOk = $true
} catch {
    Write-Host ("  (watchdog not supported on this build; using at-logon only - " + $_.Exception.Message + ")")
}

$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries -MultipleInstances IgnoreNew -ExecutionTimeLimit (New-TimeSpan -Minutes 5)
$principal = New-ScheduledTaskPrincipal -UserId $User -LogonType Interactive -RunLevel Limited

Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $triggers -Settings $settings -Principal $principal -Force | Out-Null

Write-Host ""
if ($watchOk) {
    Write-Host "Registered '$TaskName': starts the cron daemon at logon + re-checks every 15 min."
} else {
    Write-Host "Registered '$TaskName': starts the cron daemon at logon."
}
