// READ-ONLY diagnosis + fix-plan generator. Compares current Jobber state to OptimoRoute (source of
// truth) for 07-07..07-13 and writes fixplan.json. Writes NOTHING to Jobber.
import fs from 'node:fs'; import path from 'node:path'; import { execFileSync } from 'node:child_process';
function loadEnv(){let d=process.cwd();for(let i=0;i<6;i++){const p=path.join(d,'.env');if(fs.existsSync(p)){const e={};for(const l of fs.readFileSync(p,'utf8').split(/\r?\n/)){const m=l.match(/^([A-Z0-9_]+)=(.*)$/);if(m)e[m[1]]=m[2].trim();}return e;}const u=path.dirname(d);if(u===d)break;d=u;}return{};}
const env=loadEnv(); const TZ='America/Los_Angeles';
const OPTIMO='C:/Agentic-os-got-moles/.claude/skills/tool-optimoroute/scripts/optimoroute-api.mjs';
const DAYS=['2026-07-07','2026-07-08','2026-07-09','2026-07-10','2026-07-11','2026-07-12','2026-07-13'];
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
// refresh Jobber token once
const tr=await fetch('https://api.getjobber.com/api/oauth/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:env.JOBBER_CLIENT_ID,client_secret:env.JOBBER_CLIENT_SECRET,grant_type:'refresh_token',refresh_token:env.JOBBER_REFRESH_TOKEN})});
const tok=JSON.parse(await tr.text()); if(!tok.access_token){console.error('token refresh failed:',JSON.stringify(tok));process.exit(1);}
if(tok.refresh_token){const raw=fs.readFileSync('.env','utf8').replace(/JOBBER_REFRESH_TOKEN=.*/,'JOBBER_REFRESH_TOKEN='+tok.refresh_token);fs.writeFileSync('.env',raw);}
const H={Authorization:'Bearer '+tok.access_token,'X-JOBBER-GRAPHQL-VERSION':'2025-04-16','Content-Type':'application/json'};
async function gql(q){for(let a=0;a<6;a++){const r=await fetch('https://api.getjobber.com/api/graphql',{method:'POST',headers:H,body:JSON.stringify({query:q})});const j=await r.json();if(j.errors&&JSON.stringify(j.errors).includes('THROTTLED')){await sleep(8000);continue;}if(j.errors)throw new Error(JSON.stringify(j.errors));return j;}throw new Error('throttled');}
// OR correct plan: jobNumber -> {date,time,driver}
const correct={}; const orByDay={};
for(const d of DAYS){const or=JSON.parse(execFileSync('node',[OPTIMO,'routes',d],{encoding:'utf8',maxBuffer:1<<24}));let n=0;for(const rt of or.routes||[])for(const s of rt.stops||[]){correct[String(s.orderNo)]={date:d,dt:s.scheduledAtDt,driver:rt.driverName};n++;}orByDay[d]=n;}
// Jobber visits across window (cheap query, paginated)
const toPac=iso=>{const dd=new Date(iso);dd.setUTCHours(dd.getUTCHours()-7);return dd.toISOString();};
const visits=[]; let cur=null,has=true,pg=0;
while(has&&pg<30){pg++;const after=cur?', after: "'+cur+'"':'';const q='query { visits(first: 100'+after+', filter: { startAt: { after: "2026-07-07T07:00:00Z", before: "2026-07-14T07:00:00Z" } }) { nodes { id startAt job { jobNumber } } pageInfo { hasNextPage endCursor } } }';const j=await gql(q);const v=j.data.visits;visits.push(...v.nodes);has=v.pageInfo.hasNextPage;cur=v.pageInfo.endCursor;if(has)await sleep(600);}
// current day distribution
const curByDay={}; for(const v of visits){const d=toPac(v.startAt).slice(0,10);curByDay[d]=(curByDay[d]||0)+1;}
// build fix plan
const fixSchedule=[]; let backlog=0, alreadyOk=0;
for(const v of visits){const jn=v.job&&v.job.jobNumber;if(jn==null)continue;const c=correct[String(jn)];const curDay=toPac(v.startAt).slice(0,10);const curT=toPac(v.startAt).slice(11,16);
  if(c){const wantDay=c.date, wantT=c.dt.slice(11,16);if(curDay!==wantDay||curT!==wantT){fixSchedule.push({visitId:v.id,job:String(jn),dt:c.dt,driver:c.driver,fromDay:curDay,toDay:wantDay});}else alreadyOk++;}
  else{if(curT!=='00:00')backlog++;}}
fs.writeFileSync('C:/Agentic-os-got-moles/projects/briefs/technician-route-automation/fixplan.json',JSON.stringify(fixSchedule,null,2));
console.log('=== OR correct stops per day ==='); for(const d of DAYS)console.log('  '+d+': OR '+orByDay[d]+'  | Jobber currently '+(curByDay[d]||0));
console.log('total Jobber visits in window:',visits.length);
console.log('OR-routed visits needing MOVE/RETIME:',fixSchedule.length,'| already correct:',alreadyOk);
console.log('backlog (non-OR) visits with a time (should be anytime):',backlog);
console.log('fixplan.json written ('+fixSchedule.length+' schedule corrections)');
