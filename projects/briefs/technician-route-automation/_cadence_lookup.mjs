import fs from 'node:fs';
const ENV='../../../.env';
const env={};for(const l of fs.readFileSync(ENV,'utf8').split(/\r?\n/)){const m=l.match(/^([A-Z0-9_]+)=(.*)$/);if(m)env[m[1]]=m[2].trim();}
let tok=null;
async function token(){const r=await fetch('https://api.getjobber.com/api/oauth/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:env.JOBBER_CLIENT_ID,client_secret:env.JOBBER_CLIENT_SECRET,grant_type:'refresh_token',refresh_token:env.JOBBER_REFRESH_TOKEN})});const d=await r.json();
 if(d.refresh_token&&d.refresh_token!==env.JOBBER_REFRESH_TOKEN){let t=fs.readFileSync(ENV,'utf8');t=t.replace(/^JOBBER_REFRESH_TOKEN=.*$/m,'JOBBER_REFRESH_TOKEN='+d.refresh_token);fs.writeFileSync(ENV,t);}tok=d.access_token;return tok;}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function g(q,v,a){a=a||0;const t=tok||await token();const r=await fetch('https://api.getjobber.com/api/graphql',{method:'POST',headers:{Authorization:'Bearer '+t,'Content-Type':'application/json','X-JOBBER-GRAPHQL-VERSION':'2025-04-16'},body:JSON.stringify({query:q,variables:v})});
 const d=await r.json().catch(function(){return {}});
 if(d.errors&&JSON.stringify(d.errors).indexOf('THROTTLED')>=0&&a<8){await sleep(2500*Math.pow(2,a));return g(q,v,a+1);}return d;}

const WANT=['8125','6411','7725','8274','8145','7560','7777','5597','6986','7839','7884','7282','6338','5328','7891','7893','8056','4492'];
// Step 1: find each job's encoded id via visits in the window that contains their last visits.
const QV='query($a:String,$after:ISO8601DateTime,$before:ISO8601DateTime){ visits(first:50, after:$a, filter:{ startAt:{ after:$after, before:$before } }){ nodes{ startAt isComplete job{ id jobNumber } } pageInfo{ hasNextPage endCursor } } }';
const jobId={}; let cur=null;
for(;;){ const d=await g(QV,{a:cur,after:'2026-08-01T00:00:00-07:00',before:'2026-08-09T23:59:59-07:00'});
 if(!d.data){console.log('ERR',JSON.stringify(d).slice(0,250));break;}
 for(const v of d.data.visits.nodes){ const n=String(v.job&&v.job.jobNumber); if(WANT.indexOf(n)>=0) jobId[n]=v.job.id; }
 if(!d.data.visits.pageInfo.hasNextPage)break; cur=d.data.visits.pageInfo.endCursor; await sleep(420); }
console.log('resolved ids:',Object.keys(jobId).length,'of',WANT.length);
const miss=WANT.filter(function(w){return !jobId[w]});
if(miss.length) console.log('no visit Aug1-9 for:',miss.join(', '));

// Step 2: fetch each job directly.
const out={};
for(const n of Object.keys(jobId)){
  const d=await g('query($id:EncodedId!){ job(id:$id){ id jobNumber jobType jobStatus title startAt endAt client{ name } property{ address{ street city postalCode } } lineItems(first:10){ nodes{ name } } visits(first:80){ nodes{ id startAt isComplete assignedUsers(first:3){ nodes{ name{ full } } } } } } }',{id:jobId[n]});
  if(d.data&&d.data.job) out[n]=d.data.job; else console.log('  job fetch failed',n,JSON.stringify(d).slice(0,180));
  await sleep(350);
}
fs.writeFileSync('_cadence_jobs.json', JSON.stringify(out,null,2));
console.log('fetched job records:',Object.keys(out).length);
