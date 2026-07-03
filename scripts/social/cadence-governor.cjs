/**
 * Cadence Governor (B2) — the content-feed engine.
 *
 * Drains the approved-eligible clip backlog onto social at a controlled, RAMPING rate as the audience
 * grows — never flooding. It is the throttle on the approval gate: the rate it ticks `Human Approved`
 * IS the feed rate. Reads scripts/social/cadence.config.json for the dials; tracks daily state so caps
 * and stagger hold across runs. Built to run on a frequent cron inside the posting window.
 *
 *   node scripts/social/cadence-governor.cjs                 # DRY: show the plan, write nothing
 *   node scripts/social/cadence-governor.cjs --live           # approve up to the run's allowance
 *   node scripts/social/cadence-governor.cjs --source daily    # override sources_live (testing)
 *
 * Policy applied, in order: source scope -> eligibility (gate) -> priority sort -> posting window ->
 * stagger gap -> per-source daily quota (with ramp) -> per-platform daily cap -> max per run.
 */
const fs = require('fs');
const path = require('path');
const gate = require('./autopilot-gate.cjs');
const ledger = require('./ledger-lib.cjs');
const promoteLib = require('./promote-lib.cjs');

// Format dimension for the bandit ledger (channel and format are separate axes).
function deriveFormat(source, duration) {
  if (source === 'Daily Video') return 'talking-head';
  if (/Podcast/.test(source)) return (duration != null && duration < 35) ? 'micro-clip' : 'arc-clip';
  return 'clip';
}

const CFG_PATH = 'C:/Claude/agent-os-v3/agentic-os/scripts/social/cadence.config.json';
const STATE_PATH = 'C:/Claude/agent-os-v3/agentic-os/.command-centre/cadence-state.json';
const cfg = JSON.parse(fs.readFileSync(CFG_PATH, 'utf8'));

// Bandit policy from the playbook (exploit arm). Gracefully null if not generated yet.
const PLAYBOOK_PATH = 'C:/Claude/agent-os-v3/agentic-os/projects/briefs/content-flywheel/content-playbook.md';
function loadPolicy() {
  try { const md = fs.readFileSync(PLAYBOOK_PATH, 'utf8'); const m = md.match(/```json\s*([\s\S]*?)```/); return m ? JSON.parse(m[1]) : null; }
  catch { return null; }
}
const policy = loadPolicy();

const LIVE = process.argv.includes('--live');
const srcOverride = (() => { const i = process.argv.indexOf('--source'); return i > -1 ? (process.argv[i + 1] || '').split(',').filter(Boolean) : null; })();
const sourcesLive = srcOverride || cfg.sources_live;

const now = new Date();
const localDay = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
const sourceClass = s => (s === 'Daily Video' ? 'daily' : /Podcast/.test(s) ? 'podcast' : 'other');

function loadState() {
  let s = {};
  try { s = JSON.parse(fs.readFileSync(STATE_PATH, 'utf8')); } catch {}
  if (s.date !== localDay) s = { date: localDay, approvedBySource: {}, postsByPlatform: {}, lastApprovalAt: null, approvedIds: [] };
  s.approvedBySource = s.approvedBySource || {}; s.postsByPlatform = s.postsByPlatform || {}; s.approvedIds = s.approvedIds || [];
  return s;
}
function saveState(s) {
  try { fs.mkdirSync(path.dirname(STATE_PATH), { recursive: true }); } catch {}
  fs.writeFileSync(STATE_PATH, JSON.stringify(s, null, 2));
}

function effectiveQuota(source) {
  const base = (cfg.daily_clip_quota || {})[source] || 0;
  const r = cfg.ramp || {};
  if (!r.weekly_increment) return Math.min(base, r.max_daily_clip_quota ?? base);
  const start = new Date((r.start_date || localDay) + 'T00:00:00');
  const weeks = Math.max(0, Math.floor((now - start) / (7 * 86400000)));
  return Math.min(base + weeks * r.weekly_increment, r.max_daily_clip_quota ?? Infinity);
}

function prioritySort(a, b) {
  if (cfg.priority === 'playbook' && policy) {
    // exploit: bias toward format x topic the ledger shows winning; ties fall back to score, then oldest.
    const pw = e => (policy.format_weight?.[deriveFormat(e.source, e.duration)] ?? 1) * (policy.topic_weight?.[e.pillar] ?? 1);
    const d = pw(b) - pw(a); if (d) return d;
    return (b.score - a.score) || a.created.localeCompare(b.created);
  }
  if (cfg.priority === 'oldest') return a.created.localeCompare(b.created);
  if (cfg.priority === 'newest') return b.created.localeCompare(a.created);
  return (b.score - a.score) || a.created.localeCompare(b.created); // score_then_oldest
}

