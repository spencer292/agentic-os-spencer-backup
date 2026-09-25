#!/usr/bin/env node
// Got Moles — "What day are you in my area?" lookup, built from REALITY.
//
// WHY THIS EXISTS (measured 2026-08-12):
//   The old zip sheet is generated from a hand-maintained territory grid
//   (territory-grid-v5.json). Scored against 2,059 real Jobber visits it came out at
//   90% — good, but 10 zips were wrong and they carried volume: 98338 (53 visits),
//   98005 (36), 98053 (34), 98328 (19). Muhammad told Brian Honig "we're there
//   Fridays" for 98328 off that sheet and was marked CORRECT in grading. The trucks
//   actually run 98328 on Tuesday. Both the sheet and the grader were wrong together.
//   territories.json v8 is NOT the fix — scored against the same visits it is 73%.
//   It is a planning map that has not fully landed in the field.
//
//   So: derive the answer from what the trucks ACTUALLY did. This rebuilds from
//   Jobber every run and cannot drift the way a hand-kept grid does.
//
// Read-only against Jobber. Writes a self-contained, offline-capable HTML page.
//
// Usage:
//   node build-zip-day-lookup.mjs                  # 4 weeks back + 2 forward
//   node build-zip-day-lookup.mjs --weeks-back 8
//   node build-zip-day-lookup.mjs --render-only    # rebuild HTML from last pull, no API calls
//   node build-zip-day-lookup.mjs --json           # data only
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..', '..', '..', '..');
const API = path.join(ROOT, '.claude', 'skills', 'tool-jobber', 'scripts', 'jobber-api.mjs');
const PORTABLE = path.resolve(HERE, '..', 'muhammad-portable');

const argv = process.argv.slice(2);
const val = (f, d) => { const i = argv.indexOf(f); return i >= 0 && argv[i + 1] ? argv[i + 1] : d; };
const WEEKS_BACK = Number(val('--weeks-back', '4'));
const WEEKS_FWD = Number(val('--weeks-forward', '2'));
const JSON_ONLY = argv.includes('--json');
const RENDER_ONLY = argv.includes('--render-only');

const DOW = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const DAYFULL = { mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday', fri: 'Friday', sat: 'Saturday', sun: 'Sunday' };
// Blocking sleep: this is a batch builder, and Atomics.wait keeps the throttle
// backoff honest without restructuring every call site as async.
const sleep = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);

function jobber(query, tries = 6) {
  for (let a = 1; a <= tries; a++) {
    try {
      const j = JSON.parse(execFileSync('node', [API, 'query', query], { encoding: 'utf8', maxBuffer: 64e6, stdio: ['ignore', 'pipe', 'pipe'] }));
      if (j.visits) return j;
      throw new Error('unexpected response: ' + JSON.stringify(j).slice(0, 200));
    } catch (e) {
      const msg = String(e.stdout || e.message || '');
      // Jobber bills a query-cost budget on a leaky bucket; THROTTLED is normal at this volume.
      if (/THROTTLED|Throttled/i.test(msg) && a < tries) { process.stderr.write(`[throttled ${a * 12}s]`); sleep(a * 12000); continue; }
      if (a === tries) throw new Error(msg.slice(0, 400));
      sleep(3000);
    }
  }
}

const iso = (d) => d.toISOString();
const now = new Date();

