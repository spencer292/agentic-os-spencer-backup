// Got Moles — remarketing + conversion health check. Read-only. Usage: node scripts/gm-remarketing-check.mjs [--json]
// Verifies (1) the live site still loads GTM-5XLRMCGQ, (2) the compiled container's Google Ads Remarketing tag
// carries the numeric Conversion ID 18098890649 (not "AW-..."), (3) tag-based user lists are populating,
// (4) the three bidding conversion actions are still firing. Writes a dated JSON + appends to a state file.
import fs from 'node:fs';
import path from 'node:path';
import { createClient } from 'file:///C:/Claude/agent-os-v3/agentic-os/.claude/skills/ops-google-ads/scripts/lib/ads-client.mjs';

const ROOT = 'C:/Claude/agent-os-v3/agentic-os';
const OUT_DIR = path.join(ROOT, 'projects/briefs/got-moles-paid-search/remarketing-watch');
const STATE = path.join(OUT_DIR, 'state.json');
const FIX_DATE = '2026-09-14'; // GTM Version 6 published (Conversion ID → numeric)
const EXPECTED_ID = '18098890649';
const GTM_ID = 'GTM-5XLRMCGQ';
const JSON_ONLY = process.argv.includes('--json');
fs.mkdirSync(OUT_DIR, { recursive: true });

