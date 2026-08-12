import fs from 'node:fs';
const ENV='../../../.env';
const env={};for(const l of fs.readFileSync(ENV,'utf8').split(/\r?\n/)){const m=l.match(/^([A-Z0-9_]+)=(.*)$/);if(m)env[m[1]]=m[2].trim();}
let tok=null;
async function token(){const r=await fetch('https://api.getjobber.com/api/oauth/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:env.JOBBER_CLIENT_ID,client_secret:env.JOBBER_CLIENT_SECRET,grant_type:'refresh_token',refresh_token:env.JOBBER_REFRESH_TOKEN})});const d=await r.json();
 if(d.refresh_token&&d.refresh_token!==env.JOBBER_REFRESH_TOKEN){let t=fs.readFileSync(ENV,'utf8');t=t.replace(/^JOBBER_REFRESH_TOKEN=.*$/m,'JOBBER_REFRESH_TOKEN='+d.refresh_token);fs.writeFileSync(ENV,t);}tok=d.access_token;return tok;}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function g(q,v,a){a=a||0;const t=tok||await token();const r=await fetch('https://api.getjobber.com/api/graphql',{method:'POST',headers:{Authorization:'Bearer '+t,'Content-Type':'application/json','X-JOBBER-GRAPHQL-VERSION':'2025-04-16'},body:JSON.stringify({query:q,variables:v})});
 const d=await r.json().catch(function(){return {}});if(d.errors&&JSON.stringify(d.errors).indexOf('THROTTLED')>=0&&a<8){await sleep(2500*Math.pow(2,a));return g(q,v,a+1);}return d;}
function visitNumOf(v){let n=null;try{n=Buffer.from(v.id,'base64').toString('utf8').split('/').pop();}catch(e){}
 if(!n||!/^\d+$/.test(n)) n=v.id.replace(/[^a-zA-Z0-9]/g,'').slice(-10); return n;}
const before=JSON.parse(fs.readFileSync('_tue_plan_before.json','utf8'));
const env2=env;
const r=await(await fetch('https://api.optimoroute.com/v1/get_routes?key='+env2.OPTIMOROUTE_API_KEY+'&date=2026-08-11')).json();
const after={};
for(const rt of r.routes||[]) for(const s of rt.stops||[]) if(/^\d+-\w+$/.test(String(s.orderNo||''))) after[String(s.orderNo)]={t:s.scheduledAt,driver:rt.driverName};
const Q='query($a:String,$after:ISO8601DateTime,$before:ISO8601DateTime){ visits(first:50, after:$a, filter:{ startAt:{ after:$after, before:$before } }){ nodes{ id isComplete startAt client{ name phones{ number } } job{jobNumber} property{address{street city}} } pageInfo{hasNextPage endCursor} } }';
let cur=null; const info={};
for(;;){ const d=await g(Q,{a:cur,after:'2026-08-11T00:00:00-07:00',before:'2026-08-11T23:59:59-07:00'});
 if(!d.data){console.log('ERR',JSON.stringify(d).slice(0,200));break;}
 for(const v of d.data.visits.nodes){ if(v.isComplete)continue; info[String(v.job&&v.job.jobNumber)+'-'+visitNumOf(v)]=v; }
 if(!d.data.visits.pageInfo.hasNextPage)break; cur=d.data.visits.pageInfo.endCursor; await sleep(320);}
const toMin=t=>{const m=String(t||'').match(/(\d{1,2}):(\d{2})/);return m?(Number(m[1])*60+Number(m[2])):null;};
const rows=[];
for(const [o,b] of Object.entries(before)){ const a=after[o]; if(!a)continue;
  const d=Math.abs((toMin(a.t)||0)-(toMin(b.t)||0)); if(d<=60)continue;
  const v=info[o]; rows.push({o,d,from:b.t,to:a.t,driver:b.driver,
    client:(v&&v.client&&v.client.name)||'?', phone:(v&&v.client&&v.client.phones&&v.client.phones[0]&&v.client.phones[0].number)||'',
    addr:((v&&v.property&&v.property.address&&v.property.address.street)||'')+', '+((v&&v.property&&v.property.address&&v.property.address.city)||'')}); }
rows.sort((x,y)=>y.d-x.d);
console.log('CUSTOMERS MOVED MORE THAN 60 MIN ON TUE 08-11 — '+rows.length+'\n');
for(const r2 of rows) console.log('  '+String(r2.d+'m').padStart(5)+'  '+r2.from+' -> '+r2.to+'  '+r2.driver.split(' ')[0].padEnd(7)+String(r2.client).slice(0,24).padEnd(26)+String(r2.phone).padEnd(15)+r2.addr.slice(0,42));
fs.writeFileSync('tue-0811-moved-over-60min.json',JSON.stringify(rows,null,2));
console.log('\nSaved: tue-0811-moved-over-60min.json');
