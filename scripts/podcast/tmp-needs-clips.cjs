/** Temp: list episodes needing clips. */
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

(async () => {
  const res = await fetch(`https://api.notion.com/v1/data_sources/${DS}/query`, {
    method: 'POST',
    headers: H,
    body: JSON.stringify({
      filter: {
        and: [
          { or: [
            { property: 'Episode Status', select: { equals: 'Content Review' } },
            { property: 'Episode Status', select: { equals: 'Ready to Publish' } },
            { property: 'Episode Status', select: { equals: 'Published' } },
          ] },
          { property: 'Clips Uploaded', checkbox: { equals: false } },
          { property: 'Audio File ID', rich_text: { is_not_empty: true } },
        ],
      },
      page_size: 100,
    }),
  });
  const j = await res.json();
  if (!j.results) { console.log(JSON.stringify(j, null, 2)); return; }
  const txt = (x) => (x && x.rich_text ? x.rich_text.map((t) => t.plain_text).join('') : '');
  const rows = j.results.map((p) => {
    const pr = p.properties;
    const titleProp = Object.values(pr).find((v) => v.type === 'title');
    return {
      id: p.id,
      num: pr['Episode Number']?.number,
      title: titleProp ? titleProp.title.map((t) => t.plain_text).join('') : '',
      guest: txt(pr['Guest Name']) || pr['Guest Name']?.select?.name || '',
      status: pr['Episode Status']?.select?.name || pr['Episode Status']?.status?.name,
      audioId: txt(pr['Audio File ID']),
      videoId: txt(pr['Video File ID']),
      condensedId: txt(pr['Condensed Video File ID']),
      recordingDate: pr['Recording Date']?.date?.start || null,
      releaseDate: pr['Release Date']?.date?.start || null,
    };
  });
  rows.sort((a, b) => (a.num || 0) - (b.num || 0));
  console.log(JSON.stringify(rows, null, 2));
})();
