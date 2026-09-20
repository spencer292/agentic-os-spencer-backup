/**
 * Temp diagnostic: confirm the clip-filter fields read correctly (property types + row states).
 * Never prints the token.
 */
const fs = require('fs');
const ENVPATH = 'C:/Claude/agent-os-v3/agentic-os/.env';
const env = {};
for (const line of fs.readFileSync(ENVPATH, 'utf8').split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)\s*=\s*(.*)$/);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}
const TOKEN = env.NOTION_API_TOKEN || env.NOTION_TOKEN;
const DS = 'a145776d-cf65-4adc-b7ff-72bc971185b9';
const H = { Authorization: `Bearer ${TOKEN}`, 'Notion-Version': '2025-09-03', 'Content-Type': 'application/json' };
const txt = p => (p?.rich_text || p?.title || []).map(t => t.plain_text).join('');

(async () => {
  let out = [], cursor;
  do {
    const body = { page_size: 100 };
    if (cursor) body.start_cursor = cursor;
    const r = await fetch(`https://api.notion.com/v1/data_sources/${DS}/query`, {
      method: 'POST', headers: H, body: JSON.stringify(body),
    });
    const j = await r.json();
    if (!r.ok) { console.error('QUERY FAILED', r.status); process.exit(1); }
    out = out.concat(j.results || []);
    cursor = j.has_more ? j.next_cursor : null;
  } while (cursor);

  const st = out[0].properties['Episode Status'];
  console.log('Episode Status prop type:', st && st.type);
  console.log('Clips Uploaded prop type:', out[0].properties['Clips Uploaded']?.type);
  console.log('total rows:', out.length);

  const rows = out.map(p => ({
    ep: p.properties['Episode Number']?.number ?? null,
    s: p.properties['Episode Status']?.select?.name || p.properties['Episode Status']?.status?.name || '',
    clips: p.properties['Clips Uploaded']?.checkbox,
    audio: txt(p.properties['Audio File ID']) ? 'Y' : '-',
  })).sort((a, b) => (b.ep || 0) - (a.ep || 0));
  rows.slice(0, 25).forEach(r => console.log(r.ep, '|', r.s, '| clips=' + r.clips, '| audio=' + r.audio));
})();
