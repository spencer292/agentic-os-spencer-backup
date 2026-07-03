/**
 * Autopilot Gate (B1) — score-gated eligibility for spillover clips.
 *
 * Decides which Video Library clips the Gemini scorer already passed are eligible to publish to the
 * autopilot spillover set, and (when approved) ticks `Human Approved` + constrains `Target Platforms`
 * to spillover so the EXISTING Caption Router / Video Router publish them. LinkedIn + YouTube-long are
 * never auto-approved here — they stay in the human native lane (B4).
 *
 * Used two ways:
 *   - CLI (standalone, DRY by default):  node scripts/social/autopilot-gate.cjs [--live] [--source podcast|daily|all] [--max N]
 *   - require()'d by the cadence governor, which adds rate/ramp/stagger policy on top.
 *
 * Eligibility (the scorer's own rules):
 *   Status=Reviewed · Human Approved=false · ICP Score >= MIN_SCORE · Format Compliance=true
 *   per-platform: IG/TikTok/FB Reels also require Burn-in Captions=true (caption fail = auto-reject there)
 */
const fs = require('fs');
const env = {};
for (const l of fs.readFileSync('C:/Claude/agent-os-v3/agentic-os/.env', 'utf8').split(/\r?\n/)) {
  const m = l.match(/^([A-Z0-9_]+)\s*=\s*(.*)$/); if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}
const NOTION = env.NOTION_API_TOKEN || env.NOTION_TOKEN;
const DS = '33d3d42c-4a9c-8141-a744-000bed31cac8'; // Video Library data source
const H = { Authorization: `Bearer ${NOTION}`, 'Notion-Version': '2025-09-03', 'Content-Type': 'application/json' };

const MIN_SCORE = 4;
// Autopilot spillover platforms (exact Target-Platforms option strings the Caption Router routes on).
// LinkedIn, YouTube Long, YouTube (long-form) are deliberately EXCLUDED — human native lane.
const SPILLOVER = ['X/Twitter', 'Instagram Reels', 'TikTok', 'Facebook Reels', 'YouTube Shorts'];
const NEEDS_BURNIN = new Set(['Instagram Reels', 'TikTok', 'Facebook Reels']); // caption fail = auto-reject here
const SOURCE_SETS = { podcast: ['Podcast Clip', 'Podcast Episode'], daily: ['Daily Video'], all: null };

const txt = p => (p?.title || p?.rich_text || []).map(x => x.plain_text).join('');

async function queryReviewed() {
  let rows = [], cursor;
  do {
    const body = { filter: { and: [
      { property: 'Status', select: { equals: 'Reviewed' } },
      { property: 'Human Approved', checkbox: { equals: false } },
    ] }, page_size: 100 };
    if (cursor) body.start_cursor = cursor;
    const r = await fetch(`https://api.notion.com/v1/data_sources/${DS}/query`, { method: 'POST', headers: H, body: JSON.stringify(body) });
    const j = await r.json();
    if (!r.ok) throw new Error(`query ${r.status}: ${JSON.stringify(j).slice(0, 200)}`);
    rows = rows.concat(j.results || []); cursor = j.has_more ? j.next_cursor : null;
  } while (cursor);
  return rows;
}

// Pure evaluation. sourceSet = array of allowed Source Type names, or null for any.
function evaluate(row, sourceSet) {
  const P = row.properties;
  const score = P['ICP Score']?.number ?? 0;
  const formatOk = !!P['Format Compliance']?.checkbox;
  const burninOk = !!P['Burn-in Captions']?.checkbox;
  const targets = (P['Target Platforms']?.multi_select || []).map(o => o.name);
  const routed = (P['Routed To']?.multi_select || []).map(o => o.name);
  const title = txt(P['Title']) || '(untitled)';
  const source = P['Source Type']?.select?.name || '';
  const created = row.created_time || '';
  const pillar = P['Content Pillar']?.select?.name || '';
  const duration = P['Duration']?.number ?? null;

  const reasons = [];
  if (score < MIN_SCORE) reasons.push(`score ${score}<${MIN_SCORE}`);
  if (!formatOk) reasons.push('format-fail');

  const eligible = targets
    .filter(t => SPILLOVER.includes(t))
    .filter(t => !routed.includes(t))
    .filter(t => !NEEDS_BURNIN.has(t) || burninOk);

  const burninBlocked = targets.filter(t => SPILLOVER.includes(t) && NEEDS_BURNIN.has(t) && !burninOk);
  if (burninBlocked.length) reasons.push(`no-burnin→drop[${burninBlocked.join(',')}]`);
  if (sourceSet && !sourceSet.includes(source)) reasons.push(`source≠[${source || 'none'}]`);

  const qualifies = reasons.length === 0 && eligible.length > 0;
  if (!qualifies && eligible.length === 0 && !reasons.length) reasons.push('no-spillover-target');
  return { id: row.id, title, source, created, pillar, duration, score, formatOk, burninOk, targets, routed, eligible, qualifies, reasons };
}

// Apply approval: tick Human Approved + constrain Target Platforms to the given spillover subset.
async function approve(id, platforms) {
  const body = JSON.stringify({ properties: {
    'Human Approved': { checkbox: true },
    'Target Platforms': { multi_select: platforms.map(name => ({ name })) },
  } });
  const r = await fetch(`https://api.notion.com/v1/pages/${id}`, { method: 'PATCH', headers: H, body });
  if (!r.ok) throw new Error(`approve ${r.status}: ${(await r.text()).slice(0, 200)}`);
}

module.exports = { queryReviewed, evaluate, approve, SPILLOVER, NEEDS_BURNIN, SOURCE_SETS, MIN_SCORE, txt };

// ---- standalone CLI (raw gate, no cadence policy) ----
if (require.main === module) {
  const LIVE = process.argv.includes('--live');
  const MAX = (() => { const i = process.argv.indexOf('--max'); return i > -1 ? parseInt(process.argv[i + 1], 10) || 1 : 1; })();
  const SOURCE = (() => { const i = process.argv.indexOf('--source'); return i > -1 ? (process.argv[i + 1] || 'podcast') : 'podcast'; })();
  (async () => {
    console.log(`Autopilot Gate (raw) — ${LIVE ? 'LIVE' : 'DRY RUN'} (source=${SOURCE}, min score ${MIN_SCORE}, max ${MAX})`);
    const rows = await queryReviewed();
    const evald = rows.map(r => evaluate(r, SOURCE_SETS[SOURCE]));
    const pass = evald.filter(e => e.qualifies);
    console.log(`Reviewed+unapproved: ${rows.length} | qualify (source=${SOURCE}): ${pass.length}`);
    for (const e of pass.slice(0, MAX)) {
      console.log(`  ${LIVE ? 'APPROVE' : 'would'} [${e.score}/6] ${e.title.slice(0, 46)} → ${e.eligible.join(', ')}`);
      if (LIVE) { await approve(e.id, e.eligible); console.log('     ✅ approved'); }
    }
    if (!LIVE) console.log('(dry run — nothing written)');
  })().catch(e => { console.error('FATAL', e.message); process.exit(1); });
}
