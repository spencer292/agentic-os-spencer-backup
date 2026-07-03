// Fresh keyword research pull — 2026-05-06
// Expanded seed list targeting gaps identified in 2026-05-06 audit:
//   - Geo-modified buyer-intent (service area cities)
//   - Service-modifier variants (mole removal service, lawn mole removal, etc.)
//   - SQR-derived terms (queries already triggering live ads)
//   - Cost / pricing intent buyer queries
//   - Symptom + buyer hybrid queries
import fs from 'node:fs';
import path from 'node:path';

const env={};
for(const line of fs.readFileSync(path.resolve('.env'),'utf8').split(/\r?\n/)){
  const m=line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);if(!m)continue;
  let v=m[2].trim();if((v.startsWith('"')&&v.endsWith('"'))||(v.startsWith("'")&&v.endsWith("'")))v=v.slice(1,-1);
  env[m[1]]=v;
}
const CID='1665761172';const MCC=env.GOOGLE_ADS_LOGIN_CUSTOMER_ID;
const GEO=['geoTargetConstants/21178']; // Washington state

// Expanded seed list — targets the gaps identified
const SEEDS = [
  // T1 — Service-modifier variants (gap: most untested)
  'mole removal service','mole removal services','mole control service','mole exterminator service',
  'mole catching service','mole trapping service','mole pest control','mole specialist',
  'lawn mole removal','yard mole removal','garden mole removal',
  // T1 — Geo-modified buyer intent (Western WA service area)
  'mole removal seattle','mole removal tacoma','mole removal olympia','mole removal bellevue',
  'mole removal kent','mole removal everett','mole removal kirkland','mole removal redmond',
  'mole removal puyallup','mole removal federal way','mole removal lakewood','mole removal bremerton',
  'mole removal gig harbor','mole removal spokane','mole removal vancouver wa',
  'mole exterminator seattle','mole exterminator tacoma','mole exterminator olympia',
  'pest control seattle moles','pest control tacoma moles',
  'mole control seattle','mole control tacoma',
  // T1 — Cost / pricing buyer intent
  'mole removal cost','mole exterminator cost','cost to get rid of moles',
  'mole control cost','mole trapping cost','price for mole removal',
  'how much for mole removal','how much does mole removal cost',
  // T1 — Near-me variants beyond what corpus has
  'pest control for moles near me','mole specialist near me','professional mole removal near me',
  'best mole removal','best mole exterminator','best mole control',
  // T2 — Top problem-aware (already proven 720/mo each)
  'how to get rid of moles in your yard','how to get rid of moles in lawn',
  'how to get rid of moles in garden','how to get rid of moles in grass',
  'how do you get rid of moles','how do i get rid of moles in my yard',
  'how to deal with moles','how to keep moles out of garden','how to keep moles out of yard',
  'how to stop moles','how to stop moles in your yard','how to prevent moles',
  // T2 — Symptom-aware
  'moles in yard','moles in lawn','moles in garden',
  'mole damage to lawn','mole damage to yard','mole infestation','mole holes',
  'mole tunnels','mole mounds','mole hills','dirt mounds in yard',
  'tunnels in lawn','tunnels in yard','small mounds in yard',
  // T3 — Solution research
  'best way to get rid of moles','what kills moles','what gets rid of moles',
  'mole repellent','mole deterrent','natural mole repellent',
  'castor oil for moles','sonic mole repeller','ultrasonic mole repellent',
  'mole bait','mole poison','mole traps',
  // Adjacent / brand-defining
  'humane mole removal','chemical free mole removal','organic mole control',
  'eco friendly mole removal','safe mole removal',
];

console.log(`Seeds: ${SEEDS.length}`);

const tk=await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:env.GOOGLE_ADS_CLIENT_ID,client_secret:env.GOOGLE_ADS_CLIENT_SECRET,refresh_token:env.GOOGLE_ADS_REFRESH_TOKEN,grant_type:'refresh_token'})});
const accessToken=(await tk.json()).access_token;
const headers={'Authorization':`Bearer ${accessToken}`,'developer-token':env.GOOGLE_ADS_DEVELOPER_TOKEN,'login-customer-id':MCC,'Content-Type':'application/json'};

