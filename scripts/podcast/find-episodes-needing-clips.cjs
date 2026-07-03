/**
 * Find podcast episodes that need short-form clips.
 * Filter: Episode Status in [Content Review, Ready to Publish, Published]
 *   AND Clips Uploaded == false AND Audio File ID not empty.
 * Read-only. Prints one JSON line per matching episode.
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
const WANT_STATUS = new Set(['Content Review', 'Ready to Publish', 'Published']);
const txt = p => (p?.rich_text || p?.title || []).map(t => t.plain_text).join('');

async function queryAll() {
  let out = [], cursor;
  do {
    const body = { page_size: 100 };
    if (cursor) body.start_cursor = cursor;
    const r = await fetch(`https://api.notion.com/v1/data_sources/${DS}/query`, {
      method: 'POST', headers: H, body: JSON.stringify(body),
    });
    const j = await r.json();
    if (!r.ok) { console.error('QUERY FAILED', r.status, JSON.stringify(j).slice(0, 300)); process.exit(1); }
    out = out.concat(j.results || []);
    cursor = j.has_more ? j.next_cursor : null;
  } while (cursor);
  return out;
}

(async () => {
  const rows = await queryAll();
  const matches = [];
  for (const p of rows) {
    const status = p.properties['Episode Status']?.select?.name || '';
    const clipsUploaded = p.properties['Clips Uploaded']?.checkbox === true;
    const audioId = txt(p.properties['Audio File ID']);
    if (!WANT_STATUS.has(status)) continue;
    if (clipsUploaded) continue;
    if (!audioId) continue;
    matches.push({
      pageId: p.id,
      epNum: p.properties['Episode Number']?.number ?? null,
      first: txt(p.properties['Guest First Name']),
      last: txt(p.properties['Guest Last Name']),
      status,
      audioId,
      releaseDate: p.properties['Release Date']?.date?.start || null,
    });
  }
  matches.sort((a, b) => (a.epNum || 0) - (b.epNum || 0));
  console.log(JSON.stringify(matches, null, 2));
  console.error(`\n${matches.length} episode(s) need clips.`);
})();
