import fs from 'node:fs';
const ENV='../../../.env';
const env={};for(const l of fs.readFileSync(ENV,'utf8').split(/\r?\n/)){const m=l.match(/^([A-Z0-9_]+)=(.*)$/);if(m)env[m[1]]=m[2].trim();}
let tok=null;
async function token(){const r=await fetch('https://api.getjobber.com/api/oauth/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:env.JOBBER_CLIENT_ID,client_secret:env.JOBBER_CLIENT_SECRET,grant_type:'refresh_token',refresh_token:env.JOBBER_REFRESH_TOKEN})});const d=await r.json();
 if(d.refresh_token&&d.refresh_token!==env.JOBBER_REFRESH_TOKEN){let t=fs.readFileSync(ENV,'utf8');t=t.replace(/^JOBBER_REFRESH_TOKEN=.*$/m,'JOBBER_REFRESH_TOKEN='+d.refresh_token);fs.writeFileSync(ENV,t);}tok=d.access_token;return tok;}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function g(q,v,a){a=a||0;const t=tok||await token();const r=await fetch('https://api.getjobber.com/api/graphql',{method:'POST',headers:{Authorization:'Bearer '+t,'Content-Type':'application/json','X-JOBBER-GRAPHQL-VERSION':'2025-04-16'},body:JSON.stringify({query:q,variables:v})});
 const d=await r.json().catch(function(){return {}});if(d.errors&&JSON.stringify(d.errors).indexOf('THROTTLED')>=0&&a<8){await sleep(2500*Math.pow(2,a));return g(q,v,a+1);}return d;}
const Q='query($a:String,$after:ISO8601DateTime,$before:ISO8601DateTime){ visits(first:50, after:$a, filter:{ startAt:{ after:$after, before:$before } }){ nodes{ startAt isComplete property{address{postalCode city}} assignedUsers(first:3){nodes{name{full}}} } pageInfo{hasNextPage endCursor} } }';
const pt=s=>new Date(s).toLocaleString('sv-SE',{timeZone:'America/Los_Angeles'}).slice(0,10);
function weekOf(d){const p=d.split('-').map(Number);const dt=new Date(Date.UTC(p[0],p[1]-1,p[2]));const dow=(dt.getUTCDay()+6)%7;dt.setUTCDate(dt.getUTCDate()-dow);return dt.toISOString().slice(0,10);}
let cur=null; const byWeek={}, cities={}; let total=0;
for(;;){ const d=await g(Q,{a:cur,after:'2026-08-09T00:00:00-07:00',before:'2026-12-31T23:59:59-07:00'});
 if(!d.data){console.log('ERR',JSON.stringify(d).slice(0,250));break;}
 for(const v of d.data.visits.nodes){ if(v.isComplete)continue;
   const techs=(v.assignedUsers&&v.assignedUsers.nodes||[]).map(function(x){return x.name.full});
   if(techs.indexOf('Tavis Alexander')<0) continue;
   total++;
   const dt=pt(v.startAt); const w=weekOf(dt);
   byWeek[w]=(byWeek[w]||0)+1;
   const c=(v.property&&v.property.address&&v.property.address.city)||'?'; cities[c]=(cities[c]||0)+1; }
 if(!d.data.visits.pageInfo.hasNextPage)break; cur=d.data.visits.pageInfo.endCursor; await sleep(430);}
console.log('Tavis open visits 2026-08-09..12-31:',total,'\n');
console.log('by week (week starting Monday):');
for(const w of Object.keys(byWeek).sort()) console.log('  '+w+'  '+String(byWeek[w]).padStart(4));
console.log('\ntop cities:');
const cs=Object.entries(cities).sort(function(a,b){return b[1]-a[1]}).slice(0,14);
for(const c of cs) console.log('  '+c[0].padEnd(18)+c[1]);
