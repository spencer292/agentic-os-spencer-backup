import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
const __dirname=path.dirname(fileURLToPath(import.meta.url));
const env={};for(const l of fs.readFileSync(path.resolve(__dirname,'../../../.env'),'utf8').split(/\r?\n/)){const m=l.match(/^([A-Z0-9_]+)=(.*)$/);if(m)env[m[1]]=m[2].trim();}
const tr=await(await fetch('https://api.getjobber.com/api/oauth/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},
 body:new URLSearchParams({client_id:env.JOBBER_CLIENT_ID,client_secret:env.JOBBER_CLIENT_SECRET,grant_type:'refresh_token',refresh_token:env.JOBBER_REFRESH_TOKEN})})).json();
const tok=tr.access_token;
const gql=async(query,variables)=>{const r=await fetch('https://api.getjobber.com/api/graphql',{method:'POST',
 headers:{Authorization:`Bearer ${tok}`,'Content-Type':'application/json','X-JOBBER-GRAPHQL-VERSION':'2025-04-16'},
 body:JSON.stringify({query,variables})});const d=await r.json();if(d.errors)throw new Error(JSON.stringify(d.errors).slice(0,300));return d.data;};
const PT=s=>s?new Date(s).toLocaleString('sv-SE',{timeZone:'America/Los_Angeles'}).slice(0,16):'—';
for(const jn of process.argv.slice(2)){
  const d=await gql(`query($n:String!){ jobs(first:5, searchTerm:$n){ nodes{ jobNumber jobStatus client{name} property{address{city postalCode}} visits(first:60){ nodes{ startAt isComplete assignedUsers(first:2){nodes{name{full}}} } } } } }`,{n:String(jn)});
  const j=(d.jobs.nodes||[]).find(x=>String(x.jobNumber)===String(jn));
  if(!j){console.log(`#${jn} — no such job`);continue;}
  const vs=(j.visits.nodes||[]).slice().sort((a,b)=>String(a.startAt).localeCompare(String(b.startAt)));
  const near=vs.filter(v=>v.startAt>='2026-09-01');
  console.log(`#${j.jobNumber}  ${j.jobStatus.padEnd(10)} ${(j.client?.name||'').slice(0,28).padEnd(28)} ${j.property?.address?.city||''} ${j.property?.address?.postalCode||''}`);
  if(!near.length) console.log(`        last visit: ${PT(vs[vs.length-1]?.startAt)}  (nothing since 2026-09-01)`);
  for(const v of near.slice(0,6)) console.log(`        ${PT(v.startAt)}  ${v.isComplete?'complete':'OPEN    '}  ${(v.assignedUsers?.nodes?.[0]?.name?.full)||'(unassigned)'}`);
  await new Promise(r=>setTimeout(r,400));
}
