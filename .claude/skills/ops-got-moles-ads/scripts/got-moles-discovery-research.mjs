// Got Moles Discovery — Phase 1 research.
// Pulls SEASONAL Keyword Planner volumes (reads Mar-May + Sep-Nov peak months, not the
// buried 12-mo average) + SERPAPI intent (local pack / organic mix) for the candidate
// converter universe. Writes JSON for synthesis into the scored shortlist.
import fs from 'node:fs';import path from 'node:path';
const env={};for(const l of fs.readFileSync(path.resolve('.env'),'utf8').split(/\r?\n/)){const m=l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);if(!m)continue;let v=m[2].trim();if((v.startsWith('"')&&v.endsWith('"'))||(v.startsWith("'")&&v.endsWith("'")))v=v.slice(1,-1);env[m[1]]=v;}
const CID='1665761172',MCC=env.GOOGLE_ADS_LOGIN_CUSTOMER_ID,V='v23';

// ── Candidate universe (commercial intent only; DIY/info deliberately excluded) ──
const ROOTS=['mole control','mole removal','mole exterminator','mole pest control','mole treatment',
  'yard mole removal','lawn mole removal','mole removal service','professional mole removal',
  'best mole control company','mole catchers','mole trapping','pest control for moles'];
const NEARME=['mole control near me','mole removal near me','mole exterminator near me','mole removal service near me','mole catchers near me','mole trapping near me'];
const CITIES=['seattle','bellevue','tacoma','kirkland','redmond','sammamish','renton','kent','auburn','puyallup','issaquah','federal way','olympia'];
const CITYKW=[];for(const c of CITIES){CITYKW.push('mole control '+c);CITYKW.push('mole removal '+c);}
const ALL=[...ROOTS,...NEARME,...CITYKW];

const tk=await(await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:env.GOOGLE_ADS_CLIENT_ID,client_secret:env.GOOGLE_ADS_CLIENT_SECRET,refresh_token:env.GOOGLE_ADS_REFRESH_TOKEN,grant_type:'refresh_token'})})).json();
const at=tk.access_token;

// ── Signal 1: Keyword Planner seasonal (chunk into <=20 keyword requests) ──
const PEAK=new Set(['MARCH','APRIL','MAY','SEPTEMBER','OCTOBER','NOVEMBER']);
const kpMap={};
function chunk(a,n){const o=[];for(let i=0;i<a.length;i+=n)o.push(a.slice(i,i+n));return o;}
for(const grp of chunk(ALL,18)){
  const r=await fetch(`https://googleads.googleapis.com/${V}/customers/${CID}:generateKeywordHistoricalMetrics`,{
    method:'POST',headers:{'Authorization':`Bearer ${at}`,'developer-token':env.GOOGLE_ADS_DEVELOPER_TOKEN,'login-customer-id':MCC,'Content-Type':'application/json'},
    body:JSON.stringify({keywords:grp,geoTargetConstants:['geoTargetConstants/21178'],language:'languageConstants/1000',keywordPlanNetwork:'GOOGLE_SEARCH',
      historicalMetricsOptions:{yearMonthRange:{start:{year:2024,month:'MARCH'},end:{year:2025,month:'DECEMBER'}}}}),
  });
  const j=await r.json();
  if(!r.ok){console.error('KP chunk FAIL:',JSON.stringify(j).slice(0,300));continue;}
  for(const x of (j.results||[])){
    const m=x.keywordMetrics||{};
    const months=(m.monthlySearchVolumes||[]).filter(v=>v.year==='2025'||v.year===2025);
    const peakVals=months.filter(v=>PEAK.has(v.month)).map(v=>Number(v.monthlySearches||0));
    const peakAvg=peakVals.length?Math.round(peakVals.reduce((a,b)=>a+b,0)/peakVals.length):0;
    const peakMax=peakVals.length?Math.max(...peakVals):0;
    kpMap[x.text.toLowerCase()]={annual:m.avgMonthlySearches?Number(m.avgMonthlySearches):0,peakAvg,peakMax,comp:m.competition||'-',
      low:m.lowTopOfPageBidMicros?+(Number(m.lowTopOfPageBidMicros)/1e6).toFixed(2):null,high:m.highTopOfPageBidMicros?+(Number(m.highTopOfPageBidMicros)/1e6).toFixed(2):null};
  }
}

// ── Signal 2: SERPAPI intent on root terms + a couple city terms (cost-controlled) ──
async function serp(q){
  const u=new URL('https://serpapi.com/search.json');
  u.searchParams.set('engine','google');u.searchParams.set('q',q);u.searchParams.set('location','Seattle, Washington, United States');
  u.searchParams.set('hl','en');u.searchParams.set('gl','us');u.searchParams.set('api_key',env.SERPAPI_API_KEY);
  const j=await(await fetch(u)).json();
  if(j.error)return {err:j.error};
  return {ads:(j.ads||[]).length,localPack:!!(j.local_results||j.local_map),shopping:(j.shopping_results||[]).length,
    topOrganic:(j.organic_results||[]).slice(0,3).map(o=>{try{return new URL(o.link).hostname.replace('www.','')}catch{return '?'}})};
}
const serpMap={};
const serpList=[...ROOTS,'mole control seattle','mole removal seattle','mole exterminator near me'];
for(const q of serpList){serpMap[q]=await serp(q);}

const out={generated:new Date().toISOString(),seasonalWindow:'2025 peaks Mar-May + Sep-Nov',keywordPlanner:kpMap,serp:serpMap,candidates:ALL};
const outPath=path.resolve('projects/briefs/got-moles-paid-search/_discovery-research-raw.json');
fs.writeFileSync(outPath,JSON.stringify(out,null,2));

// ── Console summary ──
console.log('═══ KEYWORD PLANNER — SEASONAL (2025 peak months) vs annual avg ═══\n');
console.log('Keyword'.padEnd(30),'Annual'.padStart(7),'PeakAvg'.padStart(8),'PeakMax'.padStart(8),'Comp'.padStart(7),'$low-high'.padStart(11));
for(const k of ALL){const d=kpMap[k.toLowerCase()];if(!d)continue;
  console.log(k.padEnd(30),String(d.annual).padStart(7),String(d.peakAvg).padStart(8),String(d.peakMax).padStart(8),String(d.comp).padStart(7),`${d.low??'-'}-${d.high??'-'}`.padStart(11));}
console.log('\n═══ SERP INTENT (Seattle) ═══\n');
console.log('Keyword'.padEnd(28),'Ads'.padStart(4),'LclPk'.padStart(6),'Shop'.padStart(5),'  Top organic');
for(const q of serpList){const s=serpMap[q];if(!s||s.err){console.log(q.padEnd(28),' ',s?.err||'');continue;}
  console.log(q.padEnd(28),String(s.ads).padStart(4),String(s.localPack).padStart(6),String(s.shopping).padStart(5),'  '+s.topOrganic.join(', '));}
console.log('\nRaw saved:',outPath);
console.log('═══ END ═══');
