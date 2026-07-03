#!/usr/bin/env node
/* Studio lane → Zernio (getlate.dev) poster. Phase 6 of 00-video-studio.
 *
 * Uploads ONE video to Zernio storage, then creates one post PER platform from
 * a posts.json map (each platform gets its own content + platformSpecificData).
 * Reads ZERNIO_API_KEY from the project .env internally; never prints it.
 *
 * Usage:
 *   node zernio_post.cjs --media final.mp4 --posts posts.json --mode draft
 *   node zernio_post.cjs --media final.mp4 --posts posts.json --mode schedule --when 2026-06-15T09:00:00Z
 *   node zernio_post.cjs --media final.mp4 --posts posts.json --mode now
 *
 * Skips ad accounts (googleads, metaads, tiktokads) — organic only.
 */
const fs = require("fs");
const path = require("path");
const https = require("https");

const BASE = "https://getlate.dev/api/v1";
const SKIP = new Set(["googleads", "metaads", "tiktokads"]);

function arg(name, def) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : def;
}

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
  const text = await res.text();
  let json; try { json = JSON.parse(text); } catch { json = text; }
  if (!res.ok) throw new Error(`${method} ${ep} -> ${res.status}: ${text.slice(0, 300)}`);
  return json;
}

function putOnce(uploadUrl, buf) {
  return new Promise((resolve, reject) => {
    const u = new URL(uploadUrl);
    const req = https.request(
      { hostname: u.hostname, path: u.pathname + u.search, method: "PUT",
        headers: { "Content-Type": "video/mp4", "Content-Length": buf.length } },
      (res) => { res.on("data", () => {}); res.on("end", () => resolve(res.statusCode)); }
    );
    req.on("error", reject);
    req.write(buf);
    req.end();
  });
}

async function uploadMedia(key, file, attempts = 6) {
  const filename = path.basename(file);
  const buf = fs.readFileSync(file);
  // Corporate TLS-inspection proxies intermittently corrupt large uploads
  // ("bad record mac" / socket reset). Retry with a fresh presign each time.
  let lastErr;
  for (let i = 1; i <= attempts; i++) {
    try {
      const pre = await api(key, "POST", "/media/presign", { filename, contentType: "video/mp4" });
      const uploadUrl = pre.uploadUrl || pre.url;
      const publicUrl = pre.publicUrl || pre.fileUrl || pre.publicURL;
      if (!uploadUrl || !publicUrl) throw new Error(`presign missing urls: ${JSON.stringify(pre).slice(0,160)}`);
      const status = await putOnce(uploadUrl, buf);
      if (status < 200 || status >= 300) throw new Error(`PUT HTTP ${status}`);
      console.log(`  uploaded ${filename} (${(buf.length/1e6).toFixed(1)} MB) on attempt ${i}`);
      return publicUrl;
    } catch (e) {
      lastErr = e;
      console.log(`  upload attempt ${i}/${attempts} failed: ${e.code || e.message}`);
      await new Promise(r => setTimeout(r, 1500 * i));
    }
  }
  throw new Error(`media upload failed after ${attempts} attempts: ${lastErr && (lastErr.code || lastErr.message)}`);
}

(async () => {
  const key = loadKey();
  if (!key) { console.error("ZERNIO_API_KEY not found in env or .env"); process.exit(2); }
  const mediaPath = arg("media");
  const postsPath = arg("posts");
  const mode = arg("mode", "draft");
  const when = arg("when");
  if (!mediaPath || !postsPath) { console.error("need --media and --posts"); process.exit(2); }

  const posts = JSON.parse(fs.readFileSync(postsPath, "utf8"));

  // Discover accounts → platform:id (organic only).
  const acctRes = await api(key, "GET", "/accounts");
  const accounts = Array.isArray(acctRes) ? acctRes : (acctRes.accounts || acctRes.data || []);
  const idFor = {};
  for (const a of accounts) {
    const p = a.platform || a.provider;
    if (p && !SKIP.has(p)) idFor[p] = a._id || a.id || a.accountId;
  }

  const publicUrl = await uploadMedia(key, mediaPath);

  const results = [];
  for (const [platform, spec] of Object.entries(posts)) {
    if (platform.startsWith("_") || typeof spec !== "object" || !spec.content) continue;  // skip meta keys
    const accountId = idFor[platform];
    if (!accountId) { console.log(`  ! ${platform}: no connected account, skipped`); continue; }
    const platformEntry = { platform, accountId };
    if (spec.platformSpecificData) platformEntry.platformSpecificData = spec.platformSpecificData;
    const payload = {
      content: spec.content,
      mediaItems: [{ url: publicUrl, type: "video" }],
      platforms: [platformEntry],
    };
    if (mode === "draft") payload.isDraft = true;
    else if (mode === "schedule") payload.scheduledFor = when;
    else if (mode === "now") payload.publishNow = true;

    try {
      const r = await api(key, "POST", "/posts", payload);
      const id = r._id || r.id || (r.post && r.post._id) || "?";
      results.push({ platform, ok: true, id });
      console.log(`  ✓ ${platform}: ${mode} created (post ${id})`);
    } catch (e) {
      results.push({ platform, ok: false, error: e.message });
      console.log(`  ✗ ${platform}: ${e.message}`);
    }
  }

  const ok = results.filter(r => r.ok).length;
  console.log(`\nDone: ${ok}/${results.length} ${mode}(s) created.`);
})();
