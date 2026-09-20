[CmdletBinding()]
param(
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$Arguments
)

$RepoRoot = Split-Path -Parent $PSScriptRoot
$ScriptPath = Join-Path $RepoRoot "command-centre\scripts\cron-daemon.cjs"
$CronUiPath = Join-Path $PSScriptRoot "lib\cron-ui.ps1"
. $CronUiPath

Write-AgenticOsCronBanner `
    -Heading "Showing cron daemon logs" `
    -Subheading "Prints the most recent log lines (no live follow)."
Write-AgenticOsCronInfo "Reading the daemon log..."

node $ScriptPath logs @Arguments
$ExitCode = $LASTEXITCODE

if ($ExitCode -eq 0) {
    Write-AgenticOsCronSuccess "Log stream finished."
}

exit $ExitCode
