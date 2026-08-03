#!/usr/bin/env node
// Duplicate-visit finder: two Jobber visits for the SAME job on the SAME day. Generalises the
// one-off delete-dups-0726.mjs (hardcoded to the week of 7/27) into something the weekly run can
// use. REPORT ONLY — it never deletes. Deleting a visit is destructive and customer-affecting, so
// the list goes to Spencer and the deletion is a separate, approved step.
//
// Keeper rule:
//   0. a visit whose TITLE carries a parenthetical — "(set)", "(problem job)", "(5th visit)" —
//      always wins (Spencer 2026-08-01). The office writes that note on the record that matters;
//      the bare-name copy is the accidental one. This beats every rule below.
//   1. a visit assigned to a tech who is actually driving beats one assigned to an off-roster tech
//   2. otherwise a committed visit (real arrival window <= 6h) beats an all-day one
//   3. otherwise the LOWEST visit id wins — that is the original recurring visit, not the re-add
//
// Usage: node find-dup-visits.mjs --visits=<snapshot.json> --grid=<grid.json>
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const arg = n => (process.argv.find(a => a.startsWith(`--${n}=`)) || '').split('=')[1];
const V = JSON.parse(fs.readFileSync(path.resolve(__dirname, arg('visits')), 'utf8'));
const G = JSON.parse(fs.readFileSync(path.resolve(__dirname, arg('grid')), 'utf8'));
const ROSTER = new Set(Object.keys(G.works || {}));
const pt = iso => new Date(iso).toLocaleString('sv-SE', { timeZone: 'America/Los_Angeles' });
const num = id => Buffer.from(id, 'base64').toString('utf8').split('/').pop();

const groups = {};
for (const v of V) {
  if (v.isComplete) continue;
  const k = `${v.job?.jobNumber}|${pt(v.startAt).slice(0, 10)}`;
  (groups[k] = groups[k] || []).push(v);
}

const rows = [];
for (const [key, list] of Object.entries(groups)) {
  if (list.length < 2) continue;
  const enriched = list.map(v => {
    const techs = (v.assignedUsers?.nodes || []).map(u => u.name.full);
    const winH = v.endAt ? (new Date(v.endAt) - new Date(v.startAt)) / 3600000 : null;
    return {
      v, id: num(v.id), techs, title: (v.title || '').trim(),
      // "(set)", "(problem job)", "(5th visit)" — any parenthetical the office has written on.
      noted: /\([^)]+\)/.test(v.title || ''),
      onRoster: techs.some(t => ROSTER.has(t)),
      committed: pt(v.startAt).slice(11, 16) !== '00:00' && winH !== null && winH <= 6,
      window: winH === null ? 'none' : `${winH.toFixed(1)}h`,
      start: pt(v.startAt),
    };
  });
  let keeper, why;
  const noted = enriched.filter(e => e.noted);
  const onRoster = enriched.filter(e => e.onRoster);
  if (noted.length === 1) { keeper = noted[0]; why = 'title carries a parenthetical note'; }
  else if (onRoster.length === 1) { keeper = onRoster[0]; why = 'only one is on a working tech'; }
  else {
    const pool = onRoster.length ? onRoster : enriched;
    const committed = pool.filter(e => e.committed);
    if (committed.length === 1) { keeper = committed[0]; why = 'has the committed arrival window'; }
    else { keeper = pool.slice().sort((a, b) => Number(a.id) - Number(b.id))[0]; why = 'oldest visit id'; }
  }
  const losers = enriched.filter(e => e !== keeper);
  const risk = losers.some(e => e.committed) ? '  << LOSER HAS A COMMITTED WINDOW' : '';
  rows.push({ key, title: list[0].title, city: list[0].property?.address?.city,
              zip: (list[0].property?.address?.postalCode || '').slice(0, 5), keeper, losers, why, risk });
}

rows.sort((a, b) => a.key.localeCompare(b.key));
console.log(`duplicate job+day pairs: ${rows.length}  (${rows.reduce((s, r) => s + r.losers.length, 0)} surplus visits)\n`);
for (const r of rows) {
  const [job, date] = r.key.split('|');
  console.log(`#${job}  ${date}  ${r.city} ${r.zip}${r.risk}`);
  console.log(`   KEEP   ${r.keeper.id}  "${r.keeper.title}"  ${r.keeper.start}  window ${r.keeper.window}  [${r.keeper.techs.join('+') || 'unassigned'}]  (${r.why})`);
  for (const l of r.losers)
    console.log(`   DELETE ${l.id}  "${l.title}"  ${l.start}  window ${l.window}  [${l.techs.join('+') || 'unassigned'}]${l.committed ? '  COMMITTED' : ''}`);
}
const byDay = {};
for (const r of rows) { const d = r.key.split('|')[1]; byDay[d] = (byDay[d] || 0) + r.losers.length; }
console.log('\nsurplus visits per day:', Object.entries(byDay).sort().map(([d, n]) => `${d}:${n}`).join('  '));

// ---- second pass: stale records hiding on a DIFFERENT day ----
// #7303 Bryce Murphy (2026-08-01) had two visits — a live Tuesday one on a working tech and a
// leftover Monday one still assigned to Tavis. Keying on job+day missed it entirely. The real
// signature is a job with several visits in one week where one sits on a tech who is not driving.
const perJob = {};
for (const v of V) {
  if (v.isComplete) continue;
  (perJob[String(v.job?.jobNumber)] = perJob[String(v.job?.jobNumber)] || []).push(v);
}
const suspects = [];
for (const [job, list] of Object.entries(perJob)) {
  if (list.length < 2) continue;
  const days = new Set(list.map(v => pt(v.startAt).slice(0, 10)));
  if (days.size < 2) continue;                     // same-day pairs are handled above
  for (const v of list) {
    const techs = (v.assignedUsers?.nodes || []).map(u => u.name.full);
    const live = techs.some(t => ROSTER.has(t));
    if (live) continue;
    const alt = list.filter(o => o !== v && (o.assignedUsers?.nodes || []).some(u => ROSTER.has(u.name.full)));
    if (!alt.length) continue;                     // no working-tech sibling — not a stale leftover
    suspects.push({ job, v, techs, alt });
  }
}
console.log(`\nstale-record suspects (multi-day, one copy on a tech who is not driving): ${suspects.length}`);
for (const s of suspects) {
  console.log(`  #${s.job}  "${s.v.title}"  ${pt(s.v.startAt).slice(0, 16)}  visit ${num(s.v.id)}  [${s.techs.join('+') || 'unassigned'}]`);
  for (const a of s.alt) console.log(`      live sibling ${num(a.id)}  ${pt(a.startAt).slice(0, 16)}  [${(a.assignedUsers?.nodes || []).map(u => u.name.full).join('+')}]`);
}
console.log('\nNOT automatically stale — a job can legitimately need two visits in a week.');
console.log('REPORT ONLY — nothing deleted.');
