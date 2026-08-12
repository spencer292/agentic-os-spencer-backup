#!/usr/bin/env node
// WRITE TIMES FROM PLAN — take the OptimoRoute plan that already exists for a day and write its
// arrival times back to Jobber. Nothing else: no re-planning, no day changes, no tech changes.
//
// Exists because jobber-to-optimo-sync couples "re-plan" and "write times": if a day's verify
// fails, the plan survives in OptimoRoute but the times never reach Jobber, and re-running is a
// no-op because the orders are already in sync. Spencer 2026-08-09 hit exactly that on Friday
// 08-14 — one off-route stop (#7949, his own) failed verification and blocked the write-back for
// the other 109.
//
// SAFETY: writes a visit ONLY if OptimoRoute's planned date equals the date Jobber already has.
// A visit whose day would move is reported and skipped — this tool can never shift a day.
//
// Usage: node write-times-from-plan.mjs dry|live --date=2026-08-14

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ENV_PATH = path.resolve(__dirname, '../../../.env');
const TZ = 'America/Los_Angeles';
const mode = process.argv[2];
const flag=(n,d)=>{const a=process.argv.find(x=>x.startsWith('--'+n+'='));return a?a.split('=')[1]:d;};
const DATE = flag('date');
if (!['dry','live'].includes(mode) || !DATE) { console.log('Usage: write-times-from-plan.mjs dry|live --date=YYYY-MM-DD'); process.exit(1); }

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
const toPT=s=>new Date(s).toLocaleString('sv-SE',{timeZone:TZ});
function visitNumOf(v){let n=null;try{n=Buffer.from(v.id,'base64').toString('utf8').split('/').pop();}catch(e){}
 if(!n||!/^\d+$/.test(n)) n=v.id.replace(/[^a-zA-Z0-9]/g,'').slice(-10); return n;}

// Jobber side
const Q='query($a:String,$after:ISO8601DateTime,$before:ISO8601DateTime){ visits(first:50, after:$a, filter:{ startAt:{ after:$after, before:$before } }){ nodes{ id startAt isComplete client{name} job{jobNumber} } pageInfo{hasNextPage endCursor} } }';
let cur=null; const jb={};
for(;;){ const d=await g(Q,{a:cur,after:DATE+'T00:00:00-07:00',before:DATE+'T23:59:59-07:00'});
 if(!d.data){console.error('Jobber query failed',JSON.stringify(d).slice(0,250));process.exit(1);}
 for(const v of d.data.visits.nodes){ if(v.isComplete) continue;
   jb[String(v.job&&v.job.jobNumber)+'-'+visitNumOf(v)]={visit:v,date:toPT(v.startAt).slice(0,10),cur:toPT(v.startAt)}; }
 if(!d.data.visits.pageInfo.hasNextPage)break; cur=d.data.visits.pageInfo.endCursor; await sleep(300);}

// OptimoRoute side
const rr=await(await fetch('https://api.optimoroute.com/v1/get_routes?key='+env.OPTIMOROUTE_API_KEY+'&date='+DATE)).json();
const plan={};
for(const rt of rr.routes||[]) for(const s of rt.stops||[]){
  if(!/^\d+-\w+$/.test(String(s.orderNo||''))) continue;
  plan[String(s.orderNo)]={hm:String(s.scheduledAt||'').slice(11,16)||String(s.scheduledAt||''),raw:s.scheduledAt,driver:rt.driverName}; }

console.log('WRITE TIMES FROM PLAN ('+mode.toUpperCase()+')  '+DATE);
console.log('  Jobber open visits : '+Object.keys(jb).length);
console.log('  OptimoRoute stops  : '+Object.keys(plan).length);
let ok=0,skip=0,fail=0,same=0,noplan=0;
const dayMove=[];
for(const [o,w] of Object.entries(jb)){
  const p=plan[o];
  if(!p){ noplan++; continue; }
  // get_routes returns scheduledAt as HH:MM only — the DATE is the date we queried, so every stop
  // in this response is on DATE by construction. The guard is therefore Jobber-side: refuse if
  // Jobber has this visit on some other day than the plan we are reading.
  if(w.date!==DATE){ dayMove.push(o+' jobber '+w.date+' vs plan '+DATE); skip++; continue; }
  const hm=String(p.hm||'').trim();
  if(!/^\d{1,2}:\d{2}$/.test(hm)){ noplan++; continue; }
  const t=(hm.length===4?'0'+hm:hm)+':00';
  if(w.cur.slice(11,16)===t.slice(0,5)){ same++; continue; }
  if(mode==='dry'){ ok++; continue; }
  const endPT=new Date(new Date(w.date+'T'+t+'-07:00').getTime()+3*3600000).toLocaleString('sv-SE',{timeZone:TZ});
  const r=await g('mutation { visitEditSchedule(id: "'+w.visit.id+'", input: { startAt: { date: "'+w.date+'", time: "'+t+'", timezone: "'+TZ+'" }, endAt: { date: "'+endPT.slice(0,10)+'", time: "'+endPT.slice(11,19)+'", timezone: "'+TZ+'" } }) { userErrors { message } } }',{});
  const ue=(r.errors||[]).map(e=>e.message);
  for(const k of Object.keys(r.data||{})) if(r.data[k]&&r.data[k].userErrors) ue.push(...r.data[k].userErrors.map(e=>e.message));
  if(ue.length){ fail++; console.log('  FAIL '+o+': '+ue.join('; ').slice(0,140)); } else ok++;
  await sleep(210);
}
console.log('\n  times '+(mode==='dry'?'to write':'written')+': '+ok+'   already correct: '+same+'   no plan (off-route): '+noplan+'   failed: '+fail);
if(dayMove.length){ console.log('  REFUSED — would move a day (never written by this tool):'); for(const d of dayMove.slice(0,10)) console.log('     '+d); }
