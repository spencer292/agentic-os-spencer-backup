// Full inventory of Got Moles Google Ads as a single MD report.
import fs from 'node:fs';
import path from 'node:path';
const env={};for(const l of fs.readFileSync('.env','utf8').split(/\r?\n/)){const m=l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);if(!m)continue;let v=m[2].trim();if((v.startsWith('"')&&v.endsWith('"'))||(v.startsWith("'")&&v.endsWith("'")))v=v.slice(1,-1);env[m[1]]=v;}
const targetId='1665761172';
const mccId=env.GOOGLE_ADS_LOGIN_CUSTOMER_ID;
const VERSION='v23';

const tk=await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:env.GOOGLE_ADS_CLIENT_ID,client_secret:env.GOOGLE_ADS_CLIENT_SECRET,refresh_token:env.GOOGLE_ADS_REFRESH_TOKEN,grant_type:'refresh_token'})});
const at=(await tk.json()).access_token;

async function gaql(query){
  const r=await fetch(`https://googleads.googleapis.com/${VERSION}/customers/${targetId}/googleAds:search`,{
    method:'POST',
    headers:{'Authorization':'Bearer '+at,'developer-token':env.GOOGLE_ADS_DEVELOPER_TOKEN,'login-customer-id':mccId,'Content-Type':'application/json'},
    body:JSON.stringify({query}),
  });
  if(!r.ok){console.error('GAQL fail:',await r.text());return [];}
  return (await r.json()).results||[];
}

const today = new Date().toISOString().slice(0,10);
let md = `# Got Moles — Full Google Ads Inventory\n\n**Account:** \`1665761172\` (under ATP MCC \`2845309762\`)\n**Snapshot date:** ${today}\n**Currency:** USD\n**Time zone:** America/Los_Angeles\n\n---\n\n## Table of contents\n\n1. [Account-level conversion actions](#account-level-conversion-actions)\n2. [Campaigns](#campaigns)\n3. [Ad groups + bids](#ad-groups--bids)\n4. [Live ads (RSAs)](#live-ads-rsas)\n5. [Positive keywords](#positive-keywords)\n6. [Negative keywords](#negative-keywords)\n7. [Assets (sitelinks, callouts, structured snippets, calls)](#assets)\n\n---\n\n`;

// === Conversion actions ===
const ca = await gaql(`SELECT conversion_action.id, conversion_action.name, conversion_action.type, conversion_action.category, conversion_action.status, conversion_action.primary_for_goal FROM conversion_action`);
md += `## Account-level conversion actions\n\n| Name | ID | Type | Category | Status | Primary |\n|---|---|---|---|---|---|\n`;
for (const r of ca) {
  const c = r.conversionAction;
  md += `| ${c.name||''} | \`${c.id}\` | ${c.type||''} | ${c.category||''} | ${c.status||''} | ${c.primaryForGoal?'✅':''} |\n`;
}
md += `\n`;

// === Campaigns ===
const camps = await gaql(`SELECT campaign.id, campaign.name, campaign.status, campaign.advertising_channel_type, campaign.bidding_strategy_type, campaign.campaign_budget FROM campaign WHERE campaign.status IN ('ENABLED','PAUSED')`);
const budgets = await gaql(`SELECT campaign_budget.resource_name, campaign_budget.amount_micros FROM campaign_budget`);
const budgetMap = {};
for (const b of budgets) budgetMap[b.campaignBudget.resourceName] = Number(b.campaignBudget.amountMicros||0)/1e6;
md += `## Campaigns\n\n| Name | ID | Status | Channel | Bid strategy | Daily budget |\n|---|---|---|---|---|---:|\n`;
const enabledCampIds = new Set();
for (const r of camps) {
  const c = r.campaign;
  const budget = (budgetMap[c.campaignBudget]||0).toFixed(2);
  if (c.status === 'ENABLED') enabledCampIds.add(c.id);
  md += `| ${c.name||''} | \`${c.id}\` | ${c.status||''} | ${c.advertisingChannelType||''} | ${c.biddingStrategyType||''} | $${budget} |\n`;
}
md += `\n`;

// === Ad groups (only ENABLED campaigns) ===
const ags = await gaql(`SELECT campaign.id, campaign.name, ad_group.id, ad_group.name, ad_group.status, ad_group.cpc_bid_micros FROM ad_group WHERE ad_group.status = 'ENABLED' AND campaign.status = 'ENABLED'`);
md += `## Ad groups + bids\n\n_Only ENABLED ad groups in ENABLED campaigns are listed._\n\n| Campaign | Ad group | ID | Max CPC |\n|---|---|---|---:|\n`;
const enabledAgs = [];
for (const r of ags) {
  const cpc = (Number(r.adGroup.cpcBidMicros||0)/1e6).toFixed(2);
  md += `| ${r.campaign.name} | ${r.adGroup.name} | \`${r.adGroup.id}\` | $${cpc} |\n`;
  enabledAgs.push({ campId: r.campaign.id, campName: r.campaign.name, agId: r.adGroup.id, agName: r.adGroup.name });
}
md += `\n`;

