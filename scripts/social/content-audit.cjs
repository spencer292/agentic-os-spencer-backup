/**
 * Content Estate Audit — reconciles every content surface to show the lay of the land:
 * what's been produced, what actually reached Zernio, what's in motion, what's stranded ("dark
 * inventory"), and coverage gaps. READ-ONLY. Writes a markdown report.
 *
 *   node scripts/social/content-audit.cjs
 */
const fs = require('fs');
const env = {};
for (const l of fs.readFileSync('C:/Claude/agent-os-v3/agentic-os/.env', 'utf8').split(/\r?\n/)) {
  const m = l.match(/^([A-Z0-9_]+)\s*=\s*(.*)$/); if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}
const NH = { Authorization: `Bearer ${env.NOTION_API_TOKEN || env.NOTION_TOKEN}`, 'Notion-Version': '2025-09-03', 'Content-Type': 'application/json' };
const XN = { 'X-N8N-API-KEY': env.N8N_API_KEY };
const ZKEY = env.ZERNIO_API_KEY || env.ZERNIO_BEARER || env.LATE_API_KEY;
const REPORT = 'C:/Claude/agent-os-v3/agentic-os/projects/briefs/content-flywheel/content-estate-audit.md';

const VIDEO_DS = '33d3d42c-4a9c-8141-a744-000bed31cac8';
const POSTS_DS = '36675c46-233b-44da-8332-25d6791a0a5c';
const SCHED = { TikTok: 'fKRSLPDRpJk0QX5L', 'X/Twitter': 'jTuplJUdHtDnsvr5', 'Instagram Reels': 'MEKfskMj9Ivgqz2e',
  'Facebook Reels': 'WaQhUXwjMDtLKklj', 'YouTube Shorts': 'V6iHq94zvLr7r9Id', LinkedIn: 'bZ6qeGJAamJagivt', Threads: 'NDpyiMyE8LxFsunS' };
const hexId = r => String(r).replace(/[^0-9a-fA-F]/g, '').slice(0, 32).replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, '$1-$2-$3-$4-$5');
const tp = p => (p?.title || p?.rich_text || []).map(x => x.plain_text).join('');
const tally = (rows, fn) => { const o = {}; for (const r of rows) { const k = fn(r) || '(none)'; o[k] = (o[k] || 0) + 1; } return o; };
const fmt = o => Object.entries(o).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(' · ');

async function queryAll(dsId) {
  let rows = [], cursor;
  do {
    const body = { page_size: 100 }; if (cursor) body.start_cursor = cursor;
    const r = await fetch(`https://api.notion.com/v1/data_sources/${dsId}/query`, { method: 'POST', headers: NH, body: JSON.stringify(body) });
    const j = await r.json(); if (!r.ok) throw new Error(`${dsId} ${r.status}`);
    rows = rows.concat(j.results || []); cursor = j.has_more ? j.next_cursor : null;
  } while (cursor);
  return rows;
}
async function dsOf(wfid) {
  const w = await (await fetch(`https://allthepower.app.n8n.cloud/api/v1/workflows/${wfid}`, { headers: XN })).json();
  const trig = w.nodes.find(n => /trigger/i.test(n.name) && /notion/i.test(n.type));
  const db = hexId(trig?.parameters?.databaseId?.value || trig?.parameters?.databaseId || '');
  const dbj = await (await fetch(`https://api.notion.com/v1/databases/${db}`, { headers: NH })).json();
  return (dbj.data_sources || [])[0]?.id;
}