console.log('Calling KeywordPlanIdeaService in batches of 20 seeds...');
const merged=new Map();
for(let i=0;i<SEEDS.length;i+=20){
  const chunk=SEEDS.slice(i,i+20);
  const r=await fetch(`https://googleads.googleapis.com/v23/customers/${CID}:generateKeywordIdeas`,{
    method:'POST',headers,
    body:JSON.stringify({
      language:'languageConstants/1000',
      geoTargetConstants:GEO,
      keywordPlanNetwork:'GOOGLE_SEARCH',
      includeAdultKeywords:false,
      keywordSeed:{keywords:chunk},
    }),
  });
  const data=await r.json();
  if(!r.ok){console.error('FAIL batch',i/20+1,':',JSON.stringify(data,null,2).slice(0,500));continue;}
  for(const x of (data.results||[])){if(!merged.has(x.text))merged.set(x.text,x);}
  console.log(`  Batch ${i/20+1}: +${data.results?.length||0} ideas (merged: ${merged.size})`);
}
const data={results:[...merged.values()]};

const ideas=(data.results||[]).map(x=>{
  const m=x.keywordIdeaMetrics||{};
  return {
    keyword:x.text,
    avgMonthlySearches:m.avgMonthlySearches?Number(m.avgMonthlySearches):0,
    competition:m.competition||'UNSPECIFIED',
    competitionIndex:m.competitionIndex?Number(m.competitionIndex):null,
    lowTopBidUSD:m.lowTopOfPageBidMicros?+(Number(m.lowTopOfPageBidMicros)/1e6).toFixed(2):null,
    highTopBidUSD:m.highTopOfPageBidMicros?+(Number(m.highTopOfPageBidMicros)/1e6).toFixed(2):null,
  };
}).sort((a,b)=>b.avgMonthlySearches-a.avgMonthlySearches);

const outPath='projects/briefs/got-moles-paid-search/keyword-ideas-2026-05-06-fresh.json';
fs.writeFileSync(outPath,JSON.stringify(ideas,null,2));
console.log(`Got ${ideas.length} ideas → ${outPath}`);

// Quick analysis
const buckets={
  '>=720':ideas.filter(k=>k.avgMonthlySearches>=720),
  '320-719':ideas.filter(k=>k.avgMonthlySearches>=320&&k.avgMonthlySearches<720),
  '90-319':ideas.filter(k=>k.avgMonthlySearches>=90&&k.avgMonthlySearches<320),
  '10-89':ideas.filter(k=>k.avgMonthlySearches>=10&&k.avgMonthlySearches<90),
  '<10':ideas.filter(k=>k.avgMonthlySearches<10),
};
console.log('\n=== Volume distribution ===');
for(const [k,v] of Object.entries(buckets))console.log(`  ${k.padEnd(8)}: ${v.length}`);

// Top 30 commercially-strong
const commercial=ideas.filter(k=>/removal|exterminator|control|service|pest|trapper|catcher|near me|cost|price|professional|company|specialist|hire|best/i.test(k.keyword));
console.log(`\n=== Top 30 commercial-intent ideas (n=${commercial.length} total) ===`);
console.log('Vol  | Comp     | CPC range            | Keyword');
for(const k of commercial.slice(0,30))console.log(`${String(k.avgMonthlySearches).padStart(4)} | ${(k.competition||'-').padEnd(8)} | $${String(k.lowTopBidUSD||0).padStart(5)}-$${String(k.highTopBidUSD||0).padStart(6)} | ${k.keyword}`);

// Geo-modified ideas
const geo=ideas.filter(k=>/seattle|tacoma|olympia|bellevue|kent|everett|kirkland|redmond|puyallup|federal way|lakewood|bremerton|gig harbor|spokane|vancouver|spanaway|auburn|sumner|university place|pierce|king|kitsap|snohomish|wa\b|washington/i.test(k.keyword));
console.log(`\n=== Geo-modified ideas (n=${geo.length}) — top 30 by volume ===`);
for(const k of geo.slice(0,30))console.log(`${String(k.avgMonthlySearches).padStart(4)} | ${(k.competition||'-').padEnd(8)} | $${String(k.lowTopBidUSD||0).padStart(5)}-$${String(k.highTopBidUSD||0).padStart(6)} | ${k.keyword}`);

// Compare to existing T1 deployed
const existing=new Set(['mole control','mole removal','mole removal cost','mole exterminator','mole exterminator near me','mole removal near me','pest control for moles','mole trapper','mole removal company','professional mole removal','mole catcher','mole catchers near me','mole removal services','companies that get rid of moles','best mole exterminator near me','exterminator for moles']);
const newCommercial=commercial.filter(k=>!existing.has(k.keyword.toLowerCase())&&k.avgMonthlySearches>=10);
console.log(`\n=== NEW commercial ideas (≥10/mo, not in current T1 deployment): ${newCommercial.length} ===`);
for(const k of newCommercial.slice(0,40))console.log(`${String(k.avgMonthlySearches).padStart(4)} | $${String(k.lowTopBidUSD||0).padStart(5)}-$${String(k.highTopBidUSD||0).padStart(6)} | ${k.keyword}`);
