// Got Moles T1 - Buyer Intent (23815936218) — fresh perf snapshot.
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
const T1='23815936218';

const tk=await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:env.GOOGLE_ADS_CLIENT_ID,client_secret:env.GOOGLE_ADS_CLIENT_SECRET,refresh_token:env.GOOGLE_ADS_REFRESH_TOKEN,grant_type:'refresh_token'})});
const accessToken=(await tk.json()).access_token;

async function gaql(query){
  const r=await fetch(`https://googleads.googleapis.com/${VERSION}/customers/${targetId}/googleAds:search`,{
    method:'POST',
    headers:{'Authorization':`Bearer ${accessToken}`,'developer-token':env.GOOGLE_ADS_DEVELOPER_TOKEN,'login-customer-id':mccId,'Content-Type':'application/json'},
    body:JSON.stringify({query}),
  });
  if(!r.ok){console.error('GAQL fail:',await r.text());return [];}
  return (await r.json()).results||[];
}

const micros=n=>Number(n||0)/1_000_000;
const fmt=(n,d=2)=>(Number(n||0)).toFixed(d);

console.log('═══ T1 - Buyer Intent ('+T1+') — '+new Date().toISOString().slice(0,16).replace('T',' ')+'Z ═══\n');

// Campaign-level: lifetime since launch + last 7 + last 1
for(const [label,range] of [['LIFETIME (LAST_30_DAYS)','LAST_30_DAYS'],['LAST_7_DAYS','LAST_7_DAYS'],['YESTERDAY','YESTERDAY']]){
  const r=await gaql(`SELECT campaign.id,campaign.status,campaign_budget.amount_micros,metrics.impressions,metrics.clicks,metrics.cost_micros,metrics.conversions,metrics.conversions_value,metrics.search_impression_share,metrics.search_top_impression_share,metrics.search_absolute_top_impression_share,metrics.average_cpc,metrics.ctr FROM campaign WHERE campaign.id=${T1} AND segments.date DURING ${range}`);
  if(!r.length){console.log(`-- ${label}: no rows`);continue;}
  const m=r[0].metrics||{};
  console.log(`── ${label} ──`);
  console.log(`  Impr: ${m.impressions||0}  Clicks: ${m.clicks||0}  CTR: ${fmt((m.ctr||0)*100)}%`);
  console.log(`  Cost: $${fmt(micros(m.costMicros))}  AvgCPC: $${fmt(micros(m.averageCpc))}`);
  console.log(`  Conv: ${fmt(m.conversions||0)}  ConvValue: $${fmt(m.conversionsValue||0)}  CPA: $${m.conversions>0?fmt(micros(m.costMicros)/m.conversions):'—'}`);
  console.log(`  IS: ${fmt((m.searchImpressionShare||0)*100)}%  Top IS: ${fmt((m.searchTopImpressionShare||0)*100)}%  AbsTop IS: ${fmt((m.searchAbsoluteTopImpressionShare||0)*100)}%`);
  console.log('');
}

// Per-keyword last 30
console.log('── KEYWORDS (LAST_30_DAYS) ──');
const kw=await gaql(`SELECT ad_group_criterion.criterion_id,ad_group_criterion.keyword.text,ad_group_criterion.keyword.match_type,ad_group_criterion.status,metrics.impressions,metrics.clicks,metrics.cost_micros,metrics.conversions,metrics.ctr,metrics.average_cpc,ad_group_criterion.quality_info.quality_score FROM keyword_view WHERE campaign.id=${T1} AND segments.date DURING LAST_30_DAYS ORDER BY metrics.impressions DESC`);
console.log('Match   QS  Impr  Clicks   CTR     Cost     Conv   AvgCPC   Keyword');
for(const row of kw){
  const c=row.adGroupCriterion;const m=row.metrics||{};
  const qs=c.qualityInfo?.qualityScore??'—';
  console.log(`${(c.keyword.matchType||'').padEnd(7)} ${String(qs).padStart(2)}  ${String(m.impressions||0).padStart(4)}  ${String(m.clicks||0).padStart(5)}  ${fmt((m.ctr||0)*100).padStart(5)}%  $${fmt(micros(m.costMicros)).padStart(6)}  ${fmt(m.conversions||0).padStart(4)}   $${fmt(micros(m.averageCpc)).padStart(5)}   ${c.keyword.text}`);
}
console.log('');

// Search terms last 30 — focus on no-conv spend
console.log('── SEARCH TERMS w/ spend (LAST_30_DAYS) ──');
const st=await gaql(`SELECT search_term_view.search_term,metrics.impressions,metrics.clicks,metrics.cost_micros,metrics.conversions,metrics.ctr,search_term_view.status FROM search_term_view WHERE campaign.id=${T1} AND segments.date DURING LAST_30_DAYS AND metrics.clicks>0 ORDER BY metrics.cost_micros DESC LIMIT 60`);
console.log('Status     Impr  Clicks   CTR     Cost   Conv   Term');
for(const row of st){
  const m=row.metrics||{};const t=row.searchTermView;
  console.log(`${(t.status||'').padEnd(8)}  ${String(m.impressions||0).padStart(4)}  ${String(m.clicks||0).padStart(5)}  ${fmt((m.ctr||0)*100).padStart(5)}%  $${fmt(micros(m.costMicros)).padStart(6)}  ${fmt(m.conversions||0).padStart(4)}   ${t.searchTerm}`);
}
console.log('');

// Geographic
console.log('── GEO PERF (LAST_30_DAYS, top 20 by cost) ──');
const geo=await gaql(`SELECT geographic_view.country_criterion_id,segments.geo_target_city,segments.geo_target_region,metrics.impressions,metrics.clicks,metrics.cost_micros,metrics.conversions FROM geographic_view WHERE campaign.id=${T1} AND segments.date DURING LAST_30_DAYS AND metrics.impressions>0 ORDER BY metrics.cost_micros DESC LIMIT 20`);
for(const row of geo){
  const m=row.metrics||{};
  console.log(`  ${row.segments?.geoTargetCity||'—'} / ${row.segments?.geoTargetRegion||'—'}  Impr:${m.impressions} Clicks:${m.clicks} Cost:$${fmt(micros(m.costMicros))} Conv:${fmt(m.conversions||0)}`);
}
console.log('');

// Device + daypart
console.log('── DEVICE (LAST_30_DAYS) ──');
const dev=await gaql(`SELECT segments.device,metrics.impressions,metrics.clicks,metrics.cost_micros,metrics.conversions FROM campaign WHERE campaign.id=${T1} AND segments.date DURING LAST_30_DAYS`);
for(const row of dev){const m=row.metrics||{};console.log(`  ${row.segments?.device}: Impr:${m.impressions} Clicks:${m.clicks} Cost:$${fmt(micros(m.costMicros))} Conv:${fmt(m.conversions||0)}`);}

// Save snapshot
const snap={generatedAt:new Date().toISOString(),campaignId:T1};
fs.writeFileSync(path.resolve('scripts/_got-moles-t1-snapshot.json'),JSON.stringify(snap,null,2));
console.log('\nDone.');
