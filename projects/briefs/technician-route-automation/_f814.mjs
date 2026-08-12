import fs from 'node:fs';
const ENV='../../../.env';
const env={};for(const l of fs.readFileSync(ENV,'utf8').split(/\r?\n/)){const m=l.match(/^([A-Z0-9_]+)=(.*)$/);if(m)env[m[1]]=m[2].trim();}
let tok=null;
async function token(){const r=await fetch('https://api.getjobber.com/api/oauth/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:env.JOBBER_CLIENT_ID,client_secret:env.JOBBER_CLIENT_SECRET,grant_type:'refresh_token',refresh_token:env.JOBBER_REFRESH_TOKEN})});const d=await r.json();
 if(d.refresh_token&&d.refresh_token!==env.JOBBER_REFRESH_TOKEN){let t=fs.readFileSync(ENV,'utf8');t=t.replace(/^JOBBER_REFRESH_TOKEN=.*$/m,'JOBBER_REFRESH_TOKEN='+d.refresh_token);fs.writeFileSync(ENV,t);}tok=d.access_token;return tok;}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function g(q,v,a){a=a||0;const t=tok||await token();const r=await fetch('https://api.getjobber.com/api/graphql',{method:'POST',headers:{Authorization:'Bearer '+t,'Content-Type':'application/json','X-JOBBER-GRAPHQL-VERSION':'2025-04-16'},body:JSON.stringify({query:q,variables:v})});
 const d=await r.json().catch(function(){return {}});if(d.errors&&JSON.stringify(d.errors).indexOf('THROTTLED')>=0&&a<8){await sleep(2500*Math.pow(2,a));return g(q,v,a+1);}return d;}
const T=JSON.parse(fs.readFileSync('territories.json','utf8'));
const ZR={}; for(const [n,r] of Object.entries(T.regions)) for(const z of r.zips) if(!ZR[z]) ZR[z]={region:n,owner:r.owner};
const hand=(T.handovers||[])[0];
console.log('handover:',hand.from,'->',hand.to,'effective',hand.effective);
const live=new Set(Object.keys(T.regions));
console.log('handover regions that NO LONGER EXIST in the map:');
let broken=0;
for(const r of hand.regions){ if(!live.has(r)){ console.log('   !! "'+r+'"'); broken++; } }
if(!broken) console.log('   (none)');
const Q='query($a:String,$after:ISO8601DateTime,$before:ISO8601DateTime){ visits(first:50, after:$a, filter:{ startAt:{ after:$after, before:$before } }){ nodes{ startAt isComplete client{name} job{jobNumber} property{address{street city postalCode}} assignedUsers(first:3){nodes{name{full}}} } pageInfo{hasNextPage endCursor} } }';
let cur=null; const byTech={}; const tavis=[];
for(;;){ const d=await g(Q,{a:cur,after:'2026-08-14T00:00:00-07:00',before:'2026-08-14T23:59:59-07:00'});
 if(!d.data){console.log('ERR',JSON.stringify(d).slice(0,250));break;}
 for(const v of d.data.visits.nodes){ if(v.isComplete)continue;
  const t=((v.assignedUsers&&v.assignedUsers.nodes)||[]).map(function(x){return x.name.full}).join('+')||'NONE';
  byTech[t]=(byTech[t]||0)+1;
  if(t.indexOf('Tavis')>=0) tavis.push(v); }
 if(!d.data.visits.pageInfo.hasNextPage)break; cur=d.data.visits.pageInfo.endCursor; await sleep(430);}
console.log('\n=== FRIDAY 2026-08-14 by tech ===');
for(const [t,n] of Object.entries(byTech).sort(function(a,b){return b[1]-a[1]})) console.log('  '+t.padEnd(20)+n);
console.log('\n=== Tavis stops on 08-14 ('+tavis.length+') — what the map says they should be ===');
const cnt={};
for(const v of tavis){ const z=((v.property&&v.property.address&&v.property.address.postalCode)||'').trim().slice(0,5);
  const m=ZR[z]||{region:'UNMAPPED',owner:'?'}; const k=m.region+' -> '+m.owner; cnt[k]=(cnt[k]||0)+1; }
for(const [k,n] of Object.entries(cnt).sort(function(a,b){return b[1]-a[1]})) console.log('  '+String(n).padStart(3)+'  '+k);
console.log('\n  sample:');
for(const v of tavis.slice(0,8)){ const z=((v.property&&v.property.address&&v.property.address.postalCode)||'').trim().slice(0,5);
  console.log('    #'+String(v.job&&v.job.jobNumber).padEnd(6)+z+' '+String((v.property&&v.property.address&&v.property.address.city)||'').padEnd(16)+(v.client&&v.client.name||'')); }
