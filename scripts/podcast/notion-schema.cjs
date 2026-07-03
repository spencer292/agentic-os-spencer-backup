/**
 * Dump the Podcast Episodes data source schema (property name + type).
 * Read-only. Run: node scripts/podcast/notion-schema.cjs [filterSubstring]
 */
const fs = require('fs');
const env = {};
for (const l of fs.readFileSync('C:/Claude/agent-os-v3/agentic-os/.env', 'utf8').split(/\r?\n/)) {
  const m = l.match(/^([A-Z0-9_]+)\s*=\s*(.*)$/); if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}
const TOKEN = env.NOTION_API_TOKEN || env.NOTION_TOKEN;
const DS = 'a145776d-cf65-4adc-b7ff-72bc971185b9';
const filter = (process.argv[2] || '').toLowerCase();
(async () => {
  const r = await fetch(`https://api.notion.com/v1/data_sources/${DS}`, {
    headers: { Authorization: `Bearer ${TOKEN}`, 'Notion-Version': '2025-09-03' },
  });
  const j = await r.json();
  if (!r.ok) { console.log('FAILED', r.status, JSON.stringify(j).slice(0, 300)); return; }
  const rows = Object.entries(j.properties)
    .map(([name, def]) => ({ name, type: def.type, opts: def.select?.options?.map(o => o.name).join(', ') || def.status?.options?.map(o => o.name).join(', ') || '' }))
    .filter(p => !filter || p.name.toLowerCase().includes(filter) || p.type.toLowerCase().includes(filter))
    .sort((a, b) => a.name.localeCompare(b.name));
  console.log(`${rows.length} properties:\n`);
  for (const p of rows) console.log(`${p.type.padEnd(15)} ${p.name}${p.opts ? '  ['+p.opts+']' : ''}`);
})();
