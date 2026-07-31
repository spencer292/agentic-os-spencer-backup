#!/usr/bin/env node
// Lock every order's tech to the territory grid, whole week. NO rebalancing — the point is to see
// the true grid load so overfilled tech-days can be split across days (Spencer 2026-07-26).
// Order field assignedTo:{serial} (verified 2026-07-26). Grid day already enforced via push-week --grid.
// Usage: node lock-techs-to-grid.mjs dry|live
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname=path.dirname(fileURLToPath(import.meta.url));
const env={};for(const l of fs.readFileSync(path.resolve(__dirname,'../../../.env'),'utf8').split(/\r?\n/)){const m=l.match(/^([A-Z0-9_]+)=(.*)$/);if(m)env[m[1]]=m[2].trim();}
const K=env.OPTIMOROUTE_API_KEY;
const mode=process.argv[2]; if(!['dry','live'].includes(mode)){console.log('Usage: dry|live');process.exit(1);}
// --grid=<file> locks against an alternate grid (used to trial a proposed re-split).
const gArg=process.argv.find(a=>a.startsWith('--grid='));
const G=JSON.parse(fs.readFileSync(path.resolve(__dirname,gArg?gArg.split('=')[1]:'territory-grid.json'),'utf8'));
// --visits=<path> : use a freshly-fetched snapshot (fetch-window-visits.mjs). The default file is a
// hand-made Monday snapshot — anything booked after it is pushed to OR but never tech-locked.
const vArg=process.argv.find(a=>a.startsWith('--visits='));
const V=JSON.parse(fs.readFileSync(vArg?vArg.split('=')[1]:path.join(__dirname,'week-visits-0727-post-dedup.json'),'utf8'));
const del=new Set(JSON.parse(fs.readFileSync(path.join(__dirname,'deleted-visits-0726.json'),'utf8')).map(d=>d.num));
const manifest=new Set(fs.readFileSync(path.join(__dirname,'last-push-manifest.txt'),'utf8').split(/\r?\n/).filter(Boolean));
// who actually works which day (OptimoRoute driver availability, set 2026-07-26)
// A grid file may carry its own `works` map, so an alternate grid can add or retire a driver without
// editing this script (needed when the roster changes — e.g. a new solo tech, or a tech out of field).
const WORKS=G.works||{
 'Luke LaVergne':      ['mon','tue','wed','thu','fri'],
 'Cory Ventura':       ['mon','tue','wed','thu','fri'],
 'Cammeron Anderson':  ['mon','tue','wed','thu'],
 'Spencer Hill':       ['tue','wed','thu','fri'],   // tue peninsula + fri I-90 Snoqualmie/Fall City (Spencer 2026-07-26)
};
const rows=[], conflicts=[];
for(const v of V){
  if(v.isComplete) continue;
  let num; try{num=Buffer.from(v.id,'base64').toString('utf8').split('/').pop()}catch{}
  if(!num||del.has(num)) continue;
  const jn=String(v.job?.jobNumber), orderNo=`${jn}-${num}`;
  if(!manifest.has(orderNo)) continue;
  const zip=(v.property?.address?.postalCode||'').trim().slice(0,5);
  const ov=G.jobOverrides?.[jn], g=G.zips[zip];
  // a zip may be a TWO-DAY ZONE (days:[a,b]); tech ownership is the same either way
  const days=(ov&&(ov.days||(ov.day&&[ov.day])))||(g&&(g.days||(g.day&&[g.day])))||null;
  const tech=ov?.tech||g?.tech;
  if(!days||!days.length||!tech){ conflicts.push({orderNo,zip,why:'zip not in grid'}); continue; }
  const workable=days.filter(d=>(WORKS[tech]||[]).includes(d));
  if(!workable.length){ conflicts.push({orderNo,zip,tech,day:days.join('/'),why:`${tech} does not work ${days.join('/')}`}); continue; }
  rows.push({orderNo, tech, day:workable.join('/'), zip, city:v.property?.address?.city});
}
const cells={};
for(const r of rows) cells[`${r.day}|${r.tech}`]=(cells[`${r.day}|${r.tech}`]||0)+1;
const TECHS=Object.keys(WORKS);
console.log('grid load, no rebalancing:\n');
console.log('day  ' + TECHS.map(t=>t.split(' ')[0].padStart(11)).join(''));
for(const d of ['mon','tue','wed','thu','fri'])
  console.log(`${d}  ` + TECHS.map(t=>{const c=cells[`${d}|${t}`]; return String(c==null?'-':c).padStart(11);}).join(''));
console.log(`\nassignable: ${rows.length}`);
if(conflicts.length){ console.log(`CONFLICTS (left unassigned for the optimizer): ${conflicts.length}`);
  for(const c of conflicts.slice(0,10)) console.log(`   ${c.orderNo} ${c.zip} — ${c.why}`); }
if(mode==='dry'){ console.log('\nDRY — nothing written.'); process.exit(0); }
// serialAliases lets a grid name a tech who has no OptimoRoute driver record yet, mapping them onto an
// existing serial purely so the week can be built and measured. Remove the alias once the real driver
// exists — it only affects OptimoRoute assignment, never a Jobber write.
const AL=G.serialAliases||{};
if(Object.keys(AL).length) console.log('serial aliases (measurement shim):',JSON.stringify(AL));
const orders=rows.map(r=>({operation:'UPDATE', orderNo:r.orderNo, assignedTo:{serial:AL[r.tech]||r.tech}}));
let ok=0,fail=0;
for(let i=0;i<orders.length;i+=100){
  const res=await fetch(`https://api.optimoroute.com/v1/create_or_update_orders?key=${K}`,{method:'POST',
    headers:{'Content-Type':'application/json'},body:JSON.stringify({orders:orders.slice(i,i+100)})});
  const j=await res.json();
  for(const o of j.orders||[]){ if(o.success) ok++; else { fail++; if(fail<5) console.log('  FAIL',o.orderNo,o.code); } }
  if(!j.orders) console.log('  batch error', JSON.stringify(j).slice(0,200));
}
console.log(`\nassigned ${ok}, failed ${fail}`);
