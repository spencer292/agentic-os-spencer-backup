// Probe Zernio Ads — Facebook/Meta access state for ATP + Got Moles.
import fs from 'node:fs';
const env=Object.fromEntries(fs.readFileSync('.env','utf8').split('\n').filter(l=>l.includes('=')).map(l=>{const i=l.indexOf('=');return [l.slice(0,i).trim(),l.slice(i+1).trim().replace(/^["']|["']$/g,'')];}));
const KEY=env.ZERNIO_API_KEY;
const BASE='https://zernio.com/api/v1';
const H={Authorization:`Bearer ${KEY}`,Accept:'application/json'};

async function get(p){const r=await fetch(`${BASE}${p}`,{headers:H});const j=await r.json().catch(()=>({}));return {status:r.status,body:j};}

// 1. All connected accounts
console.log('=== All connected accounts ===');
const accts=await get('/accounts');
if(accts.status!==200){console.error('FAIL /accounts:',accts.status,JSON.stringify(accts.body).slice(0,300));process.exit(1);}
const byPlat={};
for(const a of accts.body.accounts||[]){byPlat[a.platform]=(byPlat[a.platform]||0)+1;}
console.log('Platform counts:',byPlat);

// 2. Filter to FB/Meta
console.log('\n=== Facebook/Meta accounts ===');
const fbAccts=(accts.body.accounts||[]).filter(a=>['facebook','facebook-ads','meta','meta-ads','instagram'].includes(a.platform));
if(!fbAccts.length){console.log('  (none — Zernio has no FB/Meta accounts connected)');}
fbAccts.forEach(a=>{
  console.log(`  [${a.platform}] ${a.displayName} active=${a.isActive} _id=${a._id}`);
  console.log(`    keys: ${Object.keys(a).join(', ')}`);
  if(a.platformAdAccountId)console.log(`    platformAdAccountId: ${a.platformAdAccountId}`);
  if(a.adAccountId)console.log(`    adAccountId: ${a.adAccountId}`);
  if(a.pageId)console.log(`    pageId: ${a.pageId}`);
  if(a.permissions)console.log(`    permissions: ${JSON.stringify(a.permissions)}`);
});

// 3. All ads — filter to FB platforms
console.log('\n=== All ads — Facebook/Meta filter ===');
const ads=await get('/ads');
const fbAds=(ads.body.ads||[]).filter(a=>['facebook','meta','instagram'].includes(a.platform));
console.log(`Total ads in Zernio: ${(ads.body.ads||[]).length} | FB/Meta ads: ${fbAds.length}`);
fbAds.slice(0,5).forEach(ad=>{
  console.log(`  Ad ${ad._id} [${ad.platform}] campaign=${ad.campaignName} status=${ad.status}`);
});

// 4. Campaigns
console.log('\n=== All campaigns ===');
const camps=await get('/ads/campaigns');
console.log(`Total campaigns: ${(camps.body.campaigns||[]).length}`);
if(fbAds[0]){
  const fbAcctIds=new Set(fbAds.map(a=>a.platformAdAccountId));
  const fbCamps=(camps.body.campaigns||[]).filter(c=>fbAcctIds.has(c.platformAdAccountId));
  console.log(`FB-linked campaigns: ${fbCamps.length}`);
  fbCamps.slice(0,5).forEach(c=>console.log(`  ${c.campaignName} status=${c.status} budget=${JSON.stringify(c.budget)}`));
}

// 5. What can we DO? Test endpoints
console.log('\n=== Capability probes (read what Zernio exposes) ===');
const capabilityProbes=[
  '/ads/accounts',
  '/ads/audiences',
  '/ads/campaigns',
  '/ads/adsets',
  '/ads/conversions',
  '/ads/create',  // POST endpoint — GET likely 405
];
for(const p of capabilityProbes){
  const r=await get(p);
  const ok=r.status===200?'✓':r.status===405?'POST-only':'✗';
  console.log(`  ${p.padEnd(25)} → ${r.status} ${ok}`);
}
