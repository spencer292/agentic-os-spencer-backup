// Add city-modified EXACT keywords to T1 ad group with per-keyword final-URL overrides.
// Each keyword routes to that city's strongest organic-ranking page (from city-LP-map).
import fs from 'node:fs';
import path from 'node:path';

const env={};for(const l of fs.readFileSync('.env','utf8').split(/\r?\n/)){const m=l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);if(!m)continue;let v=m[2].trim();if((v.startsWith('"')&&v.endsWith('"'))||(v.startsWith("'")&&v.endsWith("'")))v=v.slice(1,-1);env[m[1]]=v;}
const targetId='1665761172';
const mccId=env.GOOGLE_ADS_LOGIN_CUSTOMER_ID;
const VERSION='v23';
const T1_AG = '201392096612';

const tk=await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:env.GOOGLE_ADS_CLIENT_ID,client_secret:env.GOOGLE_ADS_CLIENT_SECRET,refresh_token:env.GOOGLE_ADS_REFRESH_TOKEN,grant_type:'refresh_token'})});
const at=(await tk.json()).access_token;

// Load LP map + existing T1 keywords
const lpMap = JSON.parse(fs.readFileSync('scripts/_city-lp-map.json','utf8'));
const existing = new Set(
  JSON.parse(fs.readFileSync('scripts/_t1-existing-keywords.json','utf8'))
    .filter(k => k.match === 'EXACT')
    .map(k => k.text.toLowerCase())
);

const TEMPLATES = ['mole control', 'mole exterminator', 'mole removal'];

const adds = [];
const skipped = [];
for (const [city, lp] of Object.entries(lpMap)) {
  for (const t of TEMPLATES) {
    const kw = `${t} ${city}`.toLowerCase();
    if (existing.has(kw)) { skipped.push(kw); continue; }
    adds.push({ city, kw, url: lp.url });
  }
}

console.log(`Plan: ${adds.length} new EXACT keywords (skipping ${skipped.length} duplicates)\n`);
const byCity = {};
for (const a of adds) (byCity[a.city] = byCity[a.city] || []).push(a);
for (const city of Object.keys(byCity)) {
  console.log(`  ${city.padEnd(18)} → ${byCity[city][0].url}`);
  for (const a of byCity[city]) console.log(`     + "${a.kw}"`);
}

const operations = adds.map(a => ({
  create: {
    adGroup: `customers/${targetId}/adGroups/${T1_AG}`,
    status: 'ENABLED',
    keyword: { text: a.kw, matchType: 'EXACT' },
    finalUrls: [a.url],
  },
}));

// Validate
console.log('\n═══ STAGE 1: validate_only ═══');
const v = await fetch(`https://googleads.googleapis.com/${VERSION}/customers/${targetId}/adGroupCriteria:mutate`, {
  method:'POST',
  headers:{'Authorization':'Bearer '+at,'developer-token':env.GOOGLE_ADS_DEVELOPER_TOKEN,'login-customer-id':mccId,'Content-Type':'application/json'},
  body: JSON.stringify({ operations, validateOnly: true }),
});
if (!v.ok) { console.error('validate FAIL:', await v.text()); process.exit(1); }
console.log(`✅ ${operations.length} keywords pass validation`);

// Apply
console.log('\n═══ STAGE 2: real mutate ═══');
const r = await fetch(`https://googleads.googleapis.com/${VERSION}/customers/${targetId}/adGroupCriteria:mutate`, {
  method:'POST',
  headers:{'Authorization':'Bearer '+at,'developer-token':env.GOOGLE_ADS_DEVELOPER_TOKEN,'login-customer-id':mccId,'Content-Type':'application/json'},
  body: JSON.stringify({ operations }),
});
if (!r.ok) { console.error('mutate FAIL:', await r.text()); process.exit(1); }
const j = await r.json();
console.log(`✅ Added ${j.results?.length||0} EXACT city-modified keywords to T1 with per-keyword URL overrides`);
