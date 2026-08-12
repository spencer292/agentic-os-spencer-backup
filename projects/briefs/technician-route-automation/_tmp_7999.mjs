import fs from 'node:fs';
const ENV='../../../.env';
const env={};for(const l of fs.readFileSync(ENV,'utf8').split(/\r?\n/)){const m=l.match(/^([A-Z0-9_]+)=(.*)$/);if(m)env[m[1]]=m[2].trim();}
let tok=null;
async function token(){const r=await fetch('https://api.getjobber.com/api/oauth/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:env.JOBBER_CLIENT_ID,client_secret:env.JOBBER_CLIENT_SECRET,grant_type:'refresh_token',refresh_token:env.JOBBER_REFRESH_TOKEN})});const d=await r.json();
 if(d.refresh_token&&d.refresh_token!==env.JOBBER_REFRESH_TOKEN){let t=fs.readFileSync(ENV,'utf8');t=t.replace(/^JOBBER_REFRESH_TOKEN=.*$/m,'JOBBER_REFRESH_TOKEN='+d.refresh_token);fs.writeFileSync(ENV,t);}tok=d.access_token;return tok;}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function g(q,v,a){a=a||0;const t=tok||await token();const r=await fetch('https://api.getjobber.com/api/graphql',{method:'POST',headers:{Authorization:'Bearer '+t,'Content-Type':'application/json','X-JOBBER-GRAPHQL-VERSION':'2025-04-16'},body:JSON.stringify({query:q,variables:v})});
 const d=await r.json().catch(function(){return {}});if(d.errors&&JSON.stringify(d.errors).indexOf('THROTTLED')>=0&&a<8){await sleep(2500*Math.pow(2,a));return g(q,v,a+1);}return d;}
const Q='query($a:String,$after:ISO8601DateTime,$before:ISO8601DateTime){ visits(first:50, after:$a, filter:{ startAt:{ after:$after, before:$before } }){ nodes{ id title startAt isComplete client{name} job{ jobNumber jobType jobStatus } property{address{street city postalCode}} assignedUsers(first:4){nodes{id name{full}}} } pageInfo{hasNextPage endCursor} } }';
let cur=null; let target=null;
for(;;){ const d=await g(Q,{a:cur,after:'2026-09-14T00:00:00-07:00',before:'2026-09-16T23:59:59-07:00'});
  if(!d.data){console.log('ERR',JSON.stringify(d).slice(0,300));break;}
  for(const v of d.data.visits.nodes) if(String(v.job&&v.job.jobNumber)==='7999') target=v;
  if(!d.data.visits.pageInfo.hasNextPage)break; cur=d.data.visits.pageInfo.endCursor; await sleep(430);}
if(!target){console.log('#7999 not found 09-14..09-16');process.exit(0);}
console.log('#7999');
console.log('  visitId :',target.id);
console.log('  title   :',target.title);
console.log('  start   :',new Date(target.startAt).toLocaleString('sv-SE',{timeZone:'America/Los_Angeles'}));
console.log('  client  :',target.client&&target.client.name);
console.log('  addr    :',target.property&&target.property.address.street,',',target.property&&target.property.address.city,target.property&&target.property.address.postalCode);
console.log('  jobType :',target.job&&target.job.jobType,'  status:',target.job&&target.job.jobStatus);
console.log('  tech    :',(target.assignedUsers&&target.assignedUsers.nodes||[]).map(function(x){return x.name.full}).join('+')||'NONE');
console.log('\nAttempting the exact mutation to capture the full error...');
const users = await g('query { users(first: 100) { nodes { id name { full } status } } }',{});
const alias = (users.data&&users.data.users.nodes||[]).filter(function(u){return u.name&&u.name.full&&u.name.full.trim()==='Alias Franks'})[0];
console.log('  Alias userId:', alias&&alias.id, ' status:', alias&&alias.status);
const m = await g('mutation { visitEditAssignedUsers(visitId: "'+target.id+'", input: { assignedUserIds: ["'+(alias&&alias.id)+'"] }) { userErrors { message path } visit { id } } }',{});
console.log('  RESULT:', JSON.stringify(m).slice(0,700));
