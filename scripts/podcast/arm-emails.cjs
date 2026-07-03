/**
 * Arm the P08 guest media-pack email by ticking `Media Pack: Ready to Send`.
 * Safe to run before launch: P08 still won't send until `Full Episode YouTube`
 * is present (written by the writeback when the video goes live). Skips audio-only
 * eps and ones already notified. Usage: node scripts/podcast/arm-emails.cjs <ep> [ep ...]
 */
const fs = require('fs');
const env = {};
for (const l of fs.readFileSync('C:/Claude/agent-os-v3/agentic-os/.env', 'utf8').split(/\r?\n/)) {
  const m = l.match(/^([A-Z0-9_]+)\s*=\s*(.*)$/); if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}
const T = env.NOTION_API_TOKEN || env.NOTION_TOKEN;
const DS = 'a145776d-cf65-4adc-b7ff-72bc971185b9';
const H = { Authorization: `Bearer ${T}`, 'Notion-Version': '2025-09-03', 'Content-Type': 'application/json' };
const eps = process.argv.slice(2);
const txt = p => (p?.rich_text || p?.title || []).map(t => t.plain_text).join('');
if (!eps.length) { console.log('usage: arm-emails.cjs <ep> [ep ...]'); process.exit(1); }

(async () => {
  let rows = [], c;
  do { const r = await fetch(`https://api.notion.com/v1/data_sources/${DS}/query`, { method: 'POST', headers: H, body: JSON.stringify(c ? { page_size: 100, start_cursor: c } : { page_size: 100 }) }); const j = await r.json(); rows = rows.concat(j.results || []); c = j.has_more ? j.next_cursor : null; } while (c);
  for (const ep of eps) {
    const row = rows.find(p => String(p.properties['Episode Number']?.number) === ep);
    if (!row) { console.log(ep, 'no row'); continue; }
    const p = row.properties;
    if (!txt(p['Condensed Video File ID'])) { console.log(ep, 'SKIP — audio-only (no video/email)'); continue; }
    if (p['Guest Notification Sent']?.checkbox) { console.log(ep, 'SKIP — already notified'); continue; }
    if (!p['Guest Email']?.email) { console.log(ep, 'SKIP — no Guest Email'); continue; }
    const r = await fetch(`https://api.notion.com/v1/pages/${row.id}`, {
      method: 'PATCH', headers: H,
      body: JSON.stringify({ properties: { 'Media Pack: Ready to Send': { checkbox: true } } }),
    });
    console.log(ep, r.ok ? 'ARMED — Media Pack: Ready to Send = true' : 'FAILED ' + r.status + ' ' + JSON.stringify(await r.json()).slice(0, 200));
  }
})().catch(e => console.log('ERR', e.message));
