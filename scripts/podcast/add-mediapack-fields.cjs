/**
 * One-off: add the Guest Media Pack fields to the Podcast Episodes data source.
 *   - "Media Pack: Ready to Send" (checkbox) — Roy's manual send gate
 *   - "Media Pack Folder URL" (url)         — written by the consolidation step
 * Idempotent: re-running just re-asserts the same properties.
 * Run: node scripts/podcast/add-mediapack-fields.cjs
 */
const fs = require('fs');
const env = {};
for (const l of fs.readFileSync('C:/Claude/agent-os-v3/agentic-os/.env', 'utf8').split(/\r?\n/)) {
  const m = l.match(/^([A-Z0-9_]+)\s*=\s*(.*)$/); if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}
const TOKEN = env.NOTION_API_TOKEN || env.NOTION_TOKEN;
const DS = 'a145776d-cf65-4adc-b7ff-72bc971185b9';
const H = { Authorization: `Bearer ${TOKEN}`, 'Notion-Version': '2025-09-03', 'Content-Type': 'application/json' };

(async () => {
  const body = { properties: {
    'Media Pack: Ready to Send': { checkbox: {} },
    'Media Pack Folder URL': { url: {} },
  } };
  const r = await fetch(`https://api.notion.com/v1/data_sources/${DS}`, { method: 'PATCH', headers: H, body: JSON.stringify(body) });
  const j = await r.json();
  if (!r.ok) { console.log('FAILED', r.status, JSON.stringify(j).slice(0, 400)); return; }
  const props = Object.keys(j.properties || {});
  console.log('OK. Fields now present:',
    ['Media Pack: Ready to Send', 'Media Pack Folder URL'].map(n => `${n}=${props.includes(n) ? '✓' : '✗'}`).join('  '));
})();
