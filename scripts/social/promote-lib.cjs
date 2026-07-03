/**
 * Per-platform promote (full-autopilot completion).
 *
 * The score-gate approves at the Video Library level, which routes a clip into each spillover
 * platform's Content Pipeline DB as "Ready for Review". This step clears that SECOND gate — sets
 * `Approved=true` so the per-platform scheduler publishes to Zernio. SCOPED to autopilot clips only
 * (Source Atom must be a video_lib_id present in the ledger), so the brand/evergreen review queue is
 * never auto-approved. Idempotent: only touches unapproved, pre-publish autopilot rows.
 */
const fs = require('fs');
const ledger = require('./ledger-lib.cjs');
const env = {};
for (const l of fs.readFileSync('C:/Claude/agent-os-v3/agentic-os/.env', 'utf8').split(/\r?\n/)) {
  const m = l.match(/^([A-Z0-9_]+)\s*=\s*(.*)$/); if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}
const NH = { Authorization: `Bearer ${env.NOTION_API_TOKEN || env.NOTION_TOKEN}`, 'Notion-Version': '2025-09-03', 'Content-Type': 'application/json' };

// Spillover channel -> Content Pipeline data source. LinkedIn + YouTube-long deliberately absent.
const PIPELINE_DS = {
  'TikTok': '7bfb3c27-d9c2-4c93-af1c-868b1c16b05a',
  'X/Twitter': 'e5bec208-6645-4e56-a421-ece62f27ad64',
  'Instagram Reels': 'd0ecaf3d-6562-4d37-a084-582cdb232db1',
  'Facebook Reels': '491e1280-e81e-460b-9390-d8068bab429b',
  'YouTube Shorts': '95811130-505d-4cbe-ad09-46bde78f25df',
};
const PROMOTABLE = new Set(['Draft', 'Ready for Review']); // never resurrect Cancelled/terminal
const tp = p => (p?.title || p?.rich_text || []).map(x => x.plain_text).join('');

// Autopilot clips registry = video_lib_ids the governor released (from the ledger).
function autopilotAtoms() {
  return new Set(ledger.readAll().filter(r => /^autopilot/.test(r.source || '')).map(r => r.video_lib_id).filter(Boolean));
}

async function queryUnapproved(dsId) {
  let rows = [], cursor;
  do {
    const body = { filter: { property: 'Approved', checkbox: { equals: false } }, page_size: 100 };
    if (cursor) body.start_cursor = cursor;
    const r = await fetch(`https://api.notion.com/v1/data_sources/${dsId}/query`, { method: 'POST', headers: NH, body: JSON.stringify(body) });
    const j = await r.json();
    if (!r.ok) throw new Error(`query ${r.status}: ${JSON.stringify(j).slice(0, 160)}`);
    rows = rows.concat(j.results || []); cursor = j.has_more ? j.next_cursor : null;
  } while (cursor);
  return rows;
}

async function setApproved(pageId) {
  const r = await fetch(`https://api.notion.com/v1/pages/${pageId}`, { method: 'PATCH', headers: NH,
    body: JSON.stringify({ properties: { 'Approved': { checkbox: true }, 'Status': { select: { name: 'Approved' } } } }) });
  if (!r.ok) throw new Error(`approve ${r.status}: ${(await r.text()).slice(0, 160)}`);
}

// Returns the rows that qualify; approves them when live.
async function promote({ live = false } = {}) {
  const atoms = autopilotAtoms();
  const out = [];
  for (const [channel, dsId] of Object.entries(PIPELINE_DS)) {
    const rows = await queryUnapproved(dsId);
    for (const r of rows) {
      const atom = tp(r.properties['Source Atom']);
      const status = r.properties['Status']?.select?.name || '';
      if (!atoms.has(atom)) continue;            // scope: autopilot clips only
      if (!PROMOTABLE.has(status)) continue;      // pre-publish, non-cancelled only
      const title = tp(r.properties['Post Title'] || r.properties['Title'] || r.properties['Name'] || {});
      out.push({ channel, pageId: r.id, atom, title, status });
      if (live) await setApproved(r.id);
    }
  }
  return out;
}

module.exports = { promote, autopilotAtoms, PIPELINE_DS };

// ---- standalone CLI (DRY by default) ----
if (require.main === module) {
  const LIVE = process.argv.includes('--live');
  (async () => {
    console.log(`Per-platform promote — ${LIVE ? 'LIVE' : 'DRY RUN'} (autopilot-scoped, spillover only)`);
    const atoms = autopilotAtoms();
    console.log(`autopilot clips in ledger: ${atoms.size}`);
    const res = await promote({ live: LIVE });
    if (!res.length) { console.log('nothing to promote (no autopilot rows at Ready-for-Review).'); return; }
    for (const x of res) console.log(`  ${LIVE ? '✅ approved' : 'would approve'}: ${x.channel.padEnd(16)} "${x.title.slice(0, 36)}" (${x.status})`);
    if (!LIVE) console.log('(dry run — nothing written)');
  })().catch(e => { console.error('FATAL', e.message); process.exit(1); });
}
