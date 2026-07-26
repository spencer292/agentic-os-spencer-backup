#!/usr/bin/env node
// Add interim follow-up visits per Spencer's activity-cadence rule (2026-07-26).
// MA -> this week, LA -> next week or the one after, NA -> ~2 weeks.
// Interim ADD (recurring schedule left intact) so no downstream gap is created.
// Created all-day (00:00 PT) => push-week treats it as FLEXIBLE, optimizer places it.
// Usage: node add-cadence-visit.mjs dry|live
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname=path.dirname(fileURLToPath(import.meta.url));
const env={};for(const l of fs.readFileSync(path.resolve(__dirname,'../../../.env'),'utf8').split(/\r?\n/)){const m=l.match(/^([A-Z0-9_]+)=(.*)$/);if(m)env[m[1]]=m[2].trim();}
const mode=process.argv[2]; if(!['dry','live'].includes(mode)){console.log('Usage: dry|live');process.exit(1);}
const TZ='America/Los_Angeles';
const ADDS=[
 {job:'5503', client:'Nichole Avila', jobId:'Z2lkOi8vSm9iYmVyL0pvYi85MzcwODI1Mw==', date:'2026-07-30',
  title:'Nichole Avila', why:'MA + 1 caught 7/23; weekly intensive ended, next was 8/20 (28d). Grid thu/Cammeron.'},
];
const tr=await(await fetch('https://api.getjobber.com/api/oauth/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},
 body:new URLSearchParams({client_id:env.JOBBER_CLIENT_ID,client_secret:env.JOBBER_CLIENT_SECRET,grant_type:'refresh_token',refresh_token:env.JOBBER_REFRESH_TOKEN})})).json();
const tok=tr.access_token;
async function gql(query,variables){const r=await fetch('https://api.getjobber.com/api/graphql',{method:'POST',
 headers:{Authorization:`Bearer ${tok}`,'Content-Type':'application/json','X-JOBBER-GRAPHQL-VERSION':'2023-11-15'},body:JSON.stringify({query,variables})});return r.json();}

for(const a of ADDS){
  // guard: refuse if a visit already exists on that date for this job
  const chk=await gql(`query($n:String!){ jobs(first:5, searchTerm:$n){ nodes{ jobNumber visits(first:20, filter:{ startAt:{ after:"${a.date}T00:00:00-07:00", before:"${a.date}T23:59:59-07:00" } }){ totalCount nodes{ startAt } } } } }`,{n:a.job});
  const job=(chk.data?.jobs?.nodes||[]).find(x=>String(x.jobNumber)===a.job);
  const existing=job?.visits?.totalCount ?? -1;
  console.log(`#${a.job} ${a.client} -> ${a.date}  (existing visits that day: ${existing})`);
  console.log(`     ${a.why}`);
  if(existing!==0){ console.log('     SKIP — a visit already exists on that date (or job not found)'); continue; }
  if(mode==='dry'){ console.log('     DRY — not created'); continue; }
  const j=await gql(`mutation($jobId:EncodedId!,$input:VisitCreateInput!){ visitCreate(jobId:$jobId, input:$input){ createdVisits{ id startAt endAt } userErrors{ message } } }`,
   {jobId:a.jobId, input:{ visits:[{ title:a.title, schedule:{ notifyTeam:false,
      startAt:{date:a.date,time:'00:00:00',timezone:TZ}, endAt:{date:a.date,time:'23:59:59',timezone:TZ} } }] }});
  const errs=j.errors||j.data?.visitCreate?.userErrors||[];
  if(errs.length) console.log('     FAIL', JSON.stringify(errs).slice(0,300));
  else console.log('     CREATED', JSON.stringify(j.data.visitCreate.createdVisits));
}
