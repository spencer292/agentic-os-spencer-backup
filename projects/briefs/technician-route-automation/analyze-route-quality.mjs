#!/usr/bin/env node
// Route-quality diagnostic. Answers "is the sequence bad, or is the DAY'S STOP SET bad?" — the two
// have completely different fixes. Built 2026-07-29 after Spencer reported passing the same jobs
// twice while covering Cammeron's Monday.
//
// Per route it reports:
//   - planned road miles / travel time from OptimoRoute's own numbers, vs service time and span
//     (self-consistency check: an impossible plan means the field day diverges from it by lunchtime)
//   - BACKTRACK: OR's stop order vs a 2-opt re-solve, both measured as straight-line miles, so the
//     ratio is metric-consistent and shows how much the SEQUENCE alone is leaving on the table
//   - DOUBLE-PASS: pairs of stops within --near miles of each other but >=3 apart in the sequence,
//     i.e. the truck left a neighborhood and came back. This is what "I drove past it twice" is.
//   - SPREAD: radius of the day's stop set. A big radius with tight clusters means the DAY ASSIGNMENT
//     (which zips are on which day) is the problem, not the optimizer.
//
// Usage: node analyze-route-quality.mjs 2026-07-27 [more dates...] [--near=0.5] [--service=10] [--csv]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const env = {};
for (const l of fs.readFileSync(path.resolve(__dirname, '../../../.env'), 'utf8').split(/\r?\n/)) { const m = l.match(/^([A-Z0-9_]+)=(.*)$/); if (m) env[m[1]] = m[2].trim(); }
const K = env.OPTIMOROUTE_API_KEY;

const dates = process.argv.slice(2).filter(a => /^\d{4}-\d{2}-\d{2}$/.test(a));
if (!dates.length) { console.log('Usage: analyze-route-quality.mjs YYYY-MM-DD [...] [--near=0.5] [--service=10]'); process.exit(1); }
const arg = (n, d) => { const a = process.argv.find(x => x.startsWith(`--${n}=`)); return a ? Number(a.split('=')[1]) : d; };
const NEAR = arg('near', 0.5);        // miles — "same neighborhood"
const SERVICE = arg('service', 10);   // minutes per stop assumed by the push

const R = 3958.8;
const hav = (a, b) => {
  const p = Math.PI / 180, dLat = (b.lat - a.lat) * p, dLon = (b.lon - a.lon) * p;
  const la1 = a.lat * p, la2 = b.lat * p;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};
const tour = pts => { let t = 0; for (let i = 1; i < pts.length; i++) t += hav(pts[i - 1], pts[i]); return t; };

// 2-opt with the endpoints free (an open path — techs don't return to a depot)
function twoOpt(pts) {
  let best = pts.slice(), improved = true, guard = 0;
  while (improved && guard++ < 400) {
    improved = false;
    for (let i = 0; i < best.length - 2; i++) {
      for (let j = i + 2; j < best.length; j++) {
        const a = best.slice(0, i + 1), b = best.slice(i + 1, j + 1).reverse(), c = best.slice(j + 1);
        const cand = a.concat(b, c);
        if (tour(cand) < tour(best) - 1e-9) { best = cand; improved = true; }
      }
    }
  }
  return best;
}