// ---------- the cut floor ----------
// A rolling lookback is WRONG across a territory re-cut, and this board re-cuts. The five-way cut
// took effect 2026-08-17 and moved 26.8% of visits to a different weekday; a 4-week window run on
// 08-21 was ~3.5 weeks of the old four-tech board, and it disagreed with the post-cut board on
// 51 of 117 zips — Tavis showed 9 zips instead of 20, Cory 19 instead of 7. History from before a
// cut is not weak evidence about the current board, it is evidence about a board that no longer
// exists, so it is excluded outright rather than out-weighted.
//
// The floor is READ FROM territories.json (latest handover effective date), not hardcoded, so the
// next re-cut moves it automatically. Override with --since YYYY-MM-DD.
function cutFloor() {
  const cli = val('--since', null);
  if (cli) return cli;
  try {
    const t = JSON.parse(fs.readFileSync(path.join(ROOT, 'projects/briefs/technician-route-automation/territories.json'), 'utf8'));
    const dates = (t.handovers || []).map(h => h.effective).filter(Boolean).sort();
    if (dates.length) return dates[dates.length - 1];
  } catch { /* fall through */ }
  return null;
}
const SINCE = cutFloor();
const backFrom = new Date(now.getTime() - WEEKS_BACK * 7 * 86400000);
const floorDate = SINCE ? new Date(`${SINCE}T00:00:00-07:00`) : null;
// Never pull less than the cut floor, and never pull more than asked for.
const from = iso(floorDate && floorDate > backFrom ? floorDate : backFrom);
const to = iso(new Date(now.getTime() + WEEKS_FWD * 7 * 86400000));
if (SINCE) process.stderr.write(`Cut floor: ${SINCE} (latest handover in territories.json) — nothing before it counts\n`);

let cursor = null, visits = [], cached = null;
if (RENDER_ONLY) {
  cached = JSON.parse(fs.readFileSync(path.join(HERE, 'zip-day-lookup.json'), 'utf8'));
  visits = { length: cached.visitsScanned };
  process.stderr.write(`Render-only: reusing ${cached.records.length} zips from the ${cached.generated.slice(0, 10)} pull\n`);
} else {
  process.stderr.write(`Pulling visits ${from.slice(0, 10)} .. ${to.slice(0, 10)}\n`);
  while (true) {
    const d = jobber(`{
      visits(first: 50, filter: { startAt: { after: "${from}", before: "${to}" } }${cursor ? `, after: "${cursor}"` : ''}) {
        pageInfo { hasNextPage endCursor }
        totalCount
        nodes {
          startAt
          isComplete
          assignedUsers(first: 2) { nodes { name { full } } }
          job { property { address { city postalCode } } }
        }
      }
    }`).visits;
    visits.push(...d.nodes);
    process.stderr.write(`\r  ${visits.length}/${d.totalCount}   `);
    if (!d.pageInfo.hasNextPage) break;
    cursor = d.pageInfo.endCursor;
    sleep(2500);
  }
  process.stderr.write('\n');
}

// ---------- aggregate ----------
// Weekday is computed in Pacific time: a 07:00 UTC visit is the PREVIOUS day locally,
// and getting that wrong shifts a whole zip by one day.
const ptDay = (isoStr) => DOW[new Date(new Date(isoStr).toLocaleString('en-US', { timeZone: 'America/Los_Angeles' })).getDay()];

// ---------- roster ----------
// Somebody who is no longer running a route still has weeks of history inside the lookback window,
// and that history is actively misleading: the 2026-08-12 build named Cammeron Anderson, who left on
// 08-07, and his old Monday runs also drag the DAY answer for zips somebody else now works on a
// different day. So their visits are dropped from the aggregation entirely, not just from the label.
//
// "Off the board" is not the same as "left the company" — Spencer Hill trips this too (last field
// visit 2026-07-31), and that is the correct outcome: the office should not be told Spencer covers a
// zip when he is not running routes. The cron surfaces who was dropped so a surprise gets noticed.
//
// The roster is derived, not configured — a list in a file is one more thing that rots. Anyone with
// no visit in the last ROSTER_DAYS (and none scheduled ahead) is off the roster.
const ROSTER_DAYS = Number(val('--roster-days', '10'));
const rosterCutoff = new Date(now.getTime() - ROSTER_DAYS * 86400000);
const lastSeen = {};
if (!RENDER_ONLY) {
  for (const v of visits) {
    const t = v.assignedUsers?.nodes?.[0]?.name?.full;
    if (!t) continue;
    const d = new Date(v.startAt);
    if (!lastSeen[t] || d > lastSeen[t]) lastSeen[t] = d;
  }
}
const departed = Object.entries(lastSeen).filter(([, d]) => d < rosterCutoff).map(([t]) => t);
if (departed.length) {
  process.stderr.write(`Roster: dropping ${departed.length} tech(s) with no visits in the last ${ROSTER_DAYS} days — ${departed.map(t => `${t} (last ${lastSeen[t].toISOString().slice(0, 10)})`).join(', ')}\n`);
}
const isActive = (t) => !departed.includes(t);

