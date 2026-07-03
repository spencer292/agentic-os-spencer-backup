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

// QS per keyword, enabled campaigns, last 7d
console.log('=== KEYWORD QUALITY SCORE (LAST 7 DAYS, enabled campaigns) ===');
const kw=await q(`SELECT campaign.name, ad_group.name, ad_group_criterion.keyword.text, ad_group_criterion.keyword.match_type, ad_group_criterion.quality_info.quality_score, ad_group_criterion.quality_info.creative_quality_score, ad_group_criterion.quality_info.post_click_quality_score, ad_group_criterion.quality_info.search_predicted_ctr, metrics.impressions, metrics.clicks, metrics.cost_micros, metrics.conversions FROM keyword_view WHERE campaign.status = 'ENABLED' AND ad_group_criterion.status = 'ENABLED' AND segments.date DURING LAST_7_DAYS ORDER BY metrics.impressions DESC LIMIT 50`);
const r=kw.results||[];
if(!r.length){ console.log('  none'); }
console.log('QS | CTR | LP | KW match | Impr | Clk | Cost | Conv | Campaign / AdGroup / Keyword');
for(const x of r){
  const qi=x.adGroupCriterion.qualityInfo||{};
  const k=x.adGroupCriterion.keyword;
  console.log(`${String(qi.qualityScore||'-').padStart(2)} | ${(qi.searchPredictedCtr||'-').padEnd(13)} | ${(qi.postClickQualityScore||'-').padEnd(13)} | ${k.matchType.padEnd(6)} | impr=${String(x.metrics.impressions||0).padStart(4)} clk=${String(x.metrics.clicks||0).padStart(3)} $${((x.metrics.costMicros||0)/1e6).toFixed(2).padStart(6)} conv=${x.metrics.conversions||0}  ${x.campaign.name} / ${x.adGroup.name} / "${k.text}"`);
}

// QS distribution
console.log('\n=== QS DISTRIBUTION ===');
const qsCounts={};
for(const x of r){
  const q=x.adGroupCriterion.qualityInfo?.qualityScore;
  if(q==null) continue;
  qsCounts[q]=(qsCounts[q]||0)+1;
}
for(const [q,n] of Object.entries(qsCounts).sort()) console.log(`  QS ${q}: ${n} keywords`);

// Conversion actions firing
console.log('\n=== CONVERSION ACTIONS (LAST 7 DAYS) ===');
const ca=await q(`SELECT conversion_action.name, conversion_action.category, conversion_action.primary_for_goal, conversion_action.status, metrics.all_conversions, metrics.conversions FROM conversion_action WHERE metrics.all_conversions > 0`);
for(const x of ca.results||[]) console.log(`  ${(x.conversionAction.primaryForGoal?'PRIMARY':'SECONDARY').padEnd(9)} ${x.conversionAction.status.padEnd(8)} ${(x.conversionAction.category||'').padEnd(20)} all=${x.metrics.allConversions||0} conv=${x.metrics.conversions||0}  ${x.conversionAction.name}`);

// Search terms with clicks but no conv last 7d
console.log('\n=== TOP SEARCH TERMS LAST 7 DAYS (≥1 click) ===');
const st=await q(`SELECT campaign.name, ad_group.name, search_term_view.search_term, metrics.impressions, metrics.clicks, metrics.cost_micros, metrics.conversions FROM search_term_view WHERE campaign.status = 'ENABLED' AND segments.date DURING LAST_7_DAYS AND metrics.clicks > 0 ORDER BY metrics.clicks DESC LIMIT 30`);
for(const x of st.results||[]) console.log(`  impr=${String(x.metrics.impressions||0).padStart(3)} clk=${String(x.metrics.clicks||0).padStart(2)} $${((x.metrics.costMicros||0)/1e6).toFixed(2).padStart(6)} conv=${x.metrics.conversions||0}  [${x.campaign.name}/${x.adGroup.name}] "${x.searchTermView.searchTerm}"`);

// Ad strength summary
console.log('\n=== AD STRENGTH (ENABLED campaigns) ===');
const ads=await q(`SELECT campaign.name, ad_group.name, ad_group_ad.ad_strength, ad_group_ad.status FROM ad_group_ad WHERE campaign.status = 'ENABLED' AND ad_group_ad.status = 'ENABLED'`);
const strengthCounts={};
for(const x of ads.results||[]){
  const s=x.adGroupAd.adStrength||'UNKNOWN';
  strengthCounts[s]=(strengthCounts[s]||0)+1;
}
for(const [s,n] of Object.entries(strengthCounts).sort()) console.log(`  ${s}: ${n} ads`);
