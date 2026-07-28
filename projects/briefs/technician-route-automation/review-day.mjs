#!/usr/bin/env node
// Day review: what each driver actually gets, in run order, for the day-by-day walkthrough.
// Usage: node review-day.mjs 2026-07-27
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname=path.dirname(fileURLToPath(import.meta.url));
const env={};for(const l of fs.readFileSync(path.resolve(__dirname,'../../../.env'),'utf8').split(/\r?\n/)){const m=l.match(/^([A-Z0-9_]+)=(.*)$/);if(m)env[m[1]]=m[2].trim();}
const K=env.OPTIMOROUTE_API_KEY;
const G=JSON.parse(fs.readFileSync(path.join(__dirname,'territory-grid.json'),'utf8'));
const date=process.argv[2]; if(!date){console.log('Usage: review-day.mjs YYYY-MM-DD');process.exit(1);}
const DOW=['sun','mon','tue','wed','thu','fri','sat'][new Date(date+'T12:00:00Z').getUTCDay()];
const r=await(await fetch(`https://api.optimoroute.com/v1/get_routes?key=${K}&date=${date}`)).json();
const hm=s=>{s=(s||'').trim(); return s.includes(' ')? s.split(' ')[1].slice(0,5) : s.slice(0,5);};
const mins=s=>{const t=hm(s);if(!t)return 0;const[a,b]=t.split(':').map(Number);return a*60+b;};
console.log(`\n########  ${DOW.toUpperCase()} ${date}  ########`);
for(const rt of (r.routes||[]).sort((a,b)=>(b.stops||[]).length-(a.stops||[]).length)){
  const st=rt.stops||[];
  if(!st.length) continue;
  const span=((mins(st[st.length-1].scheduledAt)-mins(st[0].scheduledAt))/60).toFixed(1);
  console.log(`\n=== ${rt.driverName} — ${st.length} stops, ${hm(st[0].scheduledAt)}-${hm(st[st.length-1].scheduledAt)} (${span}h), ${Math.round(rt.distance)} mi, drive ${Math.round(rt.duration/60)}h`);
  // collapse consecutive same-city stops into runs
  const runs=[]; let curCity=null;
  for(const s of st){
    const a=(s.address||'').split(',');
    const city=(a[1]||'?').trim();
    const zip=((a[2]||'').trim().split(/\s+/)[1])||'';
    const g=G.zips[zip];
    const foreign = g && g.tech !== rt.driverName;
    const offday  = g && g.day !== DOW;
    if(!curCity||curCity.city!==city){ curCity={city,n:0,zips:new Set(),foreign:0,offday:0,first:hm(s.scheduledAt),names:[]}; runs.push(curCity); }
    curCity.n++; if(zip)curCity.zips.add(zip); if(foreign)curCity.foreign++; if(offday)curCity.offday++;
    if(curCity.names.length<3) curCity.names.push((s.locationName||'').split(' · ')[0]);
    curCity.last=hm(s.scheduledAt);
  }
  for(const run of runs){
    const flags=[];
    if(run.foreign) flags.push(`${run.foreign} not ${rt.driverName.split(' ')[0]}'s zip`);
    if(run.offday)  flags.push(`${run.offday} off grid-day`);
    console.log(`   ${run.first}-${run.last}  ${String(run.n).padStart(3)}  ${run.city.padEnd(16)} [${[...run.zips].join(',')}]  ${run.names.join(', ')}${run.n>3?', …':''}${flags.length?'   << '+flags.join(' | '):''}`);
  }
}
const un=(r.routes||[]).filter(x=>!(x.stops||[]).length).map(x=>x.driverName);
if(un.length) console.log(`\n(no route: ${un.join(', ')})`);
