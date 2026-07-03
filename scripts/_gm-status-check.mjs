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

const today=await q(`SELECT campaign.id, campaign.name, campaign.status, campaign.serving_status, campaign_budget.amount_micros, metrics.impressions, metrics.clicks, metrics.cost_micros, metrics.conversions FROM campaign WHERE segments.date DURING TODAY AND campaign.status != 'REMOVED'`);
console.log('=== TODAY ===');
for(const r of today.results||[]) console.log(`  ${r.campaign.status.padEnd(8)} ${(r.campaign.servingStatus||'').padEnd(10)} $${((r.campaignBudget?.amountMicros||0)/1e6).toFixed(0)}/d  impr=${r.metrics.impressions||0} clk=${r.metrics.clicks||0} cost=$${((r.metrics.costMicros||0)/1e6).toFixed(2)} conv=${r.metrics.conversions||0}  ${r.campaign.name}`);

const yest=await q(`SELECT campaign.name, metrics.impressions, metrics.clicks, metrics.cost_micros, metrics.conversions FROM campaign WHERE segments.date DURING YESTERDAY AND campaign.status != 'REMOVED'`);
console.log('\n=== YESTERDAY ===');
for(const r of yest.results||[]) console.log(`  impr=${r.metrics.impressions||0} clk=${r.metrics.clicks||0} cost=$${((r.metrics.costMicros||0)/1e6).toFixed(2)} conv=${r.metrics.conversions||0}  ${r.campaign.name}`);

const last7=await q(`SELECT campaign.name, metrics.impressions, metrics.clicks, metrics.cost_micros, metrics.conversions FROM campaign WHERE segments.date DURING LAST_7_DAYS AND campaign.status != 'REMOVED'`);
console.log('\n=== LAST 7 DAYS ===');
for(const r of last7.results||[]) console.log(`  impr=${r.metrics.impressions||0} clk=${r.metrics.clicks||0} cost=$${((r.metrics.costMicros||0)/1e6).toFixed(2)} conv=${r.metrics.conversions||0}  ${r.campaign.name}`);

// Issues: disapproved ads, limited ads, keywords w/ low QS
const adIssues=await q(`SELECT campaign.name, ad_group.name, ad_group_ad.policy_summary.approval_status, ad_group_ad.policy_summary.review_status, ad_group_ad.ad.id FROM ad_group_ad WHERE campaign.status = 'ENABLED' AND ad_group_ad.status = 'ENABLED' AND ad_group_ad.policy_summary.approval_status != 'APPROVED'`);
console.log('\n=== AD POLICY ISSUES ===');
const issues=adIssues.results||[];
if(!issues.length) console.log('  none');
for(const r of issues) console.log(`  [${r.campaign.name}/${r.adGroup.name}] ad ${r.adGroupAd.ad.id}: ${r.adGroupAd.policySummary.approvalStatus} / ${r.adGroupAd.policySummary.reviewStatus}`);
