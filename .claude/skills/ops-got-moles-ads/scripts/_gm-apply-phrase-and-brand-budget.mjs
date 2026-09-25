import fs from 'node:fs';
import path from 'node:path';
const APPLY = process.argv.includes('--apply');
const env={};
for(const line of fs.readFileSync(path.resolve('.env'),'utf8').split(/\r?\n/)){
  const m=line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);if(!m)continue;
  let v=m[2].trim();if((v.startsWith('"')&&v.endsWith('"'))||(v.startsWith("'")&&v.endsWith("'")))v=v.slice(1,-1);
  env[m[1]]=v;
}
const cust='1665761172', mcc='2845309762';
const BID_MICROS = 14_000_000; // $14 default per ad group, matches existing
let _t;
async function tok(){
  if(_t) return _t;
  const r=await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:env.GOOGLE_ADS_CLIENT_ID,client_secret:env.GOOGLE_ADS_CLIENT_SECRET,refresh_token:env.GOOGLE_ADS_REFRESH_TOKEN,grant_type:'refresh_token'})});
  _t=(await r.json()).access_token; return _t;
}
async function q(query){
  const t=await tok();
  const r=await fetch(`https://googleads.googleapis.com/v23/customers/${cust}/googleAds:search`,{method:'POST',headers:{Authorization:`Bearer ${t}`,'developer-token':env.GOOGLE_ADS_DEVELOPER_TOKEN,'login-customer-id':mcc,'Content-Type':'application/json'},body:JSON.stringify({query})});
  return r.json();
}
async function mutate(resource, ops){
  const t=await tok();
  const r=await fetch(`https://googleads.googleapis.com/v23/customers/${cust}/${resource}:mutate`,{method:'POST',headers:{Authorization:`Bearer ${t}`,'developer-token':env.GOOGLE_ADS_DEVELOPER_TOKEN,'login-customer-id':mcc,'Content-Type':'application/json'},body:JSON.stringify({operations:ops})});
  return r.json();
}

console.log(`MODE: ${APPLY?'APPLY (LIVE)':'DRY RUN — pass --apply to execute'}`);

// ============ STEP 1: Brand budget $10 -> $30 ============
console.log('\n=== STEP 1: Brand budget $10 -> $30/day ===');
const brandQ=await q(`SELECT campaign.id, campaign.name, campaign.status, campaign_budget.resource_name, campaign_budget.amount_micros FROM campaign WHERE campaign.name = 'Brand' AND campaign.status = 'ENABLED'`);
const brand=brandQ.results?.[0];
if(!brand){ console.error('  Brand ENABLED campaign not found'); process.exit(1); }
const budgetRn = brand.campaignBudget.resourceName;
console.log(`  Found ENABLED Brand campaign ${brand.campaign.id}, budget ${budgetRn}, current $${(brand.campaignBudget.amountMicros/1e6).toFixed(2)}`);
if(APPLY){
  const res=await mutate('campaignBudgets', [{ update: { resourceName: budgetRn, amountMicros: 30_000_000 }, updateMask: 'amount_micros' }]);
  if(res.results) console.log(`  ✅ Brand budget updated to $30/day`);
  else console.log(`  ❌ ${JSON.stringify(res)}`);
} else {
  console.log(`  [DRY] Would PATCH ${budgetRn} amount_micros -> 30000000`);
}

// ============ STEP 2: PHRASE mirror of every EXACT in T1 v2 ============
console.log('\n=== STEP 2: PHRASE mirror of EXACT keywords in T1 v2 ===');
const kwQ=await q(`SELECT ad_group.id, ad_group.name, ad_group_criterion.keyword.text, ad_group_criterion.keyword.match_type FROM ad_group_criterion WHERE campaign.name = 'T1 v2 — City Exact' AND ad_group_criterion.type = 'KEYWORD' AND ad_group_criterion.status = 'ENABLED'`);
const byAg={};
for(const r of kwQ.results||[]){
  const ag=r.adGroup.id, k=r.adGroupCriterion.keyword;
  if(!byAg[ag]) byAg[ag]={ name: r.adGroup.name, exact: new Set(), phrase: new Set() };
  if(k.matchType==='EXACT') byAg[ag].exact.add(k.text);
  if(k.matchType==='PHRASE') byAg[ag].phrase.add(k.text);
}

let totalPlan=0, totalSkipped=0;
const allOps=[];
for(const [agId, d] of Object.entries(byAg)){
  for(const text of d.exact){
    if(d.phrase.has(text)){ totalSkipped++; continue; }
    allOps.push({
      _agName: d.name, _text: text, _agId: agId,
      create: {
        adGroup: `customers/${cust}/adGroups/${agId}`,
        status: 'ENABLED',
        cpcBidMicros: BID_MICROS,
        keyword: { text, matchType: 'PHRASE' }
      }
    });
    totalPlan++;
  }
}
console.log(`  Plan: create ${totalPlan} PHRASE keywords across ${Object.keys(byAg).length} ad groups (skip ${totalSkipped} already-existing)`);

if(!APPLY){
  console.log(`  [DRY] Sample of first 5 ops:`);
  for(const op of allOps.slice(0,5)) console.log(`    ${op._agName}: PHRASE "${op._text}" @ $${(BID_MICROS/1e6).toFixed(2)}`);
} else {
  // Mutate per ad group to keep batches reasonable
  const groups={};
  for(const op of allOps){ if(!groups[op._agId]) groups[op._agId]=[]; groups[op._agId].push(op); }
  let created=0, failed=0;
  for(const [agId, ops] of Object.entries(groups)){
    const cleaned = ops.map(o => ({ create: o.create }));
    const res = await mutate('adGroupCriteria', cleaned);
    if(res.results){ created += res.results.length; console.log(`  ✅ ${ops[0]._agName}: +${res.results.length} PHRASE keywords`); }
    else { failed += ops.length; console.log(`  ❌ ${ops[0]._agName}: ${JSON.stringify(res).slice(0,400)}`); }
  }
  console.log(`\n  TOTAL: created=${created} failed=${failed}`);
}

console.log('\nDone.');
