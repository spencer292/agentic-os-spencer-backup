#!/usr/bin/env node
/* Studio lane → Zernio (getlate.dev) draft publisher. Companion to zernio_post.cjs.
 *
 * Flips EXISTING drafts live, in place — no re-create, no re-upload, no duplicates.
 * The getlate API only honours `publishNow` on CREATE, and exposes no publish
 * endpoint; the working trick is PUT /posts/{id} with `scheduledFor` + `isDraft:false`,
 * which moves a draft → `scheduled`, and Zernio's scheduler fires it at that time.
 * "Publish now" therefore means "schedule a few minutes out" (default +5).
 *
 * Reads ZERNIO_API_KEY from the project .env internally; never prints it.
 *
 * Usage:
 *   node zernio_publish.cjs --match "almost got scammed"
 *   node zernio_publish.cjs --ids 6a2e..,6a2f.. --in 3
 *   node zernio_publish.cjs --match "scam" --book https://allthepower.co.uk/book
 *   node zernio_publish.cjs --match "scam" --when 2026-06-15T09:00:00Z --dry-run
 *
 * Options:
 *   --match "<text>"        only drafts whose content contains this (case-insensitive)
 *   --ids id1,id2,...       explicit post IDs (overrides --match)
 *   --in <minutes>          fire N minutes from now (default 5; min 2 to satisfy the API)
 *   --when <ISO8601>        explicit fire time (overrides --in)
 *   --first-comment "<txt>" attach as firstComment on comment-platforms
 *   --book <url>            shorthand for --first-comment "📘 If this resonated, I wrote a book on this: <url>"
 *   --comment-platforms a,b platforms that receive the first comment
 *                           (default: linkedin,instagram,facebook,youtube — reliable via API)
 *   --status <s>            which pool to pull from (default draft)
 *   --dry-run               show what would change; make no writes
 */
const fs = require("fs");
const path = require("path");
const BASE = "https://getlate.dev/api/v1";

function arg(name, def) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith("--")
    ? process.argv[i + 1] : def;
}
const flag = (name) => process.argv.includes(`--${name}`);

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
async function api(key, method, ep, body) {
  const res = await fetch(`${BASE}${ep}`, {
    method,
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const t = await res.text();
  let j; try { j = JSON.parse(t); } catch { j = t; }
  return { ok: res.ok, status: res.status, body: j, raw: t };
}
const unwrap = (b) => (b && (b.post || b.data)) || b;

(async () => {
  const key = loadKey();
  if (!key) { console.error("ZERNIO_API_KEY not found in env or .env"); process.exit(2); }

  const status = arg("status", "draft");
  const match = arg("match");
  const idsArg = arg("ids");
  const book = arg("book");
  const firstComment = book
    ? `📘 If this resonated, I wrote a book on this: ${book}`
    : arg("first-comment");
  const commentPlatforms = new Set(
    (arg("comment-platforms", "linkedin,instagram,facebook,youtube")).split(",").map(s => s.trim())
  );
  const minutes = Math.max(2, parseInt(arg("in", "5"), 10) || 5);
  const when = arg("when") || new Date(Date.now() + minutes * 60 * 1000).toISOString();
  const dry = flag("dry-run");

  // Resolve target posts
  let targets = [];
  if (idsArg) {
    targets = idsArg.split(",").map(s => s.trim()).filter(Boolean).map(id => ({ _id: id }));
  } else {
    const list = await api(key, "GET", `/posts?status=${status}&limit=100`);
    if (!list.ok) { console.error("list failed:", list.status, list.raw.slice(0, 160)); process.exit(1); }
    let posts = Array.isArray(list.body) ? list.body : (list.body.posts || list.body.data || []);
    if (match) posts = posts.filter(p => (p.content || "").toLowerCase().includes(match.toLowerCase()));
    targets = posts;
  }
  if (!targets.length) { console.log(`No ${status} posts match.`); return; }

  console.log(`${dry ? "[DRY RUN] " : ""}Flipping ${targets.length} ${status}(s) → scheduled for ${when}`);
  if (firstComment) console.log(`First comment on ${[...commentPlatforms].join(",")}: "${firstComment}"`);
  console.log("");

  const done = [];
  for (const t of targets) {
    const id = t._id || t.id;
    const g = await api(key, "GET", `/posts/${id}`);
    if (!g.ok) { console.log(`✗ ${id}: GET ${g.status}`); continue; }
    const post = unwrap(g.body);
    const platform = (post.platforms || [])[0] ? post.platforms[0].platform : "?";
    const plats = (post.platforms || []).map(p => {
      const e = { platform: p.platform, accountId: p.accountId && (p.accountId._id || p.accountId) };
      const psd = { ...(p.platformSpecificData || {}) };
      if (firstComment && commentPlatforms.has(p.platform)) {
        // YouTube often already carries an engagement first comment — append, don't clobber.
        if (p.platform === "youtube" && psd.firstComment && !psd.firstComment.includes(firstComment)) {
          psd.firstComment = `${psd.firstComment}\n\n${firstComment}`;
        } else {
          psd.firstComment = firstComment;
        }
      }
      if (Object.keys(psd).length) e.platformSpecificData = psd;
      return e;
    });
    const gotComment = plats.some(p => p.platformSpecificData && p.platformSpecificData.firstComment && firstComment && commentPlatforms.has(p.platform));
    if (dry) {
      console.log(`• ${platform.padEnd(9)} ${id}${gotComment ? " | +first comment" : ""}`);
      continue;
    }
    const r = await api(key, "PUT", `/posts/${id}`, { platforms: plats, scheduledFor: when, isDraft: false });
    const rp = unwrap(r.body);
    console.log(`${r.ok ? "✓" : "✗"} ${platform.padEnd(9)} ${id} → ${r.status} | ${rp && rp.status}${gotComment ? " | +book/first comment" : ""}`);
    if (!r.ok) console.log("   ", r.raw.slice(0, 200));
    else done.push({ platform, id });
  }
  if (!dry) console.log(`\nDone: ${done.length}/${targets.length} scheduled for ${when}.`);
})();
