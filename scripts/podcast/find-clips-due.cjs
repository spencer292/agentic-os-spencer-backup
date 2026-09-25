/**
 * List episodes that need short-form clips: Episode Status in
 * [Content Review, Ready to Publish, Published], Clips Uploaded = false,
 * Audio File ID non-empty. Prints one JSON line per episode.
 *
 * Run: node scripts/podcast/find-clips-due.cjs
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
const WANT = ['Content Review', 'Ready to Publish', 'Published'];

const txt = p => (p?.rich_text || p?.title || []).map(t => t.plain_text).join('');

(async () => {
  const body = {
    filter: {
      and: [
        { property: 'Clips Uploaded', checkbox: { equals: false } },
        { property: 'Audio File ID', rich_text: { is_not_empty: true } },
        { or: WANT.map(s => ({ property: 'Episode Status', select: { equals: s } })) },
      ],
    },
    page_size: 100,
  };
  const r = await fetch(`https://api.notion.com/v1/data_sources/${DS}/query`, { method: 'POST', headers: H, body: JSON.stringify(body) });
  const j = await r.json();
  if (!j.results) { console.error('Query failed:', j.code, j.message); process.exit(1); }
  for (const p of j.results) {
    const pr = p.properties;
    const titleProp = Object.values(pr).find(v => v.type === 'title');
    console.log(JSON.stringify({
      id: p.id,
      num: pr['Episode Number']?.number,
      status: pr['Episode Status']?.select?.name,
      title: txt(titleProp),
      guest: txt(pr['Guest Name']),
      audioFileId: txt(pr['Audio File ID']),
      condensedVideoFileId: txt(pr['Condensed Video File ID']),
    }));
  }
  console.log(`# ${j.results.length} episode(s) need clips`);
})();
