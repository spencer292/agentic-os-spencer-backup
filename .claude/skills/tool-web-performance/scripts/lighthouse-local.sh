#!/usr/bin/env bash
# tool-web-performance. Optional local Lighthouse runner.
#
# The main script (cwv-audit.mjs) is the default path. It calls the PageSpeed
# Insights API, which gives you CrUX field data as well as lab data and needs
# nothing installed. Use this script instead when one of these is true:
#
#   1. The site is not publicly reachable (localhost, a preview deploy behind
#      basic auth, a staging host with an IP allowlist). The PSI API cannot see it.
#   2. The keyless PageSpeed quota is exhausted and no PAGESPEED_API_KEY is set.
#      The keyless quota is shared across every anonymous caller worldwide, so
#      it runs out regularly. The API returns HTTP 429 with "Quota exceeded".
#   3. You want to test a local build before it ships.
#
# What you give up: field data. Lighthouse is a synthetic run on your machine,
# so there is no CrUX and therefore no real INP. Total Blocking Time is the
# stand-in. Never report a lab number as if it were a Core Web Vitals verdict.
#
# Requirements: Node 18+ and a Chrome or Chromium install. npx downloads
# Lighthouse on first use. Nothing is added to this repo.
#
# Usage:
#   bash lighthouse-local.sh <url> [<url> ...] [--out-dir DIR] [--desktop-only] [--mobile-only]
#
# Then feed the JSON into the same report builder:
#   node cwv-audit.mjs --from-json DIR/*.json --out projects/tool-web-performance/report.md
#
# Windows note: chrome-launcher often prints "EPERM, Permission denied" while
# deleting its own temp profile after a successful run. The JSON is already
# written at that point. Check the file exists rather than trusting the exit code.

set -u

OUT_DIR="./lighthouse-out"
FORM_FACTORS="mobile desktop"
URLS=()

while [ $# -gt 0 ]; do
  case "$1" in
    --out-dir) OUT_DIR="$2"; shift 2 ;;
    --desktop-only) FORM_FACTORS="desktop"; shift ;;
    --mobile-only) FORM_FACTORS="mobile"; shift ;;
    -h|--help) sed -n '2,30p' "$0"; exit 0 ;;
    *) URLS+=("$1"); shift ;;
  esac
done

if [ ${#URLS[@]} -eq 0 ]; then
  echo "Usage: bash lighthouse-local.sh <url> [<url> ...] [--out-dir DIR] [--desktop-only|--mobile-only]" >&2
  exit 1
fi

if ! command -v node >/dev/null 2>&1; then
  echo "Node is not on PATH. Install Node 18 or later, then re-run." >&2
  exit 1
fi

CHROME_FOUND=0
for c in chrome google-chrome chromium chromium-browser; do
  if command -v "$c" >/dev/null 2>&1; then CHROME_FOUND=1; break; fi
done
if [ "$CHROME_FOUND" -eq 0 ]; then
  for p in "/c/Program Files/Google/Chrome/Application/chrome.exe" \
           "/c/Program Files (x86)/Google/Chrome/Application/chrome.exe" \
           "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"; do
    if [ -f "$p" ]; then CHROME_FOUND=1; break; fi
  done
fi
if [ "$CHROME_FOUND" -eq 0 ]; then
  echo "No Chrome or Chromium found. Lighthouse needs one. Install Chrome, or set CHROME_PATH." >&2
  echo "Continuing anyway in case chrome-launcher can find it." >&2
fi

mkdir -p "$OUT_DIR"

slug() {
  echo "$1" | sed -e 's|^https\?://||' -e 's|[^A-Za-z0-9]|-|g' -e 's|--*|-|g' -e 's|^-||' -e 's|-$||' | cut -c1-60
}

FAILED=0
for url in "${URLS[@]}"; do
  for ff in $FORM_FACTORS; do
    name="$(slug "$url")-$ff"
    out="$OUT_DIR/$name.json"
    if [ "$ff" = "desktop" ]; then
      PRESET=(--preset=desktop)
    else
      PRESET=(--form-factor=mobile --screenEmulation.mobile)
    fi
    echo "Running Lighthouse: $ff $url"
    npx --yes lighthouse@latest "$url" \
      --only-categories=performance \
      "${PRESET[@]}" \
      --throttling-method=simulate \
      --output=json \
      --output-path="$out" \
      --chrome-flags="--headless=new --no-sandbox" \
      --quiet >/dev/null 2>&1
    if [ -s "$out" ]; then
      echo "  wrote $out"
    else
      echo "  FAILED, no JSON written for $ff $url" >&2
      FAILED=$((FAILED + 1))
    fi
  done
done

echo ""
echo "Done. JSON in $OUT_DIR"
echo "Build the report with:"
echo "  node cwv-audit.mjs $(for f in "$OUT_DIR"/*.json; do printf -- '--from-json %s ' "$f"; done)--out <report path>"

if [ "$FAILED" -gt 0 ]; then exit 2; fi
