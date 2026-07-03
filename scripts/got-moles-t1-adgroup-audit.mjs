// T1 ad group + campaign config audit (pre-restructure 2026-05-15).
import fs from 'node:fs';
import path from 'node:path';

const env={};
for(const line of fs.readFileSync(path.resolve('.env'),'utf8').split(/\r?\n/)){
  const m=line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);if(!m)continue;
  let v=m[2].trim();if((v.startsWith('"')&&v.endsWith('"'))||(v.startsWith("'")&&v.endsWith("'")))v=v.slice(1,-1);
  env[m[1]]=v;
}

const V='v23';
const CUST='1665761172';
const MCC=env.GOOGLE_ADS_LOGIN_CUSTOMER_ID;
const T1='23815936218';

const tk=await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:env.GOOGLE_ADS_CLIENT_ID,client_secret:env.GOOGLE_ADS_CLIENT_SECRET,refresh_token:env.GOOGLE_ADS_REFRESH_TOKEN,grant_type:'refresh_token'})});
const at=(await tk.json()).access_token;

async function gaql(query){
  const r=await fetch(`https://googleads.googleapis.com/${V}/customers/${CUST}/googleAds:search`,{
    method:'POST',
    headers:{'Authorization':`Bearer ${at}`,'developer-token':env.GOOGLE_ADS_DEVELOPER_TOKEN,'login-customer-id':MCC,'Content-Type':'application/json'},
    body:JSON.stringify({query}),
  });
  if(!r.ok){console.error('GAQL fail:',await r.text());return [];}
  const j=await r.json();return j.results||[];
}

const adGroups=await gaql(`
  SELECT ad_group.id, ad_group.name, ad_group.status, ad_group.cpc_bid_micros
  FROM ad_group WHERE campaign.id = ${T1}
`);
console.log('=== T1 Ad Groups ===');
adGroups.forEach(r=>{
  const s={2:'ENABLED',3:'PAUSED',4:'REMOVED'}[r.adGroup.status]||r.adGroup.status;
  console.log(`  [${s}] ${r.adGroup.name} (id=${r.adGroup.id}) cpc=$${((r.adGroup.cpcBidMicros||0)/1e6).toFixed(2)}`);
});

const ads=await gaql(`
  SELECT ad_group.id, ad_group_ad.ad.id, ad_group_ad.status, ad_group_ad.ad.type, ad_group_ad.ad.final_urls
  FROM ad_group_ad WHERE campaign.id = ${T1}
`);
console.log('\n=== T1 Ads ===');
ads.forEach(r=>{
  const s={2:'ENABLED',3:'PAUSED',4:'REMOVED'}[r.adGroupAd.status]||r.adGroupAd.status;
  console.log(`  AG ${r.adGroup.id} [${s}] ad ${r.adGroupAd.ad.id} type=${r.adGroupAd.ad.type} urls=${JSON.stringify(r.adGroupAd.ad.finalUrls||[])}`);
});

const camp=await gaql(`
  SELECT campaign.id, campaign.name, campaign.status, campaign_budget.amount_micros,
         campaign.bidding_strategy_type, campaign.network_settings.target_search_network,
         campaign.network_settings.target_partner_search_network,
         campaign.network_settings.target_content_network
  FROM campaign WHERE campaign.id = ${T1}
`);
console.log('\n=== T1 Campaign Config ===');
camp.forEach(r=>{
  const s={2:'ENABLED',3:'PAUSED',4:'REMOVED'}[r.campaign.status]||r.campaign.status;
  console.log(`  Name: ${r.campaign.name}`);
  console.log(`  Status: ${s}`);
  console.log(`  Budget: $${(r.campaignBudget.amountMicros/1e6).toFixed(2)}/day`);
  console.log(`  Bidding: ${r.campaign.biddingStrategyType}`);
  console.log(`  Search Network: ${r.campaign.networkSettings.targetSearchNetwork}`);
  console.log(`  Search Partners: ${r.campaign.networkSettings.targetPartnerSearchNetwork}`);
  console.log(`  Display: ${r.campaign.networkSettings.targetContentNetwork}`);
});

const locs=await gaql(`
  SELECT campaign_criterion.location.geo_target_constant, campaign_criterion.negative
  FROM campaign_criterion
  WHERE campaign.id = ${T1} AND campaign_criterion.type = 'LOCATION'
`);
console.log(`\n=== T1 Locations (${locs.length} criteria) ===`);
const inc=locs.filter(l=>!l.campaignCriterion.negative);
const exc=locs.filter(l=>l.campaignCriterion.negative);
console.log(`  Included: ${inc.length}`);
console.log(`  Excluded: ${exc.length}`);
if(inc.length<=10) inc.forEach(l=>console.log(`    + ${l.campaignCriterion.location.geoTargetConstant}`));
if(exc.length<=10) exc.forEach(l=>console.log(`    - ${l.campaignCriterion.location.geoTargetConstant}`));

const negs=await gaql(`
  SELECT campaign_criterion.keyword.text, campaign_criterion.keyword.match_type
  FROM campaign_criterion
  WHERE campaign.id = ${T1} AND campaign_criterion.negative = TRUE AND campaign_criterion.type = 'KEYWORD'
`);
console.log(`\n=== T1 Campaign-Level Negatives: ${negs.length} ===`);

const sched=await gaql(`
  SELECT campaign_criterion.ad_schedule.day_of_week, campaign_criterion.ad_schedule.start_hour,
         campaign_criterion.ad_schedule.end_hour, campaign_criterion.bid_modifier
  FROM campaign_criterion
  WHERE campaign.id = ${T1} AND campaign_criterion.type = 'AD_SCHEDULE'
`);
console.log(`\n=== T1 Ad Schedule: ${sched.length} entries ===`);
sched.forEach(r=>{
  const s=r.campaignCriterion.adSchedule;
  console.log(`  ${s.dayOfWeek} ${s.startHour}-${s.endHour}h bid×${r.campaignCriterion.bidModifier||1}`);
});

const dev=await gaql(`
  SELECT campaign_criterion.device.type, campaign_criterion.bid_modifier
  FROM campaign_criterion
  WHERE campaign.id = ${T1} AND campaign_criterion.type = 'DEVICE'
`);
console.log(`\n=== T1 Device Bid Adjustments: ${dev.length} ===`);
dev.forEach(r=>console.log(`  ${r.campaignCriterion.device.type} bid×${r.campaignCriterion.bidModifier||1}`));
