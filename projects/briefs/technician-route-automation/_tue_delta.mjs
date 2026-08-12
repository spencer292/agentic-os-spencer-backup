import fs from 'node:fs';
const env={};for(const l of fs.readFileSync('../../../.env','utf8').split(/\r?\n/)){const m=l.match(/^([A-Z0-9_]+)=(.*)$/);if(m)env[m[1]]=m[2].trim();}
const before=JSON.parse(fs.readFileSync('_tue_plan_before.json','utf8'));
const r=await(await fetch('https://api.optimoroute.com/v1/get_routes?key='+env.OPTIMOROUTE_API_KEY+'&date=2026-08-11')).json();
const after={};
for(const rt of r.routes||[]) for(const s of rt.stops||[]) if(/^\d+-\w+$/.test(String(s.orderNo||'')))
  after[String(s.orderNo)]={t:s.scheduledAt,driver:rt.driverName};
const toMin=t=>{const m=String(t||'').match(/(\d{1,2}):(\d{2})/);return m? (Number(m[1])*60 + Number(m[2])) : null;};
const byTech={}; const buckets={'0':0,'1-15':0,'16-30':0,'31-60':0,'60+':0}; let moved=0,same=0;
const worst=[];
for(const [o,b] of Object.entries(before)){
  const a=after[o]; if(!a) continue;
  const d=Math.abs((toMin(a.t)||0)-(toMin(b.t)||0));
  const k=b.driver; byTech[k]=byTech[k]||{n:0,moved:0,tot:0,max:0};
  byTech[k].n++; byTech[k].tot+=d; if(d>byTech[k].max) byTech[k].max=d;
  if(d===0){same++;buckets['0']++;} else {moved++; byTech[k].moved++;
    if(d<=15)buckets['1-15']++; else if(d<=30)buckets['16-30']++; else if(d<=60)buckets['31-60']++; else buckets['60+']++;}
  worst.push({o,d,b:b.t,a:a.t,driver:b.driver});
}
console.log('TUESDAY 08-11 — impact of inserting the 7 new jobs');
console.log('  already-booked stops compared: '+(moved+same));
console.log('  unchanged time : '+same);
console.log('  time moved     : '+moved+'\n');
console.log('  shift size:');
for(const [k,v] of Object.entries(buckets)) if(k!=='0') console.log('    '+k.padEnd(7)+'min  '+v);
console.log('\n  by tech:  stops  moved   avg shift   worst');
for(const [t,v] of Object.entries(byTech).sort((a,b)=>b[1].moved-a[1].moved))
  console.log('    '+t.padEnd(16)+String(v.n).padStart(4)+String(v.moved).padStart(7)+'   '+(v.tot/v.n).toFixed(1).padStart(6)+' min'+String(v.max).padStart(8)+' min');
console.log('\n  10 largest moves:');
for(const w of worst.sort((x,y)=>y.d-x.d).slice(0,10))
  console.log('    '+w.o.padEnd(20)+w.driver.padEnd(16)+w.b+' -> '+w.a+'   ('+w.d+' min)');
