/**
 * Measure cron (flywheel stages 4–5) — fast-cadence measure → learn.
 *
 * Each run: (1) reconcile — capture the Zernio Post ID from each autopilot clip's per-platform pipeline
 * row into its ledger row (exact match via Source Atom = video_lib_id); (2) pull Zernio analytics and,
 * for every ledger row with a Zernio id, append a timestamped snapshot + fill metrics{t1h,t24h,peak}
 * by post age; (3) verdict — at ~24h, score vs a channel benchmark → win/loss/neutral.
 *
 * Designed to run hourly (the 1h/24h/day-3 checkpoints fill by age). Writes only the LOCAL ledger —
 * no publishing. --dry previews without writing.
 *
 *   node scripts/social/measure.cjs            # live (updates ledger)
 *   node scripts/social/measure.cjs --dry       # preview
 */
const fs = require('fs');
const ledger = require('./ledger-lib.cjs');
const promoteLib = require('./promote-lib.cjs'); // PIPELINE_DS
const env = {};
for (const l of fs.readFileSync('C:/Claude/agent-os-v3/agentic-os/.env', 'utf8').split(/\r?\n/)) {
  const m = l.match(/^([A-Z0-9_]+)\s*=\s*(.*)$/); if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}
const NOTION = env.NOTION_API_TOKEN || env.NOTION_TOKEN;
const ZKEY = env.ZERNIO_API_KEY || env.ZERNIO_BEARER || env.LATE_API_KEY;
const NH = { Authorization: `Bearer ${NOTION}`, 'Notion-Version': '2025-09-03', 'Content-Type': 'application/json' };
const DRY = process.argv.includes('--dry');
const tp = p => (p?.title || p?.rich_text || []).map(x => x.plain_text).join('');

// Channel benchmarks: primary-metric "win" floor at ~24h. Tune from the weekly review.
const BENCHMARK = { TikTok: 400, Facebook: 120, Instagram: 40, YouTube: 25, X: 40, LinkedIn: 30, Threads: 10 };
const primaryOf = m => (m.views || 0) || (m.impressions || 0);

async function reconcileIds() {
  const atoms = promoteLib.autopilotAtoms();
  let captured = 0;
  for (const [channel, dsId] of Object.entries(promoteLib.PIPELINE_DS)) {
    const cc = ledger.canonicalChannel(channel);
    const q = await (await fetch(`https://api.notion.com/v1/data_sources/${dsId}/query`, { method: 'POST', headers: NH,
      body: JSON.stringify({ page_size: 100 }) })).json();
    for (const r of (q.results || [])) {
      const atom = tp(r.properties['Source Atom']);
      const zid = tp(r.properties['Zernio Post ID']);
      if (!zid || !atoms.has(atom)) continue;
      const row = ledger.readAll().find(x => x.post_id === `${atom}:${cc}`);
      if (row && !row.zernio_post_id) { if (!DRY) ledger.upsert(`${atom}:${cc}`, { zernio_post_id: zid }); captured++; }
    }
  }
  return captured;
}

async function pullAnalytics() {
  const byId = {};
  let page = 1, pages = 1;
  while (page <= pages && page <= 30) {
    const res = await fetch(`https://getlate.dev/api/v1/analytics?limit=50&page=${page}`, { headers: { Authorization: `Bearer ${ZKEY}` } });
    const a = await res.json();
    if (!res.ok) throw new Error(`analytics ${res.status}: ${JSON.stringify(a).slice(0, 140)}`);
    pages = a.pagination?.totalPages || a.pagination?.pages || 1;
    for (const r of (a.posts || [])) byId[r.latePostId || r._id] = { m: r.analytics || {}, publishedAt: r.publishedAt || r.scheduledFor };
    page++;
  }
  return byId;
}

(async () => {
  console.log(`Measure cron — ${DRY ? 'DRY' : 'LIVE'}  ${new Date().toISOString().slice(0, 16)}`);
  const captured = await reconcileIds();
  console.log(`  reconciled Zernio ids: +${captured}`);

  const analytics = await pullAnalytics();
  console.log(`  Zernio analytics rows: ${Object.keys(analytics).length}`);

  const rows = ledger.readAll();
  const measurable = rows.filter(r => r.zernio_post_id && analytics[r.zernio_post_id]);
  console.log(`  ledger rows with live metrics: ${measurable.length}\n`);

  const nowISO = new Date().toISOString();
  for (const r of measurable) {
    const { m, publishedAt } = analytics[r.zernio_post_id];
    const ageH = publishedAt ? (Date.now() - new Date(publishedAt)) / 3600000 : null;
    const primary = primaryOf(m);
    const metrics = { ...r.metrics };
    metrics.peak = Math.max(metrics.peak || 0, primary);
    if (ageH != null && ageH >= 0.5 && ageH <= 3 && metrics.t1h == null) metrics.t1h = primary;
    if (ageH != null && ageH >= 18 && metrics.t24h == null) metrics.t24h = primary;
    const snap = { ts: nowISO, age_h: ageH != null ? +ageH.toFixed(1) : null, views: m.views || 0, impressions: m.impressions || 0, likes: m.likes || 0, shares: m.shares || 0, saves: m.saves || 0, comments: m.comments || 0 };

    // verdict at ~24h+
    let verdict = r.verdict;
    if (ageH != null && ageH >= 18) {
      const bench = BENCHMARK[r.channel] ?? 50;
      const score = metrics.t24h ?? metrics.peak ?? primary;
      verdict = score >= bench ? 'win' : (score < bench / 3 ? 'loss' : 'neutral');
    }
    console.log(`  ${r.channel.padEnd(10)} ${String(r.title).slice(0, 28).padEnd(28)} age=${ageH != null ? ageH.toFixed(1) + 'h' : '?'} primary=${primary} → ${verdict}`);
    if (!DRY) ledger.upsert(r.post_id, { metrics, verdict, snapshots: [...(r.snapshots || []), snap] });
  }
  if (!measurable.length) console.log('  (no live-measurable autopilot posts yet — armed; will record once posts publish)');
  if (DRY) console.log('\n  (dry — ledger untouched)');
})().catch(e => { console.error('FATAL', e.message); process.exit(1); });
