#!/usr/bin/env bash
# Setup for tool-web-qa. Installs playwright, pixelmatch and pngjs INTO THIS FOLDER only.
# Never installs into the repo root. Safe to re-run.
set -u

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR" || exit 1

echo "tool-web-qa setup"
echo "install dir: $SCRIPT_DIR"

if ! command -v node >/dev/null 2>&1; then
  echo "FAIL: node is not on PATH. Install Node 18 or newer, then re-run this script."
  exit 1
fi

NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]')"
if [ "$NODE_MAJOR" -lt 18 ]; then
  echo "FAIL: node $NODE_MAJOR found. Node 18 or newer is required for global fetch."
  exit 1
fi
echo "OK: node $(node --version)"

if ! command -v npm >/dev/null 2>&1; then
  echo "FAIL: npm is not on PATH."
  exit 1
fi

NEEDS_INSTALL=0
for pkg in playwright pixelmatch pngjs; do
  if [ ! -d "$SCRIPT_DIR/node_modules/$pkg" ]; then
    NEEDS_INSTALL=1
  fi
done

if [ "$NEEDS_INSTALL" -eq 1 ]; then
  echo "installing node packages into $SCRIPT_DIR/node_modules ..."
  npm install --prefix "$SCRIPT_DIR" --no-audit --no-fund || {
    echo "FAIL: npm install failed. Check network access and try again."
    exit 1
  }
else
  echo "OK: node packages already present"
fi

# Chromium binary. Playwright caches browsers outside this folder by design.
echo "checking the chromium build ..."
if node -e "
import('playwright').then(async (pw) => {
  const b = await pw.chromium.launch();
  await b.close();
  process.exit(0);
}).catch(() => process.exit(1));
" 2>/dev/null; then
  echo "OK: chromium launches"
else
  echo "installing chromium via playwright ..."
  npx --prefix "$SCRIPT_DIR" playwright install chromium || {
    echo "FAIL: could not install chromium. Run: npx playwright install chromium"
    exit 1
  }
  echo "OK: chromium installed"
fi

echo "setup complete. Run:"
echo "  node \"$SCRIPT_DIR/qa-run.mjs\" --base https://example.com --limit 10"
