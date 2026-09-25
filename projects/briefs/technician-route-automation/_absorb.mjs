import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
const __dirname=path.dirname(fileURLToPath(import.meta.url));
const env={};for(const l of fs.readFileSync(path.resolve(__dirname,'../../../.env'),'utf8').split(/\r?\n/)){const m=l.match(/^([A-Z0-9_]+)=(.*)$/);if(m)env[m[1]]=m[2].trim();}
const K=env.OPTIMOROUTE_API_KEY;
const D='2026-09-01';
const r=await(await fetch(`https://api.optimoroute.com/v1/get_routes?key=${K}&date=${D}`)).json();
const by={};for(const rt of r.routes||[])by[rt.driverName]=(rt.stops||[]).filter(s=>s.locationName);
const mi=(a,b)=>{const R=3958.8,t=x=>x*Math.PI/180;const dLat=t(b.latitude-a.latitude),dLon=t(b.longitude-a.longitude);
 const h=Math.sin(dLat/2)**2+Math.cos(t(a.latitude))*Math.cos(t(b.latitude))*Math.sin(dLon/2)**2;return 2*R*Math.asin(Math.sqrt(h));};
const cory=by['Cory Ventura']||[],luke=by['Luke LaVergne']||[];
console.log(`Tue ${D}: Cory ${cory.length} stops, Luke ${luke.length} stops\n`);
const rows=luke.map((s,i)=>{
  let best=1e9,bn='';
  for(const c of cory){const d=mi(s,c);if(d<best){best=d;bn=c.locationName;}}
  return {i:i+1,name:s.locationName,dist:best,near:bn,tail:luke.length-i};
});
rows.sort((a,b)=>a.dist-b.dist);
console.log('Luke Tue stops ranked by distance to Cory\'s nearest Tue stop:');
console.log('  seq/of   miles to Cory   stop');
for(const x of rows.slice(0,14))
  console.log(`   ${String(x.i).padStart(2)}/${luke.length}    ${x.dist.toFixed(1).padStart(6)} mi     ${x.name.slice(0,44)}   [near ${x.near.slice(0,26)}]`);
