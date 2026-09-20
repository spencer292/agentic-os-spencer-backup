// Pause the 10 duplicate geo EXACT keywords in T1's catch-all ad group.
// City ad groups keep their copies; catch-all (ag 201392096612) gets its dupes paused.
// Reversible: re-run with --enable to set them back to ENABLED.
//
// Usage:
//   node scripts/got-moles-pause-dupe-geo-keywords.mjs          # DRY RUN (default)
//   node scripts/got-moles-pause-dupe-geo-keywords.mjs --apply  # actually pause
//   node scripts/got-moles-pause-dupe-geo-keywords.mjs --apply --enable  # reverse

import fs from 'node:fs';
const env = {};
for (const l of fs.readFileSync('.env','utf8').split(/\r?\n/)) {
  const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
  if (!m) continue;
  let v = m[2].trim();
  if ((v.startsWith('"')&&v.endsWith('"')) || (v.startsWith("'")&&v.endsWith("'"))) v = v.slice(1,-1);
  env[m[1]] = v;
}

const cid = '1665761172';
const mcc = env.GOOGLE_ADS_LOGIN_CUSTOMER_ID;
const VERSION = 'v23';
const CATCHALL_AG = '201392096612';

const APPLY  = process.argv.includes('--apply');
const ENABLE = process.argv.includes('--enable');
const TARGET_STATUS = ENABLE ? 'ENABLED' : 'PAUSED';

// 10 catch-all dupes — same criterion_id as the city-ag copy, different ad_group.
const TARGETS = [
  { kw: 'mole removal kent',     critId: '313973151784' },
  { kw: 'mole removal bellevue', critId: '351962405733' },
  { kw: 'mole removal seattle',  critId: '355336609638' },
  { kw: 'mole control seattle',  critId: '357796191056' },
  { kw: 'mole removal tacoma',   critId: '424485491200' },
  { kw: 'mole removal kirkland', critId: '454039120770' },
  { kw: 'mole control bellevue', critId: '475282861171' },
  { kw: 'mole control kent',     critId: '475282871171' },
  { kw: 'mole control kirkland', critId: '475282871211' },
  { kw: 'mole control tacoma',   critId: '475282874291' },
];

const tk = await (await fetch('https://oauth2.googleapis.com/token', {
  method: 'POST',
  headers: {'Content-Type': 'application/x-www-form-urlencoded'},
  body: new URLSearchParams({
    client_id: env.GOOGLE_ADS_CLIENT_ID,
    client_secret: env.GOOGLE_ADS_CLIENT_SECRET,
    refresh_token: env.GOOGLE_ADS_REFRESH_TOKEN,
    grant_type: 'refresh_token',
  }),
})).json();
const at = tk.access_token;

async function gaql(query) {
  const r = await fetch(`https://googleads.googleapis.com/${VERSION}/customers/${cid}/googleAds:search`, {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + at,
      'developer-token': env.GOOGLE_ADS_DEVELOPER_TOKEN,
      'login-customer-id': mcc,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({query}),
  });
  const j = await r.json();
  if (!r.ok) throw new Error(JSON.stringify(j));
  return j.results || [];
}

// Pre-flight verification: confirm each target exists in catch-all AND has a city-ag sibling.
console.log(`\n=== Pre-flight verification ===`);
console.log(`Catch-all ad group: ${CATCHALL_AG}`);
console.log(`Target status:      ${TARGET_STATUS}`);
console.log(`Mode:               ${APPLY ? 'APPLY' : 'DRY RUN'}\n`);

const safeToProceed = [];
for (const t of TARGETS) {
  const rows = await gaql(`
    SELECT ad_group.id, ad_group.name, ad_group_criterion.criterion_id, ad_group_criterion.status, ad_group_criterion.keyword.text
    FROM ad_group_criterion
    WHERE campaign.id='23815936218'
      AND ad_group_criterion.type='KEYWORD'
      AND ad_group_criterion.criterion_id=${t.critId}
  `);

  const catchall = rows.find(r => r.adGroup.id === CATCHALL_AG);
  const cityCopy = rows.find(r => r.adGroup.id !== CATCHALL_AG);

  if (!catchall) {
    console.log(`  ⚠️  SKIP "${t.kw}" — no catch-all copy found`);
    continue;
  }
  if (!cityCopy) {
    console.log(`  ⚠️  SKIP "${t.kw}" — no city-ag sibling, would orphan the keyword`);
    continue;
  }
  console.log(`  ✓  "${t.kw}"  catch-all=${catchall.adGroupCriterion.status}  city-ag="${cityCopy.adGroup.name}"=${cityCopy.adGroupCriterion.status}`);
  safeToProceed.push({...t, resource: `customers/${cid}/adGroupCriteria/${CATCHALL_AG}~${t.critId}`, currentStatus: catchall.adGroupCriterion.status});
}

console.log(`\n${safeToProceed.length}/${TARGETS.length} targets verified.`);

const toMutate = safeToProceed.filter(t => t.currentStatus !== TARGET_STATUS);
if (toMutate.length === 0) {
  console.log(`All targets already ${TARGET_STATUS}. Nothing to do.`);
  process.exit(0);
}

console.log(`\n=== Mutation plan ===`);
console.log(`Will set ${toMutate.length} keyword(s) → ${TARGET_STATUS}:\n`);
for (const t of toMutate) console.log(`  ${t.resource}  ("${t.kw}")  ${t.currentStatus} → ${TARGET_STATUS}`);

if (!APPLY) {
  console.log(`\n[DRY RUN] Re-run with --apply to execute.`);
  process.exit(0);
}

// Mutate
console.log(`\n=== Applying mutations ===`);
const operations = toMutate.map(t => ({
  update: { resourceName: t.resource, status: TARGET_STATUS },
  updateMask: 'status',
}));

const r = await fetch(`https://googleads.googleapis.com/${VERSION}/customers/${cid}/adGroupCriteria:mutate`, {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + at,
    'developer-token': env.GOOGLE_ADS_DEVELOPER_TOKEN,
    'login-customer-id': mcc,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({operations}),
});
const j = await r.json();
if (!r.ok) {
  console.error(`❌ Mutate failed:\n${JSON.stringify(j, null, 2)}`);
  process.exit(1);
}
console.log(`✅ Mutated ${j.results?.length || 0} keyword(s) → ${TARGET_STATUS}`);
for (const res of j.results || []) console.log(`   ${res.resourceName}`);
