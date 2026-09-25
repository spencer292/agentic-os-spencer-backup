/**
 * clip-lane-find — Meeting Clips Lane, step 1.
 * List meetings cleared for clipping but not yet rendered:
 *   Clip for Social == true  AND  Clips Rendered == false
 * Prints one JSON object per matching row: {uuid, title, date, pageId, url}.
 * Never echoes the Notion token.
 * Run: node scripts/meetings/clip-lane-find.cjs
 */
const fs = require("fs");
const path = require("node:path");
const ROOT = path.resolve(__dirname, "..", "..");
const env = { ...process.env };
try {
  for (const l of fs.readFileSync(path.join(ROOT, ".env"), "utf8").split(/\r?\n/)) {
    const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
} catch {}
const NOTION = env.NOTION_API_TOKEN || env.NOTION_TOKEN;
const DS = "be8400c3-cbbe-43f8-bfd9-32f18730b153";
const NH = { Authorization: `Bearer ${NOTION}`, "Notion-Version": "2025-09-03", "Content-Type": "application/json" };
const txt = (p) => (p && p.rich_text ? p.rich_text.map((t) => t.plain_text).join("") : "");
const die = (m) => { console.error("FAILED:", m); process.exit(1); };

(async () => {
  if (!NOTION) die("NOTION_API_TOKEN missing in .env");
  const filter = { and: [
    { property: "Clip for Social", checkbox: { equals: true } },
    { property: "Clips Rendered", checkbox: { equals: false } },
  ] };
  const r = await fetch(`https://api.notion.com/v1/data_sources/${DS}/query`, { method: "POST", headers: NH, body: JSON.stringify({ filter, page_size: 50 }) });
  const j = await r.json();
  if (!r.ok) die(`Notion query ${r.status}: ${JSON.stringify(j).slice(0, 200)}`);
  const rows = (j.results || []).map((p) => {
    const P = p.properties;
    const uuid = txt(P["Source"]).trim();
    const title = ((P["Name"] && P["Name"].title) || []).map((t) => t.plain_text).join("");
    const date = (P["Date"] && P["Date"].date && P["Date"].date.start) ? P["Date"].date.start.slice(0, 10) : "";
    return { uuid, title, date, pageId: p.id, url: p.url };
  }).filter((x) => x.uuid);
  console.log(JSON.stringify({ count: rows.length, rows }, null, 2));
})().catch((e) => die(e.stack || e.message));
