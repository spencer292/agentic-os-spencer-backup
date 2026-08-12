import fs from 'node:fs';
import { sideOf, loadCache } from './geo-side.mjs';

const J = JSON.parse(fs.readFileSync('_cadence_jobs.json','utf8'));
const T = JSON.parse(fs.readFileSync('territories.json','utf8'));
const cache = loadCache();
const DOW=['sun','mon','tue','wed','thu','fri','sat'];

// Spencer's table: job -> {client, lastTech, last, activity, caught}
const ROWS = [
 ['8125','Carly Klee','cam','2026-08-07','ma',1],
 ['6411','John and Tessa Woodyard','alias','2026-08-07','na',0],
 ['7725','Suzanne Gullace','cam','2026-08-06','na',0],
 ['8274','Alex Stevenson','cam','2026-08-06','na',1],
 ['8145','Jane Molenda','cam','2026-08-05','la',0],
 ['7560','Alex Alexeev','luke','2026-08-05','na',0],
 ['7777','Cory Ventura','cam','2026-08-05','na',0],
 ['5597','Jim McGowan','luke','2026-08-04','na',0],
 ['6986','Ashley Wollam','luke','2026-08-04','na',0],
 ['7839','Jason Andrews','luke','2026-08-04','la',0],
 ['7884','Matt Arnold','luke','2026-08-04','la',0],
 ['7282','Alex Austin','luke','2026-08-04','na',0],
 ['6338','Barbara Wood','luke','2026-08-04','ma',2],
 ['5328','Dave Belmont','cam','2026-08-04','la',0],
 ['7891','Westly Wright','luke','2026-08-03','la',0],
 ['7893','Miles Magnuson','luke','2026-08-03','na',0],
 ['8056','Madera West Condos','cory','2026-08-03','ha',0],
 ['4492','Rich Porter','luke','2026-08-03','la',null],
];

const GEO = T.geoSplitLines||{};
const ZIP_REGIONS={};
for(const [name,r] of Object.entries(T.regions)) for(const z of r.zips) (ZIP_REGIONS[z]=ZIP_REGIONS[z]||[]).push(name);
function regionFor(zip, street){
  const regs=ZIP_REGIONS[zip]; if(!regs||!regs.length) return null;
  if(regs.length===1) return regs[0];
  const split=regs.filter(function(n){const gs=T.regions[n].geoSplit; return gs && (!gs.appliesToZips||gs.appliesToZips.indexOf(zip)>=0);});
  if(split.length<2) return regs[0];
  const ln=T.regions[split[0]].geoSplit.line; const line=GEO[ln]; if(!line) return split[0];
  const res=sideOf(ln,line,street,zip,cache);
  return split.filter(function(n){return T.regions[n].geoSplit.side===res.side})[0]||split[0];
}
function ownerOn(region,date){ const r=T.regions[region]; if(!r) return null;
  for(const h of (T.handovers||[])) if(h.regions.indexOf(region)>=0 && date>=h.effective) return h.to;
  return r.owner; }
const addDays=function(s,n){const p=s.split('-').map(Number);return new Date(Date.UTC(p[0],p[1]-1,p[2]+n)).toISOString().slice(0,10);};
const dowOf=function(s){const p=s.split('-').map(Number);return DOW[new Date(Date.UTC(p[0],p[1]-1,p[2])).getUTCDay()];};

console.log('job    client                  product    act  cau  interval  ideal       -> TARGET      tech            region / rhythm');
const plan=[];
for(const row of ROWS){
  const [jn,client,lastTech,last,act,caught]=row;
  const j=J[jn];
  const items=j?((j.lineItems&&j.lineItems.nodes)||[]).map(function(x){return (x.name||'').toLowerCase()}).join(' | '):'';
  let product='UNKNOWN';
  if(/total mole control/.test(items)) product='TMCP';
  else if(/quick fix/.test(items)) product='QuickFix';
  else if(j) product='other';
  const hasActivity = act && act!=='na';
  const hasCatch = (caught||0) > 0;
  let days, why;
  if(product==='QuickFix'){ days=7; why='Quick Fix is always weekly'; }
  else if(hasCatch){ days=7; why='catch overrides the activity code'; }
  else if(hasActivity){ days=7; why='any activity on TMCP = weekly'; }
  else { days=30; why='na + no catch = monthly'; }
  const ideal=addDays(last,days);
  const zip=j?((j.property&&j.property.address&&j.property.address.postalCode)||'').trim().slice(0,5):'';
  const street=j?((j.property&&j.property.address&&j.property.address.street)||''):'';
  const region=zip?regionFor(zip,street):null;
  const rhythm=region?(T.regions[region].rhythm||''):'';
  const wd=(rhythm.toLowerCase().match(/mon|tue|wed|thu|fri/g))||[];
  // snap forward to the nearest rhythm day at/after ideal (never earlier than ideal)
  let target=ideal;
  if(wd.length){ let k=0; while(k<10 && wd.indexOf(dowOf(target))<0){ target=addDays(target,1); k++; } }
  const owner=region?ownerOn(region,target):null;
  const future=j?((j.visits&&j.visits.nodes)||[]).filter(function(v){return !v.isComplete && v.startAt.slice(0,10)>='2026-08-09'}):[];
  plan.push({jn,client,product,act,caught,days,why,ideal,target,zip,street,region,rhythm,owner,futureCount:future.length,
             futureDates:future.map(function(v){return new Date(v.startAt).toLocaleString('sv-SE',{timeZone:'America/Los_Angeles'}).slice(0,10)}).slice(0,4)});
  console.log(
    jn.padEnd(6)+String(client).slice(0,22).padEnd(24)+String(product).padEnd(10)+' '+String(act).padEnd(4)+' '+String(caught==null?'?':caught).padEnd(4)+
    String(days+'d').padEnd(9)+ideal+'  -> '+target+'  '+String(owner||'?').padEnd(15)+String(region||'UNMAPPED '+zip).slice(0,34)+' ['+rhythm+']');
}
fs.writeFileSync('_cadence_plan.json',JSON.stringify(plan,null,2));
console.log('\n--- existing future visits already on these jobs ---');
for(const p of plan) if(p.futureCount) console.log('  #'+p.jn.padEnd(6)+p.client.slice(0,24).padEnd(26)+p.futureCount+' future: '+p.futureDates.join(', '));
