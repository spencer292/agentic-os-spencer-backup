#!/usr/bin/env node
// Per-date driver availability + hours in OptimoRoute.
// Schema (discovered 2026-07-26, undocumented locally): update_drivers_parameters
//   { updates: [ { driver:{serial:"<name>"}, date:"YYYY-MM-DD", enabled?, workTimeFrom?, workTimeTo? } ] }
// Only those three parameters exist. Driver is addressed by SERIAL (externalId is blank on this account).
// NOTE: this unschedules existing routes — always re-plan after.
//
// Spencer works TUESDAY PENINSULA ONLY. He is not overflow. Disabling him Mon/Wed/Thu/Fri is the
// only thing that stops the optimizer handing him stops (balancing=ON_FORCE or ON both do it).
// Usage: node set-driver-days.mjs dry|live
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname=path.dirname(fileURLToPath(import.meta.url));
const env={};for(const l of fs.readFileSync(path.resolve(__dirname,'../../../.env'),'utf8').split(/\r?\n/)){const m=l.match(/^([A-Z0-9_]+)=(.*)$/);if(m)env[m[1]]=m[2].trim();}
const K=env.OPTIMOROUTE_API_KEY;
const mode=process.argv[2]; if(!['dry','live'].includes(mode)){console.log('Usage: dry|live');process.exit(1);}
const WEEK={mon:'2026-07-27',tue:'2026-07-28',wed:'2026-07-29',thu:'2026-07-30',fri:'2026-07-31'};
// PLURAL rows accept ONLY {driver, date, enabled}. workTimeFrom/workTimeTo exist solely on the
// SINGULAR endpoint, which requires externalId — blank for every driver on this account. So the
// 10-hour cap is NOT settable via API; it has to be set in the OptimoRoute web UI.
const updates=[];
// Spencer — Tuesday peninsula ONLY. This is the fix: without it the optimizer hands him stops
// on every enabled day regardless of balancing mode (verified 2026-07-26: ON_FORCE gave him 124,
// plain ON gave him 125).
for(const d of ['mon','wed']) updates.push({driver:{serial:'Spencer Hill'}, date:WEEK[d], enabled:false});
// Friday: Spencer runs the I-90 Snoqualmie/Fall City route himself (Spencer 2026-07-26).
updates.push({driver:{serial:'Spencer Hill'}, date:WEEK['fri'], enabled:true});
updates.push({driver:{serial:'Spencer Hill'}, date:WEEK['thu'], enabled:true});  // Bellevue-S/Mercer/Newcastle block
// Cammeron Fri 7/31 deliberately untouched so his existing block stays. Luke/Cory left alone —
// they are already enabled all five days and their hours can't be set from here.

for(const u of updates) console.log(`  ${u.driver.serial.padEnd(18)} ${u.date}  enabled=${u.enabled}${u.workTimeFrom?`  ${u.workTimeFrom}-${u.workTimeTo}`:''}`);
console.log(`\n${updates.length} updates (Cammeron Fri 7/31 intentionally not touched)`);
if(mode==='dry'){console.log('DRY — nothing sent.');process.exit(0);}
const r=await fetch(`https://api.optimoroute.com/v1/update_drivers_parameters?key=${K}`,{method:'POST',
  headers:{'Content-Type':'application/json'},body:JSON.stringify({updates})});
const j=await r.json();
const rows=j.updates||j.parameters||[];
const ok=rows.filter(x=>x.success).length, bad=rows.filter(x=>!x.success);
console.log(`\nsent: success ${ok}/${rows.length}`);
for(const b of bad) console.log('  FAIL', JSON.stringify(b).slice(0,180));
if(!rows.length) console.log(JSON.stringify(j).slice(0,400));
