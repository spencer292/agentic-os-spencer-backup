import fs from 'node:fs';
const env={};for(const l of fs.readFileSync('../../../.env','utf8').split(/\r?\n/)){const m=l.match(/^([A-Z0-9_]+)=(.*)$/);if(m)env[m[1]]=m[2].trim();}
const r=await(await fetch('https://api.optimoroute.com/v1/get_routes?key='+env.OPTIMOROUTE_API_KEY+'&date=2026-08-11')).json();
const NEW=new Set(['8340','8344','8345','8346','8348']);
for(const rt of r.routes||[]){
  if(rt.driverName!=='Cory Ventura') continue;
  const stops=(rt.stops||[]).filter(s=>/^\d+-\w+$/.test(String(s.orderNo||'')));
  console.log('CORY VENTURA — Tue 2026-08-11   '+stops.length+' stops, '+Math.round(rt.distance||0)+' mi');
  console.log('  #   time    job     address');
  stops.forEach(function(s,i){
    const job=String(s.orderNo).split('-')[0];
    const mark=NEW.has(job)?'  <== NEW':'';
    console.log('  '+String(i+1).padStart(2)+'  '+String(s.scheduledAt).padEnd(7)+' #'+job.padEnd(6)+String(s.address||'').slice(0,52)+mark);
  });
}
