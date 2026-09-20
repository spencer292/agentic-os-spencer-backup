import fs from 'node:fs';
import path from 'node:path';
const env={};
for(const line of fs.readFileSync(path.resolve('.env'),'utf8').split(/\r?\n/)){
  const m=line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);if(!m)continue;
  let v=m[2].trim();if((v.startsWith('"')&&v.endsWith('"'))||(v.startsWith("'")&&v.endsWith("'")))v=v.slice(1,-1);
  env[m[1]]=v;
}
const cust='1665761172', mcc='2845309762';
async function tok(){
  const r=await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:env.GOOGLE_ADS_CLIENT_ID,client_secret:env.GOOGLE_ADS_CLIENT_SECRET,refresh_token:env.GOOGLE_ADS_REFRESH_TOKEN,grant_type:'refresh_token'})});
  return (await r.json()).access_token;
}
async function q(query){
  const t=await tok();
  const r=await fetch(`https://googleads.googleapis.com/v23/customers/${cust}/googleAds:search`,{method:'POST',headers:{Authorization:`Bearer ${t}`,'developer-token':env.GOOGLE_ADS_DEVELOPER_TOKEN,'login-customer-id':mcc,'Content-Type':'application/json'},body:JSON.stringify({query})});
  return r.json();
}

// Ad groups in T1 v2 with status + bid + impr last 7d
console.log('=== T1 v2 AD GROUPS — status + bid + last 7d impressions ===');
const ag=await q(`SELECT campaign.name, ad_group.name, ad_group.id, ad_group.status, ad_group.cpc_bid_micros, metrics.impressions, metrics.clicks, metrics.cost_micros, metrics.search_impression_share FROM ad_group WHERE campaign.name = 'T1 v2 — City Exact' AND segments.date DURING LAST_7_DAYS ORDER BY ad_group.name`);
const seen=new Set();
for(const r of ag.results||[]){
  const ag1=r.adGroup, m=r.metrics;
  const key=ag1.id;
  if(seen.has(key)) continue;
  seen.add(key);
  console.log(`  ${ag1.status.padEnd(8)} bid=$${((ag1.cpcBidMicros||0)/1e6).toFixed(2).padStart(5)}  impr=${String(m.impressions||0).padStart(3)} clk=${String(m.clicks||0).padStart(2)} $${((m.costMicros||0)/1e6).toFixed(2).padStart(5)} IS=${m.searchImpressionShare?(m.searchImpressionShare*100).toFixed(0)+'%':'-'}  ${ag1.name}`);
}

// Impression share lost to budget / rank, campaign level last 7d
console.log('\n=== IMPRESSION SHARE LOSS (campaign level, 7d) ===');
const isq=await q(`SELECT campaign.name, metrics.search_impression_share, metrics.search_budget_lost_impression_share, metrics.search_rank_lost_impression_share, metrics.search_top_impression_share, metrics.search_absolute_top_impression_share FROM campaign WHERE campaign.status = 'ENABLED' AND segments.date DURING LAST_7_DAYS`);
for(const r of isq.results||[]){
  const m=r.metrics;
  const pct=v=>v==null?'-':(v*100).toFixed(0)+'%';
  console.log(`  ${r.campaign.name}`);
  console.log(`    Search IS: ${pct(m.searchImpressionShare)}   Top IS: ${pct(m.searchTopImpressionShare)}   AbsTop IS: ${pct(m.searchAbsoluteTopImpressionShare)}`);
  console.log(`    Lost to BUDGET: ${pct(m.searchBudgetLostImpressionShare)}   Lost to RANK: ${pct(m.searchRankLostImpressionShare)}`);
}

// Geo targets on T1 v2
console.log('\n=== T1 v2 GEO TARGETS ===');
const geo=await q(`SELECT campaign.name, campaign_criterion.location.geo_target_constant, campaign_criterion.negative, campaign_criterion.bid_modifier FROM campaign_criterion WHERE campaign.name = 'T1 v2 — City Exact' AND campaign_criterion.type = 'LOCATION'`);
const geoIds=(geo.results||[]).map(r => ({id:r.campaignCriterion.location.geoTargetConstant, neg:r.campaignCriterion.negative}));
console.log(`  ${geoIds.length} location criteria attached`);
// Resolve geo names
if(geoIds.length){
  const ids=geoIds.map(g => g.id.split('/').pop()).slice(0,30);
  const names=await q(`SELECT geo_target_constant.id, geo_target_constant.name, geo_target_constant.country_code, geo_target_constant.target_type, geo_target_constant.canonical_name FROM geo_target_constant WHERE geo_target_constant.resource_name IN (${geoIds.slice(0,30).map(g=>`'${g.id}'`).join(',')})`);
  for(const r of names.results||[]){
    const g=geoIds.find(x => x.id.endsWith('/'+r.geoTargetConstant.id));
    console.log(`  ${g?.neg?'NEG':'POS'}  ${r.geoTargetConstant.canonicalName} (${r.geoTargetConstant.targetType})`);
  }
}

// Negatives shared sets on T1 v2
console.log('\n=== NEGATIVE LISTS (shared sets) ON T1 v2 ===');
const shared=await q(`SELECT campaign.name, campaign_shared_set.shared_set, shared_set.name, shared_set.type FROM campaign_shared_set WHERE campaign.name = 'T1 v2 — City Exact' AND campaign_shared_set.status = 'ENABLED'`);
for(const r of shared.results||[]) console.log(`  ${r.sharedSet.type.padEnd(20)} ${r.sharedSet.name}`);
