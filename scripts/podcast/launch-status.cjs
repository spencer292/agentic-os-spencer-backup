/**
 * Launch dashboard for podcast episodes — prints the P06/P08 gate fields.
 * Read-only. Usage: node scripts/podcast/launch-status.cjs [ep ep ...]   (default: backlog)
 */
const fs = require('fs');
const env = {};
for (const l of fs.readFileSync('C:/Claude/agent-os-v3/agentic-os/.env', 'utf8').split(/\r?\n/)) {
  const m = l.match(/^([A-Z0-9_]+)\s*=\s*(.*)$/); if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}
const T = env.NOTION_API_TOKEN || env.NOTION_TOKEN;
const DS = 'a145776d-cf65-4adc-b7ff-72bc971185b9';
const H = { Authorization: `Bearer ${T}`, 'Notion-Version': '2025-09-03', 'Content-Type': 'application/json' };
const eps = process.argv.slice(2).length ? process.argv.slice(2) : ['61', '72', '78', '80', '81', '82', '83'];
const txt = p => (p?.rich_text || p?.title || []).map(t => t.plain_text).join('');
const Y = v => v ? 'Y' : '·';

(async () => {
  let rows = [], c;
  do { const r = await fetch(`https://api.notion.com/v1/data_sources/${DS}/query`, { method: 'POST', headers: H, body: JSON.stringify(c ? { page_size: 100, start_cursor: c } : { page_size: 100 }) }); const j = await r.json(); rows = rows.concat(j.results || []); c = j.has_more ? j.next_cursor : null; } while (c);
  console.log('ep   guest            vid thumb | YTcondStatus      zernioPostID fullYT | rdySend notif');
  for (const ep of eps) {
    const row = rows.find(p => String(p.properties['Episode Number']?.number) === ep); if (!row) { console.log(ep, 'no row'); continue; }
    const p = row.properties;
    console.log(
      ep.padEnd(5) + (txt(p['Guest First Name']) + ' ' + txt(p['Guest Last Name'])).padEnd(17) +
      Y(txt(p['Condensed Video File ID'])).padEnd(4) + Y(p['Thumbnail Chosen']?.checkbox).padEnd(6) + '| ' +
      (p['YT Condensed Status']?.select?.name || '—').padEnd(18) +
      Y(txt(p['Zernio YT Post ID'])).padEnd(13) + Y(p['Full Episode YouTube']?.url).padEnd(7) + '| ' +
      Y(p['Media Pack: Ready to Send']?.checkbox).padEnd(8) + Y(p['Guest Notification Sent']?.checkbox));
  }
})().catch(e => console.log('ERR', e.message));
