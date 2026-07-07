// Reverts every visit that is NOT sitting at its correct OptimoRoute slot back to ALL-DAY / anytime,
// on its current day. Leaves correctly-placed OR route stops untouched.
// Run:  node projects/briefs/technician-route-automation/revert-backlog.mjs
import fs from 'node:fs'; import path from 'node:path'; import { execFileSync } from 'node:child_process';
function loadEnv(){let d=process.cwd();for(let i=0;i<6;i++){const p=path.join(d,'.env');if(fs.existsSync(p)){const e={};for(const l of fs.readFileSync(p,'utf8').split(/\r?\n/)){const m=l.match(/^([A-Z0-9_]+)=(.*)$/);if(m)e[m[1]]=m[2].trim();}return e;}const u=path.dirname(d);if(u===d)break;d=u;}return{};}
const env=loadEnv(); const TZ='America/Los_Angeles';
const OPTIMO='C:/Agentic-os-got-moles/.claude/skills/tool-optimoroute/scripts/optimoroute-api.mjs';
const DAYS=['2026-07-07','2026-07-08','2026-07-09','2026-07-10','2026-07-11','2026-07-12','2026-07-13'];
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const tr=await fetch('https://api.getjobber.com/api/oauth/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:env.JOBBER_CLIENT_ID,client_secret:env.JOBBER_CLIENT_SECRET,grant_type:'refresh_token',refresh_token:env.JOBBER_REFRESH_TOKEN})});
const tok=JSON.parse(await tr.text()); if(!tok.access_token){console.error('token refresh failed');process.exit(1);}
if(tok.refresh_token){const raw=fs.readFileSync('.env','utf8').replace(/JOBBER_REFRESH_TOKEN=.*/,'JOBBER_REFRESH_TOKEN='+tok.refresh_token);fs.writeFileSync('.env',raw);}
const H={Authorization:'Bearer '+tok.access_token,'X-JOBBER-GRAPHQL-VERSION':'2025-04-16','Content-Type':'application/json'};
async function gql(q){for(let a=0;a<6;a++){const r=await fetch('https://api.getjobber.com/api/graphql',{method:'POST',headers:H,body:JSON.stringify({query:q})});const j=await r.json();if(j.errors&&JSON.stringify(j.errors).includes('THROTTLED')){await sleep(8000);continue;}if(j.errors)throw new Error(JSON.stringify(j.errors));return j;}throw new Error('throttled');}
const toPac=iso=>{const d=new Date(iso);d.setUTCHours(d.getUTCHours()-7);return d.toISOString();};
const visits=[]; let cur=null,has=true,pg=0;
while(has&&pg<30){pg++;const after=cur?', after: "'+cur+'"':'';const q='query { visits(first: 100'+after+', filter: { startAt: { after: "2026-07-07T07:00:00Z", before: "2026-07-14T07:00:00Z" } }) { nodes { id startAt endAt allDay job { jobNumber } } pageInfo { hasNextPage endCursor } } }';const j=await gql(q);const v=j.data.visits;visits.push(...v.nodes);has=v.pageInfo.hasNextPage;cur=v.pageInfo.endCursor;if(has)await sleep(500);}
// targets = ONLY the visits *I* damaged: exact 07:00-19:00 placeholder window. Leaves real appointments alone.
const targets=[]; for(const v of visits){const jn=v.job&&v.job.jobNumber;if(jn==null)continue;const p=toPac(v.startAt);const hm=p.slice(11,16);const eh=v.endAt?toPac(v.endAt).slice(11,16):'';if(!v.allDay&&hm==='07:00'&&eh==='19:00')targets.push({visitId:v.id,job:String(jn),day:p.slice(0,10)});}
console.log('visits:',visits.length,'| 7am-7pm placeholders to revert:',targets.length);
let ok=0,fail=0;const errs=[];
for(let i=0;i<targets.length;i++){const t=targets[i];const m='mutation { visitEditSchedule(id: "'+t.visitId+'", input: { startAt: { date: "'+t.day+'", time: "00:00:00", timezone: "'+TZ+'" }, endAt: { date: "'+t.day+'", time: "23:59:59", timezone: "'+TZ+'" } }) { visit { allDay } userErrors { message } } }';
  let done=false;for(let a=0;a<6&&!done;a++){const r=await fetch('https://api.getjobber.com/api/graphql',{method:'POST',headers:H,body:JSON.stringify({query:m})});const j=await r.json();if(j.errors&&JSON.stringify(j.errors).includes('THROTTLED')){await sleep(8000);continue;}const ue=[];if(j.errors)ue.push(...j.errors.map(e=>e.message));const dd=j.data||{};for(const k of Object.keys(dd))if(dd[k]&&dd[k].userErrors)ue.push(...dd[k].userErrors.map(e=>e.message));if(ue.length){fail++;errs.push(t.job+':'+ue.join(';'));}else ok++;done=true;}
  if((i+1)%50===0)console.log('  '+(i+1)+'/'+targets.length+' (ok '+ok+', fail '+fail+')');await sleep(120);}
console.log('DONE. reverted ok '+ok+' | failed '+fail);if(errs.length)console.log('errors (first 10): '+errs.slice(0,10).join(' | '));
