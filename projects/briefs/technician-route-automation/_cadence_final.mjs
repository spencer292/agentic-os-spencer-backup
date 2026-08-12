import fs from 'node:fs';
const P=JSON.parse(fs.readFileSync('_cadence_plan.json','utf8'));
const J=JSON.parse(fs.readFileSync('_cadence_jobs.json','utf8'));
const pt=s=>new Date(s).toLocaleString('sv-SE',{timeZone:'America/Los_Angeles'}).slice(0,10);
const add=(s,n)=>{const p=s.split('-').map(Number);return new Date(Date.UTC(p[0],p[1]-1,p[2]+n)).toISOString().slice(0,10);};
const daysBetween=(a,b)=>Math.round((Date.parse(b+'T12:00:00Z')-Date.parse(a+'T12:00:00Z'))/86400000);
const ADD=[],FLAG=[],OK=[];
for(const p of P){
  const j=J[p.jn];
  const fut=((j.visits&&j.visits.nodes)||[]).filter(v=>!v.isComplete).map(v=>pt(v.startAt)).sort();
  const doneN=((j.visits&&j.visits.nodes)||[]).filter(v=>v.isComplete).length;
  const next=fut[0]||null;
  const status=j.jobStatus;
  const requiredBy=p.ideal;
  const rec={...p,next,status,doneN,gapDays:next?daysBetween(p.jn&&P.find(x=>x.jn===p.jn).ideal?requiredBy:requiredBy,next):null};
  if(p.product==='QuickFix' && !next){
    FLAG.push({...rec,reason:'Quick Fix series EXHAUSTED ('+doneN+' visits done, none left) with activity still outstanding — Spencer rule: human/sales decision, never an automatic add'});
  } else if(!next){
    ADD.push({...rec,reason:'no future visit at all'});
  } else if(next > requiredBy){
    ADD.push({...rec,reason:'next visit '+next+' is '+daysBetween(p.ideal,next)+'d later than the '+p.days+'d interval requires'});
  } else {
    OK.push({...rec,reason:'next visit '+next+' already satisfies the '+p.days+'d interval'});
  }
}
const row=r=>'  #'+r.jn.padEnd(6)+String(r.client).slice(0,22).padEnd(24)+String(r.product).padEnd(9)+String(r.act).padEnd(3)+' c'+String(r.caught==null?'?':r.caught)+'  last '+r.ideal.slice(0,10);
console.log('=== ADD AN INTERIM VISIT ('+ADD.length+') ===');
console.log('  job   client                  product  act cau  due         -> BOOK ON     tech             region');
for(const r of ADD) console.log('  #'+r.jn.padEnd(6)+String(r.client).slice(0,22).padEnd(24)+String(r.product).padEnd(9)+String(r.act).padEnd(4)+String(r.caught==null?'?':r.caught).padEnd(4)+r.ideal+'  -> '+r.target+'   '+String(r.owner).padEnd(15)+String(r.region).slice(0,30));
for(const r of ADD) console.log('        ^ '+r.reason);
console.log('\n=== FLAG FOR YOU — do NOT auto-add ('+FLAG.length+') ===');
for(const r of FLAG){ console.log('  #'+r.jn+'  '+r.client+'  ['+r.status+']'); console.log('        '+r.reason); }
console.log('\n=== NO ACTION NEEDED ('+OK.length+') ===');
for(const r of OK) console.log('  #'+r.jn.padEnd(6)+String(r.client).slice(0,24).padEnd(26)+String(r.product).padEnd(9)+r.act+'  '+r.reason);
fs.writeFileSync('_cadence_final.json',JSON.stringify({ADD,FLAG,OK},null,2));