// Two buckets, and they are NOT equivalent evidence.
//   done      — visits actually completed since the cut. Where the truck really went.
//   booked    — visits still scheduled ahead. A PLAN, and on this board the plan drifts: next week
//               currently holds 542 visits of which 420 have no time at all, and the forward window
//               surfaced a tech ("Courtney") with 8 booked visits and zero completed work.
// A zip is answered from `done` whenever it has any, and only falls back to `booked` when it has
// none — flagged provisional, never presented as if a truck had been there.
const agg = {};        // completed
const aggBooked = {};  // scheduled ahead
if (!RENDER_ONLY) {
  for (const v of visits) {
    const zip = v.job?.property?.address?.postalCode?.slice(0, 5);
    if (!zip || !/^\d{5}$/.test(zip)) continue;
    const day = ptDay(v.startAt);
    if (day === 'sat' || day === 'sun') continue; // weekend visits are a defect, never an answer
    const tech = v.assignedUsers?.nodes?.[0]?.name?.full || '(unassigned)';
    if (tech !== '(unassigned)' && !isActive(tech)) continue; // see roster note above
    const city = v.job?.property?.address?.city || '';
    const bucket = v.isComplete ? agg : aggBooked;
    const a = (bucket[zip] ||= { days: {}, techs: {}, cities: {}, n: 0 });
    a.days[day] = (a.days[day] || 0) + 1;
    a.techs[tech] = (a.techs[tech] || 0) + 1;
    if (city) a.cities[city] = (a.cities[city] || 0) + 1;
    a.n++;
  }
  // Zips nobody has actually been to since the cut fall back to what is booked.
  for (const [zip, a] of Object.entries(aggBooked)) if (!agg[zip]) { agg[zip] = a; a.provisional = true; }
}

const records = RENDER_ONLY ? cached.records : Object.entries(agg).map(([zip, a]) => {
  const ranked = Object.entries(a.days).sort((x, y) => y[1] - x[1]);
  // Any weekday holding >=25% of a zip's visits is a real service day. Two-day zips
  // are common (a split territory, or a big zip worked over two runs) and naming only
  // the busiest day would be wrong close to half the time.
  const days = ranked.filter(([, c]) => c / a.n >= 0.25).map(([d]) => d);
  const top = ranked[0];
  const tech = Object.entries(a.techs).sort((x, y) => y[1] - x[1])[0];
  const cities = Object.entries(a.cities).sort((x, y) => y[1] - x[1]).slice(0, 3).map(([c]) => c);
  return {
    zip, cities, n: a.n,
    days: days.length ? days : [top[0]],
    // A provisional zip is answered from a booking, not from a truck that went — it can never read
    // better than low, whatever the count.
    confidence: a.provisional ? 'provisional' : a.n >= 8 ? 'high' : a.n >= 4 ? 'medium' : 'low',
    provisional: !!a.provisional,
    tech: tech[0], techShare: Math.round(100 * tech[1] / a.n),
  };
}).sort((x, y) => x.zip.localeCompare(y.zip));

// Address-split zips: a zip-level answer is wrong here by construction, because a
// highway runs through the zip and the two sides are different techs and days.
// Source: territories.json geoSplitLines (CLAUDE.local.md 2026-08-07).
let splitZips = RENDER_ONLY ? cached.splitZips : {};
if (!RENDER_ONLY) {
  try {
    const t = JSON.parse(fs.readFileSync(path.join(ROOT, 'projects/briefs/technician-route-automation/territories.json'), 'utf8'));
    for (const r of (Array.isArray(t.regions) ? t.regions : Object.values(t.regions || {})))
      for (const z of (r.geoSplit?.appliesToZips || [])) splitZips[z] = r.geoSplit.line;
  } catch { /* advisory only; the visit data stands on its own */ }
}

const out = { generated: new Date().toISOString(), window: { from, to }, visitsScanned: visits.length, records, splitZips, departed };
fs.writeFileSync(path.join(HERE, 'zip-day-lookup.json'), JSON.stringify(out, null, 1));

