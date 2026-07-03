#!/usr/bin/env node
/* Push Zernio analytics snapshots → the "Post Analytics" Notion DB.
 *
 * Reads a snapshot JSON array (from zernio_analytics.cjs --json) and creates one
 * Notion page per record (append-only time-series: one row per post per capture).
 * Reads NOTION_API_TOKEN from the project .env internally; never prints it.
 *
 * Usage:
 *   node zernio_analytics.cjs --ids ... --json snap.json
 *   node zernio_analytics_to_notion.cjs --in snap.json
 *   node zernio_analytics_to_notion.cjs --in snap.json --db <database_id> --dry-run
 */
const fs = require("fs");
const path = require("path");
const NOTION = "https://api.notion.com/v1";
const NOTION_VERSION = "2022-06-28";
const DEFAULT_DB = "f025e2e2-64a3-4b9d-bf66-239e8b32d180"; // Post Analytics

function arg(name, def) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith("--")
    ? process.argv[i + 1] : def;
}
const flag = (n) => process.argv.includes(`--${n}`);

function envVar(name) {
  if (process.env[name]) return process.env[name].trim();
  const envPath = path.resolve(__dirname, "..", "..", "..", "..", ".env");
  if (fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
      const m = line.match(new RegExp(`^\\s*${name}\\s*=\\s*(.*)\\s*$`));
      if (m) return m[1].replace(/^["']|["']$/g, "").trim();
    }
  }
  return "";
}
const num = (v) => ({ number: Number.isFinite(v) ? v : 0 });
const txt = (v) => ({ rich_text: v ? [{ text: { content: String(v).slice(0, 1900) } }] : [] });
const dateProp = (v) => (v ? { date: { start: v } } : { date: null });

async function createPage(token, db, rec) {
  const dayPub = (rec.publishedAt || "").slice(0, 10);
  const dayCap = (rec.capturedAt || "").slice(0, 10);
  const title = `${rec.platform} · ${dayPub} · @${dayCap}`;
  const properties = {
    "Snapshot": { title: [{ text: { content: title } }] },
    "Post ID": txt(rec.postId),
    "Platform": rec.platform ? { select: { name: rec.platform } } : { select: null },
    "Published At": dateProp(rec.publishedAt),
    "Captured At": dateProp(rec.capturedAt),
    "Impressions": num(rec.impressions), "Reach": num(rec.reach), "Views": num(rec.views),
    "Likes": num(rec.likes), "Comments": num(rec.comments), "Shares": num(rec.shares),
    "Saves": num(rec.saves), "Clicks": num(rec.clicks), "Engagement %": num(rec.engagementRate),
    "Post URL": rec.postUrl ? { url: rec.postUrl } : { url: null },
    "Content": txt(rec.content),
  };
  const res = await fetch(`${NOTION}/pages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Notion-Version": NOTION_VERSION,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ parent: { database_id: db }, properties }),
  });
  const t = await res.text();
  if (!res.ok) throw new Error(`${res.status}: ${t.slice(0, 220)}`);
  return JSON.parse(t).id;
}

(async () => {
  const token = envVar("NOTION_API_TOKEN") || envVar("NOTION_API_KEY");
  if (!token) { console.error("NOTION_API_TOKEN not found in env or .env"); process.exit(2); }
  const db = arg("db", DEFAULT_DB);
  const inPath = arg("in");
  if (!inPath) { console.error("need --in <snapshot.json>"); process.exit(2); }
  const recs = JSON.parse(fs.readFileSync(inPath, "utf8"));
  if (!Array.isArray(recs) || !recs.length) { console.log("no records to push"); return; }

  if (flag("dry-run")) {
    console.log(`[DRY RUN] would create ${recs.length} rows in db ${db}`);
    for (const r of recs) console.log(`  ${r.platform} | ${r.postId} | impr ${r.impressions} | eng ${r.engagementRate}%`);
    return;
  }
  let ok = 0;
  for (const r of recs) {
    try { await createPage(token, db, r); ok++; console.log(`✓ ${r.platform} ${r.postId}`); }
    catch (e) { console.log(`✗ ${r.platform} ${r.postId}: ${e.message}`); }
  }
  console.log(`\nDone: ${ok}/${recs.length} snapshot rows written to Post Analytics.`);
})();
