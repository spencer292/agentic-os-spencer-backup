// READ-ONLY: actual working day per tech for one date, fresh Jobber visits + live OptimoRoute plan.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { serviceDuration } from './service-time.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const env = {};
for (const l of fs.readFileSync(path.resolve(__dirname, '../../../.env'), 'utf8').split(/\r?\n/)) { const m = l.match(/^([A-Z0-9_]+)=(.*)$/); if (m) env[m[1]] = m[2].trim(); }
const D = process.argv[2];
const VF = process.argv[3];
const visits = JSON.parse(fs.readFileSync(VF, 'utf8'));

const svcByJob = new Map(); const techByJob = new Map(); const visitByJob = new Map();
for (const v of visits) {
  const tech = v.assignedUsers?.nodes?.[0]?.name?.full || null;
  const isSet = v.job?.startAt && String(v.job.startAt).slice(0,10) === String(v.startAt).slice(0,10);
  svcByJob.set(String(v.job.jobNumber), serviceDuration(tech, !!isSet, v.job.jobNumber, D));
  techByJob.set(String(v.job.jobNumber), tech);
  visitByJob.set(String(v.job.jobNumber), v);
}

const r = await (await fetch(`https://api.optimoroute.com/v1/get_routes?key=${env.OPTIMOROUTE_API_KEY}&date=${D}`)).json();
const hm = s => String(s||'').slice(11,16);
const mins = t => { const [h,m]=t.split(':').map(Number); return h*60+m; };
const fmt = m => `${Math.floor(m/60)}h${String(Math.round(m%60)).padStart(2,'0')}`;

const rows = []; const ghosts = [];
for (const rt of r.routes || []) {
  const stops = (rt.stops||[]).filter(s => s.scheduledAtDt && /^\d+-\w+$/.test(String(s.orderNo||'')));
  if (!stops.length) continue;
  stops.sort((a,b)=>a.stopNumber-b.stopNumber);
  for (const s of stops) { const j = String(s.orderNo).split('-')[0]; if (!svcByJob.has(j)) ghosts.push({driver: rt.driverName, job: j, at: hm(s.scheduledAtDt), addr: s.locationName || s.address}); }
  const svc = s => svcByJob.get(String(s.orderNo).split('-')[0]) ?? 15;
  const real = stops.filter(s => svcByJob.has(String(s.orderNo).split('-')[0]));
  const calc = arr => {
    if (!arr.length) return null;
    const start = mins(hm(arr[0].scheduledAtDt));
    const end = mins(hm(arr[arr.length-1].scheduledAtDt)) + svc(arr[arr.length-1]);
    const service = arr.reduce((n,s)=>n+svc(s),0);
    const drive = arr.slice(1).reduce((n,s)=>n+Number(s.travelTime||0),0)/60;
    const km = arr.slice(1).reduce((n,s)=>n+Number(s.distance||0),0)/1000;
    return {start,end,service,drive,km,work:end-start,stops:arr.length};
  };
  const all = calc(stops), clean = calc(real);
  rows.push({driver: rt.driverName||'(none)', all, clean,
    commuteMin: Number(stops[0].travelTime||0)/60, commuteKm: Number(stops[0].distance||0)/1000,
    ghosts: stops.length-real.length});
}
const clock = m => `${String(Math.floor(m/60)).padStart(2,'0')}:${String(Math.round(m%60)).padStart(2,'0')}`;
console.log(`\nACTUAL WORKING DAY — ${D} (first job to last job; unpaid commute excluded)\n`);
console.log('TECH                 STOPS   START    END   WORKING  ON-SITE  DRIVING   IDLE   MILES  COMMUTE');
for (const r0 of rows.sort((a,b)=>b.clean.work-a.clean.work)) {
  const c = r0.clean;
  const idle = Math.max(0, c.work - c.service - c.drive);
  console.log(`${r0.driver.padEnd(20)}${String(c.stops).padStart(5)}   ${clock(c.start)}  ${clock(c.end)}  ${fmt(c.work).padStart(7)}  ${fmt(c.service).padStart(7)}  ${fmt(c.drive).padStart(7)}  ${fmt(idle).padStart(5)}  ${(c.km*0.621371).toFixed(0).padStart(5)}  ${r0.commuteMin.toFixed(0).padStart(4)}m${c.work>540?'   << over 9h':''}`);
}
const T = rows.reduce((a,r0)=>({stops:a.stops+r0.clean.stops,work:a.work+r0.clean.work,svc:a.svc+r0.clean.service,drive:a.drive+r0.clean.drive,km:a.km+r0.clean.km}),{stops:0,work:0,svc:0,drive:0,km:0});
console.log(`${'ALL'.padEnd(20)}${String(T.stops).padStart(5)}                 ${fmt(T.work).padStart(7)}  ${fmt(T.svc).padStart(7)}  ${fmt(T.drive).padStart(7)}         ${(T.km*0.621371).toFixed(0).padStart(5)}`);

console.log(`\nJobber visits on ${D}: ${visits.length}   |   routed stops matched: ${T.stops}   |   ghost stops (in OptimoRoute, not in Jobber): ${ghosts.length}`);
if (ghosts.length) { console.log('\nGHOSTS (excluded from the numbers above):'); for (const g of ghosts) console.log(`  ${g.driver.padEnd(18)} job #${g.job}  ${g.at}  ${g.addr||''}`); }

// Jobber visits not on any route
const routed = new Set();
for (const rt of r.routes||[]) for (const s of rt.stops||[]) routed.add(String(s.orderNo).split('-')[0]);
const unrouted = visits.filter(v => !routed.has(String(v.job.jobNumber)));
if (unrouted.length) { console.log(`\nIN JOBBER BUT NOT ON THE MAP (${unrouted.length}):`); for (const v of unrouted) console.log(`  #${v.job.jobNumber}  ${(v.assignedUsers?.nodes?.[0]?.name?.full)||'(unassigned)'}  ${v.property?.address?.city||''} ${v.property?.address?.postalCode||''}  ${v.isComplete?'[complete]':''}`); }
