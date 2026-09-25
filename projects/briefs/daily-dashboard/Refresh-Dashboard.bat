@echo off
REM Refresh-Dashboard.bat — re-pull the daily check-in numbers and open the dashboard.
REM Double-click this any time. Takes about 3-6 minutes: the Jobber sweeps self-throttle.
REM Nothing here writes to Jobber. It only reads.

setlocal
cd /d "%~dp0..\..\.."

echo.
echo   Got Moles - refreshing the daily dashboard
echo   Reading Jobber and CallRail. This takes a few minutes.
echo.

node "projects\briefs\daily-dashboard\scripts\pull-dashboard-data.mjs"
if errorlevel 1 (
  echo.
  echo   The data pull FAILED - see the message above.
  echo   If it mentions the Jobber token, run this once and follow the browser prompt:
  echo     node .claude\skills\tool-jobber\scripts\jobber-api.mjs auth
  echo.
  pause
  exit /b 1
)

node "projects\briefs\daily-dashboard\scripts\render-dashboard.mjs"
if errorlevel 1 (
  echo.
  echo   The render FAILED - see the message above.
  pause
  exit /b 1
)

echo.
echo   Done. Opening the dashboard.
start "" "projects\briefs\daily-dashboard\dashboard.html"
timeout /t 2 >nul
endlocal
