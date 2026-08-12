import fs from 'node:fs';
const ENV='../../../.env';
const env={};for(const l of fs.readFileSync(ENV,'utf8').split(/\r?\n/)){const m=l.match(/^([A-Z0-9_]+)=(.*)$/);if(m)env[m[1]]=m[2].trim();}
let tok=null;
async function token(){const r=await fetch('https://api.getjobber.com/api/oauth/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:env.JOBBER_CLIENT_ID,client_secret:env.JOBBER_CLIENT_SECRET,grant_type:'refresh_token',refresh_token:env.JOBBER_REFRESH_TOKEN})});const d=await r.json();
 if(d.refresh_token&&d.refresh_token!==env.JOBBER_REFRESH_TOKEN){let t=fs.readFileSync(ENV,'utf8');t=t.replace(/^JOBBER_REFRESH_TOKEN=.*$/m,'JOBBER_REFRESH_TOKEN='+d.refresh_token);fs.writeFileSync(ENV,t);}tok=d.access_token;return tok;}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function g(q,v,a){a=a||0;const t=tok||await token();const r=await fetch('https://api.getjobber.com/api/graphql',{method:'POST',headers:{Authorization:'Bearer '+t,'Content-Type':'application/json','X-JOBBER-GRAPHQL-VERSION':'2025-04-16'},body:JSON.stringify({query:q,variables:v})});
 const d=await r.json().catch(function(){return {}});if(d.errors&&JSON.stringify(d.errors).indexOf('THROTTLED')>=0&&a<8){await sleep(2500*Math.pow(2,a));return g(q,v,a+1);}return d;}
const pt=s=>new Date(s).toLocaleString('sv-SE',{timeZone:'America/Los_Angeles'}).slice(0,10);
const DOW=['sun','mon','tue','wed','thu','fri','sat'];
const dowOf=s=>{const p=s.split('-').map(Number);return DOW[new Date(Date.UTC(p[0],p[1]-1,p[2])).getUTCDay()];};

// 1. live board for the week Spencer built
const Q='query($a:String,$after:ISO8601DateTime,$before:ISO8601DateTime){ visits(first:50, after:$a, filter:{ startAt:{ after:$after, before:$before } }){ nodes{ startAt isComplete job{jobNumber} property{address{street city postalCode}} assignedUsers(first:3){nodes{name{full}}} } pageInfo{hasNextPage endCursor} } }';
let cur=null; const board=[];
for(;;){ const d=await g(Q,{a:cur,after:'2026-08-10T00:00:00-07:00',before:'2026-08-14T23:59:59-07:00'});
 if(!d.data){console.log('ERR',JSON.stringify(d).slice(0,250));process.exit(1);}
 for(const v of d.data.visits.nodes) if(!v.isComplete) board.push({date:pt(v.startAt),zip:((v.property&&v.property.address&&v.property.address.postalCode)||'').trim().slice(0,5),city:(v.property&&v.property.address&&v.property.address.city)||'',tech:((v.assignedUsers&&v.assignedUsers.nodes)||[]).map(x=>x.name.full)[0]||'NONE'});
 if(!d.data.visits.pageInfo.hasNextPage)break; cur=d.data.visits.pageInfo.endCursor; await sleep(420);}
console.log('live board 08-10..08-14 open visits:',board.length);

// 2. re-verify each candidate against CURRENT state
const P=JSON.parse(fs.readFileSync('_cadence_final.json','utf8'));
const CAND=P.ADD;
const out=[];
for(const c of CAND){
  const d=await g('query($id:EncodedId!){ job(id:$id){ id jobNumber client{name} property{address{street city postalCode}} visits(first:80){ nodes{ id startAt isComplete assignedUsers(first:3){nodes{name{full}}} } } } }',{id:JSON.parse(fs.readFileSync('_cadence_jobs.json','utf8'))[c.jn].id});
  const j=d.data&&d.data.job; if(!j){console.log('  fetch fail',c.jn);continue;}
  const fut=((j.visits&&j.visits.nodes)||[]).filter(v=>!v.isComplete).map(v=>pt(v.startAt)).sort();
  const next=fut[0]||null;
  const stillNeeded = !next || next > c.ideal;
  const zip=((j.property&&j.property.address&&j.property.address.postalCode)||'').trim().slice(0,5);
  // where is this zip actually being served next week, and by whom?
  const sameZip=board.filter(b=>b.zip===zip);
  const byDay={};
  for(const b of sameZip){ const k=b.date+'|'+b.tech; byDay[k]=(byDay[k]||0)+1; }
  const ranked=Object.entries(byDay).sort((a,b)=>b[1]-a[1]).map(([k,n])=>({date:k.split('|')[0],tech:k.split('|')[1],n}));
  // choose the earliest day at/after the due date that already serves this zip; else the busiest
  const onOrAfter=ranked.filter(r=>r.date>=c.ideal).sort((a,b)=>a.date.localeCompare(b.date));
  const pick=onOrAfter[0]||ranked[0]||null;
  out.push({jn:c.jn,client:j.client&&j.client.name,zip,city:(j.property&&j.property.address&&j.property.address.city)||'',
    street:(j.property&&j.property.address&&j.property.address.street)||'',
    act:c.act,caught:c.caught,due:c.ideal,next,stillNeeded,
    place:pick?pick.date:null, tech:pick?pick.tech:c.owner, sameZipStops:pick?pick.n:0,
    mapTarget:c.target, mapOwner:c.owner, jobId:j.id});
  await sleep(320);
}
fs.writeFileSync('_adds_plan.json',JSON.stringify(out,null,2));
console.log('\njob    client                 zip    act c  due         next-now    -> PLACE ON    tech            (existing stops in that zip that day)');
for(const o of out) console.log('  #'+o.jn.padEnd(6)+String(o.client).slice(0,20).padEnd(22)+o.zip+'  '+String(o.act).padEnd(3)+String(o.caught==null?'?':o.caught).padEnd(3)+o.due+'  '+String(o.next||'NONE').padEnd(11)+' -> '+String(o.place||'??').padEnd(12)+String(o.tech).padEnd(15)+o.sameZipStops+(o.stillNeeded?'':'   <-- NO LONGER NEEDED'));
