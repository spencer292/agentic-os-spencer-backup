' Agentic OS - cron daemon autostart (keeps scheduled jobs running after login).
' No admin / no Task Scheduler needed. Runs hidden at login. Idempotent: the daemon's
' "start" no-ops if one is already leading, so it is safe to run on every login.
'
' Install (no admin): copy this into your Startup folder, e.g. in PowerShell -
'   Copy-Item "C:\Claude\agent-os-v3\agentic-os\scripts\cron-daemon-startup.vbs" "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Startup\"
' Remove: delete cron-daemon-startup.vbs from that Startup folder.
CreateObject("WScript.Shell").Run """C:\Program Files\nodejs\node.exe"" ""C:\Claude\agent-os-v3\agentic-os\command-centre\scripts\cron-daemon.cjs"" start", 0, False
