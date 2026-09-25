// Fix the Spencer Andrews → Spencer Hill hallucination across the Brand campaign.
// 1. Replace Brand RSA headline "Got Moles | Spencer Andrews" → "Got Moles | Spencer Hill"
// 2. Remove keyword PHRASE "got moles spencer andrews"
// 3. Add keyword PHRASE "got moles spencer hill"
// 4. Pause old Brand RSA after new one creates
import fs from 'node:fs';
const env={};for(const l of fs.readFileSync('.env','utf8').split(/\r?\n/)){const m=l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);if(!m)continue;let v=m[2].trim();if((v.startsWith('"')&&v.endsWith('"'))||(v.startsWith("'")&&v.endsWith("'")))v=v.slice(1,-1);env[m[1]]=v;}
const targetId='1665761172';
const mccId=env.GOOGLE_ADS_LOGIN_CUSTOMER_ID;
const VERSION='v23';

const tk=await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:env.GOOGLE_ADS_CLIENT_ID,client_secret:env.GOOGLE_ADS_CLIENT_SECRET,refresh_token:env.GOOGLE_ADS_REFRESH_TOKEN,grant_type:'refresh_token'})});
const at=(await tk.json()).access_token;
const headers={'Authorization':'Bearer '+at,'developer-token':env.GOOGLE_ADS_DEVELOPER_TOKEN,'login-customer-id':mccId,'Content-Type':'application/json'};

const BRAND_AG = '196657777816';
const BRAND_AG_RES = `customers/${targetId}/adGroups/${BRAND_AG}`;

// === 1. Fetch current Brand RSA and build corrected version ===
async function gaql(q){
  const r=await fetch(`https://googleads.googleapis.com/${VERSION}/customers/${targetId}/googleAds:search`,{method:'POST',headers,body:JSON.stringify({query:q})});
  return (await r.json()).results||[];
}

const brandRsas = await gaql(`
  SELECT ad_group.id, ad_group_ad.ad.id, ad_group_ad.ad.resource_name,
    ad_group_ad.ad.responsive_search_ad.headlines, ad_group_ad.ad.responsive_search_ad.descriptions,
    ad_group_ad.ad.responsive_search_ad.path1, ad_group_ad.ad.responsive_search_ad.path2,
    ad_group_ad.ad.final_urls, ad_group_ad.status
  FROM ad_group_ad
  WHERE ad_group.id = ${BRAND_AG} AND ad_group_ad.status = 'ENABLED'
`);
if (brandRsas.length !== 1) {
  console.error(`Expected 1 ENABLED Brand RSA, found ${brandRsas.length}`);
  process.exit(1);
}
const oldAd = brandRsas[0].adGroupAd.ad;
const oldStatus = brandRsas[0].adGroupAd.status;
const oldRes = `customers/${targetId}/adGroupAds/${BRAND_AG}~${oldAd.id}`;
const rsa = oldAd.responsiveSearchAd;

const newHeadlines = rsa.headlines.map(h => ({
  text: h.text === 'Got Moles | Spencer Andrews' ? 'Got Moles | Spencer Hill' : h.text,
}));
const newDescriptions = rsa.descriptions.map(d => ({ text: d.text }));

console.log('Old ad:', oldAd.id, '— headline change:');
for (let i = 0; i < rsa.headlines.length; i++) {
  const before = rsa.headlines[i].text;
  const after = newHeadlines[i].text;
  if (before !== after) console.log(`  "${before}" → "${after}"`);
}

// === 2. Validate + create new Brand RSA ===
const createOp = {
  create: {
    adGroup: BRAND_AG_RES, status: 'ENABLED',
    ad: {
      finalUrls: oldAd.finalUrls,
      responsiveSearchAd: {
        headlines: newHeadlines, descriptions: newDescriptions,
        path1: rsa.path1, path2: rsa.path2,
      },
    },
  },
};

console.log('\n═══ Validate new Brand RSA ═══');
let r = await fetch(`https://googleads.googleapis.com/${VERSION}/customers/${targetId}/adGroupAds:mutate`, {
  method:'POST', headers,
  body: JSON.stringify({ operations: [createOp], validateOnly: true }),
});
if (!r.ok) { console.error('validate FAIL:', await r.text()); process.exit(1); }
console.log('✅ validates');

console.log('\n═══ Create new Brand RSA ═══');
r = await fetch(`https://googleads.googleapis.com/${VERSION}/customers/${targetId}/adGroupAds:mutate`, {
  method:'POST', headers, body: JSON.stringify({ operations: [createOp] }),
});
if (!r.ok) { console.error('create FAIL:', await r.text()); process.exit(1); }
const created = await r.json();
const newAdRes = created.results[0].resourceName;
console.log(`✅ Created: ${newAdRes}`);

// === 3. Pause old Brand RSA ===
console.log('\n═══ Pause old Brand RSA ═══');
r = await fetch(`https://googleads.googleapis.com/${VERSION}/customers/${targetId}/adGroupAds:mutate`, {
  method:'POST', headers,
  body: JSON.stringify({ operations: [{ update: { resourceName: oldRes, status: 'PAUSED' }, updateMask: 'status' }] }),
});
if (!r.ok) { console.error('pause FAIL:', await r.text()); process.exit(1); }
console.log(`✅ Paused old ad ${oldAd.id}`);

// === 4. Find + remove "got moles spencer andrews" keyword ===
console.log('\n═══ Remove "got moles spencer andrews" keyword ═══');
const kwRows = await gaql(`
  SELECT ad_group_criterion.criterion_id, ad_group_criterion.keyword.text, ad_group_criterion.keyword.match_type
  FROM ad_group_criterion
  WHERE ad_group.id = ${BRAND_AG}
    AND ad_group_criterion.type = 'KEYWORD'
    AND ad_group_criterion.negative = FALSE
    AND ad_group_criterion.keyword.text = 'got moles spencer andrews'
`);
if (kwRows.length) {
  const critId = kwRows[0].adGroupCriterion.criterionId;
  const removeRes = `customers/${targetId}/adGroupCriteria/${BRAND_AG}~${critId}`;
  r = await fetch(`https://googleads.googleapis.com/${VERSION}/customers/${targetId}/adGroupCriteria:mutate`, {
    method:'POST', headers,
    body: JSON.stringify({ operations: [{ remove: removeRes }] }),
  });
  if (!r.ok) { console.error('remove FAIL:', await r.text()); process.exit(1); }
  console.log(`✅ Removed keyword "got moles spencer andrews"`);
} else {
  console.log('  (not found — already gone)');
}

// === 5. Add "got moles spencer hill" PHRASE keyword ===
console.log('\n═══ Add "got moles spencer hill" PHRASE keyword ═══');
r = await fetch(`https://googleads.googleapis.com/${VERSION}/customers/${targetId}/adGroupCriteria:mutate`, {
  method:'POST', headers,
  body: JSON.stringify({ operations: [{
    create: {
      adGroup: BRAND_AG_RES, status: 'ENABLED',
      keyword: { text: 'got moles spencer hill', matchType: 'PHRASE' },
    },
  }] }),
});
if (!r.ok) { console.error('add FAIL:', await r.text()); process.exit(1); }
console.log(`✅ Added "got moles spencer hill" PHRASE`);

console.log('\n═══ DONE ═══');
console.log('Spencer Andrews hallucination removed from live ads + keywords.');
