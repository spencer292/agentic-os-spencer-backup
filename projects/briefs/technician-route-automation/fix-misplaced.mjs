#!/usr/bin/env node
// Move visits stranded on the wrong day back to their territory-grid day, and attach the grid tech.
// Two causes seen 2026-07-26: (a) visits PINNED to a day by a committed time, which grid-day
// enforcement cannot move; (b) visits with NO tech attached at all. Both leave the route sloppy.
// Sets the visit ALL-DAY so push-week treats it as flexible and the optimizer can sequence it.
// Usage: node fix-misplaced.mjs dry|live
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname=path.dirname(fileURLToPath(import.meta.url));
const env={};for(const l of fs.readFileSync(path.resolve(__dirname,'../../../.env'),'utf8').split(/\r?\n/)){const m=l.match(/^([A-Z0-9_]+)=(.*)$/);if(m)env[m[1]]=m[2].trim();}
const mode=process.argv[2]; if(!['dry','live'].includes(mode)){console.log('Usage: dry|live');process.exit(1);}
const TZ='America/Los_Angeles';
const FIX=[
  // far-south Graham/Eatonville stranded on TUE — all grid wed/Luke (Spencer 2026-07-26)
  {v:'2255660358', job:'8179', who:'Sharon Young',    to:'2026-07-29', tech:'Luke LaVergne', why:'pinned tue, grid wed/Luke'},
  {v:'2260569393', job:'8205', who:'Jake Fox',        to:'2026-07-29', tech:'Luke LaVergne', why:'pinned tue + on Spencer, grid wed/Luke'},
  {v:'2260889949', job:'8208', who:'Jakob Laroche',   to:'2026-07-29', tech:'Luke LaVergne', why:'pinned tue + on Spencer, grid wed/Luke'},
  {v:'1650149861', job:'4998', who:'Bill Langley',    to:'2026-07-29', tech:'Luke LaVergne', why:'NO TECH, grid wed/Luke'},
  {v:'1718978549', job:'5540', who:'Chris Thornhill', to:'2026-07-29', tech:'Luke LaVergne', why:'NO TECH, grid wed/Luke'},
  {v:'1980793832', job:'6064', who:'Joe Edmunson',    to:'2026-07-29', tech:'Luke LaVergne', why:'NO TECH, grid wed/Luke'},
  // stranded on FRI but owned by Cammeron, who does not work Friday -> unplannable
  {v:'2259775833', job:'8204', who:'Michael Marquez', to:'2026-07-29', tech:'Cammeron Anderson', why:'dated fri, grid wed/Cammeron (no Fri route)'},
  {v:'2265633333', job:'8043', who:'Teagan Eldridge', to:'2026-07-30', tech:'Cammeron Anderson', why:'dated fri, grid thu/Cammeron (no Fri route)'},
  {v:'2264619957', job:'8228', who:'Matt Vega',       to:'2026-07-30', tech:'Cammeron Anderson', why:'dated fri, grid thu/Cammeron (no Fri route)'},
];
const tr=await(await fetch('https://api.getjobber.com/api/oauth/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},
 body:new URLSearchParams({client_id:env.JOBBER_CLIENT_ID,client_secret:env.JOBBER_CLIENT_SECRET,grant_type:'refresh_token',refresh_token:env.JOBBER_REFRESH_TOKEN})})).json();
const tok=tr.access_token;
async function gql(query,variables){const r=await fetch('https://api.getjobber.com/api/graphql',{method:'POST',
 headers:{Authorization:`Bearer ${tok}`,'Content-Type':'application/json','X-JOBBER-GRAPHQL-VERSION':'2023-11-15'},body:JSON.stringify({query,variables})});return r.json();}
const u=await gql('query { users(first:100){ nodes{ id name{ full } } } }',{});
const USERS={}; for(const x of u.data.users.nodes) if(x.name?.full) USERS[x.name.full.trim().toLowerCase()]=x.id;
for(const f of FIX){
  console.log(`#${f.job.padEnd(5)} ${f.who.padEnd(18)} -> ${f.to} ${f.tech.split(' ')[0].padEnd(9)} (${f.why})`);
  if(mode==='dry') continue;
  const enc=Buffer.from(`gid://Jobber/Visit/${f.v}`).toString('base64');
  const s=await gql(`mutation($id:EncodedId!,$input:VisitEditScheduleInput!){ visitEditSchedule(id:$id, input:$input){ userErrors{ message } } }`,
    {id:enc,input:{startAt:{date:f.to,time:'00:00:00',timezone:TZ},endAt:{date:f.to,time:'23:59:59',timezone:TZ}}});
  const se=s.errors||s.data?.visitEditSchedule?.userErrors||[];
  const uid=USERS[f.tech.trim().toLowerCase()];
  let ae=[];
  if(uid){ const a=await gql(`mutation($id:EncodedId!,$input:VisitEditAssignedUsersInput!){ visitEditAssignedUsers(visitId:$id, input:$input){ userErrors{ message } } }`,
    {id:enc,input:{assignedUserIds:[uid]}}); ae=a.errors||a.data?.visitEditAssignedUsers?.userErrors||[]; }
  console.log(`      date ${se.length?'FAIL '+JSON.stringify(se).slice(0,110):'ok'} | tech ${!uid?'user not found':(ae.length?'FAIL '+JSON.stringify(ae).slice(0,110):'ok')}`);
  await new Promise(r=>setTimeout(r,250));
}
