import fs from 'node:fs';
const ENV='../../../.env';
const env={};for(const l of fs.readFileSync(ENV,'utf8').split(/\r?\n/)){const m=l.match(/^([A-Z0-9_]+)=(.*)$/);if(m)env[m[1]]=m[2].trim();}
function saveEnvKey(k,v){let t=fs.readFileSync(ENV,'utf8');const re=new RegExp('^'+k+'=.*$','m');t=re.test(t)?t.replace(re,k+'='+v):t+'\n'+k+'='+v+'\n';fs.writeFileSync(ENV,t);}
let tok=null;
async function token(){const r=await fetch('https://api.getjobber.com/api/oauth/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:env.JOBBER_CLIENT_ID,client_secret:env.JOBBER_CLIENT_SECRET,grant_type:'refresh_token',refresh_token:env.JOBBER_REFRESH_TOKEN})});const d=await r.json();
 if(d.refresh_token&&d.refresh_token!==env.JOBBER_REFRESH_TOKEN) saveEnvKey('JOBBER_REFRESH_TOKEN',d.refresh_token); tok=d.access_token;return tok;}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function g(q,v,a){a=a||0;const t=tok||await token();const r=await fetch('https://api.getjobber.com/api/graphql',{method:'POST',headers:{Authorization:'Bearer '+t,'Content-Type':'application/json','X-JOBBER-GRAPHQL-VERSION':'2025-04-16'},body:JSON.stringify({query:q,variables:v})});
 const d=await r.json().catch(function(){return {}});if(d.errors&&JSON.stringify(d.errors).indexOf('THROTTLED')>=0&&a<8){await sleep(2500*Math.pow(2,a));return g(q,v,a+1);}return d;}
const TZ='America/Los_Angeles';
const pt=s=>new Date(s).toLocaleString('sv-SE',{timeZone:TZ});
const Q='query($a:String,$after:ISO8601DateTime,$before:ISO8601DateTime){ visits(first:50, after:$a, filter:{ startAt:{ after:$after, before:$before } }){ nodes{ id startAt isComplete client{name} job{jobNumber} property{address{street city postalCode}} assignedUsers(first:3){nodes{name{full}}} } pageInfo{hasNextPage endCursor} } }';
let cur=null,target=null;
for(;;){ const d=await g(Q,{a:cur,after:'2026-08-10T00:00:00-07:00',before:'2026-08-16T23:59:59-07:00'});
 if(!d.data){console.log('ERR',JSON.stringify(d).slice(0,250));process.exit(1);}
 for(const v of d.data.visits.nodes) if(String(v.job&&v.job.jobNumber)==='7949' && !v.isComplete) target=v;
 if(!d.data.visits.pageInfo.hasNextPage)break; cur=d.data.visits.pageInfo.endCursor; await sleep(400);}
if(!target){ console.log('#7949 not found in 08-10..08-16'); process.exit(0); }
console.log('#7949 now:', pt(target.startAt), '|', ((target.assignedUsers&&target.assignedUsers.nodes)||[]).map(x=>x.name.full).join('+')||'NONE');
console.log('  ', target.property&&target.property.address&&target.property.address.street, ',', target.property&&target.property.address&&target.property.address.city);
const u=await g('query { users(first:100){ nodes{ id name{full} status } } }',{});
const rob=((u.data&&u.data.users&&u.data.users.nodes)||[]).filter(x=>x.name&&x.name.full&&x.name.full.trim()==='Robert Norton')[0];
if(!rob){ console.log('Robert Norton user not found'); process.exit(1); }
// all-day Thursday so the optimizer places it inside the day
const s1=await g('mutation { visitEditSchedule(id: "'+target.id+'", input: { startAt: { date: "2026-08-13", time: "00:00:00", timezone: "'+TZ+'" }, endAt: { date: "2026-08-13", time: "23:59:59", timezone: "'+TZ+'" } }) { userErrors { message } } }',{});
const e1=(s1.errors||[]).concat(((s1.data&&s1.data.visitEditSchedule&&s1.data.visitEditSchedule.userErrors)||[]));
console.log(e1.length? '  DATE FAIL '+JSON.stringify(e1).slice(0,200) : '  moved to Thu 2026-08-13 (all-day, optimizer will place it)');
const s2=await g('mutation { visitEditAssignedUsers(visitId: "'+target.id+'", input: { assignedUserIds: ["'+rob.id+'"] }) { userErrors { message } } }',{});
const e2=(s2.errors||[]).concat(((s2.data&&s2.data.visitEditAssignedUsers&&s2.data.visitEditAssignedUsers.userErrors)||[]));
console.log(e2.length? '  TECH FAIL '+JSON.stringify(e2).slice(0,200) : '  assigned to Robert Norton');
