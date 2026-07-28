#!/usr/bin/env node
// Write an explicit subset of optimize-plan writes (same mutation shape as optimize-week write).
// Needed because `write --date X` only covers writes TARGETING X — it misses the visits currently
// ON X that the plan moves away, leaving that day double-loaded (hit 2026-07-26: Monday showed 147
// against a 99-stop plan). Usage: node write-subset.mjs <file.json> dry|live
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname=path.dirname(fileURLToPath(import.meta.url));
const ENV_PATH=path.resolve(__dirname,'../../../.env');
const TZ='America/Los_Angeles';
const env={};for(const l of fs.readFileSync(ENV_PATH,'utf8').split(/\r?\n/)){const m=l.match(/^([A-Z0-9_]+)=(.*)$/);if(m)env[m[1]]=m[2].trim();}
const [file,mode]=[process.argv[2],process.argv[3]];
if(!file||!['dry','live'].includes(mode)){console.log('Usage: write-subset.mjs <file.json> dry|live');process.exit(1);}
const writes=JSON.parse(fs.readFileSync(path.join(__dirname,file),'utf8'));
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const ptNow=()=>new Date().toLocaleString('sv-SE',{timeZone:TZ});
const addD=(d,n)=>{const[y,m,dd]=d.split('-').map(Number);return new Date(Date.UTC(y,m-1,dd+n)).toISOString().slice(0,10);};
function cutoffOk(dateStr){const n=ptNow();const t=n.slice(0,10);const h=Number(n.slice(11,13));
  if(dateStr<=t)return false; if(dateStr===addD(t,1)&&h>=14)return false; return true;}
let tokenv=null;
async function tok(){ if(tokenv)return tokenv;
  const r=await fetch('https://api.getjobber.com/api/oauth/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},
   body:new URLSearchParams({client_id:env.JOBBER_CLIENT_ID,client_secret:env.JOBBER_CLIENT_SECRET,grant_type:'refresh_token',refresh_token:env.JOBBER_REFRESH_TOKEN})});
  const d=await r.json(); tokenv=d.access_token; return tokenv;}
async function gql(q){const t=await tok();
  const r=await fetch('https://api.getjobber.com/api/graphql',{method:'POST',
   headers:{Authorization:`Bearer ${t}`,'Content-Type':'application/json','X-JOBBER-GRAPHQL-VERSION':'2025-04-16'},body:JSON.stringify({query:q})});
  return r.json();}
const todo=writes.filter(w=>cutoffOk(w.date));
console.log(`${writes.length} writes, ${todo.length} pass the email cutoff`);
const by={}; for(const w of todo) by[w.date]=(by[w.date]||0)+1;
console.log('targets:',JSON.stringify(by));
if(mode==='dry'){console.log('DRY — nothing written.');process.exit(0);}
let ok=0,failed=0;const errs=[];
for(let i=0;i<todo.length;i++){
  const w=todo[i]; const ops=[];
  if(w.doSchedule){
    const endT=new Date(`${w.date}T${w.time}-07:00`).getTime()+3*3600000;
    const endPT=new Date(endT).toLocaleString('sv-SE',{timeZone:TZ});
    ops.push(`mutation { visitEditSchedule(id: "${w.visitId}", input: { startAt: { date: "${w.date}", time: "${w.time}", timezone: "${TZ}" }, endAt: { date: "${endPT.slice(0,10)}", time: "${endPT.slice(11,19)}", timezone: "${TZ}" } }) { userErrors { message } } }`);
  }
  if(w.doAssign){ const ids=[w.newUserId,...((w.rideAlongIds||[]).filter(i=>i!==w.newUserId))];
    ops.push(`mutation { visitEditAssignedUsers(visitId: "${w.visitId}", input: { assignedUserIds: [${ids.map(i=>`"${i}"`).join(', ')}] }) { userErrors { message } } }`); }
  let bad=null;
  for(const op of ops){ const r=await gql(op); const ue=[];
    if(r.errors) ue.push(...r.errors.map(e=>e.message));
    for(const k of Object.keys(r.data||{})) if(r.data[k]?.userErrors) ue.push(...r.data[k].userErrors.map(e=>e.message));
    if(ue.length){bad=ue.join('; ');break;} await sleep(150);}
  if(bad){failed++;errs.push(`job ${w.job}: ${bad}`);} else ok++;
  if((i+1)%25===0) console.log(`  ${i+1}/${todo.length} (ok ${ok}, failed ${failed})`);
  await sleep(200);
}
console.log(`\nSUBSET WRITE DONE: ok ${ok}, failed ${failed} of ${todo.length}`);
if(errs.length) console.log('Errors:', errs.slice(0,10).join(' | '));