// ---------- grid emit (spec v2 defect D1) ----------
// build-address-day-lookup.mjs needs a zip->day grid to answer for addresses with nothing scheduled.
// It was pinned to territory-grid-v5.json — a four-tech map from 2026-08-01 that still lists
// Cammeron Anderson and has no truck for Robert Norton — so the office quoted days off a dead map
// every morning. Emitting the SAME reality this page is built from means both office pages agree
// and neither can drift from what the trucks actually did.
if (!RENDER_ONLY) {
  const gridZips = {};
  for (const r of records) {
    gridZips[r.zip] = {
      days: r.days,
      tech: r.tech,
      cities: r.cities.join('/'),
      visits: r.n,
      confidence: r.confidence,
      note: `Derived from ${r.n} real visits in ${from.slice(0, 10)}..${to.slice(0, 10)}${splitZips[r.zip] ? ` — WARNING: ${splitZips[r.zip]} runs through this zip, so a zip-level answer is wrong here; use the address lookup` : ''}`,
    };
  }
  const gridOut = {
    _comment: 'GENERATED — do not hand-edit. Zip route days derived from real Jobber visit history by build-zip-day-lookup.mjs, replacing the hand-kept territory-grid-v*.json line (spec v2 defect D1). Scored against real visits the hand-kept grid was 90% and territories.json v8 was 73%; this is the board as it actually ran. Rebuilt every morning by the service-day-sheet-refresh cron.',
    generated: out.generated,
    basedOn: `${visits.length} real Jobber visits, ${from.slice(0, 10)}..${to.slice(0, 10)}`,
    inactiveTechsExcluded: departed,
    zips: gridZips,
    jobOverrides: {},   // reserved: job-level exceptions still beat the zip rule downstream
  };
  fs.writeFileSync(path.join(HERE, 'service-day-grid.json'), JSON.stringify(gridOut, null, 1));
  process.stderr.write(`Grid emitted: service-day-grid.json — ${Object.keys(gridZips).length} zips\n`);
}
if (JSON_ONLY) { console.log(`${records.length} zips from ${visits.length} visits`); process.exit(0); }

// ---------- render ----------
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const genPT = new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles', dateStyle: 'medium', timeStyle: 'short' });

