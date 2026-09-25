// Replace the 5 RSAs containing "free inspection / quote / estimate" claims.
// Strategy: validate new RSAs (dry run) → create new ENABLED → pause old ENABLED.
// Continuous serving, rollback-safe.
import fs from 'node:fs';
import path from 'node:path';

const env={};
for(const line of fs.readFileSync(path.resolve('.env'),'utf8').split(/\r?\n/)){
  const m=line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);if(!m)continue;
  let v=m[2].trim();if((v.startsWith('"')&&v.endsWith('"'))||(v.startsWith("'")&&v.endsWith("'")))v=v.slice(1,-1);
  env[m[1]]=v;
}
const targetId='1665761172';
const mccId=env.GOOGLE_ADS_LOGIN_CUSTOMER_ID;
const VERSION='v23';

const tk=await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:env.GOOGLE_ADS_CLIENT_ID,client_secret:env.GOOGLE_ADS_CLIENT_SECRET,refresh_token:env.GOOGLE_ADS_REFRESH_TOKEN,grant_type:'refresh_token'})});
const accessToken=(await tk.json()).access_token;

const live=JSON.parse(fs.readFileSync('scripts/_got-moles-live-rsas.json','utf8'));

// Build replacement headlines/descriptions per ad. Same array, with offending entries swapped.
function fix(arr, replacements) {
  return arr.map(item => replacements[item] || item);
}

const REPLACEMENTS = {
  // Brand
  'Get a Free Mole Inspection':           'Take Our Free Mole Quiz',
  '5,000+ WA properties served. 219+ five-star Google reviews. Free inspection available.':
    '5,000+ WA properties served. 219+ five-star Google reviews. Same-day call-back.',
  'Got Moles — Spencer\'s original mole-removal team. Same-day call-back, free quote.':
    "Got Moles — Spencer's original mole-removal team. Same-day call-back. Call today.",
  // T1
  'Free Mole Inspection':                  'On-Site Mole Inspection',
  '5,000+ WA properties served. 219+ five-star reviews. Same-day free quote.':
    '5,000+ WA properties served. 219+ five-star reviews. Same-day call-back.',
  'Free property inspection. No poisons or chemicals. Mole control done right.':
    'On-site mole inspection. No poisons or chemicals. Mole control done right.',
  // T2
  'Same-Day Free Inspection':              'Same-Day Call-Back',
  'Free risk assessment. See if moles are the cause + how to stop them coming back.':
    'Free 2-min quiz. See if moles are the cause + how to stop them coming back.',
  // T3
  'Free Mole-Damage Assessment':           'Free 2-Min Damage Quiz',
  'Free assessment. See if moles are the cause + how to stop them coming back for good.':
    'Free 2-min quiz. See if moles are the cause + how to stop them coming back for good.',
};

// Verify all replacements respect Google Ads limits (30 headlines / 90 descriptions)
for (const [from, to] of Object.entries(REPLACEMENTS)) {
  const isHeadline = from.length <= 30;
  const limit = isHeadline ? 30 : 90;
  if (to.length > limit) {
    console.error(`❌ replacement too long: "${to}" (${to.length}/${limit})`);
    process.exit(1);
  }
}

// Build new ad payloads
const TARGETS = [];
for (const [campName, ads] of Object.entries(live)) {
  for (const a of ads) {
    const offenders = [...a.headlines.filter(h=>REPLACEMENTS[h]), ...a.descriptions.filter(d=>REPLACEMENTS[d])];
    if (offenders.length === 0) continue;
    TARGETS.push({
      campaign: campName,
      adGroupResource: `customers/${targetId}/adGroups/${a.adGroupId}`,
      oldAdResource: a.resourceName,
      oldAdId: a.adId,
      newHeadlines: fix(a.headlines, REPLACEMENTS),
      newDescriptions: fix(a.descriptions, REPLACEMENTS),
      path1: a.path1, path2: a.path2,
      finalUrls: a.finalUrls,
      offenders,
    });
  }
}

console.log(`Targets: ${TARGETS.length} ads to replace\n`);
for (const t of TARGETS) {
  console.log(`  ${t.campaign} (ad ${t.oldAdId}) — fixing ${t.offenders.length} entries`);
  for (const o of t.offenders) console.log(`    - "${o}" → "${REPLACEMENTS[o]}"`);
}

// === STAGE 1: Validate new ads (dry run) ===
console.log('\n═══ STAGE 1: validate_only dry run ═══');
async function gaCall(endpoint, body, validateOnly=false) {
  const fullBody = validateOnly ? {...body, validateOnly: true} : body;
  const r = await fetch(`https://googleads.googleapis.com/${VERSION}/customers/${targetId}/${endpoint}`, {
    method:'POST',
    headers:{'Authorization':`Bearer ${accessToken}`,'developer-token':env.GOOGLE_ADS_DEVELOPER_TOKEN,'login-customer-id':mccId,'Content-Type':'application/json'},
    body: JSON.stringify(fullBody),
  });
  return { ok: r.ok, status: r.status, body: await r.text() };
}

function buildCreateOp(t) {
  return {
    create: {
      adGroup: t.adGroupResource,
      status: 'ENABLED',
      ad: {
        finalUrls: t.finalUrls,
        responsiveSearchAd: {
          headlines: t.newHeadlines.map(text => ({ text })),
          descriptions: t.newDescriptions.map(text => ({ text })),
          path1: t.path1, path2: t.path2,
        },
      },
    },
  };
}

const createOps = TARGETS.map(buildCreateOp);
const dryRun = await gaCall('adGroupAds:mutate', { operations: createOps }, true);
if (!dryRun.ok) {
  console.error('❌ validate_only FAILED:');
  console.error(dryRun.body.slice(0, 4000));
  process.exit(1);
}
console.log('✅ validate_only PASSED — proposed ads pass policy/format check');

// === STAGE 2: Create new ads (real mutate) ===
console.log('\n═══ STAGE 2: create new ads ═══');
const createReal = await gaCall('adGroupAds:mutate', { operations: createOps });
if (!createReal.ok) {
  console.error('❌ CREATE FAILED:');
  console.error(createReal.body.slice(0, 4000));
  process.exit(1);
}
const createdJ = JSON.parse(createReal.body);
console.log(`✅ Created ${createdJ.results?.length||0} new ads`);
for (let i = 0; i < createdJ.results.length; i++) {
  const t = TARGETS[i];
  const newRes = createdJ.results[i].resourceName;
  console.log(`  ${t.campaign}: new ad ${newRes.split('/').pop()} (replaces ${t.oldAdId})`);
}

// === STAGE 3: Pause old ads ===
console.log('\n═══ STAGE 3: pause old ads ═══');
const pauseOps = TARGETS.map(t => ({
  update: {
    resourceName: t.oldAdResource,
    status: 'PAUSED',
  },
  updateMask: 'status',
}));
const pauseR = await gaCall('adGroupAds:mutate', { operations: pauseOps });
if (!pauseR.ok) {
  console.error('❌ PAUSE FAILED:');
  console.error(pauseR.body.slice(0, 4000));
  process.exit(1);
}
console.log(`✅ Paused ${TARGETS.length} old ads (preserved for rollback)`);

console.log('\n═══ DONE ═══');
console.log('New ads are LIVE in Eligible/limited state — Google policy review ~24h.');
console.log('Old ads are PAUSED — re-enable via UI if rollback needed.');
console.log('After 24h, verify new ads are APPROVED, then remove the paused old ads (separate cleanup).');
