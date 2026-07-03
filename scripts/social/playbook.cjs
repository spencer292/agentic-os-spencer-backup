/**
 * Playbook generator (flywheel stage 6 — adapt).
 *
 * Reads content-ledger.jsonl, aggregates results by channel / format / topic, and writes
 * content-playbook.md — the current targeting rules + a machine-readable policy block the cadence
 * governor reads to bias what it releases next (the bandit's exploit arm). Honest about data
 * sufficiency: where samples are thin it leans on the channel-role priors from the brief.
 *
 *   node scripts/social/playbook.cjs
 */
const fs = require('fs');
const ledger = require('./ledger-lib.cjs');
const OUT = 'C:/Claude/agent-os-v3/agentic-os/projects/briefs/content-flywheel/content-playbook.md';

const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
const primary = r => (r.metrics && r.metrics.peak != null) ? r.metrics.peak : null;

// Channel-role priors (brief §"Channel roles") — used when data is thin.
const ROLE = {
  TikTok: 'discovery (cold)', Instagram: 'discovery (cold)', YouTube: 'library/discovery',
  Facebook: 'community/reach', X: 'conversation', LinkedIn: 'B2B authority', Threads: 'conversation',
};

function aggregate(rows, key) {
  const g = {};
  for (const r of rows) {
    const k = r[key]; if (!k) continue;
    g[k] = g[k] || { n: 0, peakN: 0, sumPeak: 0, wins: 0, losses: 0 };
    g[k].n++;
    const p = primary(r); if (p != null) { g[k].peakN++; g[k].sumPeak += p; }
    if (r.verdict === 'win') g[k].wins++; if (r.verdict === 'loss') g[k].losses++;
  }
  for (const k of Object.keys(g)) g[k].avgPeak = g[k].peakN ? g[k].sumPeak / g[k].peakN : null;
  return g;
}

function weights(agg) {
  const vals = Object.values(agg).map(v => v.avgPeak).filter(v => v != null);
  const overall = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
  const w = {};
  for (const [k, v] of Object.entries(agg)) {
    w[k] = (v.avgPeak != null && overall) ? +clamp(v.avgPeak / overall, 0.5, 2.0).toFixed(2) : 1.0;
  }
  return w;
}

const rows = ledger.readAll();
const nVerd = rows.filter(r => r.verdict && r.verdict !== 'pending').length;
const byChannel = aggregate(rows, 'channel');
const byFormat = aggregate(rows, 'format');
const byTopic = aggregate(rows, 'topic');
const channelWeight = weights(byChannel), formatWeight = weights(byFormat), topicWeight = weights(byTopic);
const channelRank = Object.entries(byChannel).filter(([, v]) => v.avgPeak != null).sort((a, b) => b[1].avgPeak - a[1].avgPeak).map(([k]) => k);

const thin = rows.length < 12 || nVerd < 4;
const policy = {
  generated: new Date().toISOString(), n_posts: rows.length, n_verdicts: nVerd, confidence: thin ? 'low (leaning on priors)' : 'building',
  channel_rank: channelRank, channel_weight: channelWeight, format_weight: formatWeight, topic_weight: topicWeight,
};

const fmtRow = (k, v) => `| ${k} | ${v.n} | ${v.avgPeak != null ? Math.round(v.avgPeak) : '—'} | ${v.wins}/${v.losses} | ${ROLE[k] || '—'} |`;
const md = `# Content Playbook — current targeting policy

*Generated ${policy.generated.slice(0, 16)} from \`content-ledger.jsonl\` (${rows.length} posts, ${nVerd} with verdicts). Confidence: **${policy.confidence}**.*
*This is the bandit's policy: the cadence governor reads the JSON block below to bias what it releases. Regenerate after the measure cron runs.*

## Channel priority (lead with these)
${channelRank.length ? channelRank.map((c, i) => `${i + 1}. **${c}** — ${ROLE[c] || ''} (avg ${Math.round(byChannel[c].avgPeak)}, weight ${channelWeight[c]})`).join('\n') : '_No metric data yet — using channel-role priors: lead with TikTok / Reels / Shorts for cold discovery._'}

## By channel
| Channel | posts | avg peak | W/L | role |
|---|---|---|---|---|
${Object.entries(byChannel).map(([k, v]) => fmtRow(k, v)).join('\n')}

## By format
| Format | posts | avg peak | W/L |
|---|---|---|---|
${Object.entries(byFormat).map(([k, v]) => `| ${k} | ${v.n} | ${v.avgPeak != null ? Math.round(v.avgPeak) : '—'} | ${v.wins}/${v.losses} |`).join('\n')}

## By topic
| Topic | posts | avg peak | W/L |
|---|---|---|---|
${Object.entries(byTopic).map(([k, v]) => `| ${k} | ${v.n} | ${v.avgPeak != null ? Math.round(v.avgPeak) : '—'} | ${v.wins}/${v.losses} |`).join('\n')}

## Notes
- ${thin ? '**Thin data** — weights are mostly neutral; the channel ranking leans on the AI-broken seed + the channel-role research. Sharpens as verdicts accumulate.' : 'Weights computed from accumulated verdicts.'}
- Metric caveat: peaks mix views (video channels) and impressions (X/LinkedIn) — not strictly comparable; treat the channel *ranking* as directional, not absolute.

\`\`\`json
${JSON.stringify(policy, null, 2)}
\`\`\`
`;

fs.writeFileSync(OUT, md);
console.log(`Playbook written: ${OUT}`);
console.log(`  posts=${rows.length} verdicts=${nVerd} confidence=${policy.confidence}`);
console.log(`  channel rank: ${channelRank.join(' > ') || '(no metric data — priors)'}`);
console.log(`  channel weights: ${JSON.stringify(channelWeight)}`);
