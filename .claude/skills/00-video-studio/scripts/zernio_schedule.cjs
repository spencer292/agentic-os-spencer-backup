#!/usr/bin/env node
/* Staggered scheduler for the studio lane — flips EACH draft to its OWN time.
 * Companion to zernio_publish.cjs (which uses one time for all). Same PUT mechanics:
 * PUT /posts/{id} with scheduledFor + isDraft:false → status `scheduled`.
 * Reads ZERNIO_API_KEY from .env internally; never prints it.
 *
 * Usage:
 *   node zernio_schedule.cjs --schedule path/to/schedule.json [--status draft] [--dry-run]
 *
 * schedule.json maps platform → ISO8601 time, e.g. {"linkedin":"2026-06-16T14:43:00Z", ...}
 * Underscore keys (e.g. "_tz") are ignored. Only drafts whose platform is in the map are touched.
 */
const fs = require("fs");
const path = require("path");
const BASE = "https://getlate.dev/api/v1";

function arg(n, d) { const i = process.argv.indexOf(`--${n}`); return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : d; }
const flag = (n) => process.argv.includes(`--${n}`);
function loadKey() {
  if (process.env.ZERNIO_API_KEY) return process.env.ZERNIO_API_KEY.trim();
  const p = path.resolve(__dirname, "..", "..", "..", "..", ".env");
  if (fs.existsSync(p)) for (const l of fs.readFileSync(p, "utf8").split(/\r?\n/)) {
    const m = l.match(/^\s*ZERNIO_API_KEY\s*=\s*(.*)\s*$/); if (m) return m[1].replace(/^["']|["']$/g, "").trim();
  }
  return "";
}
async function api(key, method, ep, body) {
  const res = await fetch(`${BASE}${ep}`, { method, headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
  const t = await res.text(); let j; try { j = JSON.parse(t); } catch { j = t; }
  return { ok: res.ok, status: res.status, body: j, raw: t };
}
const unwrap = (b) => (b && (b.post || b.data)) || b;

(async () => {
  const key = loadKey();
  if (!key) { console.error("ZERNIO_API_KEY not found"); process.exit(2); }
  const sched = JSON.parse(fs.readFileSync(arg("schedule"), "utf8"));
  const map = {}; for (const [k, v] of Object.entries(sched)) if (!k.startsWith("_")) map[k] = v;
  const status = arg("status", "draft");
  const dry = flag("dry-run");

  const list = await api(key, "GET", `/posts?status=${status}&limit=100`);
  if (!list.ok) { console.error("list failed", list.status, list.raw.slice(0, 160)); process.exit(1); }
  const posts = Array.isArray(list.body) ? list.body : (list.body.posts || list.body.data || []);

  console.log(`${dry ? "[DRY RUN] " : ""}Scheduling ${status} drafts by platform:\n`);
  let n = 0;
  for (const p of posts) {
    const plat = (p.platforms || [])[0] ? p.platforms[0].platform : null;
    if (!plat || !map[plat]) continue;
    const id = p._id || p.id;
    if (dry) { console.log(`• ${plat.padEnd(10)} ${id} → ${map[plat]}`); n++; continue; }
    const g = await api(key, "GET", `/posts/${id}`);
    const post = unwrap(g.body);
    const plats = (post.platforms || []).map(x => {
      const e = { platform: x.platform, accountId: x.accountId && (x.accountId._id || x.accountId) };
      if (x.platformSpecificData && Object.keys(x.platformSpecificData).length) e.platformSpecificData = x.platformSpecificData;
      return e;
    });
    const r = await api(key, "PUT", `/posts/${id}`, { platforms: plats, scheduledFor: map[plat], isDraft: false });
    console.log(`${r.ok ? "✓" : "✗"} ${plat.padEnd(10)} ${id} → ${r.status} | ${unwrap(r.body) && unwrap(r.body).status} @ ${map[plat]}`);
    if (!r.ok) console.log("   ", r.raw.slice(0, 200));
    n++;
  }
  console.log(`\n${dry ? "[DRY RUN] " : ""}${n} post(s) ${dry ? "would be" : ""} scheduled.`);
})();
