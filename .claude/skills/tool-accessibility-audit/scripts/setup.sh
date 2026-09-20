#!/usr/bin/env bash
# setup.sh — install this skill's audit dependencies into this folder only.
#
# Nothing is installed into the repo root. playwright, @axe-core/playwright and a
# Chromium binary land under .claude/skills/tool-accessibility-audit/scripts/.
# Idempotent: re-running when everything is present does nothing but report.

set -uo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "tool-accessibility-audit setup"
echo "  target: $DIR"

# --- prerequisites -----------------------------------------------------------

if ! command -v node >/dev/null 2>&1; then
  echo "  FAIL: node is not on PATH. Install Node 18 or newer, then re-run this script."
  exit 1
fi
echo "  node: $(node -v)"

if ! command -v npm >/dev/null 2>&1; then
  echo "  FAIL: npm is not on PATH. It ships with Node. Install Node 18 or newer, then re-run."
  exit 1
fi
echo "  npm: $(npm -v)"

NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]')"
if [ "$NODE_MAJOR" -lt 18 ]; then
  echo "  FAIL: Node $NODE_MAJOR is too old. Playwright needs Node 18 or newer."
  exit 1
fi

cd "$DIR" || exit 1

# --- npm packages ------------------------------------------------------------

if [ -d "$DIR/node_modules/playwright" ] && [ -d "$DIR/node_modules/@axe-core/playwright" ]; then
  echo "  packages: already present, skipping npm install"
else
  echo "  packages: installing playwright and @axe-core/playwright into $DIR"
  if ! npm install playwright @axe-core/playwright --no-audit --no-fund --loglevel=error; then
    echo "  FAIL: npm install failed. Check network access and the npm registry setting."
    exit 1
  fi
  echo "  packages: installed"
fi

# --- chromium browser --------------------------------------------------------

echo "  browser: ensuring Chromium is downloaded (Playwright skips it if already present)"
if ! npx --yes playwright install chromium; then
  echo "  FAIL: Chromium download failed."
  echo "        On Linux you may also need: npx playwright install-deps chromium"
  exit 1
fi

# --- verify ------------------------------------------------------------------

echo "  verifying"
if node -e "
  Promise.all([import('playwright'), import('@axe-core/playwright')])
    .then(async ([pw, axe]) => {
      const AxeBuilder = axe.default?.default ?? axe.default ?? axe.AxeBuilder;
      if (typeof AxeBuilder !== 'function') throw new Error('AxeBuilder export not found');
      const b = await pw.chromium.launch({ headless: true });
      await b.close();
      console.log('    playwright + axe-core ready');
    })
    .catch((e) => { console.error('    ' + e.message); process.exit(1); });
"; then
  echo "  OK. Run: node $DIR/a11y-audit.mjs <url> --out <report.md>"
else
  echo "  FAIL: dependencies installed but the smoke test did not pass."
  exit 1
fi
