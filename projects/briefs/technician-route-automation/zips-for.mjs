#!/usr/bin/env node
// zip breakdown for one driver on one date. Usage: node zips-for.mjs 2026-07-29 "Luke LaVergne"
import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
const __dirname=path.dirname(fileURLToPath(import.meta.url));
const env={};for(const l of fs.readFileSync(path.resolve(__dirname,'../../../.env'),'utf8').split(/\r?\n/)){const m=l.match(/^([A-Z0-9_]+)=(.*)$/);if(m)env[m[1]]=m[2].trim();}
const K=env.OPTIMOROUTE_API_KEY;
const G=JSON.parse(fs.readFileSync(path.join(__dirname,'territory-grid.json'),'utf8'));
const [date,who]=[process.argv[2],process.argv[3]];
const r=await(await fetch(`https://api.optimoroute.com/v1/get_routes?key=${K}&date=${date}`)).json();
const rt=(r.routes||[]).find(x=>x.driverName===who);
if(!rt){console.log('no route');process.exit(0)}
const z={};
for(const s of rt.stops||[]){const m=(s.address||'').match(/\b(98\d{3})\b/);const zip=m?m[1]:'?';
  const city=(s.address||'').split(',')[1]?.trim(); z[zip]=z[zip]||{n:0,city,first:s.scheduledAt}; z[zip].n++; z[zip].last=s.scheduledAt;}
console.log(`${who} ${date} — ${(rt.stops||[]).length} stops, ${Math.round(rt.distance)} mi`);
for(const [zip,v] of Object.entries(z).sort((a,b)=>b[1].n-a[1].n))
  console.log(`   ${zip} ${(v.city||'').padEnd(16)} ${String(v.n).padStart(3)}   ${v.first}-${v.last}   grid=${G.zips[zip]?.day||'?'}/${(G.zips[zip]?.tech||'?').split(' ')[0]}`);
