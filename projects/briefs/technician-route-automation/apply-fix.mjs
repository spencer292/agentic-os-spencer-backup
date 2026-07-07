// APPLY fix: moves each OR-routed visit back to its correct OptimoRoute day+time (from fixplan.json).
// Run yourself:  node projects/briefs/technician-route-automation/apply-fix.mjs
import fs from 'node:fs'; import path from 'node:path';
function loadEnv(){let d=process.cwd();for(let i=0;i<6;i++){const p=path.join(d,'.env');if(fs.existsSync(p)){const e={};for(const l of fs.readFileSync(p,'utf8').split(/\r?\n/)){const m=l.match(/^([A-Z0-9_]+)=(.*)$/);if(m)e[m[1]]=m[2].trim();}return e;}const u=path.dirname(d);if(u===d)break;d=u;}return{};}
const env=loadEnv(); const TZ='America/Los_Angeles';
const plan=JSON.parse(fs.readFileSync('C:/Agentic-os-got-moles/projects/briefs/technician-route-automation/fixplan.json','utf8'));
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const tr=await fetch('https://api.getjobber.com/api/oauth/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:env.JOBBER_CLIENT_ID,client_secret:env.JOBBER_CLIENT_SECRET,grant_type:'refresh_token',refresh_token:env.JOBBER_REFRESH_TOKEN})});
const tok=JSON.parse(await tr.text()); if(!tok.access_token){console.error('token refresh failed');process.exit(1);}
if(tok.refresh_token){const raw=fs.readFileSync('.env','utf8').replace(/JOBBER_REFRESH_TOKEN=.*/,'JOBBER_REFRESH_TOKEN='+tok.refresh_token);fs.writeFileSync('.env',raw);}
const H={Authorization:'Bearer '+tok.access_token,'X-JOBBER-GRAPHQL-VERSION':'2025-04-16','Content-Type':'application/json'};
function pad(n){return String(n).padStart(2,'0');}
function ends(dt){const d=dt.slice(0,10),t=dt.slice(11,19);let h=parseInt(t.slice(0,2),10)+2;if(h>23)h=23;return{sd:d,st:t,ed:d,et:pad(h)+t.slice(2)};}
let ok=0,fail=0; const errs=[];
console.log('Applying '+plan.length+' schedule corrections...');
for(let i=0;i<plan.length;i++){const p=plan[i];const w=ends(p.dt);
  const m='mutation { visitEditSchedule(id: "'+p.visitId+'", input: { startAt: { date: "'+w.sd+'", time: "'+w.st+'", timezone: "'+TZ+'" }, endAt: { date: "'+w.ed+'", time: "'+w.et+'", timezone: "'+TZ+'" } }) { userErrors { message } } }';
  let done=false;
  for(let a=0;a<6&&!done;a++){const r=await fetch('https://api.getjobber.com/api/graphql',{method:'POST',headers:H,body:JSON.stringify({query:m})});const j=await r.json();
    if(j.errors&&JSON.stringify(j.errors).includes('THROTTLED')){await sleep(8000);continue;}
    const ue=[]; if(j.errors)ue.push(...j.errors.map(e=>e.message)); const dd=j.data||{}; for(const k of Object.keys(dd))if(dd[k]&&dd[k].userErrors)ue.push(...dd[k].userErrors.map(e=>e.message));
    if(ue.length){fail++;errs.push(p.job+': '+ue.join(';'));}else{ok++;} done=true;}
  if((i+1)%50===0)console.log('  '+(i+1)+'/'+plan.length+' (ok '+ok+', fail '+fail+')');
  await sleep(120);
}
console.log('DONE. ok '+ok+' | failed '+fail);
if(errs.length)console.log('errors (first 15): '+errs.slice(0,15).join(' | '));
