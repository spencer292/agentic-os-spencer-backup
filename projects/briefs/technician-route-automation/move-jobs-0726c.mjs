#!/usr/bin/env node
// Spencer day-review pass 3, 2026-07-26 eve.
// ORDER MATTERS: move in Jobber -> push-week --grid -> lock techs -> re-plan -> write.
// Skipping the re-push lets the stale OptimoRoute plan overwrite the move on write-back
// (that is what silently reverted #6418 to Friday earlier tonight).
// Usage: node move-jobs-0726c.mjs dry|live
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname=path.dirname(fileURLToPath(import.meta.url));
const env={};for(const l of fs.readFileSync(path.resolve(__dirname,'../../../.env'),'utf8').split(/\r?\n/)){const m=l.match(/^([A-Z0-9_]+)=(.*)$/);if(m)env[m[1]]=m[2].trim();}
const TZ='America/Los_Angeles';
const mode=process.argv[2]; if(!['dry','live'].includes(mode)){console.log('Usage: dry|live');process.exit(1);}
const M=[
 {job:'6418', v:'2263672159', who:'Diana Silva',      to:'2026-07-28', tech:'Luke LaVergne'},
 {job:'7662', v:'2261496080', who:'James Harnish',    to:'2026-07-30', tech:'Cammeron Anderson'},
 {job:'7010', v:'2261466204', who:'Charles Lindsey',  to:'2026-07-30', tech:'Cammeron Anderson'},
 {job:'5415', v:'2263601225', who:'Rick Conces',      to:'2026-07-29', tech:'Cammeron Anderson'},
 {job:'6663', v:'2262233914', who:'Don Petricic',     to:'2026-07-29', tech:'Cammeron Anderson'},
 {job:'7382', v:'2263222186', who:'Jason Nault',      to:'2026-07-29', tech:'Cammeron Anderson'},
 {job:'6475', v:'2262271518', who:'Amber Owen',       to:'2026-07-29', tech:'Cammeron Anderson'},
 {job:'5022', v:'2263283343', who:'Liz Jones',        to:'2026-07-29', tech:'Cammeron Anderson'},
 {job:'6371', v:'2257635035', who:'Maggie Culbert-O.',to:'2026-07-30', tech:'Cory Ventura'},
 {job:'7632', v:'2262310758', who:'Joel Coons',       to:'2026-07-30', tech:'Cory Ventura'},
 {job:'7477', v:'2261558095', who:'Melissa Osvaldik', to:'2026-07-30', tech:'Cory Ventura'},
];
const DOW=['sun','mon','tue','wed','thu','fri','sat'];
for(const m of M) console.log(`#${m.job.padEnd(5)} ${m.who.padEnd(20)} -> ${m.to} (${DOW[new Date(m.to+'T12:00:00Z').getUTCDay()]}) ${m.tech}`);
if(mode==='dry'){console.log('\nDRY — nothing written.');process.exit(0);}
const tr=await(await fetch('https://api.getjobber.com/api/oauth/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},
 body:new URLSearchParams({client_id:env.JOBBER_CLIENT_ID,client_secret:env.JOBBER_CLIENT_SECRET,grant_type:'refresh_token',refresh_token:env.JOBBER_REFRESH_TOKEN})})).json();
const tok=tr.access_token;
async function gql(query,variables){const r=await fetch('https://api.getjobber.com/api/graphql',{method:'POST',
 headers:{Authorization:`Bearer ${tok}`,'Content-Type':'application/json','X-JOBBER-GRAPHQL-VERSION':'2023-11-15'},body:JSON.stringify({query,variables})});return r.json();}
const u=await gql('query { users(first:100){ nodes{ id name{ full } } } }',{});
const USERS={}; for(const x of u.data.users.nodes) if(x.name?.full) USERS[x.name.full.trim().toLowerCase()]=x.id;
console.log('');
for(const m of M){
  const enc=Buffer.from(`gid://Jobber/Visit/${m.v}`).toString('base64');
  const s=await gql(`mutation($id:EncodedId!,$input:VisitEditScheduleInput!){ visitEditSchedule(id:$id, input:$input){ userErrors{ message } } }`,
    {id:enc,input:{startAt:{date:m.to,time:'00:00:00',timezone:TZ},endAt:{date:m.to,time:'23:59:59',timezone:TZ}}});
  const se=s.errors||s.data?.visitEditSchedule?.userErrors||[];
  const a=await gql(`mutation($id:EncodedId!,$input:VisitEditAssignedUsersInput!){ visitEditAssignedUsers(visitId:$id, input:$input){ userErrors{ message } } }`,
    {id:enc,input:{assignedUserIds:[USERS[m.tech.trim().toLowerCase()]]}});
  const ae=a.errors||a.data?.visitEditAssignedUsers?.userErrors||[];
  console.log(`#${m.job.padEnd(5)} date ${se.length?'FAIL '+JSON.stringify(se).slice(0,80):'ok'} | tech ${ae.length?'FAIL '+JSON.stringify(ae).slice(0,80):'ok'}`);
  await new Promise(r=>setTimeout(r,250));
}