const today = new Date().toISOString().slice(0, 10);
const daysSinceFix = Math.round((Date.parse(today) - Date.parse(FIX_DATE)) / 864e5);
const UA = { headers: { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/128', 'cache-control': 'no-cache' } };
const fails = [], watches = [], notes = [];

// ---- 1. live site loads GTM
let siteOk = false;
try {
  const html = await (await fetch('https://www.got-moles.com/?rmkcheck=' + Date.now(), UA)).text();
  siteOk = html.includes(GTM_ID);
  if (!siteOk) fails.push(`Site HTML no longer references ${GTM_ID}`);
} catch (e) { fails.push('Site fetch failed: ' + e.message); }

// ---- 2. compiled container: remarketing tag Conversion ID + All Pages trigger
let convId = null, spOnAllPages = null;
try {
  const js = await (await fetch(`https://www.googletagmanager.com/gtm.js?id=${GTM_ID}&cb=${Date.now()}`, UA)).text();
  const sp = js.match(/\{"function":"__sp"[^}]*\}/);
  convId = sp && (sp[0].match(/"vtp_conversionId":"([^"]+)"/) || [])[1];
  if (!sp) fails.push('Google Ads Remarketing tag (__sp) missing from compiled container');
  else if (convId !== EXPECTED_ID) fails.push(`Remarketing Conversion ID is "${convId}" — expected "${EXPECTED_ID}" (AW- prefix regression = lists stop filling)`);
  // trigger check: the gtm.js (All Pages) rule must include the __sp tag index
  const tagsJson = js.slice(js.indexOf('"tags":['), js.indexOf('"predicates":'));
  const tagFns = [...tagsJson.matchAll(/\{"function":"(__[a-z_]+)"/g)].map(m => m[1]);
  const spIdx = tagFns.indexOf('__sp');
  const preds = [...js.slice(js.indexOf('"predicates":'), js.indexOf('"rules":')).matchAll(/"arg1":"([^"]+)"/g)].map(m => m[1]);
  const rules = js.slice(js.indexOf('"rules":'), js.indexOf('"runtime":'));
  const allPagesPred = preds.indexOf('gtm.js');
  const rule = rules.match(new RegExp(`\\[\\["if",${allPagesPred}\\],\\["add",([0-9,]+)\\]`));
  spOnAllPages = !!(rule && rule[1].split(',').map(Number).includes(spIdx));
  if (spIdx > -1 && !spOnAllPages) fails.push('Remarketing tag is no longer on the All Pages (gtm.js) trigger');
} catch (e) { fails.push('Container fetch/parse failed: ' + e.message); }

// ---- 3 + 4. account: user lists + conversion actions
const c = await createClient({ customerId: '1665761172' });
const lists = (await c.gaql(`SELECT user_list.name, user_list.type, user_list.size_for_search, user_list.size_for_display FROM user_list WHERE user_list.type IN ('RULE_BASED','REMARKETING','LOGICAL')`))
  .map(r => ({ name: r.userList.name, type: r.userList.type, search: Number(r.userList.sizeForSearch || 0), display: Number(r.userList.sizeForDisplay || 0) }));
const tagBased = lists.filter(l => /All visitors|All Users|All Converters|optimized/i.test(l.name));
const anyMembers = tagBased.some(l => l.search > 0 || l.display > 0);
const state = fs.existsSync(STATE) ? JSON.parse(fs.readFileSync(STATE, 'utf8')) : { runs: [] };
const prev = state.runs.at(-1);
const prevMax = prev ? Math.max(...prev.lists.map(l => Math.max(l.search, l.display))) : 0;
const curMax = Math.max(...tagBased.map(l => Math.max(l.search, l.display)), 0);
if (!anyMembers) {
  if (daysSinceFix >= 5) fails.push(`Tag-based lists still at 0 members ${daysSinceFix} days after the fix — next suspects: Data Manager tag data-source activation; add a Google tag for AW-18098890649 in GTM ("Create tag"); Audience Manager list rules bound to a different source`);
  else watches.push(`Tag-based lists at 0 members (day ${daysSinceFix} after fix — Google shows list sizes with a 1–3 day lag; not yet a failure)`);
} else if (prev && curMax < prevMax) watches.push(`Largest tag-based list shrank ${prevMax} → ${curMax}`);
else notes.push(`Tag-based lists populating: max ${curMax} (prev ${prevMax})`);

const end = today, s7 = new Date(Date.now() - 7 * 864e5).toISOString().slice(0, 10);
const actions = (await c.gaql(`SELECT conversion_action.name, conversion_action.include_in_conversions_metric FROM conversion_action WHERE conversion_action.status='ENABLED'`))
  .map(r => ({ name: r.conversionAction.name, inMetric: !!r.conversionAction.includeInConversionsMetric }));
const perAction = {};
for (const r of await c.gaql(`SELECT segments.conversion_action_name, metrics.all_conversions FROM customer WHERE segments.date BETWEEN '${s7}' AND '${end}'`)) {
  const n = r.segments.conversionActionName; perAction[n] = (perAction[n] || 0) + Number(r.metrics.allConversions || 0);
}
const bidding = actions.filter(a => a.inMetric).map(a => ({ name: a.name, conv7d: perAction[a.name] || 0 }));
const daily = (await c.gaql(`SELECT segments.date, metrics.conversions, metrics.cost_micros, metrics.clicks FROM customer WHERE segments.date BETWEEN '${s7}' AND '${end}' ORDER BY segments.date`))
  .map(r => ({ date: r.segments.date, conv: Number(r.metrics.conversions || 0), spend: Math.round(Number(r.metrics.costMicros || 0) / 1e4) / 100, clicks: Number(r.metrics.clicks || 0) }));
const last3 = daily.slice(-3);
const conv3 = last3.reduce((a, d) => a + d.conv, 0), spend3 = last3.reduce((a, d) => a + d.spend, 0);
const totalBidding7d = bidding.reduce((a, x) => a + x.conv7d, 0);
if (totalBidding7d === 0) fails.push('No conversions recorded on any bidding conversion action in 7 days — tracking broken');
else if (conv3 === 0 && spend3 > 150) fails.push(`Zero conversions in the last 3 days on $${spend3.toFixed(2)} spend — check CallRail → GA4 → Ads import (phone backfills 1–3 days; if day 3 is still 0, escalate)`);
for (const x of bidding) if (x.conv7d === 0) watches.push(`Bidding action "${x.name}" has 0 conversions in 7 days`);

const verdict = fails.length ? 'FAIL' : watches.length ? 'WATCH' : 'PASS';
const run = { date: today, daysSinceFix, verdict, siteOk, convId, spOnAllPages, lists: tagBased, bidding, last3, fails, watches, notes };
state.runs.push(run); state.runs = state.runs.slice(-30);
fs.writeFileSync(STATE, JSON.stringify(state, null, 2));
fs.writeFileSync(path.join(OUT_DIR, `${today}.json`), JSON.stringify(run, null, 2));
const passStreak = [...state.runs].reverse().findIndex(r => r.verdict !== 'PASS' || !r.lists.some(l => l.search > 0 || l.display > 0));
run.consecutivePassWithMembers = passStreak === -1 ? state.runs.length : passStreak;

if (JSON_ONLY) { console.log(JSON.stringify(run, null, 2)); process.exit(0); }
console.log(`GOT MOLES REMARKETING WATCH — ${today} (day ${daysSinceFix} after fix) — ${verdict}`);
console.log(`Site loads ${GTM_ID}: ${siteOk ? 'yes' : 'NO'} | Remarketing Conversion ID: ${convId} (${convId === EXPECTED_ID ? 'correct' : 'WRONG'}) | on All Pages: ${spOnAllPages}`);
console.log('Tag-based lists: ' + tagBased.map(l => `${l.name} S${l.search}/D${l.display}`).join(' · '));
console.log('Bidding actions 7d: ' + bidding.map(x => `${x.name} ${x.conv7d}`).join(' · '));
console.log('Last 3 days: ' + last3.map(d => `${d.date} $${d.spend} / ${d.conv} conv`).join(' · '));
for (const f of fails) console.log('FAIL: ' + f);
for (const w of watches) console.log('WATCH: ' + w);
for (const n of notes) console.log('OK: ' + n);
console.log(`Consecutive PASS days with list members: ${run.consecutivePassWithMembers}`);
console.log(`Saved: ${path.join(OUT_DIR, today + '.json')}`);
