/** List Meetings rows ready to clip: Clip for Social == true AND Clips Rendered == false.
 *  Read-only. Never prints the Notion token. Run: node scripts/meetings/_clip-queue.cjs
 */
const fs = require('fs');
const path = require('node:path');
const ROOT = path.resolve(__dirname, '..', '..');
const env = { ...process.env };
try {
  for (const l of fs.readFileSync(path.join(ROOT, '.env'), 'utf8').split(/\r?\n/)) {
    const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
} catch {}
const NOTION = env.NOTION_API_TOKEN || env.NOTION_TOKEN;
const DS = 'be8400c3-cbbe-43f8-bfd9-32f18730b153';
const H = { Authorization: `Bearer ${NOTION}`, 'Notion-Version': '2025-09-03', 'Content-Type': 'application/json' };
const txt = (p) => (p && p.rich_text ? p.rich_text.map(t => t.plain_text).join('') : '');
const sel = (p) => (p && p.select ? p.select.name : '');
const chk = (p) => !!(p && p.checkbox);

(async () => {
  if (!NOTION) { console.error('FAILED: no NOTION_API_TOKEN in .env'); process.exit(1); }
  const body = {
    filter: { and: [
      { property: 'Clip for Social', checkbox: { equals: true } },
      { property: 'Clips Rendered', checkbox: { equals: false } },
    ] },
    page_size: 50,
  };
  const r = await fetch(`https://api.notion.com/v1/data_sources/${DS}/query`, { method: 'POST', headers: H, body: JSON.stringify(body) });
  const j = await r.json();
  if (!r.ok) { console.error('FAILED:', r.status, JSON.stringify(j).slice(0, 300)); process.exit(1); }
  const rows = j.results || [];
  const out = rows.map(p => {
    const P = p.properties;
    return {
      page_id: p.id,
      title: (P['Name'] && P['Name'].title || []).map(t => t.plain_text).join(''),
      source_uuid: txt(P['Source']),
      meeting_type: sel(P['Meeting Type']),
      clip_for_social: chk(P['Clip for Social']),
      clips_rendered: chk(P['Clips Rendered']),
    };
  });
  console.log(JSON.stringify({ count: out.length, rows: out }, null, 2));
})().catch(e => { console.error('FAILED:', e.message); process.exit(1); });
