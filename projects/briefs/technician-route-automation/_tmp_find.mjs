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
  nodes{ startAt isComplete client{name} job{jobNumber}
   property{address{street city postalCode}} assignedUsers(first:4){nodes{name{full}}} }
  pageInfo{hasNextPage endCursor} } }`;
const DOW=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
let cur=null;const hits=[];let n=0;
for(;;){const d=await g(Q,{a:cur,after:'2026-08-08T00:00:00-07:00',before:'2026-09-30T23:59:59-07:00'});
 if(!d.data){console.log('ERR');break;}
 n+=d.data.visits.nodes.length;
 for(const v of d.data.visits.nodes){
   const blob=((v.client?.name||'')+' '+(v.property?.address?.street||'')).toLowerCase();
   if(/argus|velia/.test(blob)) hits.push(v);
 }
 if(!d.data.visits.pageInfo.hasNextPage)break;cur=d.data.visits.pageInfo.endCursor;await sleep(430);}
console.log('scanned',n,'visits\n');
const seen=new Set();
for(const v of hits){
 const dt=new Date(v.startAt).toLocaleString('sv-SE',{timeZone:'America/Los_Angeles'});
 const day=DOW[new Date(dt.slice(0,10)+'T12:00:00Z').getUTCDay()];
 const k=v.job?.jobNumber+dt.slice(0,10); if(seen.has(k))continue; seen.add(k);
 console.log('#'+String(v.job?.jobNumber).padEnd(6),day,dt.slice(0,10),
  'zip='+(v.property?.address?.postalCode||'?'),
  'tech='+(v.assignedUsers?.nodes?.map(x=>x.name.full).join('+')||'NONE').padEnd(14),
  '|',(v.client?.name||'').padEnd(22),'|',v.property?.address?.street,',',v.property?.address?.city);
}
if(!hits.length) console.log('no Argus / Velia match Aug 8 - Sep 30');