// === RSAs (only ENABLED ads in ENABLED ad groups in ENABLED campaigns) ===
const rsas = await gaql(`
  SELECT campaign.name, ad_group.name, ad_group.id, ad_group_ad.ad.id, ad_group_ad.status, ad_group_ad.policy_summary.approval_status,
    ad_group_ad.ad.responsive_search_ad.headlines, ad_group_ad.ad.responsive_search_ad.descriptions,
    ad_group_ad.ad.responsive_search_ad.path1, ad_group_ad.ad.responsive_search_ad.path2,
    ad_group_ad.ad.final_urls
  FROM ad_group_ad
  WHERE ad_group_ad.ad.type = 'RESPONSIVE_SEARCH_AD'
    AND ad_group_ad.status = 'ENABLED'
    AND ad_group.status = 'ENABLED'
    AND campaign.status = 'ENABLED'
`);
md += `## Live ads (RSAs)\n\n_Only ENABLED ads in ENABLED ad groups + ENABLED campaigns. Policy review status shown per ad._\n\n`;
for (const r of rsas) {
  const ad = r.adGroupAd.ad;
  const rsa = ad.responsiveSearchAd||{};
  md += `### ${r.campaign.name} → ${r.adGroup.name}\n\n`;
  md += `**Ad ID:** \`${ad.id}\` | **Status:** ${r.adGroupAd.status} | **Approval:** ${r.adGroupAd.policySummary?.approvalStatus||'(unknown)'}\n\n`;
  md += `**Final URL:** ${(ad.finalUrls||[]).join(', ')||'(none)'} | **Display path:** /${rsa.path1||''}/${rsa.path2||''}\n\n`;
  md += `**Headlines (${(rsa.headlines||[]).length}/15):**\n\n`;
  for (const h of (rsa.headlines||[])) md += `- ${h.text}\n`;
  md += `\n**Descriptions (${(rsa.descriptions||[]).length}/4):**\n\n`;
  for (const d of (rsa.descriptions||[])) md += `- ${d.text}\n`;
  md += `\n`;
}

// === Positive keywords (with per-keyword finalUrls) ===
const posKws = await gaql(`
  SELECT campaign.name, ad_group.name, ad_group.id,
    ad_group_criterion.criterion_id, ad_group_criterion.keyword.text, ad_group_criterion.keyword.match_type,
    ad_group_criterion.status, ad_group_criterion.final_urls, ad_group_criterion.cpc_bid_micros
  FROM ad_group_criterion
  WHERE ad_group_criterion.type = 'KEYWORD'
    AND ad_group_criterion.negative = FALSE
    AND ad_group_criterion.status != 'REMOVED'
    AND ad_group.status = 'ENABLED'
    AND campaign.status = 'ENABLED'
`);

const byCampPos = {};
for (const r of posKws) {
  const k = r.campaign.name;
  byCampPos[k] = byCampPos[k] || [];
  byCampPos[k].push(r);
}

md += `## Positive keywords\n\n`;
for (const [campName, list] of Object.entries(byCampPos)) {
  md += `### ${campName} — ${list.length} positive keywords\n\n`;
  md += `| Match | Keyword | Per-KW Final URL override | Bid |\n|---|---|---|---:|\n`;
  for (const r of list.sort((a,b)=>{
    const ma=a.adGroupCriterion.keyword.matchType, mb=b.adGroupCriterion.keyword.matchType;
    if (ma!==mb) return ma.localeCompare(mb);
    return a.adGroupCriterion.keyword.text.localeCompare(b.adGroupCriterion.keyword.text);
  })) {
    const ac=r.adGroupCriterion;
    const url=(ac.finalUrls||[]).join(', ')||'_(uses ad default)_';
    const bid=ac.cpcBidMicros?'$'+(Number(ac.cpcBidMicros)/1e6).toFixed(2):'_(ag default)_';
    md += `| ${ac.keyword.matchType} | ${ac.keyword.text} | ${url} | ${bid} |\n`;
  }
  md += `\n`;
}

