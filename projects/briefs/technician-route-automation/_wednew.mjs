import fs from 'node:fs';
const env={};for(const l of fs.readFileSync('../../../.env','utf8').split(/\r?\n/)){const m=l.match(/^([A-Z0-9_]+)=(.*)$/);if(m)env[m[1]]=m[2].trim();}
const V=JSON.parse(fs.readFileSync('wed-new.json','utf8'));
const pt=s=>new Date(s).toLocaleString('sv-SE',{timeZone:'America/Los_Angeles'});
function vn(v){let n=null;try{n=Buffer.from(v.id,'base64').toString('utf8').split('/').pop();}catch(e){}
 if(!n||!/^\d+$/.test(n)) n=v.id.replace(/[^a-zA-Z0-9]/g,'').slice(-10); return n;}
const r=await(await fetch('https://api.optimoroute.com/v1/get_routes?key='+env.OPTIMOROUTE_API_KEY+'&date=2026-08-12')).json();
const have=new Set();
for(const rt of r.routes||[]) for(const s of rt.stops||[]) if(/^\d+-\w+$/.test(String(s.orderNo||''))) have.add(String(s.orderNo));
const missing=V.filter(v=>!v.isComplete && !have.has(String(v.job&&v.job.jobNumber)+'-'+vn(v)));
console.log('Wed 08-12 — Jobber open: '+V.filter(v=>!v.isComplete).length+'   already routed: '+have.size+'   NEW: '+missing.length+'\n');
for(const v of missing) console.log('  #'+String(v.job&&v.job.jobNumber).padEnd(6)+pt(v.startAt).slice(11,16)+'  '+
  String(((v.assignedUsers&&v.assignedUsers.nodes)||[]).map(x=>x.name.full)[0]||'NONE').padEnd(15)+
  String((v.property&&v.property.address&&v.property.address.city)||'').padEnd(15)+(v.property&&v.property.address&&v.property.address.street||''));
const adam=V.filter(v=>/adam/i.test(JSON.stringify(v)));
console.log('\nanything matching "Adam" on Wednesday: '+adam.length);
for(const v of adam) console.log('   #'+(v.job&&v.job.jobNumber)+'  '+pt(v.startAt).slice(11,16)+'  '+(v.property&&v.property.address&&v.property.address.street));
