import fs from 'node:fs';
const env={};for(const l of fs.readFileSync('../../../.env','utf8').split(/\r?\n/)){const m=l.match(/^([A-Z0-9_]+)=(.*)$/);if(m)env[m[1]]=m[2].trim();}
const r=await(await fetch('https://api.optimoroute.com/v1/get_routes?key='+env.OPTIMOROUTE_API_KEY+'&date=2026-08-11')).json();
const snap={};
for(const rt of r.routes||[]) for(const s of rt.stops||[]) if(/^\d+-\w+$/.test(String(s.orderNo||'')))
  snap[String(s.orderNo)]={t:s.scheduledAt,driver:rt.driverName,travel:s.travelTime};
fs.writeFileSync('_tue_plan_before.json',JSON.stringify(snap,null,2));
console.log('snapshotted current Tuesday plan:',Object.keys(snap).length,'stops -> _tue_plan_before.json');
