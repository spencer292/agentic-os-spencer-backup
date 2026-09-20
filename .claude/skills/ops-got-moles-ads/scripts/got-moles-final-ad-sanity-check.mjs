// Final sanity check — every Google Ad against ALL known violation rules.
import fs from 'node:fs';
const env={};for(const l of fs.readFileSync('.env','utf8').split(/\r?\n/)){const m=l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);if(!m)continue;let v=m[2].trim();if((v.startsWith('"')&&v.endsWith('"'))||(v.startsWith("'")&&v.endsWith("'")))v=v.slice(1,-1);env[m[1]]=v;}
const tk=await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:env.GOOGLE_ADS_CLIENT_ID,client_secret:env.GOOGLE_ADS_CLIENT_SECRET,refresh_token:env.GOOGLE_ADS_REFRESH_TOKEN,grant_type:'refresh_token'})});
const at=(await tk.json()).access_token;

async function gaql(q){
  const r=await fetch(`https://googleads.googleapis.com/v23/customers/1665761172/googleAds:search`,{
    method:'POST',
    headers:{'Authorization':'Bearer '+at,'developer-token':env.GOOGLE_ADS_DEVELOPER_TOKEN,'login-customer-id':env.GOOGLE_ADS_LOGIN_CUSTOMER_ID,'Content-Type':'application/json'},
    body:JSON.stringify({query:q}),
  });
  return (await r.json()).results||[];
}

// Pull every ad NOT REMOVED — check both ENABLED-in-ENABLED-camp (live) and ENABLED-in-PAUSED-camp (would-serve-if-resumed)
const rsas = await gaql(`
  SELECT campaign.name, campaign.status, ad_group.name, ad_group.status,
    ad_group_ad.ad.id, ad_group_ad.status, ad_group_ad.policy_summary.approval_status,
    ad_group_ad.ad.responsive_search_ad.headlines, ad_group_ad.ad.responsive_search_ad.descriptions
  FROM ad_group_ad
  WHERE ad_group_ad.ad.type = 'RESPONSIVE_SEARCH_AD'
    AND ad_group_ad.status IN ('ENABLED','PAUSED')
    AND ad_group.status = 'ENABLED'
    AND campaign.status IN ('ENABLED','PAUSED')
`);

// Violation rules
const RULES = [
  { id: 'FREE_INSPECTION', regex: /free [a-z- ]*?(inspection|quote|estimate|appraisal|consultation)\b/i, exclude: /2[-\s]min|quiz/i, label: 'Free inspection/quote/estimate (without 2-min/quiz qualifier)' },
  { id: 'FREE_ASSESSMENT_AMBIG', regex: /free [a-z- ]*?assessment/i, exclude: /2[-\s]min|quiz/i, label: 'Free assessment (ambiguous — needs 2-min/quiz qualifier)' },
  { id: 'SPENCER_ANDREWS', regex: /spencer andrews|spencer anderson|spencer a\b/i, exclude: null, label: 'Spencer Andrews hallucination' },
  { id: 'MECHANISM', regex: /\b(body[- ]grip|bodygrip|scissor|harpoon|spear|spike|\bkill\b|lethal|dispatch|exterminate|euthani[zs]|poison|strychnine|warfarin|crush|snap[- ]trap)/i, exclude: null, label: 'Posture A mechanism word' },
  { id: 'WAS_NUMBER_1', regex: /\bWA[''']?s? #?1\b|washington[''']?s? #?1\b/i, exclude: null, label: 'Banned "WA\'s #1" claim' },
  { id: 'ONLY_MOLE_EXCLUSIVE', regex: /\bonly mole[- ]exclusive\b/i, exclude: null, label: 'Banned "only mole-exclusive" claim' },
  { id: 'GUARANTEE_OUTCOME', regex: /\bguarantee[d]?\s+(eradication|removal|elimination)|100%\s+(removal|eradication|effective)/i, exclude: null, label: 'Banned outcome guarantee' },
];

function check(text) {
  if (!text) return [];
  const hits = [];
  for (const r of RULES) {
    if (!r.regex.test(text)) continue;
    if (r.exclude && r.exclude.test(text)) continue;
    hits.push(r.id);
  }
  return hits;
}

const issues = [];
let totalAds = 0;
let cleanAds = 0;
for (const r of rsas) {
  totalAds++;
  const ad = r.adGroupAd.ad;
  const rsa = ad.responsiveSearchAd || {};
  const isLive = r.campaign.status === 'ENABLED' && r.adGroupAd.status === 'ENABLED';
  const status = isLive ? 'LIVE' : `${r.campaign.status}/${r.adGroupAd.status}`;
  const adIssues = [];
  for (const h of rsa.headlines || []) {
    const hits = check(h.text);
    if (hits.length) adIssues.push({ kind: 'H', text: h.text, hits });
  }
  for (const d of rsa.descriptions || []) {
    const hits = check(d.text);
    if (hits.length) adIssues.push({ kind: 'D', text: d.text, hits });
  }
  if (adIssues.length === 0) {
    cleanAds++;
  } else {
    issues.push({ campaign: r.campaign.name, adGroup: r.adGroup.name, adId: ad.id, status, issues: adIssues });
  }
}

console.log(`═══ FINAL SANITY CHECK — Got Moles Google Ads ═══\n`);
console.log(`Scanned ${totalAds} RSAs across all campaigns (ENABLED + PAUSED).`);
console.log(`Clean: ${cleanAds}/${totalAds}\n`);

if (issues.length === 0) {
  console.log('✅ ZERO violations across all rules:');
  for (const r of RULES) console.log(`   ✓ ${r.label}`);
} else {
  console.log(`⚠ ${issues.length} ad(s) with issues:\n`);
  for (const it of issues) {
    console.log(`  ${it.campaign} → ${it.adGroup} | ad ${it.adId} | ${it.status}`);
    for (const i of it.issues) console.log(`    ${i.kind}: "${i.text}" — ${i.hits.join(', ')}`);
    console.log();
  }
}

// Also sweep keywords
console.log(`\n═══ KEYWORD SWEEP ═══`);
const kws = await gaql(`
  SELECT campaign.name, ad_group.name, ad_group_criterion.keyword.text, ad_group_criterion.keyword.match_type, ad_group_criterion.negative
  FROM ad_group_criterion
  WHERE ad_group_criterion.type = 'KEYWORD'
    AND ad_group_criterion.status = 'ENABLED'
    AND ad_group.status = 'ENABLED'
    AND campaign.status IN ('ENABLED','PAUSED')
`);
const kwIssues = [];
for (const r of kws) {
  const t = r.adGroupCriterion.keyword.text;
  const hits = check(t);
  // For positive keywords, mechanism words are flagged. For negatives, mechanism words are FINE (we're blocking those queries).
  const isNeg = r.adGroupCriterion.negative === true;
  const filteredHits = isNeg ? hits.filter(h => h !== 'MECHANISM') : hits;
  if (filteredHits.length) kwIssues.push({ camp: r.campaign.name, ag: r.adGroup.name, neg: isNeg, kw: t, hits: filteredHits });
}
if (kwIssues.length === 0) {
  console.log('✅ Zero violations in active keywords.');
} else {
  for (const i of kwIssues) console.log(`  ${i.camp}/${i.ag} ${i.neg?'(NEG)':'(POS)'}: "${i.kw}" — ${i.hits.join(', ')}`);
}

console.log('\n═══ DONE ═══');