const html = `<title>Got Moles Service Days</title>
<style>
  /* Light is the base palette. Neutrals carry a green bias toward the accent so the
     greys read as chosen, not inherited. Semantic colors are deliberately NOT the
     accent — critical and caution mean "stop", not "brand". */
  :root{
    --ground:#fbfcfb; --raised:#f2f5f2; --ink:#131a15; --muted:#5c6b60; --line:#e0e6e1;
    --accent:#1a7a3c; --accent-soft:#e6f2ea;
    --critical:#b3261e; --critical-soft:#fbeae9;
    --caution:#8a5200;  --caution-soft:#fdf1e0;
  }
  @media (prefers-color-scheme:dark){:root:not([data-theme="light"]){
    --ground:#111512; --raised:#1a201c; --ink:#e9efea; --muted:#93a398; --line:#232a25;
    --accent:#54c977; --accent-soft:#16281c;
    --critical:#ff7268; --critical-soft:#2c1614;
    --caution:#e0a052;  --caution-soft:#2a1f10;
  }}
  :root[data-theme="dark"]{
    --ground:#111512; --raised:#1a201c; --ink:#e9efea; --muted:#93a398; --line:#232a25;
    --accent:#54c977; --accent-soft:#16281c;
    --critical:#ff7268; --critical-soft:#2c1614;
    --caution:#e0a052;  --caution-soft:#2a1f10;
  }
  *{box-sizing:border-box}
  html{-webkit-text-size-adjust:100%}
  body{
    margin:0; background:var(--ground); color:var(--ink);
    font:16px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;
  }
  .wrap{max-width:640px;margin:0 auto;padding:20px 16px 72px;}
  h1{font-size:20px;line-height:1.25;margin:0;letter-spacing:-.01em;text-wrap:balance;}
  .sub{color:var(--muted);font-size:12.5px;margin-top:4px;font-variant-numeric:tabular-nums;}

  /* The input is the hero. This page has exactly one job. */
  #q{
    width:100%;margin-top:18px;font-size:32px;font-weight:600;padding:15px 18px;
    border:2px solid var(--line);border-radius:14px;background:var(--raised);color:var(--ink);
    font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;
    font-variant-numeric:tabular-nums;letter-spacing:.1em;
  }
  #q::placeholder{color:var(--muted);opacity:.75;letter-spacing:0;font-size:19px;font-weight:400;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;}
  #q:focus{outline:3px solid var(--accent);outline-offset:2px;border-color:transparent;}
  .hint{color:var(--muted);font-size:12.5px;margin:8px 2px 0;line-height:1.5;}
  .hint b{color:var(--ink);}

  #out{display:flex;flex-direction:column;gap:10px;margin-top:20px;}
  .card{border:1px solid var(--line);border-radius:14px;padding:15px 17px;background:var(--raised);}
  .zip{
    font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;
    font-size:14px;font-weight:600;letter-spacing:.08em;color:var(--muted);
    font-variant-numeric:tabular-nums;
  }
  .city{font-size:14px;color:var(--muted);margin-top:3px;}
  /* The answer. Biggest thing on the page, because it is the only thing he needs. */
  .day{font-size:34px;font-weight:700;color:var(--accent);margin-top:10px;line-height:1.08;letter-spacing:-.02em;text-wrap:balance;}
  .say{
    margin-top:11px;padding:10px 13px;border-radius:10px;
    background:var(--accent-soft);border:1px solid var(--line);font-size:15px;line-height:1.45;
  }
  .say .lead{display:block;font-size:10.5px;font-weight:700;letter-spacing:.11em;text-transform:uppercase;color:var(--muted);margin-bottom:4px;}
  .say b{color:var(--accent);}
  .flag{margin-top:9px;padding:10px 13px;border-radius:10px;font-size:13.5px;line-height:1.45;color:var(--ink);}
  .flag.critical{background:var(--critical-soft);border:1px solid var(--critical);}
  .flag.caution{background:var(--caution-soft);border:1px solid var(--caution);}
  .meta{
    font-size:12px;color:var(--muted);margin-top:10px;padding-top:9px;border-top:1px solid var(--line);
    font-variant-numeric:tabular-nums;
  }
  .none{padding:18px 17px;border:2px dashed var(--caution);border-radius:14px;background:var(--caution-soft);font-size:14.5px;line-height:1.55;color:var(--ink);}
  .none .big{font-size:17px;font-weight:700;display:block;margin-bottom:8px;}
  .foot{margin-top:30px;padding-top:14px;border-top:1px solid var(--line);color:var(--muted);font-size:12.5px;line-height:1.65;}
  .foot b{color:var(--ink);}
  .foot ol{margin:8px 0 0;padding-left:20px;display:flex;flex-direction:column;gap:5px;}
</style>
<div class="wrap">
  <h1>What day are we in your area?</h1>
  <div class="sub">Built from ${visits.length.toLocaleString()} real visits &middot; ${records.length} zips &middot; ${esc(genPT)} PT${SINCE ? `<br>Five-technician routes &mdash; counts only work done since the re-cut on ${esc(SINCE)}. Days will firm up as more weeks run.` : ''}</div>
  <input id="q" inputmode="numeric" autocomplete="off" placeholder="Type the zip&hellip;" aria-label="Zip code" autofocus>
  <div class="hint">Ask for the <b>zip</b>, never the city &mdash; Seattle alone spans 21 zips across 4 different days.</div>
  <div id="out" role="status" aria-live="polite"></div>
  <div class="foot">
    <b>On the phone</b>
    <ol>
      <li>Zip not listed &rarr; <i>&ldquo;Let me confirm coverage for that address and call you right back today.&rdquo;</i> Never yes or no on the spot.</li>
      <li>Never promise a technician by name. Assignments move; the name here is internal only.</li>
      <li>Low confidence means we have barely worked that zip since the re-cut &mdash; say the day as <i>&ldquo;usually&rdquo;</i>.</li>
      <li>A red <b>&ldquo;no truck has been to this zip&rdquo;</b> flag means the day is a booking, not a fact. Confirm and call back &mdash; do not promise it.</li>
      <li>This page rebuilds from Jobber. If the date above is more than 2 days old, ask Spencer to re-run it.</li>
    </ol>
  </div>
</div>
<script>
var DATA=${JSON.stringify({ records, splitZips })};
var FULL=${JSON.stringify(DAYFULL)};
var q=document.getElementById('q'), out=document.getElementById('out');
function phrase(ds){
  // Typographic apostrophe on purpose: a plain one would close this string literal.
  var n=ds.map(function(d){return FULL[d];});
  if(n.length===1) return 'We’re in your area on <b>'+n[0]+'s</b>.';
  return 'We’re in your area on <b>'+n.slice(0,-1).join('s, ')+'s and '+n[n.length-1]+'s</b>.';
}
function render(){
  var v=q.value.replace(/[^0-9]/g,'');
  if(v.length<3){ out.innerHTML=''; return; }
  var hits=DATA.records.filter(function(r){return r.zip.indexOf(v)===0;}).slice(0,8);
  if(!hits.length){
    out.innerHTML='<div class="none"><span class="big">'+v+' is not a zip we have worked recently.</span>'+
      'Say: <i>&ldquo;Let me confirm coverage for that address and call you right back today.&rdquo;</i><br><br>'+
      'Do <b>not</b> tell them we do not serve them. On 2026-08-11 a real lead in 98444 was turned away as out-of-area for a zip we cover.</div>';
    return;
  }
  out.innerHTML=hits.map(function(r){
    var split=DATA.splitZips[r.zip];
    var flags='';
    if(split) flags+='<div class="flag critical"><b>This zip is split by a highway ('+split+').</b> The day depends which side of the line the address sits on. Get the full street address and confirm before promising a day.</div>';
    if(r.provisional) flags+='<div class="flag critical"><b>No truck has been to this zip since the routes were re-cut.</b> This day comes from what is BOOKED ahead, not from a visit that happened &mdash; and booked days move. Do not promise it. Say you will confirm the day and call back today.</div>';
    else if(r.confidence==='low') flags+='<div class="flag caution"><b>Low confidence</b> &mdash; only '+r.n+' visit'+(r.n===1?'':'s')+' here since the re-cut. Say &ldquo;usually&rdquo;, or offer to confirm.</div>';
    else if(r.days.length>1) flags+='<div class="flag caution">Two service days in this zip. Either is safe to say; <b>'+FULL[r.days[0]]+'</b> is the more common one.</div>';
    return '<div class="card">'+
      '<div class="zip">'+r.zip+'</div>'+
      '<div class="city">'+r.cities.join(' &middot; ')+'</div>'+
      '<div class="day">'+r.days.map(function(d){return FULL[d];}).join(' / ')+'</div>'+
      '<div class="say"><span class="lead">Say this</span>'+phrase(r.days)+'</div>'+
      flags+
      '<div class="meta">'+r.n+' visits &middot; '+r.confidence+' confidence &middot; internal: '+r.tech+' ('+r.techShare+'%)</div>'+
    '</div>';
  }).join('');
}
q.addEventListener('input',render);
</script>`;

// Two shapes, one body — same split as build-address-day-lookup.mjs.
//   standalone  — opened from disk, and carried offline in muhammad-portable. Needs its own doctype,
//                 charset and viewport, or it renders as mojibake at desktop width on a phone.
//   artifact    — the hosted page supplies the doctype/head/body skeleton itself, so emitting our own
//                 would nest a second document inside theirs.
const standaloneHtml = `<!doctype html>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
${html}`;

fs.writeFileSync(path.join(HERE, 'zip-day-lookup.html'), standaloneHtml);
// Source for the hosted copy. Kept beside the standalone one so the two can never drift to
// different data — the failure that keeps the office reading a page nobody is updating.
fs.writeFileSync(path.join(HERE, 'zip-day-lookup.artifact.html'), html);
try { fs.mkdirSync(PORTABLE, { recursive: true }); fs.writeFileSync(path.join(PORTABLE, 'zip-day-lookup.html'), standaloneHtml); } catch { /* portable copy is best-effort */ }
console.log(`${records.length} zips from ${visits.length} visits -> zip-day-lookup.html + .artifact.html (+ muhammad-portable copy)`);
