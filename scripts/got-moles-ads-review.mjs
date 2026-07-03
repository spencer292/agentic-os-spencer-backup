// Got Moles Google Ads review — campaigns, ad groups, RSAs, keywords, negatives.
// Audits against memory rules:
//  - feedback_got_moles_posture_a_silent_mechanism (no body-gripping/scissor/harpoon/spike/kill/lethal)
//  - reference_google_ads_mole_policy_RAG (LSA wildlife purge, eligible-limited, safe substitutions)
//  - reference_mole_negative_keywords_medical (~120 keyword medical-cluster negatives mandatory)
import fs from 'node:fs';
import path from 'node:path';

const env={};
for(const line of fs.readFileSync(path.resolve('.env'),'utf8').split(/\r?\n/)){
  const m=line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);if(!m)continue;
  let v=m[2].trim();if((v.startsWith('"')&&v.endsWith('"'))||(v.startsWith("'")&&v.endsWith("'")))v=v.slice(1,-1);
  env[m[1]]=v;
}

const VERSION='v23';
const targetId='1665761172';
const mccId=env.GOOGLE_ADS_LOGIN_CUSTOMER_ID;

// 1. Mint token
const tk=await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:env.GOOGLE_ADS_CLIENT_ID,client_secret:env.GOOGLE_ADS_CLIENT_SECRET,refresh_token:env.GOOGLE_ADS_REFRESH_TOKEN,grant_type:'refresh_token'})});
const tkj=await tk.json();
const accessToken=tkj.access_token;

async function gaql(query){
  const r=await fetch(`https://googleads.googleapis.com/${VERSION}/customers/${targetId}/googleAds:search`,{
    method:'POST',
    headers:{'Authorization':`Bearer ${accessToken}`,'developer-token':env.GOOGLE_ADS_DEVELOPER_TOKEN,'login-customer-id':mccId,'Content-Type':'application/json'},
    body:JSON.stringify({query}),
  });
  if(!r.ok){console.error('  GAQL fail:',await r.text());return [];}
  const j=await r.json();
  return j.results||[];
}

// === Banned-words audit (Posture A) ===
const BANNED=['body.grip','bodygrip','scissor','harpoon','spear','spike','kill','lethal','dispatch','exterminate','euthani','poison','strychnine','warfarin','crush','snap.trap'];
const BANNED_RX=new RegExp(BANNED.join('|'),'i');
const MEDICAL_TRIGGERS=['skin','dermatolog','cosmetic','remov.*mole','beauty','face','body.mole'];
const MEDICAL_RX=new RegExp(MEDICAL_TRIGGERS.join('|'),'i');

function flag(text){
  const f=[];
  if(BANNED_RX.test(text||''))f.push('⚠ MECHANISM');
  if(MEDICAL_RX.test(text||''))f.push('⚠ MEDICAL');
  return f.join(' ');
}

// === Pull all campaigns ===
console.log('═══ GOT MOLES (1665761172) AD REVIEW — '+new Date().toISOString().slice(0,10)+' ═══\n');

const camps=await gaql(`
  SELECT campaign.id, campaign.name, campaign.status, campaign.advertising_channel_type,
         campaign.serving_status, campaign_budget.amount_micros,
         metrics.cost_micros, metrics.impressions, metrics.clicks, metrics.conversions
  FROM campaign
  WHERE campaign.status != 'REMOVED'
  ORDER BY campaign.name
`);

console.log(`Active+paused campaigns: ${camps.length}\n`);
for(const c of camps){
  const cm=c.campaign;
  const m=c.metrics||{};
  const cost=((parseInt(m.costMicros||0))/1e6).toFixed(2);
  console.log(`## ${cm.name} (${cm.id}) — ${cm.status} / ${cm.advertisingChannelType} / serving=${cm.servingStatus}`);
  console.log(`   Budget £${(parseInt(c.campaignBudget?.amountMicros||0)/1e6).toFixed(2)}/day | Lifetime: £${cost} cost / ${m.impressions||0} imp / ${m.clicks||0} clicks / ${m.conversions||0} conv`);
}

// === Ad groups ===
console.log('\n═══ AD GROUPS ═══');
const adGroups=await gaql(`
  SELECT ad_group.id, ad_group.name, ad_group.status, ad_group.cpc_bid_micros,
         campaign.id, campaign.name, metrics.cost_micros, metrics.impressions, metrics.clicks
  FROM ad_group
  WHERE ad_group.status != 'REMOVED' AND campaign.status != 'REMOVED'
  ORDER BY campaign.name, ad_group.name
`);
const byCampaign={};
for(const ag of adGroups){const k=ag.campaign.name;(byCampaign[k]=byCampaign[k]||[]).push(ag);}
for(const [c,ags] of Object.entries(byCampaign)){
  console.log(`\n${c}:`);
  for(const ag of ags){
    const m=ag.metrics||{};
    console.log(`  - ${ag.adGroup.name} (${ag.adGroup.id}) | ${ag.adGroup.status} | bid £${((parseInt(ag.adGroup.cpcBidMicros||0))/1e6).toFixed(2)} | ${m.impressions||0} imp / ${m.clicks||0} clicks`);
  }
}

