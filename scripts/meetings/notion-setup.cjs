/**
 * Notion setup for zoom-meeting-intelligence.
 * Talks to Notion via the DIRECT REST API using NOTION_API_TOKEN from .env
 * (the path Roy set up — the claude.ai Notion MCP is unreliable, do not use it).
 *
 * Modes:
 *   (no args)              Probe: confirm the token works (who am I) and list the
 *                          pages/databases the integration can see, with ids.
 *   --create <pageId>      Create the "Meetings" database under that parent page,
 *                          print the new database id + data source id.
 *
 * Run: node scripts/meetings/notion-setup.cjs
 *      node scripts/meetings/notion-setup.cjs --create <parent_page_id>
 */
const fs = require('fs');

const ENVPATH = 'C:/Claude/agent-os-v3/agentic-os/.env';
const env = {};
for (const l of fs.readFileSync(ENVPATH, 'utf8').split(/\r?\n/)) {
  const m = l.match(/^([A-Z0-9_]+)\s*=\s*(.*)$/);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}
const NOTION = env.NOTION_API_TOKEN || env.NOTION_TOKEN;
if (!NOTION) throw new Error('NOTION_API_TOKEN not found in .env');
const H = { Authorization: `Bearer ${NOTION}`, 'Notion-Version': '2025-09-03', 'Content-Type': 'application/json' };

const MEETINGS_PROPS = {
  'Name': { title: {} },
  'Date': { date: {} },
  'Attendees': { rich_text: {} },
  'Summary': { rich_text: {} },
  'Decisions': { rich_text: {} },
  'Action Items (Roy)': { rich_text: {} },
  'Action Items (Others)': { rich_text: {} },
  'Open Questions': { rich_text: {} },
  'Source': { rich_text: {} },
  'Status': { select: { options: [
    { name: 'New', color: 'blue' },
    { name: 'Reviewed', color: 'green' },
    { name: 'Actioned', color: 'gray' },
  ] } },
};

const titleOf = (o) => {
  const t = o.title || o.properties?.title?.title || [];
  if (Array.isArray(t) && t.length) return t.map(x => x.plain_text || x.text?.content || '').join('');
  // page objects: find the title property
  for (const v of Object.values(o.properties || {})) {
    if (v?.type === 'title') return (v.title || []).map(x => x.plain_text || '').join('');
  }
  return '(untitled)';
};

async function whoAmI() {
  const r = await fetch('https://api.notion.com/v1/users/me', { headers: H });
  const j = await r.json();
  if (!r.ok) throw new Error(`users/me ${r.status}: ${JSON.stringify(j).slice(0, 300)}`);
  console.log(`Token OK → integration: ${j.name || j.bot?.owner?.type || j.id}\n`);
}

async function probe() {
  await whoAmI();
  const r = await fetch('https://api.notion.com/v1/search', {
    method: 'POST', headers: H,
    body: JSON.stringify({ query: '', page_size: 25, sort: { direction: 'descending', timestamp: 'last_edited_time' } }),
  });
  const j = await r.json();
  if (!r.ok) throw new Error(`search ${r.status}: ${JSON.stringify(j).slice(0, 300)}`);
  console.log(`Integration can see ${j.results.length} object(s) (top 25 by last-edited):`);
  for (const o of j.results) {
    console.log(`  ${o.object.padEnd(10)} ${o.id}  ${titleOf(o).slice(0, 50)}`);
  }
  console.log('\nNext: node scripts/meetings/notion-setup.cjs --create <page_id>');
}

async function create(parentId) {
  await whoAmI();
  // Notion 2025-09-03 expects initial_data_source.properties; older expects top-level properties.
  const modern = {
    parent: { type: 'page_id', page_id: parentId },
    title: [{ type: 'text', text: { content: 'Meetings' } }],
    initial_data_source: { properties: MEETINGS_PROPS },
  };
  const legacy = {
    parent: { type: 'page_id', page_id: parentId },
    title: [{ type: 'text', text: { content: 'Meetings' } }],
    properties: MEETINGS_PROPS,
  };
  for (const [label, body] of [['2025-09-03', modern], ['legacy', legacy]]) {
    const r = await fetch('https://api.notion.com/v1/databases', { method: 'POST', headers: H, body: JSON.stringify(body) });
    const j = await r.json();
    if (r.ok) {
      const ds = (j.data_sources && j.data_sources[0]) || null;
      console.log(`Created Meetings database (${label} shape):`);
      console.log(`  database_id   : ${j.id}`);
      if (ds) console.log(`  data_source_id: ${ds.id}`);
      console.log(`  url           : ${j.url || '(n/a)'}`);
      return;
    }
    console.log(`  ${label} shape failed ${r.status}: ${JSON.stringify(j).slice(0, 300)}`);
  }
  throw new Error('Both create shapes failed — see errors above.');
}

async function addFields() {
  const DS = 'be8400c3-cbbe-43f8-bfd9-32f18730b153';
  const properties = {
    'Meeting Type': { select: { options: [
      { name: 'Coaching', color: 'green' }, { name: 'Discovery', color: 'blue' },
      { name: 'Community', color: 'purple' }, { name: 'Partner', color: 'orange' },
      { name: 'Internal', color: 'gray' }, { name: 'Other', color: 'default' },
    ] } },
    'Lead': { rich_text: {} },
    'Topics': { multi_select: { options: [] } },
    'One-line': { rich_text: {} },
    'Marketing Snippets': { rich_text: {} },
    'Lessons': { rich_text: {} },
  };
  const r = await fetch(`https://api.notion.com/v1/data_sources/${DS}`, { method: 'PATCH', headers: H, body: JSON.stringify({ properties }) });
  const j = await r.json();
  if (!r.ok) throw new Error(`addFields ${r.status}: ${JSON.stringify(j).slice(0, 300)}`);
  console.log('Added fields:', Object.keys(properties).join(', '));
}

async function archive(pageId) {
  const r = await fetch(`https://api.notion.com/v1/pages/${pageId}`, { method: 'PATCH', headers: H, body: JSON.stringify({ archived: true }) });
  const j = await r.json();
  if (!r.ok) throw new Error(`archive ${r.status}: ${JSON.stringify(j).slice(0, 200)}`);
  console.log(`Archived page ${pageId}`);
}

(async () => {
  const ci = process.argv.indexOf('--create');
  const ai = process.argv.indexOf('--archive');
  if (process.argv.includes('--addfields')) {
    await addFields();
  } else if (ai !== -1) {
    if (!process.argv[ai + 1]) throw new Error('--archive needs a page id');
    await archive(process.argv[ai + 1]);
  } else if (ci !== -1) {
    const parent = process.argv[ci + 1];
    if (!parent) throw new Error('--create needs a parent page id');
    await create(parent);
  } else {
    await probe();
  }
})().catch(e => { console.error('\nFAILED:', e.message); process.exitCode = 1; });
