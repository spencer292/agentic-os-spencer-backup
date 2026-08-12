import fs from 'node:fs';
const env={};for(const l of fs.readFileSync('../../../.env','utf8').split(/\r?\n/)){const m=l.match(/^([A-Z0-9_]+)=(.*)$/);if(m)env[m[1]]=m[2].trim();}
const V=JSON.parse(fs.readFileSync('week-visits-tue.json','utf8'));
const pt=s=>new Date(s).toLocaleString('sv-SE',{timeZone:'America/Los_Angeles'});
function visitNumOf(v){let n=null;try{n=Buffer.from(v.id,'base64').toString('utf8').split('/').pop();}catch(e){}
 if(!n||!/^\d+$/.test(n)) n=v.id.replace(/[^a-zA-Z0-9]/g,'').slice(-10); return n;}
const r=await(await fetch('https://api.optimoroute.com/v1/get_routes?key='+env.OPTIMOROUTE_API_KEY+'&date=2026-08-11')).json();
const have=new Set();
for(const rt of r.routes||[]) for(const s of rt.stops||[]) if(/^\d+-\w+$/.test(String(s.orderNo||''))) have.add(String(s.orderNo));
const missing=[];
for(const v of V){ if(v.isComplete)continue; const o=String(v.job&&v.job.jobNumber)+'-'+visitNumOf(v);
  if(!have.has(o)) missing.push(v); }
console.log('Tuesday 08-11 — in Jobber but NOT on the OptimoRoute route: '+missing.length+'\n');
for(const v of missing){
  console.log('  #'+String(v.job&&v.job.jobNumber).padEnd(6)+pt(v.startAt).slice(11,16)+'  '+
    String(((v.assignedUsers&&v.assignedUsers.nodes)||[]).map(x=>x.name.full)[0]||'NONE').padEnd(15)+
    String((v.property&&v.property.address&&v.property.address.city)||'').padEnd(16)+
    (v.property&&v.property.address&&v.property.address.postalCode));
  console.log('        '+(v.property&&v.property.address&&v.property.address.street||''));
}
const byTech={};
for(const rt of r.routes||[]){ const n=(rt.stops||[]).filter(s=>/^\d+-\w+$/.test(String(s.orderNo||''))).length; if(n) byTech[rt.driverName]=n; }
console.log('\nAlready routed tomorrow (windows likely sent):');
for(const [t,n] of Object.entries(byTech)) console.log('  '+t.padEnd(16)+n+' stops');
