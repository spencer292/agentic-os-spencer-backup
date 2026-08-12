import fs from 'node:fs';
const env={};for(const l of fs.readFileSync('../../../.env','utf8').split(/\r?\n/)){const m=l.match(/^([A-Z0-9_]+)=(.*)$/);if(m)env[m[1]]=m[2].trim();}
const NEW=new Set(['8352','8354','8355','8358']);
const r=await(await fetch('https://api.optimoroute.com/v1/get_routes?key='+env.OPTIMOROUTE_API_KEY+'&date=2026-08-12')).json();
for(const rt of r.routes||[]){ const stops=(rt.stops||[]).filter(s=>/^\d+-\w+$/.test(String(s.orderNo||'')));
  stops.forEach(function(s,i){ const j=String(s.orderNo).split('-')[0];
    if(NEW.has(j)) console.log('  #'+j+'  '+s.scheduledAt+'  '+rt.driverName.padEnd(15)+'stop '+(i+1)+' of '+stops.length+'   '+String(s.address||'').slice(0,46)); }); }
