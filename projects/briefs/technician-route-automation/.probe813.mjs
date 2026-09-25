import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const env = {};
for (const l of fs.readFileSync(path.resolve(__dirname,'../../../.env'),'utf8').split(/\r?\n/)){const m=l.match(/^([A-Z0-9_]+)=(.*)$/); if(m) env[m[1]]=m[2].trim();}
const K = env.OPTIMOROUTE_API_KEY;
const r = await fetch(`https://api.optimoroute.com/v1/get_routes?key=${K}&date=2026-08-13`).then(r=>r.json());
for (const rt of r.routes||[]) {
  const stops=(rt.stops||[]).filter(s=>/^\d+-\w+$/.test(String(s.orderNo||'')));
  if(!stops.length) continue;
  const first=stops[0], last=stops[stops.length-1];
  console.log(`${(rt.driverName||'?').padEnd(18)} ${String(stops.length).padStart(3)} stops  ${(first.scheduledAtDt||'').slice(11,16)} -> ${(last.scheduledAtDt||'').slice(11,16)}`);
}
