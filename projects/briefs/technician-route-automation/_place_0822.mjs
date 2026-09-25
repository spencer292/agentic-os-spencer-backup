#!/usr/bin/env node
// READ-ONLY. Place the 2026-08-22 cadence adds onto the day their zip is actually served next week.
import fs from 'node:fs'; import path from 'node:path'; import {fileURLToPath} from 'node:url';
const __dirname=path.dirname(fileURLToPath(import.meta.url));
const ENV=path.resolve(__dirname,'../../../.env');
const env={};for(const l of fs.readFileSync(ENV,'utf8').split(/\r?\n/)){const m=l.match(/^([A-Z0-9_]+)=(.*)$/);if(m)env[m[1]]=m[2].trim();}
const tr=await(await fetch('https://api.getjobber.com/api/oauth/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},
 body:new URLSearchParams({client_id:env.JOBBER_CLIENT_ID,client_secret:env.JOBBER_CLIENT_SECRET,grant_type:'refresh_token',refresh_token:env.JOBBER_REFRESH_TOKEN})})).json();
if(tr.refresh_token&&tr.refresh_token!==env.JOBBER_REFRESH_TOKEN) fs.writeFileSync(ENV,fs.readFileSync(ENV,'utf8').replace(/^JOBBER_REFRESH_TOKEN=.*$/m,'JOBBER_REFRESH_TOKEN='+tr.refresh_token));
const tok=tr.access_token; const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const gql=async(q,v,a=0)=>{const r=await fetch('https://api.getjobber.com/api/graphql',{method:'POST',headers:{Authorization:'Bearer '+tok,'Content-Type':'application/json','X-JOBBER-GRAPHQL-VERSION':'2025-04-16'},body:JSON.stringify({query:q,variables:v})});
 const d=await r.json();if(d.errors&&JSON.stringify(d.errors).includes('THROTTL')&&a<8){await sleep(2500*2**a);return gql(q,v,a+1);}return d;};
const pt=s=>new Date(s).toLocaleString('sv-SE',{timeZone:'America/Los_Angeles'}).slice(0,10);
const DOW=['sun','mon','tue','wed','thu','fri','sat'];
const dowOf=d=>DOW[new Date(d+'T12:00:00Z').getUTCDay()];

// next-week board with zips
const Q='query($a:String){ visits(first:50, after:$a, filter:{ startAt:{ after:"2026-08-24T00:00:00-07:00", before:"2026-08-28T23:59:59-07:00" } }){ nodes{ startAt isComplete property{address{postalCode city}} assignedUsers(first:3){nodes{name{full}}} } pageInfo{hasNextPage endCursor} } }';
let cur=null; const board=[];
for(;;){const d=await gql(Q,{a:cur}); if(!d.data){console.log('ERR',JSON.stringify(d).slice(0,300));process.exit(1);}
 for(const v of d.data.visits.nodes) if(!v.isComplete) board.push({date:pt(v.startAt),zip:(v.property?.address?.postalCode||'').trim().slice(0,5),tech:(v.assignedUsers?.nodes||[])[0]?.name?.full||'NONE'});
 if(!d.data.visits.pageInfo.hasNextPage)break; cur=d.data.visits.pageInfo.endCursor; await sleep(400);}
console.log('next-week open visits 08-24..08-28:',board.length);

const grid=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../callrail-faq/service-day-lookup/zip-day-lookup.json'),'utf8'));
const byZip={}; for(const r of grid.records) byZip[r.zip]=r;
const plan=JSON.parse(fs.readFileSync(path.join(__dirname,'_cadence_0822.json'),'utf8'));

const out=[];
console.log('\njob    client               zip    city          due         grid day/tech            next-wk stops in zip by day        -> PLACE');
for(const r of plan.rows){
  if(!r.target){ continue; }
  const zip=String(r.zip||'').trim().slice(0,5);
  const g=byZip[zip];
  const inZip=board.filter(b=>b.zip===zip);
  const byDay={}; for(const b of inZip){const k=b.date+'|'+b.tech; byDay[k]=(byDay[k]||0)+1;}
  const ranked=Object.entries(byDay).map(([k,n])=>({date:k.split('|')[0],tech:k.split('|')[1],n})).sort((a,b)=>a.date.localeCompare(b.date));
  const onOrAfter=ranked.filter(x=>x.date>=r.target);
  const pick=onOrAfter[0]||ranked[0]||null;
  out.push({...r, zip, gridDays:g?g.days.join('/'):'?', gridTech:g?g.tech:'?', gridConf:g?g.confidence:'?', gridProvisional:g?g.provisional:null,
    place:pick?pick.date:null, placeDow:pick?dowOf(pick.date):null, placeTech:pick?pick.tech:(g?g.tech:r.tech), sameZipStops:pick?pick.n:0,
    zipDayMap:ranked.map(x=>x.date+'('+dowOf(x.date)+') '+x.tech.split(' ')[0]+' x'+x.n).join(', ')});
  const o=out[out.length-1];
  console.log(('#'+r.jn).padEnd(6)+String(r.client).slice(0,18).padEnd(21)+zip.padEnd(7)+String(r.city).slice(0,12).padEnd(14)+String(r.target).padEnd(12)+(o.gridDays+'/'+String(o.gridTech).split(' ')[0]).padEnd(24)+(o.zipDayMap||'(none)').padEnd(34)+' -> '+String(o.place||'??')+' '+(o.placeDow||'')+' '+String(o.placeTech).split(' ')[0]);
}
fs.writeFileSync(path.join(__dirname,'_adds_plan_0822.json'),JSON.stringify(out,null,2));
console.log('\nplan -> _adds_plan_0822.json  ('+out.length+' adds)');
