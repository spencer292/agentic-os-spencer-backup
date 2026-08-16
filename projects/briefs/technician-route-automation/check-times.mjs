#!/usr/bin/env node
// CHECK TIMES — sanity-check the OptimoRoute plan before its arrival times are written to Jobber.
// Read-only. This is the last look before customer-facing times exist, so it asks the questions
// that only matter once a real person is told "we'll be there at":
//
//   1. outside hours      — a stop before 07:00 or finishing after 18:00
//   2. weekend            — Got Moles is Mon-Fri; a Sat/Sun stop is a defect, never a route
//   3. out of sequence    — stop N+1 timed before stop N on the same tech (would mean bad data)
//   4. impossible gap     — a stop timed before the previous one could physically be finished
//   5. big movers         — visits whose time shifts by hours vs what Jobber holds now, which is
//                           what an already-notified customer would experience as a change
//   6. unscheduled        — on the board but on nobody's route
//
// Usage: node check-times.mjs <from> <to> --visits=<snapshot.json>

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { serviceDuration } from './service-time.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const env = {};
for (const l of fs.readFileSync(path.resolve(__dirname, '../../../.env'), 'utf8').split(/\r?\n/)) {
  const m = l.match(/^([A-Z0-9_]+)=(.*)$/); if (m) env[m[1]] = m[2].trim();
}
const K = env.OPTIMOROUTE_API_KEY;
const FROM = process.argv[2], TO = process.argv[3];
const vArg = process.argv.find(a => a.startsWith('--visits='));
if (!FROM || !TO || !vArg) { console.log('Usage: check-times.mjs <from> <to> --visits=<snapshot.json>'); process.exit(1); }

const TZ = 'America/Los_Angeles';
const toPT = s => new Date(s).toLocaleString('sv-SE', { timeZone: TZ });
const addDays = (s, n) => { const [y, m, d] = s.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10); };
const dowN = s => new Date(s + 'T12:00:00Z').getUTCDay();
const dow = s => ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][dowN(s)];
const hm = s => { s = (s || '').trim(); return s.includes(' ') ? s.split(' ')[1].slice(0, 5) : s.slice(0, 5); };
const mins = s => { const t = hm(s); if (!t) return 0; const [a, b] = t.split(':').map(Number); return a * 60 + b; };
const clock = m => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
function visitNumOf(v) {
  let n = null;
  try { n = Buffer.from(v.id, 'base64').toString('utf8').split('/').pop(); } catch (e) {}
  if (!n || !/^\d+$/.test(n)) n = v.id.replace(/[^a-zA-Z0-9]/g, '').slice(-10);
  return n;
}

const V = JSON.parse(fs.readFileSync(path.resolve(__dirname, vArg.split('=')[1]), 'utf8'));
const board = {};   // orderNo -> {date, label, jobberTime, isSet}
for (const v of V) {
  const pt = toPT(v.startAt);
  board[`${v.job?.jobNumber}-${visitNumOf(v)}`] = {
    date: pt.slice(0, 10), label: `#${v.job?.jobNumber} ${v.title || ''}`.trim(),
    jobberTime: pt.slice(11, 16),
    isSet: v.job?.startAt ? toPT(v.job.startAt).slice(0, 10) === pt.slice(0, 10) : false,
  };
}

const dates = [];
for (let d = FROM; d <= TO; d = addDays(d, 1)) dates.push(d);

const outside = [], weekend = [], outOfOrder = [], tooTight = [], movers = [], unscheduled = [], anytime = [];
let routed = 0, willWrite = 0;

for (const date of dates) {
  const r = await (await fetch(`https://api.optimoroute.com/v1/get_routes?key=${K}&date=${date}`)).json();
  const routes = (r.routes || []).filter(rt => (rt.stops || []).length);
  const seen = new Set();
  for (const rt of routes) {
    const st = rt.stops;
    for (let i = 0; i < st.length; i++) {
      const s = st[i];
      const o = String(s.orderNo || '');
      const b = board[o];
      routed++; seen.add(o);
      const svc = serviceDuration(rt.driverName, b?.isSet || false, o.split('-')[0]);
      const start = mins(s.scheduledAt), end = start + svc;
      const who = `${dow(date)} ${rt.driverName.split(' ')[0]} stop ${i + 1}  ${b?.label || o}`;

      if (dowN(date) === 0 || dowN(date) === 6) weekend.push(`${who} — ${date} is a ${dow(date)}`);
      if (start < 7 * 60) outside.push(`${who} — starts ${hm(s.scheduledAt)}, before 07:00`);
      if (end > 18 * 60) outside.push(`${who} — finishes ${clock(end)}, after 18:00`);
      if (i > 0) {
        const prev = st[i - 1], pb = board[String(prev.orderNo || '')];
        const prevEnd = mins(prev.scheduledAt) + serviceDuration(rt.driverName, pb?.isSet || false, String(prev.orderNo).split('-')[0]);
        if (start < mins(prev.scheduledAt)) outOfOrder.push(`${who} — ${hm(s.scheduledAt)} is before the previous stop's ${hm(prev.scheduledAt)}`);
        else if (start < prevEnd) tooTight.push(`${who} — starts ${hm(s.scheduledAt)} but the previous stop is not done until ${clock(prevEnd)}`);
      }
      if (b) {
        if (b.jobberTime === '00:00') anytime.push(o);
        else {
          const delta = Math.abs(start - mins(b.jobberTime));
          if (delta >= 180) movers.push({ label: b.label, day: dow(date), from: b.jobberTime, to: hm(s.scheduledAt), delta });
        }
        if (b.jobberTime !== hm(s.scheduledAt)) willWrite++;
      }
    }
  }
  for (const [o, b] of Object.entries(board)) if (b.date === date && !seen.has(o)) unscheduled.push(`${dow(date)} ${b.label}`);
}

const line = (name, arr, show = 8) => {
  console.log(`  ${arr.length === 0 ? 'OK  ' : '!!  '}${name.padEnd(34)} ${arr.length}`);
  for (const x of arr.slice(0, show)) console.log(`        ${typeof x === 'string' ? x : JSON.stringify(x)}`);
  if (arr.length > show) console.log(`        … +${arr.length - show} more`);
};

console.log(`\nTIME CHECK — ${FROM}..${TO}   (read-only, nothing written)\n`);
console.log(`  routed stops: ${routed}   board visits: ${Object.keys(board).length}   would write a new time: ${willWrite}`);
console.log(`  currently "anytime" in Jobber (no clock time yet): ${anytime.length}\n`);
line('weekend stops', weekend);
line('outside 07:00-18:00', outside);
line('out of sequence', outOfOrder);
line('starts before previous finishes', tooTight);
line('unscheduled (on board, not routed)', unscheduled);
movers.sort((a, b) => b.delta - a.delta);
line('moving 3h+ vs the time Jobber holds', movers.map(m => `${m.day} ${m.label} — ${m.from} -> ${m.to} (${(m.delta / 60).toFixed(1)}h)`), 10);
const bad = weekend.length + outside.length + outOfOrder.length + tooTight.length + unscheduled.length;
console.log(`\n  ${bad === 0 ? 'CLEAN — no structural problems in the plan.' : `${bad} structural issue(s) to look at before writing.`}`);
