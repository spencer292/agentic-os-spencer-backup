[CmdletBinding()]
param(
    [switch]$Uninstall
)

# Auto-start the Command Centre at logon (Next.js server + in-process cron scheduler),
# so cron jobs fire without keeping a terminal open.
#
# Runs the PRODUCTION server (`npm run start`), not the dev server. The dev server's
# on-demand Turbopack compiler can wedge over long (multi-day) uptimes ("node process
# exited before we could connect to it"); the production server compiles once up front
# and just serves, so it stays healthy as an always-on process. It self-heals: if no
# build exists yet (`.next/BUILD_ID` missing), it builds first, then starts.
# NOTE: changes to Command Centre *code* now require `npm run build` + a restart to show
# up. Tasks, crons, content and config are unaffected.
#
# Uses a shortcut in the user's Startup folder — no admin required. (Task Scheduler
# registration is blocked by policy on managed/corporate machines, so this is the
# reliable per-user mechanism.)

$ErrorActionPreference = "Stop"
$RepoRoot  = Split-Path -Parent $PSScriptRoot
$CentreDir = Join-Path $RepoRoot "command-centre"
$Startup   = [Environment]::GetFolderPath("Startup")
$LnkPath   = Join-Path $Startup "AgenticOS Command Centre.lnk"

if ($Uninstall) {
    if (Test-Path $LnkPath) { Remove-Item $LnkPath -Force; Write-Host "[OK] Removed autostart shortcut." -ForegroundColor Green }
    else { Write-Host "[!] No autostart shortcut found." -ForegroundColor Yellow }
    exit 0
}

if (-not (Test-Path $CentreDir)) { throw "command-centre not found at $CentreDir" }

$ws  = New-Object -ComObject WScript.Shell
$lnk = $ws.CreateShortcut($LnkPath)
$lnk.TargetPath       = "powershell.exe"
$lnk.Arguments        = "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -Command `"Set-Location '$CentreDir'; if (-not (Test-Path '.next\BUILD_ID')) { npm run build }; npm run start`""
$lnk.WorkingDirectory = $CentreDir
$lnk.WindowStyle      = 7   # minimized
$lnk.Description      = "Starts the Agentic OS Command Centre (cron runtime) at logon"
$lnk.Save()

Write-Host "[OK] Installed autostart shortcut:" -ForegroundColor Green
Write-Host "     $LnkPath" -ForegroundColor Gray
Write-Host "     Launches the Command Centre headless at logon -> http://localhost:3000" -ForegroundColor Gray
Write-Host "     Cron jobs (incl. Zernio Analytics Snapshot 06:00) run while it's up." -ForegroundColor Gray
Write-Host "     Remove with:  powershell -File scripts\install-centre-autostart.ps1 -Uninstall" -ForegroundColor Gray
