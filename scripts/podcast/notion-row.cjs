/**
 * Print key asset fields for one episode (by Episode Number). Read-only.
 * Run: node scripts/podcast/notion-row.cjs <episodeNumber>
 */
const fs = require('fs');
const env = {};
for (const l of fs.readFileSync('C:/Claude/agent-os-v3/agentic-os/.env', 'utf8').split(/\r?\n/)) {
  const m = l.match(/^([A-Z0-9_]+)\s*=\s*(.*)$/); if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}
const TOKEN = env.NOTION_API_TOKEN || env.NOTION_TOKEN;
const DS = 'a145776d-cf65-4adc-b7ff-72bc971185b9';
const H = { Authorization: `Bearer ${TOKEN}`, 'Notion-Version': '2025-09-03', 'Content-Type': 'application/json' };
const ep = String(process.argv[2] || '61');
const txt = p => (p?.rich_text || p?.title || []).map(t => t.plain_text).join('');
(async () => {
  let rows = [], cursor;
  do { const r = await fetch(`https://api.notion.com/v1/data_sources/${DS}/query`, { method: 'POST', headers: H, body: JSON.stringify(cursor ? { page_size: 100, start_cursor: cursor } : { page_size: 100 }) }); const j = await r.json(); rows = rows.concat(j.results || []); cursor = j.has_more ? j.next_cursor : null; } while (cursor);
  const row = rows.find(p => String(p.properties['Episode Number']?.number) === ep);
  if (!row) { console.log('no row for ep', ep); return; }
  const p = row.properties;
  const files = (p['Guest Photo']?.files || []).map(f => f.name + ' -> ' + (f.file?.url || f.external?.url || '').slice(0, 80));
  console.log('Ep', ep, txt(p['Guest First Name']), txt(p['Guest Last Name']));
  console.log('Episode Title :', (p['Episode Title']?.title || []).map(t=>t.plain_text).join(''));
  console.log('Guest Photo URL:', p['Guest Photo URL']?.url || '(empty)');
  console.log('Guest Photo files:', files.length ? '\n  ' + files.join('\n  ') : '(none)');
  console.log('Thumbnail File ID:', txt(p['Thumbnail File ID']) || '(empty)');
  console.log('Guest Website :', p['Guest Website']?.url || '(empty)');
})().catch(e => console.log('Error:', e.message));