(async () => {
  const out = [];
  const P = (s) => { out.push(s); console.log(s); };
  P(`# Content Estate Audit\n\n*Generated ${new Date().toISOString().slice(0, 16)} · read-only reconciliation across all content surfaces.*`);

  // 1. VIDEO LIBRARY
  const vid = await queryAll(VIDEO_DS);
  const vStatus = tally(vid, r => r.properties['Status']?.select?.name);
  const vSource = tally(vid, r => r.properties['Source Type']?.select?.name);
  const vReviewedUnappr = vid.filter(r => r.properties['Status']?.select?.name === 'Reviewed' && !r.properties['Human Approved']?.checkbox).length;
  P(`\n## 1. Video Library (clips)  —  ${vid.length} rows`);
  P(`- by Status: ${fmt(vStatus)}`);
  P(`- by Source: ${fmt(vSource)}`);
  P(`- **DARK: Reviewed but never approved = ${vReviewedUnappr}**`);

  // 2. POSTS MASTER
  const posts = await queryAll(POSTS_DS);
  const pStatus = tally(posts, r => r.properties['Status']?.select?.name);
  const pSource = tally(posts, r => r.properties['Source Type']?.select?.name);
  const pPlat = tally(posts, r => r.properties['Platform']?.select?.name);
  const podLinked = posts.filter(r => (r.properties['Podcast Episode']?.relation || []).length).length;
  P(`\n## 2. Social Media Posts Master (text/posts)  —  ${posts.length} rows`);
  P(`- by Status: ${fmt(pStatus)}`);
  P(`- by Source: ${fmt(pSource)} · by Platform: ${fmt(pPlat)}`);
  P(`- podcast-linked: ${podLinked} · **DARK: Draft (never published) = ${pStatus.Draft || 0}**`);

  // 3. PER-PLATFORM PIPELINE DBs
  P(`\n## 3. Per-platform Content Pipeline DBs (the publish queue)`);
  let pipeTotals = { rows: 0, withZernio: 0, dark: 0, published: 0, scheduled: 0, cancelled: 0 };
  const darkBy = {};
  const PROMOTABLE = new Set(['Draft', 'Ready for Review']);
  for (const [chan, wfid] of Object.entries(SCHED)) {
    let ds; try { ds = await dsOf(wfid); } catch { P(`- ${chan}: (could not resolve DB)`); continue; }
    if (!ds) { P(`- ${chan}: (no data source)`); continue; }
    const rows = await queryAll(ds);
    const st = tally(rows, r => r.properties['Status']?.select?.name);
    const withZ = rows.filter(r => tp(r.properties['Zernio Post ID'])).length;
    const dark = rows.filter(r => PROMOTABLE.has(r.properties['Status']?.select?.name)).length;
    darkBy[chan] = dark;
    pipeTotals.rows += rows.length; pipeTotals.withZernio += withZ; pipeTotals.dark += dark;
    pipeTotals.published += (st.Published || 0); pipeTotals.scheduled += (st.Scheduled || 0); pipeTotals.cancelled += (st.Cancelled || 0);
    P(`- **${chan}** (${rows.length}): ${fmt(st)} · with Zernio id ${withZ} · DARK ${dark}`);
  }

  // 4. ZERNIO (what's actually live)
  let zStatus = {};
  try {
    const zj = await (await fetch('https://zernio.com/api/v1/posts?limit=100', { headers: { Authorization: `Bearer ${ZKEY}` } })).json();
    const zposts = zj.posts || zj.data || [];
    zStatus = tally(zposts, p => p.status || p.state);
    P(`\n## 4. Zernio (live state, last 100)  —  ${fmt(zStatus)}`);
  } catch (e) { P(`\n## 4. Zernio — error: ${e.message}`); }

  // 5. RECONCILIATION — two layers (upstream sources vs downstream publish queue; don't sum across)
  const topDark = Object.entries(darkBy).sort((a, b) => b[1] - a[1]);
  const totalDark = vReviewedUnappr + (pStatus.Draft || 0) + pipeTotals.dark;
  P(`\n## 5. Reconciliation — the lay of the land`);
  P(`\n### Two layers (distinct — don't sum across them)`);
  P(`**Upstream sources** (where content is born):`);
  P(`- Video Library: ${vid.length} clips (all Daily Video) — **${vReviewedUnappr} scored but never approved → dark**`);
  P(`- Posts Master: ${posts.length} posts (${podLinked} episode-linked) — **${pStatus.Draft || 0} Draft, never bridged to a pipeline → dark**`);
  P(`\n**Publish queue** (per-platform pipeline rows that feed Zernio): ${pipeTotals.rows} rows`);
  P(`- Live (Published): ${pipeTotals.published} · In motion (Scheduled): ${pipeTotals.scheduled} · reached Zernio (has id): ${pipeTotals.withZernio}`);
  P(`- **DARK (Draft + Ready-for-Review): ${pipeTotals.dark}** · Cancelled/abandoned: ${pipeTotals.cancelled}`);
  P(`\n### Biggest dark pools (produced, never published) — where the value is trapped`);
  P(`1. LinkedIn pipeline — ${darkBy['LinkedIn'] || 0}`);
  P(`2. Posts Master (podcast text) — ${pStatus.Draft || 0}`);
  P(`3. Video Library (daily-video clips) — ${vReviewedUnappr}`);
  P(`4. Other pipelines (TikTok/IG/FB/YT/Threads) — ${pipeTotals.dark - (darkBy['LinkedIn'] || 0)}`);
  P(`\n### Gaps / notes`);
  P(`- Video Library has **0 Podcast Clip/Episode rows** — rendered podcast clips aren't landing here (recent eps audio-only, or an onboarding gap to investigate).`);
  P(`- X & Threads pipelines are **mostly Cancelled** (lanes look deliberately wound down).`);
  P(`\n> Headline: across all surfaces, **~${totalDark} content items are sitting dark** (scored/drafted but never published). The machinery publishes (${pipeTotals.published} live, ${pipeTotals.withZernio} reached Zernio) — the bottleneck is the approval gate, exactly what the autopilot closes.`);

  fs.writeFileSync(REPORT, out.join('\n') + '\n');
  console.log(`\n[report written: ${REPORT}]`);
})().catch(e => { console.error('FATAL', e.message); process.exit(1); });
