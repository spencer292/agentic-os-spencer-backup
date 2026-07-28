#!/usr/bin/env node
// Got Moles never works weekends. Any Sat/Sun visit is a defect: move it to the territory-grid
// weekday of the Mon-Sun week it falls in (earlier, so service is not delayed). Spencer 2026-07-26.
// Usage: node fix-weekend-visits.mjs dry|live
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname=path.dirname(fileURLToPath(import.meta.url));
const env={};for(const l of fs.readFileSync(path.resolve(__dirname,'../../../.env'),'utf8').split(/\r?\n/)){const m=l.match(/^([A-Z0-9_]+)=(.*)$/);if(m)env[m[1]]=m[2].trim();}
const mode=process.argv[2]; if(!['dry','live'].includes(mode)){console.log('Usage: dry|live');process.exit(1);}
const TZ='America/Los_Angeles';
const G=JSON.parse(fs.readFileSync(path.join(__dirname,'territory-grid.json'),'utf8'));
const bad=JSON.parse(fs.readFileSync(path.join(__dirname,process.argv[3]||'weekend-visits-0726.json'),'utf8'));
const IDX={mon:0,tue:1,wed:2,thu:3,fri:4};
const addD=(d,n)=>{const[y,m,dd]=d.split('-').map(Number);return new Date(Date.UTC(y,m-1,dd+n)).toISOString().slice(0,10);};
const dow=d=>new Date(d+'T12:00:00Z').getUTCDay();            // 0=Sun
const tr=await(await fetch('https://api.getjobber.com/api/oauth/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},
 body:new URLSearchParams({client_id:env.JOBBER_CLIENT_ID,client_secret:env.JOBBER_CLIENT_SECRET,grant_type:'refresh_token',refresh_token:env.JOBBER_REFRESH_TOKEN})})).json();
const tok=tr.access_token;
async function gql(query,variables){const r=await fetch('https://api.getjobber.com/api/graphql',{method:'POST',
 headers:{Authorization:`Bearer ${tok}`,'Content-Type':'application/json','X-JOBBER-GRAPHQL-VERSION':'2023-11-15'},body:JSON.stringify({query,variables})});return r.json();}
for(const b of bad){
  const gd=G.zips[b.zip]?.day; if(!gd){console.log(`#${b.job} zip ${b.zip} not in grid — SKIP`);continue;}
  const wd=dow(b.d);                       // sat=6, sun=0
  const monday=addD(b.d, wd===0 ? -6 : -(wd-1));   // Mon of the Mon-Sun week
  const target=addD(monday, IDX[gd]);
  console.log(`#${b.job} ${b.title}  ${b.d} (${b.dow}) -> ${target} (${gd})   zip ${b.zip} ${b.city}   was tech=${b.tech}`);
  if(mode==='dry') continue;
  const enc=Buffer.from(`gid://Jobber/Visit/${b.num}`).toString('base64');
  const j=await gql(`mutation($id:EncodedId!,$input:VisitEditScheduleInput!){ visitEditSchedule(id:$id, input:$input){ userErrors{ message } } }`,
   {id:enc, input:{ startAt:{date:target,time:'00:00:00',timezone:TZ}, endAt:{date:target,time:'23:59:59',timezone:TZ} }});
  const errs=j.errors||j.data?.visitEditSchedule?.userErrors||[];
  console.log(errs.length?`   FAIL ${JSON.stringify(errs).slice(0,200)}`:'   moved');
}
