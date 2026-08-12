import fs from 'node:fs';
import { classifyPoint } from './geo-side.mjs';
const env={};for(const l of fs.readFileSync('../../../.env','utf8').split(/\r?\n/)){const m=l.match(/^([A-Z0-9_]+)=(.*)$/);if(m)env[m[1]]=m[2].trim();}
const K=env.OPTIMOROUTE_API_KEY;
const T=JSON.parse(fs.readFileSync('territories.json','utf8'));
const line=T.geoSplitLines['sr-516'];
const want=new Set(['8305','8329','7362']);
const seen={};
for(const d of ['2026-08-10','2026-08-11','2026-08-12','2026-08-13','2026-08-14']){
  const r=await(await fetch('https://api.optimoroute.com/v1/get_routes?key='+K+'&date='+d)).json();
  for(const rt of r.routes||[])for(const s of rt.stops||[]){
    const j=String(s.orderNo||'').split('-')[0];
    if(!want.has(j))continue;
    const lat=s.location?.latitude??s.latitude, lon=s.location?.longitude??s.longitude;
    seen[j]={lat,lon,addr:s.address,driver:rt.driverName,date:d};
  }
  await new Promise(r=>setTimeout(r,300));
}
console.log('Where these sit relative to the SR-516 line (north = Cory Monday, south = Robert):\n');
for(const [j,v] of Object.entries(seen)){
  const c=classifyPoint(line,v.lat,v.lon);
  console.log('  #'+j.padEnd(6)+(c?c.side.padEnd(6)+String(c.marginMi).padStart(6)+' mi   ':'no coords   ')+v.addr);
}
// how far is Des Moines from Cory's Monday cluster (Kent) vs his Tuesday cluster (Burien/WestSea)?
const mi=(a,b,c,d)=>{const R=3959,t=x=>x*Math.PI/180;const dl=t(c-a),dg=t(d-b);const q=Math.sin(dl/2)**2+Math.cos(t(a))*Math.cos(t(c))*Math.sin(dg/2)**2;return 2*R*Math.asin(Math.sqrt(q));};
const anchor=seen['8329']||seen['8305'];
if(anchor){
  const near={mon:[],tue:[]};
  for(const d of ['2026-08-10','2026-08-11']){
    const r=await(await fetch('https://api.optimoroute.com/v1/get_routes?key='+K+'&date='+d)).json();
    for(const rt of r.routes||[]){ if(rt.driverName!=='Cory Ventura')continue;
      for(const s of rt.stops||[]){const lat=s.location?.latitude,lon=s.location?.longitude;if(!lat)continue;
        near[d==='2026-08-10'?'mon':'tue'].push(mi(anchor.lat,anchor.lon,lat,lon));}}
    await new Promise(r=>setTimeout(r,300));
  }
  for(const k of ['mon','tue']){const a=near[k].sort((x,y)=>x-y);
    console.log('\n  Cory '+k.toUpperCase()+': nearest stop to that Des Moines address = '+(a[0]?a[0].toFixed(1):'n/a')+' mi, median '+(a.length?a[Math.floor(a.length/2)].toFixed(1):'n/a')+' mi ('+a.length+' stops)');}
}
