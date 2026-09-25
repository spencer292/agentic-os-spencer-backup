import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
const __dirname=path.dirname(fileURLToPath(import.meta.url));
const env={};for(const l of fs.readFileSync(path.resolve(__dirname,'../../../.env'),'utf8').split(/\r?\n/)){const m=l.match(/^([A-Z0-9_]+)=(.*)$/);if(m)env[m[1]]=m[2].trim();}
const K=env.OPTIMOROUTE_API_KEY;
const DAYS=['2026-08-31','2026-09-01','2026-09-02','2026-09-03','2026-09-04'];
const DOW={'2026-08-31':'Mon','2026-09-01':'Tue','2026-09-02':'Wed','2026-09-03':'Thu','2026-09-04':'Fri'};
const hm=s=>s?s.slice(-8,-3):'--:--';
const mins=s=>{const[a,b]=hm(s).split(':').map(Number);return a*60+b;};
const fmt=m=>`${Math.floor(m/60)}h${String(Math.round(m%60)).padStart(2,'0')}`;
const out={};
for(const d of DAYS){
  const r=await(await fetch(`https://api.optimoroute.com/v1/get_routes?key=${K}&date=${d}`)).json();
  for(const rt of r.routes||[]){
    const stops=(rt.stops||[]).filter(s=>s.scheduledAtDt||s.scheduledAt);
    if(!stops.length)continue;
    const t=s=>s.scheduledAtDt||s.scheduledAt;
    const first=mins(t(stops[0])), lastS=stops[stops.length-1];
    const end=mins(t(lastS))+(lastS.durationMin??lastS.duration??15);
    const drive=stops.reduce((n,s)=>n+(s.travelTime||0)/60,0);
    (out[rt.driverName]=out[rt.driverName]||{})[d]={n:stops.length,first,end,work:end-first,drive,km:rt.distance||0};
  }
}
const techs=Object.keys(out).sort();
for(const tc of techs){
  console.log(`\n${tc}`);
  console.log('  day          stops   first    last-done   worked   driving   miles');
  let tw=0,tn=0,tdr=0,tmi=0;
  for(const d of DAYS){
    const x=out[tc][d];
    if(!x){console.log(`  ${DOW[d]} ${d.slice(5)}        --                            (no route)`);continue;}
    const mi=x.km*0.621371;
    tw+=x.work;tn+=x.n;tdr+=x.drive;tmi+=mi;
    console.log(`  ${DOW[d]} ${d.slice(5)}   ${String(x.n).padStart(5)}   ${fmtT(x.first)}    ${fmtT(x.end)}      ${fmt(x.work).padStart(6)}   ${fmt(x.drive).padStart(7)}  ${mi.toFixed(0).padStart(5)}`);
  }
  console.log(`  WEEK          ${String(tn).padStart(4)}                            ${fmt(tw).padStart(6)}   ${fmt(tdr).padStart(7)}  ${tmi.toFixed(0).padStart(5)}`);
}
function fmtT(m){return `${String(Math.floor(m/60)).padStart(2,'0')}:${String(Math.round(m%60)).padStart(2,'0')}`}
