#!/usr/bin/env node
// Usage: node lookup-jobs.mjs 6418 6737 ...
import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
const __dirname=path.dirname(fileURLToPath(import.meta.url));
const env={};for(const l of fs.readFileSync(path.resolve(__dirname,'../../../.env'),'utf8').split(/\r?\n/)){const m=l.match(/^([A-Z0-9_]+)=(.*)$/);if(m)env[m[1]]=m[2].trim();}
const G=JSON.parse(fs.readFileSync(path.join(__dirname,'territory-grid.json'),'utf8'));
const tr=await(await fetch('https://api.getjobber.com/api/oauth/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},
 body:new URLSearchParams({client_id:env.JOBBER_CLIENT_ID,client_secret:env.JOBBER_CLIENT_SECRET,grant_type:'refresh_token',refresh_token:env.JOBBER_REFRESH_TOKEN})})).json();
const tok=tr.access_token;
const q=async a=>{const r=await fetch('https://api.getjobber.com/api/graphql',{method:'POST',
 headers:{Authorization:`Bearer ${tok}`,'Content-Type':'application/json','X-JOBBER-GRAPHQL-VERSION':'2023-11-15'},
 body:JSON.stringify({query:`query($a:String){ visits(first:50, after:$a, filter:{ startAt:{ after:"2026-07-26T23:59:59-07:00", before:"2026-08-02T23:59:59-07:00" } }){ nodes{ id title startAt endAt isComplete assignedUsers(first:4){nodes{name{full}}} job{jobNumber startAt} property{address{street city postalCode}} } pageInfo{hasNextPage endCursor} } }`,variables:{a}})});
 return (await r.json()).data.visits;};
let all=[],cur=null;
for(;;){const v=await q(cur);all.push(...v.nodes);if(!v.pageInfo.hasNextPage)break;cur=v.pageInfo.endCursor;await new Promise(r=>setTimeout(r,300));}
const PT=s=>new Date(s).toLocaleString('sv-SE',{timeZone:'America/Los_Angeles'});
const DOW=['sun','mon','tue','wed','thu','fri','sat'];
for(const jn of process.argv.slice(2)){
  const v=all.find(x=>String(x.job?.jobNumber)===jn && !x.isComplete);
  if(!v){console.log(`#${jn.padEnd(5)} — no live visit this week`);continue;}
  const zip=(v.property?.address?.postalCode||'').trim().slice(0,5);
  const g=G.zips[zip]; const ov=G.jobOverrides?.[jn];
  const d=PT(v.startAt).slice(0,10), hm=PT(v.startAt).slice(11,16);
  const winH=v.endAt?(new Date(v.endAt)-new Date(v.startAt))/3600000:99;
  const isSet=v.job?.startAt?PT(v.job.startAt).slice(0,10)===d:false;
  const pinned=isSet||(hm!=='00:00'&&winH<=6);
  let n;try{n=Buffer.from(v.id,'base64').toString('utf8').split('/').pop()}catch{}
  console.log(`#${jn.padEnd(5)} ${(v.title||'').slice(0,24).padEnd(25)} ${(v.property?.address?.city||'').padEnd(13)} ${zip}  ${d}(${DOW[new Date(d+'T12:00:00Z').getUTCDay()]}) ${hm}  ${((v.assignedUsers?.nodes||[]).map(u=>u.name.full).join('+')||'(none)').padEnd(24)} grid=${ov?'OVERRIDE ':''}${(ov?.day||ov?.days||g?.day||g?.days||'?')}/${((ov?.tech||g?.tech||'?')+'').split(' ')[0]}  ${pinned?(isSet?'SET':'committed'):'flexible'}  visit=${n}`);
}