// === RSA review (headlines + descriptions) ===
console.log('\n═══ RSA HEADLINES & DESCRIPTIONS ═══');
const ads=await gaql(`
  SELECT ad_group_ad.ad.id, ad_group_ad.ad.responsive_search_ad.headlines,
         ad_group_ad.ad.responsive_search_ad.descriptions, ad_group_ad.ad.final_urls,
         ad_group_ad.status, ad_group_ad.policy_summary.approval_status,
         ad_group_ad.policy_summary.policy_topic_entries,
         ad_group.name, campaign.name
  FROM ad_group_ad
  WHERE ad_group_ad.status != 'REMOVED' AND ad_group_ad.ad.type = 'RESPONSIVE_SEARCH_AD'
`);
let banFlags=0,medFlags=0,policyFlags=0;
for(const a of ads){
  const ad=a.adGroupAd;
  const heads=(ad.ad.responsiveSearchAd?.headlines||[]).map(h=>h.text);
  const descs=(ad.ad.responsiveSearchAd?.descriptions||[]).map(d=>d.text);
  const policy=ad.policySummary?.approvalStatus||'?';
  console.log(`\n${a.campaign.name} → ${a.adGroup.name} | RSA approval=${policy}`);
  for(const h of heads){const f=flag(h);if(f){banFlags+=f.includes('MECHANISM')?1:0;medFlags+=f.includes('MEDICAL')?1:0;}console.log(`  H ${f.padEnd(20)}| ${h}`);}
  for(const d of descs){const f=flag(d);if(f){banFlags+=f.includes('MECHANISM')?1:0;medFlags+=f.includes('MEDICAL')?1:0;}console.log(`  D ${f.padEnd(20)}| ${d}`);}
  if(policy!=='APPROVED'){policyFlags++;
    const topics=(ad.policySummary?.policyTopicEntries||[]).map(t=>`${t.topic}(${t.type})`).join(', ');
    console.log(`  ⚠ POLICY topics: ${topics||'(none listed)'}`);
  }
}

// === Keywords ===
console.log('\n═══ KEYWORDS (positive) ═══');
const kws=await gaql(`
  SELECT ad_group_criterion.criterion_id, ad_group_criterion.keyword.text, ad_group_criterion.keyword.match_type,
         ad_group_criterion.status, ad_group_criterion.approval_status,
         ad_group.name, campaign.name, metrics.impressions, metrics.clicks, metrics.cost_micros
  FROM keyword_view
  WHERE ad_group_criterion.status != 'REMOVED' AND ad_group_criterion.negative = false
`);
let kwFlagged=0;
for(const k of kws){
  const txt=k.adGroupCriterion.keyword.text;
  const f=flag(txt);
  if(f)kwFlagged++;
  if(f||(parseInt(k.metrics?.impressions||0)>0)){
    console.log(`  ${k.campaign.name.slice(0,30).padEnd(30)} | ${k.adGroupCriterion.keyword.matchType.padEnd(8)} | ${(f||'').padEnd(20)} | ${txt.padEnd(40)} | imp=${k.metrics?.impressions||0} clk=${k.metrics?.clicks||0}`);
  }
}

// === Negative keywords ===
console.log('\n═══ NEGATIVE KEYWORDS (account + campaign + ad group) ═══');
const accountNeg=await gaql(`
  SELECT customer_negative_criterion.criterion_id, customer_negative_criterion.keyword.text, customer_negative_criterion.keyword.match_type
  FROM customer_negative_criterion
`);
console.log(`Account-level negatives: ${accountNeg.length}`);

const campNeg=await gaql(`
  SELECT campaign_criterion.keyword.text, campaign_criterion.keyword.match_type, campaign.name
  FROM campaign_criterion
  WHERE campaign_criterion.negative = true AND campaign_criterion.type = 'KEYWORD'
`);
const negsByCamp={};
for(const n of campNeg){const k=n.campaign.name;(negsByCamp[k]=negsByCamp[k]||0)+1;negsByCamp[k]=(negsByCamp[k]||0)+1;}
console.log(`Campaign-level negatives total: ${campNeg.length}`);

// Medical-cluster check on account-level negatives
const medicalNegFound=accountNeg.filter(n=>MEDICAL_RX.test(n.customerNegativeCriterion?.keyword?.text||''));
const dermClusters=['skin','dermatolog','cosmetic','beauty','remov.*mole','face mole','body mole'];
console.log(`Medical-cluster negatives detected at account level: ${medicalNegFound.length}`);

// === FINAL SUMMARY ===
console.log('\n═══ AUDIT SUMMARY ═══');
console.log(`Mechanism-word flags in ad copy: ${banFlags} (Posture A says zero allowed)`);
console.log(`Medical-cluster flags in ad copy: ${medFlags}`);
console.log(`RSAs not Approved: ${policyFlags}`);
console.log(`Keyword flags: ${kwFlagged}`);
console.log(`Account-level negatives: ${accountNeg.length} (memory says ~120 needed for medical cluster — gap=${Math.max(0,120-accountNeg.length)})`);

fs.writeFileSync('scripts/_got-moles-ads-snapshot.json',JSON.stringify({campaigns:camps,adGroups,ads,keywords:kws,accountNeg,campNeg},null,2));
console.log('\nFull snapshot → scripts/_got-moles-ads-snapshot.json');
