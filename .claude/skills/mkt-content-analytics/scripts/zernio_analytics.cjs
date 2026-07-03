#!/usr/bin/env node
/* Zernio (getlate.dev) analytics fetcher — REST, no MCP.
 *
 * Zernio aggregates per-platform metrics server-side; `GET /analytics` returns
 * one row per post (keyed by latePostId) with an `analytics{}` block, plus an
 * `overview` carrying `lastSync` + `dataStaleness`. There is NO per-post endpoint
 * (/posts/{id}/analytics → 404) — everything lives in the paginated feed.
 *
 * This tool: optionally triggers a sync when data is stale, pages the whole feed,
 * filters (since/platform/ids/match), and emits normalised snapshot records —
 * each stamped with capturedAt so repeated runs form a time-series ("motion").
 *
 * Reads ZERNIO_API_KEY from the project .env internally; never prints it.
 *
 * Usage:
 *   node zernio_analytics.cjs --since 30d                 # table for last 30 days
 *   node zernio_analytics.cjs --ids 6a2e..,6a2f.. --json out.json
 *   node zernio_analytics.cjs --match "scammed" --sync    # force-sync then read
 *   node zernio_analytics.cjs --platform linkedin --since 2026-06-01
 *
 * Options:
 *   --since 30d | YYYY-MM-DD   only posts published on/after this (default 30d)
 *   --ids id1,id2,...          only these latePostIds (overrides --since)
 *   --match "<text>"           only posts whose content contains this
 *   --platform <name>          filter to one platform
 *   --sync                     trigger ?sync=true and wait briefly before reading
 *   --json <path>              also write the snapshot array as JSON to <path>
 *   --capturedAt <ISO>         override the capture timestamp (cron passes one in;
 *                              Date.now() is fine standalone)
 */
const fs = require("fs");
const path = require("path");
const BASE = "https://getlate.dev/api/v1";

function arg(name, def) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith("--")
    ? process.argv[i + 1] : def;
}
const flag = (n) => process.argv.includes(`--${n}`);

function loadKey() {
  if (process.env.ZERNIO_API_KEY) return process.env.ZERNIO_API_KEY.trim();
  const envPath = path.resolve(__dirname, "..", "..", "..", "..", ".env");
  if (fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
      const m = line.match(/^\s*ZERNIO_API_KEY\s*=\s*(.*)\s*$/);
      if (m) return m[1].replace(/^["']|["']$/g, "").trim();
    }
  }
  return "";
}
async function api(key, ep) {
  const res = await fetch(`${BASE}${ep}`, { headers: { Authorization: `Bearer ${key}` } });
  const t = await res.text();
  let j; try { j = JSON.parse(t); } catch { j = t; }
  if (!res.ok) throw new Error(`${ep} -> ${res.status}: ${String(t).slice(0, 160)}`);
  return j;
}
function sinceToDate(s) {
  if (!s) return null;
  const m = /^(\d+)d$/.exec(s);
  if (m) return new Date(Date.now() - Number(m[1]) * 864e5);
  const d = new Date(s);
  return isNaN(d) ? null : d;
}

(async () => {
  const key = loadKey();
  if (!key) { console.error("ZERNIO_API_KEY not found in env or .env"); process.exit(2); }

  const ids = arg("ids") ? new Set(arg("ids").split(",").map(s => s.trim())) : null;
  const match = arg("match");
  const platform = arg("platform");
  const since = ids ? null : sinceToDate(arg("since", "30d"));
  const capturedAt = arg("capturedAt") || new Date().toISOString();

  // 1. Staleness / optional sync
  let ov = (await api(key, "/analytics?limit=1")).overview || {};
  if (flag("sync") || (ov.dataStaleness && ov.dataStaleness.staleAccountCount > 0)) {
    try { ov = (await api(key, "/analytics?sync=true&limit=1")).overview || ov; } catch {}
  }

  // 2. Page the whole feed
  const rows = [];
  let page = 1, pages = 1;
  while (page <= pages && page <= 30) {
    const a = await api(key, `/analytics?limit=50&page=${page}`);
    const pg = a.pagination || {};
    pages = pg.totalPages || pg.pages || 1;
    for (const r of (a.posts || [])) rows.push(r);
    page++;
  }

  // 3. Filter + normalise
  const snap = [];
  for (const r of rows) {
    const id = r.latePostId || r._id;
    const plat = r.platform || (r.platforms && r.platforms[0]);
    const pub = r.publishedAt || r.scheduledFor;
    if (ids && !ids.has(id)) continue;
    if (platform && plat !== platform) continue;
    if (match && !String(r.content || "").toLowerCase().includes(match.toLowerCase())) continue;
    if (since && pub && new Date(pub) < since) continue;
    const m = r.analytics || {};
    snap.push({
      capturedAt,
      postId: id,
      platform: plat || "?",
      publishedAt: pub || null,
      postUrl: r.platformPostUrl || null,
      content: String(r.content || "").replace(/\s+/g, " ").slice(0, 120),
      impressions: m.impressions ?? 0, reach: m.reach ?? 0, views: m.views ?? 0,
      likes: m.likes ?? 0, comments: m.comments ?? 0, shares: m.shares ?? 0,
      saves: m.saves ?? 0, clicks: m.clicks ?? 0,
      engagementRate: m.engagementRate ?? 0,
      metricsUpdated: m.lastUpdated || null,
    });
  }

  // 4. Output
  if (arg("json")) fs.writeFileSync(arg("json"), JSON.stringify(snap, null, 2));
  console.error(`lastSync=${ov.lastSync} stale=${JSON.stringify(ov.dataStaleness || {})} captured=${capturedAt} rows=${snap.length}`);
  const pad = (v, n) => String(v).padStart(n);
  console.error("platform   pub-date    impr  reach  views  likes  cmnt  shr  eng%");
  for (const s of snap.sort((a, b) => (b.publishedAt || "").localeCompare(a.publishedAt || "")).slice(0, 60)) {
    console.error(`${s.platform.padEnd(10)} ${String(s.publishedAt||"").slice(0,10)}  ${pad(s.impressions,4)}  ${pad(s.reach,5)}  ${pad(s.views,5)}  ${pad(s.likes,5)}  ${pad(s.comments,4)}  ${pad(s.shares,3)}  ${s.engagementRate}`);
  }
  // machine-readable to stdout for piping
  process.stdout.write(JSON.stringify(snap));
})();
