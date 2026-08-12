#!/usr/bin/env node
// TECH PACE — how fast is each technician, measured from real completion times.
//
// Spencer 2026-08-10: "Cory is much faster than the other guys." Every route estimate up to now has
// assumed ONE service time for everybody, because that is what OptimoRoute plans with — so a day
// quoted at 9h20 is really "9h20 at the average tech's pace", and it is wrong for whoever is fastest.
//
// Measures the gap between consecutive completedAt stamps on the same tech, same day. That gap is
// the real cycle time: drive to the next stop plus the work at it. Gaps over 90 min are dropped as
// lunch/admin, gaps under 2 min as double-taps.
//
// READ-ONLY.
//
// Usage: node tech-pace.mjs --from=2026-07-13 --to=2026-08-09

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname=path.dirname(fileURLToPath(import.meta.url));
const ENV_PATH=path.resolve(__dirname,'../../../.env');
const TZ='America/Los_Angeles';
const flag=(n,d)=>{const a=process.argv.find(x=>x.startsWith('--'+n+'='));return a?a.split('=')[1]:d;};
const FROM=flag('from'), TO=flag('to');
if(!FROM||!TO){console.error('Usage: tech-pace.mjs --from=YYYY-MM-DD --to=YYYY-MM-DD');process.exit(1);}
const env={};
for(const l of fs.readFileSync(ENV_PATH,'utf8').split(/\r?\n/)){const m=l.match(/^([A-Z0-9_]+)=(.*)$/);if(m)env[m[1]]=m[2].trim();}
function saveEnvKey(k,v){let t=fs.readFileSync(ENV_PATH,'utf8');const re=new RegExp('^'+k+'=.*$','m');t=re.test(t)?t.replace(re,k+'='+v):t+'\n'+k+'='+v+'\n';fs.writeFileSync(ENV_PATH,t);}
let tok=null;
async function token(){const r=await fetch('https://api.getjobber.com/api/oauth/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:env.JOBBER_CLIENT_ID,client_secret:env.JOBBER_CLIENT_SECRET,grant_type:'refresh_token',refresh_token:env.JOBBER_REFRESH_TOKEN})});const d=await r.json();
 if(d.refresh_token&&d.refresh_token!==env.JOBBER_REFRESH_TOKEN) saveEnvKey('JOBBER_REFRESH_TOKEN',d.refresh_token); tok=d.access_token;return tok;}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function g(q,v,a){a=a||0;const t=tok||await token();const r=await fetch('https://api.getjobber.com/api/graphql',{method:'POST',headers:{Authorization:'Bearer '+t,'Content-Type':'application/json','X-JOBBER-GRAPHQL-VERSION':'2025-04-16'},body:JSON.stringify({query:q,variables:v})});
 const d=await r.json().catch(function(){return {}});if(d.errors&&JSON.stringify(d.errors).indexOf('THROTTLED')>=0&&a<8){await sleep(2500*Math.pow(2,a));return g(q,v,a+1);}return d;}
const pt=s=>new Date(s).toLocaleString('sv-SE',{timeZone:TZ});

const Q='query($a:String,$after:ISO8601DateTime,$before:ISO8601DateTime){ visits(first:50, after:$a, filter:{ startAt:{ after:$after, before:$before } }){ nodes{ isComplete completedAt startAt property{address{postalCode}} assignedUsers(first:3){nodes{name{full}}} } pageInfo{hasNextPage endCursor} } }';
let cur=null; const rows=[];
for(;;){ const d=await g(Q,{a:cur,after:FROM+'T00:00:00-07:00',before:TO+'T23:59:59-07:00'});
 if(!d.data){console.error('Jobber query failed',JSON.stringify(d).slice(0,250));process.exit(1);}
 for(const v of d.data.visits.nodes){ if(!v.isComplete||!v.completedAt) continue;
   const t=((v.assignedUsers&&v.assignedUsers.nodes)||[]).map(x=>x.name.full)[0]; if(!t) continue;
   rows.push({tech:t,day:pt(v.completedAt).slice(0,10),at:new Date(v.completedAt).getTime()}); }
 if(!d.data.visits.pageInfo.hasNextPage)break; cur=d.data.visits.pageInfo.endCursor; await sleep(400);}
console.log('completed visits with a completion stamp: '+rows.length+'   ('+FROM+' .. '+TO+')\n');

const byTechDay={};
for(const r of rows){ const k=r.tech+'|'+r.day; (byTechDay[k]=byTechDay[k]||[]).push(r.at); }
const gaps={};
for(const [k,list] of Object.entries(byTechDay)){
  const tech=k.split('|')[0]; list.sort((a,b)=>a-b);
  for(let i=1;i<list.length;i++){ const m=(list[i]-list[i-1])/60000;
    if(m<2||m>90) continue; (gaps[tech]=gaps[tech]||[]).push(m); }
}
const med=a=>{const s=a.slice().sort((x,y)=>x-y);return s.length? s[Math.floor(s.length/2)] : null;};
console.log('tech               stops   days   median min/stop   mean    fastest quartile');
const out=[];
for(const [t,a] of Object.entries(gaps).sort((x,y)=>med(x[1])-med(y[1]))){
  const s=a.slice().sort((p,q)=>p-q);
  const m=med(a), mean=a.reduce((p,q)=>p+q,0)/a.length, q1=s[Math.floor(s.length*0.25)];
  const days=new Set(Object.keys(byTechDay).filter(k=>k.split('|')[0]===t)).size;
  console.log('  '+t.padEnd(18)+String(a.length+1).padStart(5)+String(days).padStart(7)+'   '+m.toFixed(1).padStart(10)+'   '+mean.toFixed(1).padStart(6)+'   '+q1.toFixed(1).padStart(8));
  out.push({tech:t,samples:a.length,days,medianMinPerStop:+m.toFixed(1),meanMinPerStop:+mean.toFixed(1),q1:+q1.toFixed(1)});
}
const all=Object.values(gaps).flat();
console.log('\n  ALL TECHS median: '+med(all).toFixed(1)+' min/stop over '+all.length+' measured gaps');
fs.writeFileSync(path.join(__dirname,'tech-pace-'+FROM+'_'+TO+'.json'),JSON.stringify({from:FROM,to:TO,allMedian:+med(all).toFixed(1),techs:out},null,2));
