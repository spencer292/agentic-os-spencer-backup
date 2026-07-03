/** Show the key fields of a Meetings row by Source UUID. Read-only.
 *  Run: node scripts/meetings/notion-show.cjs "<zoom-uuid>"
 */
const fs = require('fs');
const path = require('path');
const ROOT = 'C:/Claude/agent-os-v3/agentic-os';
const env = {};
for (const l of fs.readFileSync(path.join(ROOT, '.env'), 'utf8').split(/\r?\n/)) {
  const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}
const H = { Authorization: `Bearer ${env.NOTION_API_TOKEN || env.NOTION_TOKEN}`, 'Notion-Version': '2025-09-03', 'Content-Type': 'application/json' };
const DS = 'be8400c3-cbbe-43f8-bfd9-32f18730b153';
const txt = (p) => (p && p.rich_text ? p.rich_text.map(t => t.plain_text).join('') : '');
const sel = (p) => (p && p.select ? p.select.name : '');
const ms = (p) => (p && p.multi_select ? p.multi_select.map(o => o.name).join(', ') : '');

(async () => {
  const uuid = process.argv[2];
  if (!uuid) {
    const r = await fetch(`https://api.notion.com/v1/data_sources/${DS}/query`, { method: 'POST', headers: H, body: JSON.stringify({ page_size: 25, sorts: [{ timestamp: 'created_time', direction: 'descending' }] }) });
    const j = await r.json();
    if (!r.ok) throw new Error(`${r.status}: ${JSON.stringify(j).slice(0, 200)}`);
    console.log(`${(j.results || []).length} row(s) in the Meetings library:`);
    for (const p of j.results || []) {
      const P = p.properties;
      const title = (P['Name'].title || []).map(t => t.plain_text).join('');
      console.log('  [' + (sel(P['Meeting Type']) || '?').padEnd(9) + '] ' + title + '  — ' + txt(P['Lead']).slice(0, 45));
    }
    return;
  }
  const r = await fetch(`https://api.notion.com/v1/data_sources/${DS}/query`, { method: 'POST', headers: H, body: JSON.stringify({ filter: { property: 'Source', rich_text: { contains: uuid } } }) });
  const j = await r.json();
  if (!r.ok) throw new Error(`${r.status}: ${JSON.stringify(j).slice(0, 200)}`);
  const p = (j.results || [])[0];
  if (!p) { console.log('No row found for', uuid); return; }
  const P = p.properties;
  console.log('URL         :', p.url);
  console.log('Meeting Type:', sel(P['Meeting Type']));
  console.log('Lead        :', txt(P['Lead']));
  console.log('Topics      :', ms(P['Topics']));
  console.log('One-line    :', txt(P['One-line']));
  console.log('\nSUMMARY:\n' + txt(P['Summary']).slice(0, 700));
  console.log('\nMARKETING SNIPPETS:\n' + txt(P['Marketing Snippets']).slice(0, 1200));
  console.log('\nLESSONS:\n' + txt(P['Lessons']).slice(0, 1000));
  console.log('\nACTIONS (Roy):\n' + txt(P['Action Items (Roy)']).slice(0, 700));
  console.log('\nACTIONS (Others):\n' + txt(P['Action Items (Others)']).slice(0, 700));
})().catch(e => { console.error('FAILED:', e.message); process.exit(1); });
