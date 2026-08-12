import fs from 'node:fs';
const ENV='../../../.env';
const env={};for(const l of fs.readFileSync(ENV,'utf8').split(/\r?\n/)){const m=l.match(/^([A-Z0-9_]+)=(.*)$/);if(m)env[m[1]]=m[2].trim();}
let tok=null;
async function token(){const r=await fetch('https://api.getjobber.com/api/oauth/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:env.JOBBER_CLIENT_ID,client_secret:env.JOBBER_CLIENT_SECRET,grant_type:'refresh_token',refresh_token:env.JOBBER_REFRESH_TOKEN})});const d=await r.json();
 if(d.refresh_token&&d.refresh_token!==env.JOBBER_REFRESH_TOKEN){let t=fs.readFileSync(ENV,'utf8');t=t.replace(/^JOBBER_REFRESH_TOKEN=.*$/m,'JOBBER_REFRESH_TOKEN='+d.refresh_token);fs.writeFileSync(ENV,t);}tok=d.access_token;return tok;}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function g(q,v,a=0){const t=tok||await token();const r=await fetch('https://api.getjobber.com/api/graphql',{method:'POST',headers:{Authorization:'Bearer '+t,'Content-Type':'application/json','X-JOBBER-GRAPHQL-VERSION':'2025-04-16'},body:JSON.stringify({query:q,variables:v})});
 const d=await r.json().catch(()=>({}));if(d.errors&&JSON.stringify(d.errors).includes('THROTTLED')&&a<8){await sleep(2500*2**a);return g(q,v,a+1);}return d;}
const Q=`query($a:String,$after:ISO8601DateTime,$before:ISO8601DateTime){
 visits(first:50, after:$a, filter:{ startAt:{ after:$after, before:$before } }){
  nodes{ id title startAt isComplete client{name} job{jobNumber}
   property{address{street city postalCode}} assignedUsers(first:4){nodes{name{full}}} }
  pageInfo{hasNextPage endCursor} } }`;
const DOW=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const pt=iso=>new Date(iso).toLocaleString('sv-SE',{timeZone:'America/Los_Angeles'});
const dayOf=d=>DOW[new Date(d+'T12:00:00Z').getUTCDay()];
let cur=null;const all=[];
for(;;){const d=await g(Q,{a:cur,after:'2026-07-01T00:00:00-07:00',before:'2026-08-14T23:59:59-07:00'});
 if(!d.data){console.log('ERR',JSON.stringify(d).slice(0,200));break;}
 all.push(...d.data.visits.nodes);
 if(!d.data.visits.pageInfo.hasNextPage)break;cur=d.data.visits.pageInfo.endCursor;await sleep(430);}
console.log('week visits:',all.length,'\n=== NAMED ===');
let found=0;
for(const v of all){
 const blob=((v.client?.name||'')+' '+(v.property?.address?.street||'')+' '+(v.title||'')).toLowerCase();
 if(!/madera|madeira/.test(blob))continue; found++;
 const d=pt(v.startAt);
 console.log(' #'+String(v.job?.jobNumber).padEnd(6),dayOf(d.slice(0,10)),d.slice(0,16),'done='+String(v.isComplete).padEnd(5),
  'tech='+(v.assignedUsers?.nodes?.map(x=>x.name.full).join('+')||'NONE').padEnd(14),'|',(v.client?.name||'').padEnd(26),'|',v.property?.address?.street,',',v.property?.address?.city);
 console.log('        visitId:',v.id);
}
if(!found)console.log('  no match');
console.log('\n=== DUPLICATE JOB+DAY (open visits) ===');
const key={};
for(const v of all){ if(v.isComplete)continue; const d=pt(v.startAt).slice(0,10);
 (key[v.job?.jobNumber+'|'+d]=key[v.job?.jobNumber+'|'+d]||[]).push(v); }
for(const [k,list] of Object.entries(key)){
 if(list.length<2)continue;
 const v0=list[0];
 console.log(' #'+String(v0.job?.jobNumber).padEnd(6),(v0.client?.name||'(no name)').padEnd(26),v0.property?.address?.street,',',v0.property?.address?.city);
 for(const v of list.sort((a,b)=>a.startAt.localeCompare(b.startAt)))
   console.log('     ',pt(v.startAt).slice(0,16),'tech='+(v.assignedUsers?.nodes?.map(x=>x.name.full).join('+')||'NONE').padEnd(14),'visitId:',v.id);
}
