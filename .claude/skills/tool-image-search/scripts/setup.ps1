# Setup for tool-image-search on Windows (PowerShell, native — no Git Bash).
# Tier 1 + 2 only need `uv` + Python 3.10+. Tier 3 (scraping) needs Playwright
# chromium; we install it here unless $env:TIER3 = "0".

$ErrorActionPreference = "Stop"

function Ok($msg)   { Write-Host "[OK] $msg"   -ForegroundColor Green }
function Warn($msg) { Write-Host "[WARN] $msg" -ForegroundColor Yellow }
function Fail($msg) { Write-Host "[FAIL] $msg" -ForegroundColor Red; exit 1 }

# --- Python ---
$py = Get-Command python -ErrorAction SilentlyContinue
if (-not $py) { $py = Get-Command python3 -ErrorAction SilentlyContinue }
if (-not $py) { Fail "python not found. Install Python 3.10+ from python.org and re-run." }
Ok "python: $(& $py.Path --version)"

# --- uv ---
$uv = Get-Command uv -ErrorAction SilentlyContinue
if (-not $uv) {
  Write-Host "Installing uv..."
  Invoke-RestMethod https://astral.sh/uv/install.ps1 | Invoke-Expression
  # uv installer adds %USERPROFILE%\.local\bin to PATH for new sessions only;
  # add it to the current one too so the rest of this script can find it.
  $env:Path = "$env:USERPROFILE\.local\bin;$env:Path"
  $uv = Get-Command uv -ErrorAction SilentlyContinue
}
if (-not $uv) { Fail "uv installation failed" }
Ok "uv: $(& $uv.Path --version)"

# --- Playwright chromium (Tier 3) ---
if ($env:TIER3 -eq "0") {
  Warn "TIER3=0 - skipping Playwright chromium install. Scraping (--allow-scraping) will fail until you run setup again without TIER3=0."
} else {
  Write-Host "Installing Playwright chromium (~200MB) - required for --allow-scraping"
  & uv run --with playwright --with playwright-stealth python -m playwright install chromium
  Ok "Playwright chromium ready"
}

Write-Host ""
Ok "tool-image-search setup complete."
Write-Host "Try:"
Write-Host "  uv run scripts\search.py --query 'minimalist workspace' --intent stock --count 3"