const hm = s => (s || '').slice(11, 16);
const rows = [];
for (const date of dates) {
  const r = await (await fetch(`https://api.optimoroute.com/v1/get_routes?key=${K}&date=${date}`)).json();
  if (!r.success) { console.log(date, 'get_routes failed', JSON.stringify(r).slice(0, 150)); continue; }
  const dow = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][new Date(date + 'T12:00:00Z').getUTCDay()];
  console.log(`\n############  ${dow} ${date}  ############`);
  for (const rt of (r.routes || []).sort((a, b) => (b.stops || []).length - (a.stops || []).length)) {
    const st = rt.stops || [];
    if (st.length < 3) continue;
    const pts = st.map(s => ({ lat: s.latitude, lon: s.longitude, name: (s.locationName || '').split(' · ')[0], city: (s.address || '').split(',')[1]?.trim() || '?', at: hm(s.scheduledAtDt) }));

    const roadMi = st.reduce((a, s) => a + (s.distance || 0), 0) / 1609.34;
    // stop[0].travelTime is the drive TO the first job — it happens BEFORE the span (first arrival ->
    // last arrival), so counting it makes every route look impossible. Same for the last stop's
    // service, which lands after the final arrival.
    const travelMin = st.slice(1).reduce((a, s) => a + (s.travelTime || 0), 0) / 60;
    const commuteMin = (st[0].travelTime || 0) / 60;
    const serviceMin = (st.length - 1) * SERVICE;
    const first = st[0].scheduledAtDt, last = st[st.length - 1].scheduledAtDt;
    const spanMin = (new Date(last.replace(' ', 'T')) - new Date(first.replace(' ', 'T'))) / 60000;

    const asIs = tour(pts);
    const opt = twoOpt(pts);
    const optLen = tour(opt);
    const slack = asIs > 0 ? (asIs - optLen) / asIs * 100 : 0;

    // double-pass detection
    const dbl = [];
    for (let i = 0; i < pts.length; i++)
      for (let j = i + 3; j < pts.length; j++)
        if (hav(pts[i], pts[j]) <= NEAR) dbl.push({ i, j, mi: hav(pts[i], pts[j]), gap: j - i, a: pts[i], b: pts[j] });
    // keep the worst (largest sequence gap) per neighborhood
    dbl.sort((a, b) => b.gap - a.gap);
    const seen = new Set(), worst = [];
    for (const d of dbl) { const k = `${Math.round(d.a.lat * 50)}|${Math.round(d.a.lon * 50)}`; if (seen.has(k)) continue; seen.add(k); worst.push(d); }

    // spread
    const cLat = pts.reduce((a, p) => a + p.lat, 0) / pts.length, cLon = pts.reduce((a, p) => a + p.lon, 0) / pts.length;
    const radii = pts.map(p => hav(p, { lat: cLat, lon: cLon })).sort((a, b) => a - b);
    const radius = radii[radii.length - 1], p90 = radii[Math.floor(radii.length * 0.9)];
    const hops = [];
    for (let i = 1; i < pts.length; i++) hops.push({ mi: hav(pts[i - 1], pts[i]), from: pts[i - 1], to: pts[i] });
    hops.sort((a, b) => b.mi - a.mi);

    const feasible = travelMin + serviceMin;
    console.log(`\n=== ${rt.driverName} — ${st.length} stops, ${hm(first)}-${hm(last)} (${(spanMin / 60).toFixed(1)}h span)`);
    console.log(`    OR plan: ${roadMi.toFixed(0)} road mi, ${(travelMin / 60).toFixed(1)}h in-day driving + ${(serviceMin / 60).toFixed(1)}h service @${SERVICE}min = ${(feasible / 60).toFixed(1)}h vs ${(spanMin / 60).toFixed(1)}h span (${commuteMin.toFixed(0)}min commute to stop 1)  ${feasible > spanMin + 15 ? `<<< OVER by ${((feasible - spanMin) / 60).toFixed(1)}h at ${SERVICE}min/stop` : 'consistent'}`);
    console.log(`    SEQUENCE: ${asIs.toFixed(1)} straight-line mi as planned vs ${optLen.toFixed(1)} mi 2-opt best = ${slack.toFixed(0)}% slack${slack > 12 ? '   <<< BAD SEQUENCE' : ''}`);
    console.log(`    SPREAD: ${radius.toFixed(1)} mi max radius (p90 ${p90.toFixed(1)} mi) — ${radius > 18 ? 'SPRAWLING DAY SET' : 'compact'}`);
    if (worst.length) {
      console.log(`    DOUBLE-PASS: ${worst.length} neighborhood(s) left and returned to:`);
      for (const d of worst.slice(0, 6))
        console.log(`       stop ${d.i + 1} ${d.a.at} ${d.a.city} (${d.a.name}) -> came back at stop ${d.j + 1} ${d.b.at} (${d.b.name}), ${d.mi.toFixed(2)} mi apart, ${d.gap} stops later`);
    }
    console.log(`    LONGEST HOPS: ` + hops.slice(0, 3).map(h => `${h.mi.toFixed(1)}mi ${h.from.city}->${h.to.city}`).join(' | '));
    rows.push({ date, driver: rt.driverName, stops: st.length, roadMi: +roadMi.toFixed(0), driveH: +(travelMin / 60).toFixed(1), spanH: +(spanMin / 60).toFixed(1), needH: +(feasible / 60).toFixed(1), slackPct: +slack.toFixed(0), radiusMi: +radius.toFixed(1), doublePass: worst.length });
  }
}
console.log('\n\n======== SUMMARY ========');
console.log('date        driver               stops  roadmi  drive  span  needed  seq-slack  radius  dbl');
for (const r of rows) console.log(`${r.date}  ${r.driver.padEnd(20)} ${String(r.stops).padStart(5)} ${String(r.roadMi).padStart(7)} ${String(r.driveH).padStart(6)}h ${String(r.spanH).padStart(5)}h ${String(r.needH).padStart(6)}h ${String(r.slackPct).padStart(9)}% ${String(r.radiusMi).padStart(7)} ${String(r.doublePass).padStart(4)}`);
fs.writeFileSync(path.join(__dirname, 'route-quality-report.json'), JSON.stringify(rows, null, 1));
