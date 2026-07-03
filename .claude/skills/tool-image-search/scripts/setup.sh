#!/usr/bin/env bash
# Setup for tool-image-search on macOS / Linux.
# Tier 1 + 2 only need `uv` + Python 3.10+. Tier 3 (scraping) additionally needs
# Playwright chromium; we install it here so --allow-scraping works out of the
# box. Skip the chromium install with TIER3=0.

set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
ok()   { echo -e "${GREEN}[OK]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
fail() { echo -e "${RED}[FAIL]${NC} $1"; exit 1; }

# --- Python 3 ---
command -v python3 >/dev/null 2>&1 || fail "python3 not found. Install Python 3.10+ first."
ok "python3: $(python3 --version)"

# --- uv ---
if ! command -v uv >/dev/null 2>&1; then
  echo "Installing uv..."
  curl -LsSf https://astral.sh/uv/install.sh | sh
  export PATH="$HOME/.local/bin:$PATH"
fi
command -v uv >/dev/null 2>&1 || fail "uv installation failed"
ok "uv: $(uv --version)"

# --- Playwright chromium (Tier 3) ---
if [ "${TIER3:-1}" = "0" ]; then
  warn "TIER3=0 — skipping Playwright chromium install. Scraping (--allow-scraping) will fail until you run this script with TIER3=1."
else
  echo "Installing Playwright chromium (~200MB) — required for --allow-scraping"
  uv run --with playwright --with playwright-stealth python3 -m playwright install chromium
  ok "Playwright chromium ready"
fi

echo ""
ok "tool-image-search setup complete."
echo "Try:"
echo "  uv run scripts/search.py --query 'minimalist workspace' --intent stock --count 3"
