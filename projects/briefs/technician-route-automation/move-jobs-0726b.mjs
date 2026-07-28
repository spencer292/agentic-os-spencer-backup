#!/usr/bin/env node
// Spencer's day-review moves, 2026-07-26 evening. Sets the Jobber visit date + tech, records a
// jobOverride so the grid remembers, and (for Monday, which is past its email freeze and already
// written) updates the OptimoRoute order directly since push-week's window now starts Tuesday.
// Usage: node move-jobs-0726b.mjs dry|live
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname=path.dirname(fileURLToPath(import.meta.url));
const env={};for(const l of fs.readFileSync(path.resolve(__dirname,'../../../.env'),'utf8').split(/\r?\n/)){const m=l.match(/^([A-Z0-9_]+)=(.*)$/);if(m)env[m[1]]=m[2].trim();}
const K=env.OPTIMOROUTE_API_KEY, TZ='America/Los_Angeles';
const mode=process.argv[2]; if(!['dry','live'].includes(mode)){console.log('Usage: dry|live');process.exit(1);}
const M=[
 {job:'6418', v:'2263672159', who:'Diana Silva',        to:'2026-07-28', tech:'Luke LaVergne'},
 {job:'6737', v:'2260177970', who:'Kristina Rollings',  to:'2026-07-29', tech:'Luke LaVergne'},
 {job:'6246', v:'2260175353', who:'Lisa Miles',         to:'2026-07-29', tech:'Luke LaVergne'},
 {job:'7829', v:'2109777978', who:'Joey Russo',         to:'2026-07-29', tech:'Luke LaVergne'},
 {job:'4674', v:'2260403142', who:'Noe Cerda',          to:'2026-07-29', tech:'Luke LaVergne'},
 {job:'4935', v:'2260496496', who:'Maja Haloway',       to:'2026-07-29', tech:'Luke LaVergne'},
 {job:'8212', v:'2261153694', who:'Cindy Holshouser',   to:'2026-07-30', tech:'Luke LaVergne'},
 {job:'5529', v:'1770752338', who:'Christina McDougall',to:'2026-07-30', tech:'Luke LaVergne'},
 {job:'8197', v:'2259565785', who:'Erin Irvine',        to:'2026-07-30', tech:'Luke LaVergne'},
 {job:'8196', v:'2259513487', who:'Lisa Politeo',       to:'2026-07-30', tech:'Luke LaVergne'},
 // MONDAY — already written and past its 14:00 email freeze; OR order updated directly
 {job:'7951', v:'2259169787', who:'Peter Kupu',   to:'2026-07-27', tech:'Cammeron Anderson', monday:true},
 {job:'8237', v:'2265639001', who:'Effie Weaver', to:'2026-07-27', tech:'Luke LaVergne', monday:true, morning:true},
];
for(const m of M) console.log(`#${m.job.padEnd(5)} ${m.who.padEnd(21)} -> ${m.to} ${m.tech.split(' ')[0].padEnd(9)}${m.morning?' MORNING 08:00-11:00':''}${m.monday?'   [monday: past freeze]':''}`);
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
  const st=m.morning?{s:'08:00:00',e:'11:00:00'}:{s:'00:00:00',e:'23:59:59'};
  const s=await gql(`mutation($id:EncodedId!,$input:VisitEditScheduleInput!){ visitEditSchedule(id:$id, input:$input){ userErrors{ message } } }`,
    {id:enc,input:{startAt:{date:m.to,time:st.s,timezone:TZ},endAt:{date:m.to,time:st.e,timezone:TZ}}});
  const se=s.errors||s.data?.visitEditSchedule?.userErrors||[];
  const uid=USERS[m.tech.trim().toLowerCase()];
  const a=await gql(`mutation($id:EncodedId!,$input:VisitEditAssignedUsersInput!){ visitEditAssignedUsers(visitId:$id, input:$input){ userErrors{ message } } }`,
    {id:enc,input:{assignedUserIds:[uid]}});
  const ae=a.errors||a.data?.visitEditAssignedUsers?.userErrors||[];
  let orMsg='';
  if(m.monday){
    const ord={operation:'UPDATE', orderNo:`${m.job}-${m.v}`, date:m.to,
      allowedDates:{from:m.to,to:m.to}, allowedWeekdays:['mon'], assignedTo:{serial:m.tech}};
    if(m.morning) ord.timeWindows=[{twFrom:'08:00',twTo:'11:00'}];
    const o=await fetch(`https://api.optimoroute.com/v1/create_or_update_orders?key=${K}`,{method:'POST',
      headers:{'Content-Type':'application/json'},body:JSON.stringify({orders:[ord]})});
    const oj=await o.json();
    orMsg=` | OR ${oj.orders?.[0]?.success?'ok':JSON.stringify(oj).slice(0,90)}`;
  }
  console.log(`#${m.job.padEnd(5)} date ${se.length?'FAIL '+JSON.stringify(se).slice(0,90):'ok'} | tech ${ae.length?'FAIL '+JSON.stringify(ae).slice(0,90):'ok'}${orMsg}`);
  await new Promise(r=>setTimeout(r,250));
}
