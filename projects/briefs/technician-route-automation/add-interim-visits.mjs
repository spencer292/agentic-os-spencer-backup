#!/usr/bin/env node
// ADD INTERIM VISITS — book the follow-ups the cadence rules call for, INTO the route that already
// exists, without moving anything Spencer built.
//
// Spencer 2026-08-09: "Add the missing visits and only run the route I have created through
// OptimoRoute for times and correct order — do not shift any days without my confirmation."
//
// Placement rule: each visit lands on the day that its OWNING TECH is already working that ZIP in
// the live Jobber board, at/after the date the cadence interval requires. Never a new day, never a
// new area — it joins a cluster that is already going out.
//
// Created ALL-DAY (00:00-23:59 PT) so the optimizer may sequence it inside the day but cannot move
// the date. The recurring series is left untouched — this is an interim ADD.
//
// Usage: node add-interim-visits.mjs dry|live --plan=_adds_plan.json [--skip=7893]

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ENV_PATH = path.resolve(__dirname, '../../../.env');
const TZ = 'America/Los_Angeles';
const mode = process.argv[2];
if (!['dry','live'].includes(mode)) { console.log('Usage: add-interim-visits.mjs dry|live --plan=file.json [--skip=a,b]'); process.exit(1); }
const flag=(n,d)=>{const a=process.argv.find(x=>x.startsWith('--'+n+'='));return a?a.split('=')[1]:d;};
const PLAN = flag('plan','_adds_plan.json');
const SKIP = String(flag('skip','')).split(',').filter(Boolean);

const env={};
for(const l of fs.readFileSync(ENV_PATH,'utf8').split(/\r?\n/)){const m=l.match(/^([A-Z0-9_]+)=(.*)$/);if(m)env[m[1]]=m[2].trim();}
function saveEnvKey(k,v){let t=fs.readFileSync(ENV_PATH,'utf8');const re=new RegExp('^'+k+'=.*$','m');t=re.test(t)?t.replace(re,k+'='+v):t+'\n'+k+'='+v+'\n';fs.writeFileSync(ENV_PATH,t);}
let tok=null;
async function token(){const r=await fetch('https://api.getjobber.com/api/oauth/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:env.JOBBER_CLIENT_ID,client_secret:env.JOBBER_CLIENT_SECRET,grant_type:'refresh_token',refresh_token:env.JOBBER_REFRESH_TOKEN})});const d=await r.json();
 if(d.refresh_token&&d.refresh_token!==env.JOBBER_REFRESH_TOKEN) saveEnvKey('JOBBER_REFRESH_TOKEN',d.refresh_token);
 tok=d.access_token;return tok;}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function g(q,v,a){a=a||0;const t=tok||await token();const r=await fetch('https://api.getjobber.com/api/graphql',{method:'POST',headers:{Authorization:'Bearer '+t,'Content-Type':'application/json','X-JOBBER-GRAPHQL-VERSION':'2025-04-16'},body:JSON.stringify({query:q,variables:v})});
 const d=await r.json().catch(function(){return {}});if(d.errors&&JSON.stringify(d.errors).indexOf('THROTTLED')>=0&&a<8){await sleep(2500*Math.pow(2,a));return g(q,v,a+1);}return d;}

const plan=JSON.parse(fs.readFileSync(path.join(__dirname,PLAN),'utf8')).filter(p=>p.stillNeeded && SKIP.indexOf(p.jn)<0 && p.place);
console.log('ADD INTERIM VISITS ('+mode.toUpperCase()+') — '+plan.length+' to book'+(SKIP.length?'   skipping '+SKIP.join(','):''));

const ures=await g('query { users(first:100){ nodes{ id name{full} status } } }',{});
const users={};
for(const u of (ures.data&&ures.data.users&&ures.data.users.nodes)||[]) if(u.name&&u.name.full) users[u.name.full.trim()]= u;

let ok=0,skip=0,fail=0;
for(const p of plan){
  const u=users[String(p.tech).trim()];
  console.log('\n#'+p.jn+'  '+p.client+'  '+p.city+' '+p.zip);
  console.log('   '+p.street);
  console.log('   act '+p.act+' / caught '+(p.caught==null?'?':p.caught)+' — due '+p.due+', next existing '+(p.next||'NONE'));
  console.log('   -> book '+p.place+' on '+p.tech+'  (joins '+p.sameZipStops+' existing stop(s) in '+p.zip+' that day)');
  if(!u){ console.log('   FAIL — no Jobber user named "'+p.tech+'"'); fail++; continue; }
  // guard: never double-book the same job on the same day
  const chk=await g('query($id:EncodedId!){ job(id:$id){ visits(first:80){ nodes{ startAt isComplete } } } }',{id:p.jobId});
  const same=(((chk.data&&chk.data.job&&chk.data.job.visits&&chk.data.job.visits.nodes)||[])
    .filter(v=>new Date(v.startAt).toLocaleString('sv-SE',{timeZone:TZ}).slice(0,10)===p.place)).length;
  if(same>0){ console.log('   SKIP — job already has a visit on '+p.place); skip++; continue; }
  if(mode==='dry'){ console.log('   DRY — not created'); continue; }
  const c=await g('mutation($jobId:EncodedId!,$input:VisitCreateInput!){ visitCreate(jobId:$jobId, input:$input){ createdVisits{ id startAt } userErrors{ message } } }',
    {jobId:p.jobId, input:{ visits:[{ title:p.client, schedule:{ notifyTeam:false,
      startAt:{date:p.place,time:'00:00:00',timezone:TZ}, endAt:{date:p.place,time:'23:59:59',timezone:TZ} } }] }});
  const errs=(c.errors)||(c.data&&c.data.visitCreate&&c.data.visitCreate.userErrors)||[];
  if(errs.length){ console.log('   FAIL create', JSON.stringify(errs).slice(0,240)); fail++; continue; }
  const vid=c.data.visitCreate.createdVisits[0].id;
  const a=await g('mutation { visitEditAssignedUsers(visitId: "'+vid+'", input: { assignedUserIds: ["'+u.id+'"] }) { userErrors { message } } }',{});
  const aerr=(a.errors)||(a.data&&a.data.visitEditAssignedUsers&&a.data.visitEditAssignedUsers.userErrors)||[];
  if(aerr.length){ console.log('   CREATED but assign FAILED', JSON.stringify(aerr).slice(0,200)); fail++; }
  else { console.log('   CREATED + assigned to '+p.tech); ok++; }
  await sleep(400);
}
console.log('\nDONE — created '+ok+', skipped '+skip+', failed '+fail);
