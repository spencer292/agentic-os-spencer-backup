// READ-ONLY. Build an add-interim-visits.mjs-conformant plan for the 7 approved adds.
import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
const __dirname=path.dirname(fileURLToPath(import.meta.url));
const ENV=path.resolve(__dirname,'../../../.env');
const env={};for(const l of fs.readFileSync(ENV,'utf8').split(/\r?\n/)){const m=l.match(/^([A-Z0-9_]+)=(.*)$/);if(m)env[m[1]]=m[2].trim();}
const tr=await(await fetch('https://api.getjobber.com/api/oauth/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:env.JOBBER_CLIENT_ID,client_secret:env.JOBBER_CLIENT_SECRET,grant_type:'refresh_token',refresh_token:env.JOBBER_REFRESH_TOKEN})})).json();
const tok=tr.access_token;const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const gql=async q=>{const r=await fetch('https://api.getjobber.com/api/graphql',{method:'POST',headers:{Authorization:'Bearer '+tok,'Content-Type':'application/json','X-JOBBER-GRAPHQL-VERSION':'2025-04-16'},body:JSON.stringify({query:q})});return r.json();};
const KEEP=['6416','8090','7478','7488','7682','7384','6555'];
const src=JSON.parse(fs.readFileSync(path.join(__dirname,'_adds_plan_0822.json'),'utf8'));
const out=[];
for(const r of src){
  if(!KEEP.includes(String(r.jn))) continue;
  const d=await gql(`query { jobs(first:5, searchTerm:"${r.jn}"){ nodes{ id jobNumber property{address{street city postalCode}} } } }`);
  const j=(d.data.jobs.nodes||[]).find(x=>String(x.jobNumber)===String(r.jn));
  if(!j){console.log('MISS',r.jn);continue;}
  out.push({jn:String(r.jn),jobId:j.id,client:r.client,city:j.property?.address?.city||r.city,zip:r.zip,
    street:j.property?.address?.street||'',act:r.code,caught:r.caught,due:r.target,next:r.nextVisit,
    stillNeeded:true,place:r.place,tech:r.placeTech,sameZipStops:r.sameZipStops});
  await sleep(350);
}
fs.writeFileSync(path.join(__dirname,'_adds_plan_0822_final.json'),JSON.stringify(out,null,2));
for(const o of out) console.log(('#'+o.jn).padEnd(6)+String(o.client).slice(0,20).padEnd(22)+o.zip+'  '+String(o.city).padEnd(12)+' due '+o.due+'  -> '+o.place+'  '+o.tech+'  (joins '+o.sameZipStops+')');
console.log('\n'+out.length+' -> _adds_plan_0822_final.json');
