import fs from 'node:fs';
const ENV='../../../.env';
const env={};for(const l of fs.readFileSync(ENV,'utf8').split(/\r?\n/)){const m=l.match(/^([A-Z0-9_]+)=(.*)$/);if(m)env[m[1]]=m[2].trim();}
let tok=null;
async function token(){const r=await fetch('https://api.getjobber.com/api/oauth/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:env.JOBBER_CLIENT_ID,client_secret:env.JOBBER_CLIENT_SECRET,grant_type:'refresh_token',refresh_token:env.JOBBER_REFRESH_TOKEN})});const d=await r.json();
 if(d.refresh_token&&d.refresh_token!==env.JOBBER_REFRESH_TOKEN){let t=fs.readFileSync(ENV,'utf8');t=t.replace(/^JOBBER_REFRESH_TOKEN=.*$/m,'JOBBER_REFRESH_TOKEN='+d.refresh_token);fs.writeFileSync(ENV,t);}tok=d.access_token;return tok;}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function g(q,v,a){a=a||0;const t=tok||await token();const r=await fetch('https://api.getjobber.com/api/graphql',{method:'POST',headers:{Authorization:'Bearer '+t,'Content-Type':'application/json','X-JOBBER-GRAPHQL-VERSION':'2025-04-16'},body:JSON.stringify({query:q,variables:v})});
 const d=await r.json().catch(function(){return {}});if(d.errors&&JSON.stringify(d.errors).indexOf('THROTTLED')>=0&&a<8){await sleep(2500*Math.pow(2,a));return g(q,v,a+1);}return d;}
const pt=s=>new Date(s).toLocaleString('sv-SE',{timeZone:'America/Los_Angeles'});
function visitNumOf(v){let n=null;try{n=Buffer.from(v.id,'base64').toString('utf8').split('/').pop();}catch(e){}
 if(!n||!/^\d+$/.test(n)) n=v.id.replace(/[^a-zA-Z0-9]/g,'').slice(-10); return n;}
// OptimoRoute
const r=await(await fetch('https://api.optimoroute.com/v1/get_routes?key='+env.OPTIMOROUTE_API_KEY+'&date=2026-08-11')).json();
const orCory=[];
for(const rt of r.routes||[]){ if(rt.driverName!=='Cory Ventura') continue;
  for(const s of rt.stops||[]) if(/^\d+-\w+$/.test(String(s.orderNo||''))) orCory.push({o:String(s.orderNo),t:s.scheduledAt}); }
// Jobber
const Q='query($a:String,$after:ISO8601DateTime,$before:ISO8601DateTime){ visits(first:50, after:$a, filter:{ startAt:{ after:$after, before:$before } }){ nodes{ id isComplete startAt client{name} job{jobNumber} property{address{street city}} assignedUsers(first:3){nodes{name{full}}} } pageInfo{hasNextPage endCursor} } }';
let cur=null; const jbCory=[];
for(;;){ const d=await g(Q,{a:cur,after:'2026-08-11T00:00:00-07:00',before:'2026-08-11T23:59:59-07:00'});
 if(!d.data){console.log('ERR');break;}
 for(const v of d.data.visits.nodes){ if(v.isComplete)continue;
   const t=((v.assignedUsers&&v.assignedUsers.nodes)||[]).map(x=>x.name.full)[0]||'NONE';
   if(t==='Cory Ventura') jbCory.push({o:String(v.job&&v.job.jobNumber)+'-'+visitNumOf(v),job:String(v.job&&v.job.jobNumber),t:pt(v.startAt).slice(11,16),client:v.client&&v.client.name,city:v.property&&v.property.address&&v.property.address.city}); }
 if(!d.data.visits.pageInfo.hasNextPage)break; cur=d.data.visits.pageInfo.endCursor; await sleep(320);}
console.log('Cory Tuesday 08-11 — OptimoRoute stops: '+orCory.length+'   Jobber visits: '+jbCory.length);
const orSet=new Map(orCory.map(x=>[x.o,x.t]));
const missing=jbCory.filter(x=>!orSet.has(x.o));
console.log('  in Jobber but NOT on his OR route: '+missing.length);
for(const m of missing) console.log('     #'+m.job+'  '+m.t+'  '+m.client+'  '+m.city);
console.log('\n  the 5 new West Seattle jobs:');
for(const jn of ['8340','8344','8345','8346','8348']){
  const j=jbCory.filter(x=>x.job===jn)[0];
  const inOR = j? orSet.get(j.o) : null;
  console.log('    #'+jn+'  jobber '+(j? j.t+' '+(j.client||'') : 'NOT on Cory')+'   |  OptimoRoute '+(inOR||'NOT PRESENT'));
}
console.log('\n  Cory OR route first/last: '+(orCory.length? orCory[0].t+' -> '+orCory[orCory.length-1].t : 'n/a'));