// === Negative keywords ===
const negKws = await gaql(`
  SELECT campaign.name, ad_group.name,
    ad_group_criterion.keyword.text, ad_group_criterion.keyword.match_type
  FROM ad_group_criterion
  WHERE ad_group_criterion.type = 'KEYWORD'
    AND ad_group_criterion.negative = TRUE
    AND ad_group_criterion.status != 'REMOVED'
    AND ad_group.status = 'ENABLED'
    AND campaign.status = 'ENABLED'
`);
const campNegs = await gaql(`
  SELECT campaign.name, campaign_criterion.keyword.text, campaign_criterion.keyword.match_type
  FROM campaign_criterion
  WHERE campaign_criterion.type = 'KEYWORD'
    AND campaign_criterion.negative = TRUE
    AND campaign.status = 'ENABLED'
`);

md += `## Negative keywords\n\n`;
md += `### Campaign-level negatives (apply to entire campaign)\n\n`;
const byCampNeg = {};
for (const r of campNegs) {
  const k = r.campaign.name;
  byCampNeg[k] = byCampNeg[k] || [];
  byCampNeg[k].push(r);
}
for (const [campName, list] of Object.entries(byCampNeg)) {
  md += `**${campName} — ${list.length} negatives:**\n\n`;
  for (const r of list.sort((a,b)=>a.campaignCriterion.keyword.text.localeCompare(b.campaignCriterion.keyword.text))) {
    md += `- \`${r.campaignCriterion.keyword.matchType}\` ${r.campaignCriterion.keyword.text}\n`;
  }
  md += `\n`;
}

if (negKws.length) {
  md += `### Ad-group-level negatives\n\n`;
  const byAg = {};
  for (const r of negKws) {
    const k = `${r.campaign.name} → ${r.adGroup.name}`;
    byAg[k] = byAg[k] || [];
    byAg[k].push(r);
  }
  for (const [agKey, list] of Object.entries(byAg)) {
    md += `**${agKey} — ${list.length} negatives:**\n\n`;
    for (const r of list) md += `- \`${r.adGroupCriterion.keyword.matchType}\` ${r.adGroupCriterion.keyword.text}\n`;
    md += `\n`;
  }
}

// === Assets (sitelinks, callouts, structured snippets, call) — top level ===
const assets = await gaql(`
  SELECT campaign.name, campaign.status, asset.id, asset.type, asset.name,
    asset.sitelink_asset.link_text, asset.sitelink_asset.description1, asset.sitelink_asset.description2,
    asset.callout_asset.callout_text, asset.structured_snippet_asset.header, asset.structured_snippet_asset.values,
    asset.call_asset.phone_number, asset.call_asset.country_code,
    campaign_asset.field_type
  FROM campaign_asset
  WHERE campaign.status = 'ENABLED'
`);
md += `## Assets\n\n_Sitelinks, callouts, structured snippets, and call assets attached to campaigns._\n\n`;
const assetByCamp = {};
for (const r of assets) {
  const k = r.campaign.name;
  assetByCamp[k] = assetByCamp[k] || { sitelinks: [], callouts: [], snippets: [], calls: [], other: [] };
  const a = r.asset;
  const ft = r.campaignAsset?.fieldType;
  if (ft === 'SITELINK' || a.sitelinkAsset) assetByCamp[k].sitelinks.push(a.sitelinkAsset);
  else if (ft === 'CALLOUT' || a.calloutAsset) assetByCamp[k].callouts.push(a.calloutAsset);
  else if (ft === 'STRUCTURED_SNIPPET' || a.structuredSnippetAsset) assetByCamp[k].snippets.push(a.structuredSnippetAsset);
  else if (ft === 'CALL' || a.callAsset) assetByCamp[k].calls.push(a.callAsset);
  else assetByCamp[k].other.push({ ft, name: a.name });
}
for (const [campName, b] of Object.entries(assetByCamp)) {
  md += `### ${campName}\n\n`;
  if (b.sitelinks.length) {
    md += `**Sitelinks:**\n\n`;
    for (const s of b.sitelinks) md += `- ${s.linkText||'(?)'} — ${s.description1||''} ${s.description2||''}\n`;
    md += `\n`;
  }
  if (b.callouts.length) {
    md += `**Callouts:** ${b.callouts.map(c=>`"${c.calloutText}"`).join(', ')}\n\n`;
  }
  if (b.snippets.length) {
    md += `**Structured snippets:**\n\n`;
    for (const s of b.snippets) md += `- ${s.header}: ${(s.values||[]).join(', ')}\n`;
    md += `\n`;
  }
  if (b.calls.length) {
    md += `**Call:** ${b.calls.map(c=>`+${c.countryCode||''} ${c.phoneNumber}`).join(', ')}\n\n`;
  }
}

const outPath = `projects/briefs/got-moles-paid-search/${today}_full-google-ads-inventory.md`;
fs.writeFileSync(outPath, md);
console.log(`✅ Wrote ${md.length.toLocaleString()} chars to ${outPath}`);
