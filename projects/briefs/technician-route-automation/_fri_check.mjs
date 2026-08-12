import fs from 'node:fs';
const env={};for(const l of fs.readFileSync('../../../.env','utf8').split(/\r?\n/)){const m=l.match(/^([A-Z0-9_]+)=(.*)$/);if(m)env[m[1]]=m[2].trim();}
const K=env.OPTIMOROUTE_API_KEY;
const r=await(await fetch('https://api.optimoroute.com/v1/get_routes?key='+K+'&date=2026-08-14')).json();
let total=0; const byDriver={};
for(const rt of r.routes||[]){ const stops=(rt.stops||[]).filter(s=>/^\d+-\w+$/.test(String(s.orderNo||'')));
  if(!stops.length) continue; byDriver[rt.driverName]={stops:stops.length,mi:Math.round(rt.distance||0),first:stops[0].scheduledAt,last:stops[stops.length-1].scheduledAt}; total+=stops.length; }
console.log('OptimoRoute Friday 2026-08-14 — planned stops:',total);
for(const [d,v] of Object.entries(byDriver)) console.log('  '+d.padEnd(16)+String(v.stops).padStart(3)+' stops  '+String(v.mi).padStart(4)+' mi   '+v.first+' -> '+v.last);
const V=JSON.parse(fs.readFileSync('week-visits-0810-final.json','utf8'));
const pt=s=>new Date(s).toLocaleString('sv-SE',{timeZone:'America/Los_Angeles'}).slice(0,10);
const jobberFri=V.filter(v=>!v.isComplete && pt(v.startAt)==='2026-08-14');
console.log('\nJobber Friday open visits:',jobberFri.length,' (109 routable + #7949 off-route =',jobberFri.length+')');
