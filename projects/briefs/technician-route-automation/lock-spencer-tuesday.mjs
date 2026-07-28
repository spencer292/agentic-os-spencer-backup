#!/usr/bin/env node
// Pin Tuesday's tech assignment so Spencer gets ONLY the peninsula run.
// Why: Spencer works Tuesday peninsula only, but lockTechs=false lets the optimizer hand him any
// nearby work — it gave him 43 stops on 2026-07-28. Disabling him on other days (set-driver-days)
// fixes Mon/Wed/Thu/Fri; this fixes Tuesday. Order field `assignedTo:{serial}` (verified 2026-07-26).
// Assignment = territory grid tech, with over-ceiling techs shed to an under-ceiling tech working
// the same day and the same cities. Only TUESDAY is locked; the rest of the week stays optimizer-led.
// Usage: node lock-spencer-tuesday.mjs dry|live
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname=path.dirname(fileURLToPath(import.meta.url));
const env={};for(const l of fs.readFileSync(path.resolve(__dirname,'../../../.env'),'utf8').split(/\r?\n/)){const m=l.match(/^([A-Z0-9_]+)=(.*)$/);if(m)env[m[1]]=m[2].trim();}
const K=env.OPTIMOROUTE_API_KEY;
const mode=process.argv[2]; if(!['dry','live'].includes(mode)){console.log('Usage: dry|live');process.exit(1);}
const TUE='2026-07-28';
const G=JSON.parse(fs.readFileSync(path.join(__dirname,'territory-grid.json'),'utf8'));
const V=JSON.parse(fs.readFileSync(path.join(__dirname,'week-visits-0727-post-dedup.json'),'utf8'));
const del=new Set(JSON.parse(fs.readFileSync(path.join(__dirname,'deleted-visits-0726.json'),'utf8')).map(d=>d.num));
const manifest=new Set(fs.readFileSync(path.join(__dirname,'last-push-manifest.txt'),'utf8').split(/\r?\n/).filter(Boolean));
const CEIL={'Luke LaVergne':33,'Cory Ventura':34,'Cammeron Anderson':38,'Spencer Hill':12};
// every order whose GRID day is Tuesday
const rows=[];
for(const v of V){
  if(v.isComplete) continue;
  let num; try{num=Buffer.from(v.id,'base64').toString('utf8').split('/').pop()}catch{}
  if(!num||del.has(num)) continue;
  const jn=String(v.job?.jobNumber); const orderNo=`${jn}-${num}`;
  if(!manifest.has(orderNo)) continue;
  const zip=(v.property?.address?.postalCode||'').trim().slice(0,5);
  const ov=G.jobOverrides?.[jn], g=G.zips[zip];
  const day=ov?.day||g?.day, tech=ov?.tech||g?.tech;
  if(day!=='tue'||!tech) continue;
  rows.push({orderNo, zip, city:v.property?.address?.city, tech});
}
const count=t=>rows.filter(r=>r.tech===t).length;
// shed over-ceiling techs to the emptiest tech that already works the same cities on Tuesday
for(let guard=0; guard<200; guard++){
  const over=Object.keys(CEIL).find(t=>count(t)>CEIL[t]);
  if(!over) break;
  const target=Object.keys(CEIL).filter(t=>t!=='Spencer Hill'&&t!==over).sort((a,b)=>count(a)-count(b))[0];
  const cities=new Set(rows.filter(r=>r.tech===target).map(r=>r.city));
  const moveable=rows.filter(r=>r.tech===over&&cities.has(r.city)) ;
  const pick=(moveable.length?moveable:rows.filter(r=>r.tech===over))[0];
  if(!pick) break;
  pick.tech=target; pick.moved=true;
}
console.log(`Tuesday ${TUE} — ${rows.length} orders`);
for(const t of Object.keys(CEIL)) console.log(`   ${t.padEnd(20)} ${String(count(t)).padStart(3)} / ${CEIL[t]}`);
const moved=rows.filter(r=>r.moved);
console.log(`   rebalanced off over-ceiling techs: ${moved.length}`);
if(mode==='dry'){console.log('\nDRY — nothing written.');process.exit(0);}
const orders=rows.map(r=>({operation:'UPDATE', orderNo:r.orderNo, assignedTo:{serial:r.tech}}));
let ok=0,fail=0;
for(let i=0;i<orders.length;i+=100){
  const batch=orders.slice(i,i+100);
  const res=await fetch(`https://api.optimoroute.com/v1/create_or_update_orders?key=${K}`,{method:'POST',
    headers:{'Content-Type':'application/json'},body:JSON.stringify({orders:batch})});
  const j=await res.json();
  for(const o of j.orders||[]){ if(o.success) ok++; else {fail++; if(fail<4) console.log('  FAIL',o.orderNo,o.code,String(o.message||'').slice(0,80));} }
  if(!j.orders) console.log('  batch error', JSON.stringify(j).slice(0,200));
}
console.log(`\nassigned: ${ok} ok, ${fail} failed`);
