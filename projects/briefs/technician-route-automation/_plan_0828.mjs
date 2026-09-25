// READ-ONLY. Build an add-interim-visits.mjs-conformant plan for the 2026-08-28 "add visit" list.
import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
const __dirname=path.dirname(fileURLToPath(import.meta.url));
const ENV=path.resolve(__dirname,'../../../.env');
const env={};for(const l of fs.readFileSync(ENV,'utf8').split(/\r?\n/)){const m=l.match(/^([A-Z0-9_]+)=(.*)$/);if(m)env[m[1]]=m[2].trim();}
const tr=await(await fetch('https://api.getjobber.com/api/oauth/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:env.JOBBER_CLIENT_ID,client_secret:env.JOBBER_CLIENT_SECRET,grant_type:'refresh_token',refresh_token:env.JOBBER_REFRESH_TOKEN})})).json();
if(tr.refresh_token&&tr.refresh_token!==env.JOBBER_REFRESH_TOKEN){let t=fs.readFileSync(ENV,'utf8');t=t.replace(/^JOBBER_REFRESH_TOKEN=.*$/m,'JOBBER_REFRESH_TOKEN='+tr.refresh_token);fs.writeFileSync(ENV,t);}
const tok=tr.access_token;const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function g(q,v,a){a=a||0;const r=await fetch('https://api.getjobber.com/api/graphql',{method:'POST',headers:{Authorization:'Bearer '+tok,'Content-Type':'application/json','X-JOBBER-GRAPHQL-VERSION':'2025-04-16'},body:JSON.stringify({query:q,variables:v})});const d=await r.json().catch(()=>({}));if(d.errors&&JSON.stringify(d.errors).includes('THROTTLED')&&a<8){await sleep(2500*Math.pow(2,a));return g(q,v,a+1);}return d;}
const pt=s=>new Date(s).toLocaleString('sv-SE',{timeZone:'America/Los_Angeles'}).slice(0,10);
const addDays=(d,n)=>{const p=d.split('-').map(Number);const x=new Date(Date.UTC(p[0],p[1]-1,p[2]));x.setUTCDate(x.getUTCDate()+n);return x.toISOString().slice(0,10);};
const DOW=['sun','mon','tue','wed','thu','fri','sat'];
const dowOf=s=>{const p=s.split('-').map(Number);return DOW[new Date(Date.UTC(p[0],p[1]-1,p[2])).getUTCDay()];};

const LIST=[
 {jn:'8249',tech:'alias', last:'2026-08-28',act:'ma',caught:3},
 {jn:'8218',tech:'robert',last:'2026-08-27',act:'la',caught:1},
 {jn:'8456',tech:'robert',last:'2026-08-27',act:'ma',caught:0},
 {jn:'8093',tech:'robert',last:'2026-08-27',act:'la',caught:1},
 {jn:'8074',tech:'alias', last:'2026-08-27',act:'la',caught:1},
 {jn:'8247',tech:'tavis', last:'2026-08-27',act:'na',caught:1},
 {jn:'5071',tech:'tavis', last:'2026-08-26',act:'ma',caught:0},
 {jn:'7617',tech:'cory',  last:'2026-08-26',act:'ma',caught:0},
 {jn:'4425',tech:'luke',  last:'2026-08-25',act:'la',caught:1},
 {jn:'8452',tech:'robert',last:'2026-08-25',act:'ma',caught:0},
 {jn:'7792',tech:'luke',  last:'2026-08-24',act:'na',caught:0},
 {jn:'8199',tech:'tavis', last:'2026-08-24',act:'la',caught:0},
 {jn:'5801',tech:'luke',  last:'2026-08-24',act:'na',caught:0},
];

// 1. live board, next two working weeks
const Q='query($a:String,$after:ISO8601DateTime,$before:ISO8601DateTime){ visits(first:50, after:$a, filter:{ startAt:{ after:$after, before:$before } }){ nodes{ startAt isComplete job{jobNumber} property{address{city postalCode}} assignedUsers(first:3){nodes{name{full}}} } pageInfo{hasNextPage endCursor} } }';
let cur=null;const board=[];
for(;;){const d=await g(Q,{a:cur,after:'2026-08-29T00:00:00-07:00',before:'2026-09-12T23:59:59-07:00'});
 if(!d.data){console.log('ERR',JSON.stringify(d).slice(0,300));process.exit(1);}
 for(const v of d.data.visits.nodes) if(!v.isComplete) board.push({date:pt(v.startAt),zip:((v.property?.address?.postalCode)||'').trim().slice(0,5),city:v.property?.address?.city||'',tech:(v.assignedUsers?.nodes||[]).map(x=>x.name.full)[0]||'NONE'});
 if(!d.data.visits.pageInfo.hasNextPage)break;cur=d.data.visits.pageInfo.endCursor;await sleep(420);}
console.log('live board 08-29..09-12 open visits:',board.length);

const out=[];
for(const c of LIST){
  const s=await g('query($n:String!){ jobs(first:8, searchTerm:$n){ nodes{ id jobNumber client{name} property{address{street city postalCode}} lineItems(first:10){nodes{name}} visits(first:120){ nodes{ startAt isComplete assignedUsers(first:3){nodes{name{full}}} } } } } }',{n:c.jn});
  const j=(s.data?.jobs?.nodes||[]).find(x=>String(x.jobNumber)===String(c.jn));
  if(!j){console.log('MISS',c.jn);continue;}
  const vs=j.visits?.nodes||[];
  const done=vs.filter(v=>v.isComplete).map(v=>pt(v.startAt)).sort();
  const fut=vs.filter(v=>!v.isComplete).map(v=>pt(v.startAt)).sort();
  const lastDone=done[done.length-1]||c.last;
  const next=fut.find(d=>d>='2026-08-29')||null;
  const items=(j.lineItems?.nodes||[]).map(x=>x.name).join(' | ');
  const prod=/total mole control/i.test(items)?'TMCP':(/quick fix/i.test(items)?'QUICKFIX':'OTHER');
  const due=addDays(lastDone,7);
  const stillNeeded=!next||next>due;
  const zip=((j.property?.address?.postalCode)||'').trim().slice(0,5);
  const byDay={};for(const b of board.filter(b=>b.zip===zip)){const k=b.date+'|'+b.tech;byDay[k]=(byDay[k]||0)+1;}
  const ranked=Object.entries(byDay).map(([k,n])=>({date:k.split('|')[0],tech:k.split('|')[1],n})).sort((a,b)=>a.date.localeCompare(b.date));
  const onOrAfter=ranked.filter(r=>r.date>=due);
  const pick=onOrAfter[0]||null;
  out.push({jn:c.jn,jobId:j.id,client:j.client?.name,zip,city:j.property?.address?.city||'',street:j.property?.address?.street||'',
    act:c.act,caught:c.caught,product:prod,lastDone,due,next,stillNeeded,
    place:pick?pick.date:null,placeDow:pick?dowOf(pick.date):null,tech:pick?pick.tech:null,sameZipStops:pick?pick.n:0,
    noteTech:c.tech,alt:ranked.slice(0,6)});
  await sleep(350);
}
fs.writeFileSync(path.join(__dirname,'_adds_plan_0828.json'),JSON.stringify(out,null,2));
console.log('\njob   client              zip    city         prod  act c  last       due        next-now   -> PLACE      dow tech            zipstops');
for(const o of out) console.log(('#'+o.jn).padEnd(6)+String(o.client).slice(0,18).padEnd(20)+o.zip+'  '+String(o.city).slice(0,11).padEnd(13)+String(o.product).padEnd(6)+String(o.act).padEnd(4)+String(o.caught).padEnd(3)+o.lastDone+' '+o.due+' '+String(o.next||'NONE').padEnd(11)+'-> '+String(o.place||'??').padEnd(12)+String(o.placeDow||'').padEnd(4)+String(o.tech||'').padEnd(16)+o.sameZipStops+(o.stillNeeded?'':'   <-- ALREADY OK'));
