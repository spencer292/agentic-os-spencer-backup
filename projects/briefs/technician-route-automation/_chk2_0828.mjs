import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
const __dirname=path.dirname(fileURLToPath(import.meta.url));
const env={};for(const l of fs.readFileSync(path.resolve(__dirname,'../../../.env'),'utf8').split(/\r?\n/)){const m=l.match(/^([A-Z0-9_]+)=(.*)$/);if(m)env[m[1]]=m[2].trim();}
const tr=await(await fetch('https://api.getjobber.com/api/oauth/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:env.JOBBER_CLIENT_ID,client_secret:env.JOBBER_CLIENT_SECRET,grant_type:'refresh_token',refresh_token:env.JOBBER_REFRESH_TOKEN})})).json();
const tok=tr.access_token;const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const g=async(q,v)=>(await(await fetch('https://api.getjobber.com/api/graphql',{method:'POST',headers:{Authorization:'Bearer '+tok,'Content-Type':'application/json','X-JOBBER-GRAPHQL-VERSION':'2025-04-16'},body:JSON.stringify({query:q,variables:v})})).json());
const pt=s=>new Date(s).toLocaleString('sv-SE',{timeZone:'America/Los_Angeles'}).slice(0,10);
for(const n of ['8249','8218','8093','8074','5071','7617','4425','8452']){
  const d=await g('query($n:String!){ jobs(first:8, searchTerm:$n){ nodes{ jobNumber jobStatus client{name} lineItems(first:10){nodes{name}} visits(first:200){ nodes{ startAt isComplete } } } } }',{n});
  const j=(d.data?.jobs?.nodes||[]).find(x=>String(x.jobNumber)===n);
  const vs=j.visits.nodes||[];const done=vs.filter(v=>v.isComplete).map(v=>pt(v.startAt)).sort();const fut=vs.filter(v=>!v.isComplete).map(v=>pt(v.startAt)).sort();
  console.log('#'+n,'|',String(j.client?.name).slice(0,22),'|',j.jobStatus,'| done',done.length,'last3:',done.slice(-3).join(' '),'| next3:',fut.slice(0,3).join(' ')||'NONE','| items:',(j.lineItems?.nodes||[]).map(x=>x.name).join(' ~ ').slice(0,70));
  await sleep(300);
}
