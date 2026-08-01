#!/usr/bin/env node
// Reconcile Jobber against the OptimoRoute plan, per day, per tech. The check that catches a
// double-loaded day (hit 2026-07-26 when a scoped write left Monday at 147 vs a 99-stop plan).
import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
const __dirname=path.dirname(fileURLToPath(import.meta.url));
const env={};for(const l of fs.readFileSync(path.resolve(__dirname,'../../../.env'),'utf8').split(/\r?\n/)){const m=l.match(/^([A-Z0-9_]+)=(.*)$/);if(m)env[m[1]]=m[2].trim();}
const K=env.OPTIMOROUTE_API_KEY;
const tr=await(await fetch('https://api.getjobber.com/api/oauth/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},
 body:new URLSearchParams({client_id:env.JOBBER_CLIENT_ID,client_secret:env.JOBBER_CLIENT_SECRET,grant_type:'refresh_token',refresh_token:env.JOBBER_REFRESH_TOKEN})})).json();
const tok=tr.access_token;
// Roster and week are arguments now, not literals: --grid=<file> takes the roster from the grid's
// `works` map, --week=<monday> picks the five weekdays. Defaults reproduce the 07-27 week.
const gArg=process.argv.find(a=>a.startsWith('--grid='));
const G=gArg?JSON.parse(fs.readFileSync(path.resolve(__dirname,gArg.split('=')[1]),'utf8')):null;
const DRIVERS=G?Object.keys(G.works||{}):['Luke LaVergne','Cory Ventura','Cammeron Anderson','Spencer Hill'];
// Alias Franks left this rule 2026-07-31 — own truck from the week of 08-03.
const RIDE=/norton/i;
// A grid may run a tech on someone else's OptimoRoute serial until their driver record exists;
// OptimoRoute reports the borrowed name, so fold it back before comparing against Jobber.
const UNALIAS={};for(const [real,serial] of Object.entries((G&&G.serialAliases)||{})) UNALIAS[serial]=real;
const wArg=process.argv.find(a=>a.startsWith('--week='));
const mon=wArg?wArg.split('=')[1]:'2026-07-27';
const addD=(d,n)=>{const [y,m,dd]=d.split('-').map(Number);return new Date(Date.UTC(y,m-1,dd+n)).toISOString().slice(0,10);};
const days=['MON','TUE','WED','THU','FRI'].map((nm,i)=>[nm,addD(mon,i)]);
let bad=0;
for(const [nm,d] of days){
  const q=async a=>{const r=await fetch('https://api.getjobber.com/api/graphql',{method:'POST',
   headers:{Authorization:`Bearer ${tok}`,'Content-Type':'application/json','X-JOBBER-GRAPHQL-VERSION':'2023-11-15'},
   body:JSON.stringify({query:`query($a:String){ visits(first:50, after:$a, filter:{ startAt:{ after:"${d}T00:00:00-07:00", before:"${d}T23:59:59-07:00" } }){ nodes{ id isComplete assignedUsers(first:4){nodes{name{full}}} job{jobNumber} } pageInfo{hasNextPage endCursor} } }`,variables:{a}})});
   return (await r.json()).data.visits;};
  let all=[],cur=null;
  for(;;){const v=await q(cur);all.push(...v.nodes);if(!v.pageInfo.hasNextPage)break;cur=v.pageInfo.endCursor;await new Promise(r=>setTimeout(r,300));}
  const live=all.filter(v=>!v.isComplete);
  const jb={}; let noDriver=0, rideKept=0, nonWorking=0; const offRoster={};
  for(const v of live){
    const names=(v.assignedUsers?.nodes||[]).map(u=>u.name.full);
    const drv=names.find(n=>DRIVERS.includes(n));
    if(!drv) noDriver++; else jb[drv]=(jb[drv]||0)+1;
    if(names.some(n=>RIDE.test(n))) rideKept++;
    // anyone assigned who is neither on the roster nor a ride-along is a stale assignment —
    // the visit looks covered in Jobber but nobody is driving it (Tavis's 100 next week).
    for(const n of names) if(!DRIVERS.includes(n)&&!RIDE.test(n)){offRoster[n]=(offRoster[n]||0)+1;nonWorking++;}
  }
  const r=await(await fetch(`https://api.optimoroute.com/v1/get_routes?key=${K}&date=${d}`)).json();
  const or={}; for(const rt of r.routes||[]){const n=(rt.stops||[]).length; if(n) or[UNALIAS[rt.driverName]||rt.driverName]=n;}
  const techs=[...new Set([...Object.keys(jb),...Object.keys(or)])].sort();
  const jt=Object.values(jb).reduce((a,b)=>a+b,0), ot=Object.values(or).reduce((a,b)=>a+b,0);
  const flag = (jt!==ot||noDriver||nonWorking) ? '  <<< MISMATCH' : '  ok';
  console.log(`\n${nm} ${d}   jobber ${jt} | optimo ${ot}${flag}`);
  for(const t of techs){
    const a=jb[t]||0,b=or[t]||0;
    console.log(`   ${t.padEnd(20)} jobber ${String(a).padStart(3)}   optimo ${String(b).padStart(3)}${a!==b?'   <<< differs':''}`);
  }
  if(noDriver) console.log(`   !! ${noDriver} visits with NO driver attached`);
  if(nonWorking) console.log(`   !! ${nonWorking} visits on techs who are not driving: ${Object.entries(offRoster).map(([n,c])=>`${n} ${c}`).join(', ')}`);
  if(rideKept) console.log(`   (${rideKept} visits keep a ride-along attached)`);
  if(jt!==ot||noDriver||nonWorking) bad++;
}
console.log(bad?`\n${bad} day(s) need attention`:'\nAll five days reconcile.');
