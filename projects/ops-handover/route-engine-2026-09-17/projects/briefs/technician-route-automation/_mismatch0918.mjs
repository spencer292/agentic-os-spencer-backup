import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
const __dirname=path.dirname(fileURLToPath(import.meta.url));
const env={};for(const l of fs.readFileSync(path.resolve(__dirname,'../../../.env'),'utf8').split(/\r?\n/)){const m=l.match(/^([A-Z0-9_]+)=(.*)$/);if(m)env[m[1]]=m[2].trim();}
const D='2026-09-18';
const V=JSON.parse(fs.readFileSync('C:/Users/spenc/AppData/Local/scratch_0918.json','utf8'));
const jobberTech=new Map(V.map(v=>[String(v.job.jobNumber), v.assignedUsers?.nodes?.[0]?.name?.full||'(unassigned)']));
const where=new Map(V.map(v=>[String(v.job.jobNumber), (v.property?.address?.city||'')+' '+(v.property?.address?.postalCode||'')]));
const r=await (await fetch(`https://api.optimoroute.com/v1/get_routes?key=${env.OPTIMOROUTE_API_KEY}&date=${D}`)).json();
for(const rt of r.routes||[]) for(const s of (rt.stops||[])){
  const j=String(s.orderNo||'').split('-')[0]; if(!jobberTech.has(j))continue;
  if(jobberTech.get(j)!==rt.driverName) console.log(`#${j}  map: ${String(rt.driverName).padEnd(17)} jobber: ${jobberTech.get(j).padEnd(17)} ${where.get(j)}  ${String(s.scheduledAtDt).slice(11,16)}`);
}
