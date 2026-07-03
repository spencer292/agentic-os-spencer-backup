// Got Moles audience + remarketing readiness audit.
import fs from 'node:fs';import path from 'node:path';
const env={};for(const line of fs.readFileSync(path.resolve('.env'),'utf8').split(/\r?\n/)){const m=line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);if(!m)continue;let v=m[2].trim();if((v.startsWith('"')&&v.endsWith('"'))||(v.startsWith("'")&&v.endsWith("'")))v=v.slice(1,-1);env[m[1]]=v;}
const V='v23',CUST='1665761172',MCC=env.GOOGLE_ADS_LOGIN_CUSTOMER_ID;
const tk=await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:env.GOOGLE_ADS_CLIENT_ID,client_secret:env.GOOGLE_ADS_CLIENT_SECRET,refresh_token:env.GOOGLE_ADS_REFRESH_TOKEN,grant_type:'refresh_token'})});
const at=(await tk.json()).access_token;
async function gaql(q){
  const r=await fetch(`https://googleads.googleapis.com/${V}/customers/${CUST}/googleAds:search`,{method:'POST',headers:{'Authorization':`Bearer ${at}`,'developer-token':env.GOOGLE_ADS_DEVELOPER_TOKEN,'login-customer-id':MCC,'Content-Type':'application/json'},body:JSON.stringify({query:q})});
  const j=await r.json();if(!r.ok){console.error('FAIL:',JSON.stringify(j,null,2));return [];}
  return j.results||[];
}

// 1. User lists (Customer Match + remarketing lists)
console.log('=== 1. User lists (audiences) on this account ===');
const lists=await gaql(`SELECT user_list.id, user_list.name, user_list.type, user_list.size_for_search, user_list.size_for_display, user_list.size_range_for_search, user_list.size_range_for_display, user_list.eligible_for_search, user_list.eligible_for_display, user_list.access_reason, user_list.membership_status FROM user_list`);
if(!lists.length){console.log('  (none — no audiences exist on the account yet)');}
lists.forEach(r=>{
  const u=r.userList;
  console.log(`  [${u.type}] ${u.name} (id=${u.id})`);
  console.log(`    search size ${u.sizeForSearch||'?'} (${u.sizeRangeForSearch||'?'}) display ${u.sizeForDisplay||'?'} (${u.sizeRangeForDisplay||'?'})`);
  console.log(`    eligible search=${u.eligibleForSearch} display=${u.eligibleForDisplay} status=${u.membershipStatus}`);
});

// 2. Conversion actions (remarketing tag presence check via conversion source)
console.log('\n=== 2. Conversion actions + data sources ===');
const conv=await gaql(`SELECT conversion_action.id, conversion_action.name, conversion_action.type, conversion_action.status, conversion_action.primary_for_goal, conversion_action.category FROM conversion_action WHERE conversion_action.status != 'REMOVED'`);
conv.forEach(r=>{
  const c=r.conversionAction;
  console.log(`  [${c.status}] ${c.name} type=${c.type} cat=${c.category} primary=${c.primaryForGoal}`);
});

// 3. Linked accounts (GA4, Merchant, YouTube)
console.log('\n=== 3. Linked accounts ===');
const link=await gaql(`SELECT customer_client_link.client_customer, customer_client_link.status FROM customer_client_link`);
link.forEach(r=>console.log(`  client_link ${JSON.stringify(r.customerClientLink)}`));

// 4. Account-level data-driven attribution + audience capability check
console.log('\n=== 4. Account audience-readiness ===');
const cust=await gaql(`SELECT customer.id, customer.descriptive_name, customer.conversion_tracking_setting.accepted_customer_data_terms, customer.conversion_tracking_setting.enhanced_conversions_for_leads_enabled, customer.conversion_tracking_setting.google_ads_conversion_customer FROM customer LIMIT 1`);
cust.forEach(r=>{
  const c=r.customer;
  console.log(`  Customer Data Terms accepted: ${c.conversionTrackingSetting?.acceptedCustomerDataTerms}`);
  console.log(`  Enhanced Conversions for Leads: ${c.conversionTrackingSetting?.enhancedConversionsForLeadsEnabled}`);
  console.log(`  Conversion tracking customer: ${c.conversionTrackingSetting?.googleAdsConversionCustomer}`);
});

// 5. Campaign-level audience attachments
console.log('\n=== 5. Audiences attached to campaigns/ad groups ===');
const audCamp=await gaql(`SELECT campaign.name, campaign_criterion.user_list.user_list, campaign_criterion.type FROM campaign_criterion WHERE campaign_criterion.type='USER_LIST' AND campaign.status != 'REMOVED'`);
if(!audCamp.length)console.log('  (none — no audiences attached at campaign level)');
audCamp.forEach(r=>console.log(`  ${r.campaign.name}: ${r.campaignCriterion.userList.userList}`));

const audAg=await gaql(`SELECT campaign.name, ad_group.name, ad_group_criterion.user_list.user_list, ad_group_criterion.type FROM ad_group_criterion WHERE ad_group_criterion.type='USER_LIST' AND campaign.status != 'REMOVED' AND ad_group.status != 'REMOVED'`);
if(!audAg.length)console.log('  (none at ad-group level either)');
audAg.forEach(r=>console.log(`  ${r.campaign.name} / ${r.adGroup.name}: ${r.adGroupCriterion.userList.userList}`));

// 6. Remarketing tag (Google tag) presence — via account-level
console.log('\n=== 6. Conversion sources / tag presence ===');
// Custom audiences don't have a direct API field for tag firing, but we can check audience_status of "all visitors" auto-list which Google creates by default
