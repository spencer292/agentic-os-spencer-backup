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
  # Register-ScheduledTask, not schtasks: schtasks can't clear the default "No Start On Batteries",
  # which refused the 2026-10-26 run (0x800710E0) on a laptop. StartWhenAvailable catches up a run
  # missed while the machine was asleep.
  $self = Join-Path $PSScriptRoot 'run-ninety-scorecard-push.ps1'
  $action = New-ScheduledTaskAction -Execute 'powershell.exe' `
    -Argument "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$self`""
  $trigger = New-ScheduledTaskTrigger -Weekly -DaysOfWeek Monday -At 05:30
  # Drop the UTC offset New-ScheduledTaskTrigger bakes in, or the run slides an hour at DST changes.
  $trigger.StartBoundary = (Get-Date '05:30').ToString('s')
  $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries `
    -StartWhenAvailable -ExecutionTimeLimit (New-TimeSpan -Hours 1)
  Register-ScheduledTask -TaskName "GotMoles Ninety Scorecard Push" -Action $action -Trigger $trigger `
    -Settings $settings -Force | Out-Null
  exit 0
}

New-Item -ItemType Directory -Force -Path $LogDir | Out-Null
$log = Join-Path $LogDir ("ninety-scorecard-push-{0}.log" -f (Get-Date -Format 'yyyy-MM-dd_HHmm'))
Set-Location $Root

# Out-File utf8, not *>> — Windows PowerShell's redirect writes UTF-16, which grep reads as binary.
& node projects/briefs/got-moles-scale/scripts/ninety-weekly-push.mjs *>&1 | Out-File -Append -Encoding utf8 $log
if ($LASTEXITCODE -ne 0) { "PUSH FAILED (exit $LASTEXITCODE) - see above" | Out-File -Append -Encoding utf8 $log; exit 1 }
