// Got Moles — re-add generic "money" buyer-intent keywords dropped in the 5/24 City-Exact rebuild.
// Creates ONE new ad group "Buyer Intent — Generic" in T1 v2 (geo-less terms can't live in a city group),
// a geo-neutral RSA reusing APPROVED copy, and the money keyword set with tight match types.
// Campaign-level shared negative lists already cover this ad group (no re-attach needed).
// DRY RUN by default. Apply with:  node scripts/got-moles-add-money-keywords.mjs --apply
import fs from 'node:fs';import path from 'node:path';
const APPLY=process.argv.includes('--apply');
const env={};for(const line of fs.readFileSync(path.resolve('.env'),'utf8').split(/\r?\n/)){const m=line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);if(!m)continue;let v=m[2].trim();if((v.startsWith('"')&&v.endsWith('"'))||(v.startsWith("'")&&v.endsWith("'")))v=v.slice(1,-1);env[m[1]]=v;}
const targetId='1665761172';const mccId=env.GOOGLE_ADS_LOGIN_CUSTOMER_ID;const CAMP='23876158925';
const LP='https://got-moles.com/lp/mole-removal/';
const BID_MICROS=14_000_000;

// --- keyword set (grounded in LEARNINGS-INDEX: exact city+service converts; loose head terms bleed) ---
const EXACT_AND_PHRASE=[
  'professional mole removal','mole removal company','mole control company',
  'mole removal service','mole exterminator','mole control',
  'mole removal near me','mole exterminator near me',
];
const EXACT_ONLY=['moles in lawn'];
const HELD_BACK={
  'mole removal cost':'QS3 + below-LP history (5/23) — price-shopper/info intent. Add later only if conv supports.',
  'mole removal':'bare head term = the dermatology trap ($291 bled). Exact still pulls skin-mole close variants.',
};

// --- geo-neutral RSA (reuses APPROVED Seattle copy, de-cityed; Posture A safe, no phone numbers) ---
const HEADLINES=[
  {text:'Professional Mole Removal',pin:'HEADLINE_1'},
  {text:'Mole Removal Company',pin:'HEADLINE_1'},
  {text:'Western WA Mole Removal'},
  {text:'Mole Exterminator'},
  {text:'Mole Control Experts'},
  {text:'Local Mole Specialists'},
  {text:'Same-Day Call-Back'},
  {text:'No Catch, No Charge'},
  {text:'Pay Only If We Catch'},
  {text:'$150 Deposit, $450 Max'},
  {text:'219+ 5-Star Reviews'},
  {text:'Safe for Pets & Kids'},
  {text:"Spencer's Mole Team"},
  {text:'Moles in Your Lawn?'},
  {text:'Father-and-Son Trade'},
];
const DESCRIPTIONS=[
  {text:'Professional mole removal across Western WA. $150 to start. Pay only if we catch moles.'},
  {text:'Same-day call-back. 219+ five-star reviews. Nearly 5,000 WA yards since 2017.'},
  {text:'Mole tunnels or mounds in your yard? Spencer’s team handles it.'},
  {text:'Safe for kids, pets, gardens. No poisons. No chemicals. Spencer’s proven method.'},
];

console.log(`\n=== ${APPLY?'APPLY':'DRY RUN'} — Got Moles money-keyword re-add ===`);
console.log(`Campaign: T1 v2 — City Exact (${CAMP})`);
console.log(`New ad group: "Buyer Intent — Generic"  |  bid $${(BID_MICROS/1e6).toFixed(2)}  |  LP ${LP}`);
console.log(`\nKEYWORDS — EXACT + PHRASE (${EXACT_AND_PHRASE.length} terms → ${EXACT_AND_PHRASE.length*2} criteria):`);
EXACT_AND_PHRASE.forEach(k=>console.log(`  [EXACT] [PHRASE]  ${k}`));
console.log(`\nKEYWORDS — EXACT only (${EXACT_ONLY.length}):`);
EXACT_ONLY.forEach(k=>console.log(`  [EXACT]           ${k}`));
console.log(`\nHELD BACK (not added — flagged for Roy):`);
for(const [k,why] of Object.entries(HELD_BACK)) console.log(`  ✗ ${k} — ${why}`);
console.log(`\nRSA headlines (${HEADLINES.length}): `+HEADLINES.map(h=>h.text+(h.pin?'*':'')).join(' | '));
console.log(`RSA descriptions (${DESCRIPTIONS.length}): `+DESCRIPTIONS.map(d=>d.text).join(' || '));
const totalKw=EXACT_AND_PHRASE.length*2+EXACT_ONLY.length;
console.log(`\nTotal new keyword criteria: ${totalKw}  (campaign shared negatives already apply)`);

if(!APPLY){console.log('\nDRY RUN only — no changes made. Re-run with --apply to execute.\n');process.exit(0);}

// ---- APPLY ----
const tk=await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:env.GOOGLE_ADS_CLIENT_ID,client_secret:env.GOOGLE_ADS_CLIENT_SECRET,refresh_token:env.GOOGLE_ADS_REFRESH_TOKEN,grant_type:'refresh_token'})});
const accessToken=(await tk.json()).access_token;
async function mutate(svc,operations){
  const r=await fetch(`https://googleads.googleapis.com/v23/customers/${targetId}/${svc}:mutate`,{method:'POST',headers:{'Authorization':`Bearer ${accessToken}`,'developer-token':env.GOOGLE_ADS_DEVELOPER_TOKEN,'login-customer-id':mccId,'Content-Type':'application/json'},body:JSON.stringify({operations})});
  const j=await r.json();if(!r.ok){console.error(`${svc} FAIL:`,JSON.stringify(j));throw new Error(svc+' failed');}return j;
}
// 1) ad group
const agCreate={name:'Buyer Intent — Generic',campaign:`customers/${targetId}/campaigns/${CAMP}`,status:'ENABLED',type:'SEARCH_STANDARD',cpcBidMicros:BID_MICROS};
const agRes=await mutate('adGroups',[{create:agCreate}]);
const agRN=agRes.results[0].resourceName;
console.log('\n✓ ad group created:',agRN);
// 2) RSA
const rsaHeadlines=HEADLINES.map(function(h){return h.pin?{text:h.text,pinnedField:h.pin}:{text:h.text};});
const rsaDescriptions=DESCRIPTIONS.map(function(d){return {text:d.text};});
const adCreate={adGroup:agRN,status:'ENABLED',ad:{finalUrls:[LP],responsiveSearchAd:{headlines:rsaHeadlines,descriptions:rsaDescriptions}}};
await mutate('adGroupAds',[{create:adCreate}]);
console.log('✓ RSA created');
// 3) keywords
const kwOps=[];
for(const k of EXACT_AND_PHRASE){
  kwOps.push({create:{adGroup:agRN,status:'ENABLED',keyword:{text:k,matchType:'EXACT'}}});
  kwOps.push({create:{adGroup:agRN,status:'ENABLED',keyword:{text:k,matchType:'PHRASE'}}});
}
for(const k of EXACT_ONLY){
  kwOps.push({create:{adGroup:agRN,status:'ENABLED',keyword:{text:k,matchType:'EXACT'}}});
}
const kwRes=await mutate('adGroupCriteria',kwOps);
console.log(`✓ ${kwRes.results.length} keyword criteria created`);
console.log('\n=== DONE — verify approval with: node scripts/got-moles-campaign-status.mjs ===\n');
