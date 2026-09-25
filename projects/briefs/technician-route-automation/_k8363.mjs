import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
const __dirname=path.dirname(fileURLToPath(import.meta.url));
const ENV=path.resolve(__dirname,'../../../.env');
const env={};for(const l of fs.readFileSync(ENV,'utf8').split(/\r?\n/)){const m=l.match(/^([A-Z0-9_]+)=(.*)$/);if(m)env[m[1]]=m[2].trim();}
const tr=await(await fetch('https://api.getjobber.com/api/oauth/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:env.JOBBER_CLIENT_ID,client_secret:env.JOBBER_CLIENT_SECRET,grant_type:'refresh_token',refresh_token:env.JOBBER_REFRESH_TOKEN})})).json();
const tok=tr.access_token;
const gql=async q=>{const r=await fetch('https://api.getjobber.com/api/graphql',{method:'POST',headers:{Authorization:'Bearer '+tok,'Content-Type':'application/json','X-JOBBER-GRAPHQL-VERSION':'2025-04-16'},body:JSON.stringify({query:q})});return r.json();};
const pt=s=>new Date(s).toLocaleString('sv-SE',{timeZone:'America/Los_Angeles'}).slice(0,16);
for (const term of ['8363','Klaudia Elam']) {
  const d=await gql(`query { jobs(first:8, searchTerm:"${term}"){ nodes{ jobNumber jobStatus title client{name} lineItems(first:6){nodes{name}} property{address{street city postalCode}} visits(first:40){nodes{ startAt isComplete assignedUsers(first:2){nodes{name{full}}} }} } } }`);
  console.log('=== search',term);
  for(const j of d.data.jobs.nodes){
    console.log(' #'+j.jobNumber, j.jobStatus, '|', j.client?.name, '|', (j.lineItems?.nodes||[]).map(x=>x.name).join(' + '));
    console.log('   ', j.property?.address?.street, j.property?.address?.city, j.property?.address?.postalCode);
    const vs=(j.visits?.nodes||[]).sort((a,b)=>a.startAt.localeCompare(b.startAt));
    for(const v of vs.slice(-6)) console.log('     ', pt(v.startAt), v.isComplete?'DONE':'open', (v.assignedUsers?.nodes||[])[0]?.name?.full||'unassigned');
  }
  await new Promise(r=>setTimeout(r,400));
}