(async () => {
  console.log(`Cadence Governor — ${LIVE ? 'LIVE' : 'DRY RUN'}  ${now.toISOString().slice(0, 16)}  sources=[${sourcesLive.join(',')}]`);
  const state = loadState();

  // window + stagger gates
  const hr = now.getHours();
  const ignoreWindow = process.argv.includes('--ignore-window'); // supervised manual test only
  const inWindow = ignoreWindow || (hr >= (cfg.posting_window?.start_hour ?? 0) && hr < (cfg.posting_window?.end_hour ?? 24));
  const minsSinceLast = state.lastApprovalAt ? (now - new Date(state.lastApprovalAt)) / 60000 : Infinity;
  const staggerOk = minsSinceLast >= (cfg.min_minutes_between_posts || 0);

  for (const s of sourcesLive) console.log(`  quota ${s}: ${state.approvedBySource[s] || 0}/${effectiveQuota(s)} used today`);
  if (cfg.priority === 'playbook') console.log(`  policy: ${policy ? `loaded (${policy.confidence}) — channel rank ${policy.channel_rank.slice(0, 3).join('>')}` : 'none yet → score fallback'}`);
  console.log(`  window ${cfg.posting_window?.start_hour}-${cfg.posting_window?.end_hour}h: ${inWindow ? 'OPEN' : 'CLOSED'} (now ${hr}h) | stagger: ${staggerOk ? 'ok' : `wait ${Math.ceil((cfg.min_minutes_between_posts||0)-minsSinceLast)}m`} | last: ${state.lastApprovalAt || 'none today'}`);

  // eligible queue
  const sourceSet = sourcesLive.includes('all') ? null : sourcesLive.flatMap(s => gate.SOURCE_SETS[s] || []);
  const rows = await gate.queryReviewed();
  const eligible = rows.map(r => gate.evaluate(r, sourceSet)).filter(e => e.qualifies && sourceClass(e.source) !== 'other').sort(prioritySort);
  console.log(`\n  eligible queue: ${eligible.length}`);
  for (const e of eligible.slice(0, 8)) console.log(`    [${e.score}/6] ${e.created.slice(0,10)} ${e.title.slice(0, 42).padEnd(42)} ${e.eligible.join(',')}`);
  if (eligible.length > 8) console.log(`    …+${eligible.length - 8} more`);

  // selection
  const plan = [];
  if (inWindow && staggerOk) {
    for (const e of eligible) {
      if (plan.length >= (cfg.max_per_run || 1)) break;
      const src = sourceClass(e.source);
      if ((state.approvedBySource[src] || 0) + plan.filter(p => p.src === src).length >= effectiveQuota(src)) continue;
      const platforms = e.eligible.filter(p => (state.postsByPlatform[p] || 0) + plan.flatMap(x => x.platforms).filter(x => x === p).length < (cfg.per_platform_daily_cap?.[p] ?? Infinity));
      if (!platforms.length) continue;
      plan.push({ id: e.id, title: e.title, src, platforms, score: e.score, source: e.source, pillar: e.pillar, duration: e.duration });
    }
  }

  console.log(`\n  ${LIVE ? 'RELEASING' : 'WOULD RELEASE'} this run: ${plan.length}`);
  for (const p of plan) {
    console.log(`    → [${p.score}/6] ${p.title.slice(0, 46)}  ⇒ ${p.platforms.join(', ')}  (+${p.platforms.length} ledger rows)`);
    if (LIVE) {
      await gate.approve(p.id, p.platforms);
      state.approvedBySource[p.src] = (state.approvedBySource[p.src] || 0) + 1;
      for (const pl of p.platforms) state.postsByPlatform[pl] = (state.postsByPlatform[pl] || 0) + 1;
      state.lastApprovalAt = now.toISOString();
      state.approvedIds.push(p.id);
      const n = ledger.append(ledger.buildRows({
        videoLibId: p.id, title: p.title, date: localDay,
        format: deriveFormat(p.source, p.duration), hook: '', topic: p.pillar, pillar: p.pillar, source: 'autopilot',
      }, p.platforms));
      console.log(`       ✅ approved + 📒 ledger +${n} candidate rows`);
    }
  }
  if (!plan.length) console.log(`    (nothing this run${!inWindow ? ' — window closed' : !staggerOk ? ' — stagger wait' : eligible.length ? ' — daily quota reached' : ' — queue empty'})`);
  if (LIVE) saveState(state);

  // Promote phase (full autopilot): clear the per-platform "Ready for Review" gate for already-routed
  // autopilot clips so the schedulers publish. Runs every cycle, decoupled from the async Caption Router.
  const promoted = await promoteLib.promote({ live: LIVE });
  console.log(`\n  ${LIVE ? 'PROMOTED' : 'WOULD PROMOTE'} per-platform rows: ${promoted.length}`);
  for (const x of promoted) console.log(`    ✔ ${x.channel.padEnd(16)} ${x.title.slice(0, 40)}`);

  if (!LIVE) console.log('\n  (dry run — no approvals, state untouched)');
})().catch(e => { console.error('FATAL', e.message); process.exit(1); });
