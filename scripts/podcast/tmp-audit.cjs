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
  let cursor, all = [];
  do {
    const r = await fetch(`https://api.notion.com/v1/data_sources/${DS}/query`, {
      method: 'POST', headers: H,
      body: JSON.stringify({ page_size: 100, start_cursor: cursor }),
    });
    const j = await r.json();
    if (!j.results) { console.log(JSON.stringify(j)); return; }
    all = all.concat(j.results); cursor = j.next_cursor;
  } while (cursor);
  const txt = (x) => (x && x.rich_text ? x.rich_text.map((t) => t.plain_text).join('') : '');
  const rows = all.map((p) => {
    const pr = p.properties;
    return {
      num: pr['Episode Number']?.number,
      guest: txt(pr['Guest Name']) || pr['Guest Name']?.select?.name || '',
      status: pr['Episode Status']?.select?.name || pr['Episode Status']?.status?.name || '',
      clipsUploaded: pr['Clips Uploaded']?.checkbox,
      audioId: txt(pr['Audio File ID']) ? 'Y' : '',
      videoId: txt(pr['Video File ID']) ? 'Y' : '',
    };
  }).sort((a,b)=>(b.num||0)-(a.num||0));
  console.log('total', rows.length);
  console.log(rows.map(r=>`${r.num}\t${r.guest}\t[${r.status}]\tclips=${r.clipsUploaded}\taud=${r.audioId}\tvid=${r.videoId}`).join('\n'));
})();
