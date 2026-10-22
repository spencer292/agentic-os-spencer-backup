# Weekly Ninety scorecard push, run from Windows Task Scheduler.
#
# Why this exists (2026-10-22): the cron daemon is stopped, and restarting it would also fire ~20
# other jobs, several of which write to live Jobber. The scorecard silently froze on 2026-08-11 as a
# result; weeks 08-03..10-12 were backfilled by hand on 10-22.
#
# Plain node, no Claude: the push script is deterministic, read-only against Jobber and CallRail,
# and writes only Ninety scores and notes. Defaults (last 3 completed weeks, fresh pull) are the
# same as the cron job in cron/jobs/ninety-scorecard-push.md. Results: scorecard-runs/runs.log.
#
# Install / remove the weekly task (Monday 05:30):
#   powershell -NoProfile -ExecutionPolicy Bypass -File scripts\run-ninety-scorecard-push.ps1 -Install
#   schtasks /Delete /TN "GotMoles Ninety Scorecard Push" /F
# Run now:
#   powershell -NoProfile -ExecutionPolicy Bypass -File scripts\run-ninety-scorecard-push.ps1
param([switch]$Install)

$Root = Split-Path -Parent $PSScriptRoot
$LogDir = Join-Path $Root 'cron\logs'

if ($Install) {
  $self = Join-Path $PSScriptRoot 'run-ninety-scorecard-push.ps1'
  schtasks /Create /TN "GotMoles Ninety Scorecard Push" /SC WEEKLY /D MON /ST 05:30 /F `
    /TR "powershell -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$self`""
  exit $LASTEXITCODE
}

New-Item -ItemType Directory -Force -Path $LogDir | Out-Null
$log = Join-Path $LogDir ("ninety-scorecard-push-{0}.log" -f (Get-Date -Format 'yyyy-MM-dd_HHmm'))
Set-Location $Root

& node projects/briefs/got-moles-scale/scripts/ninety-weekly-push.mjs *>> $log
if ($LASTEXITCODE -ne 0) { "PUSH FAILED (exit $LASTEXITCODE) - see above" >> $log; exit 1 }
