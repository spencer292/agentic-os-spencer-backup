// Got Moles Ads — 3-day pulse since 2026-05-05 launch.
// Pulls per-campaign spend / clicks / conv / IS, plus search terms with no conv.
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

const fmt=(n,d=2)=>(Number(n||0)).toFixed(d);
const micros=n=>Number(n||0)/1_000_000;

console.log('═══ GOT MOLES — LAST 7 DAYS PULSE ═══\n');

// === Campaign performance ===
const camps=await gaql(`
  SELECT campaign.id, campaign.name, campaign.status,
    metrics.impressions, metrics.clicks, metrics.cost_micros,
    metrics.conversions, metrics.all_conversions,
    metrics.search_impression_share, metrics.search_budget_lost_impression_share,
    metrics.search_rank_lost_impression_share, metrics.average_cpc
  FROM campaign
  WHERE segments.date DURING LAST_7_DAYS
    AND campaign.status = 'ENABLED'
  ORDER BY metrics.cost_micros DESC
`);

console.log('CAMPAIGN PERFORMANCE (last 7 days)');
console.log('─'.repeat(120));
console.log('Campaign'.padEnd(35),'Imp'.padStart(7),'Clk'.padStart(5),'Cost'.padStart(9),'AvgCPC'.padStart(8),'Conv'.padStart(6),'IS%'.padStart(6),'BudLost%'.padStart(9),'RankLost%'.padStart(10));
console.log('─'.repeat(120));
let totCost=0,totClk=0,totConv=0;
for(const r of camps){
  const c=r.campaign,m=r.metrics;
  const cost=micros(m.costMicros);
  totCost+=cost;totClk+=Number(m.clicks||0);totConv+=Number(m.conversions||0);
  console.log(
    (c.name||'').padEnd(35),
    String(m.impressions||0).padStart(7),
    String(m.clicks||0).padStart(5),
    ('$'+fmt(cost)).padStart(9),
    ('$'+fmt(micros(m.averageCpc))).padStart(8),
    fmt(m.conversions,1).padStart(6),
    (m.searchImpressionShare?fmt(m.searchImpressionShare*100,1)+'%':'—').padStart(6),
    (m.searchBudgetLostImpressionShare?fmt(m.searchBudgetLostImpressionShare*100,1)+'%':'—').padStart(9),
    (m.searchRankLostImpressionShare?fmt(m.searchRankLostImpressionShare*100,1)+'%':'—').padStart(10),
  );
}
console.log('─'.repeat(120));
console.log('TOTAL'.padEnd(35),''.padStart(7),String(totClk).padStart(5),('$'+fmt(totCost)).padStart(9),''.padStart(8),fmt(totConv,1).padStart(6));

// === Search terms (last 7d) ===
const terms=await gaql(`
  SELECT search_term_view.search_term, campaign.name,
    metrics.impressions, metrics.clicks, metrics.cost_micros, metrics.conversions
  FROM search_term_view
  WHERE segments.date DURING LAST_7_DAYS
    AND metrics.impressions > 0
  ORDER BY metrics.cost_micros DESC
  LIMIT 100
`);

console.log('\n\nSEARCH TERMS (last 7 days, top 50 by spend)');
console.log('─'.repeat(120));
console.log('Term'.padEnd(55),'Campaign'.padEnd(28),'Imp'.padStart(5),'Clk'.padStart(4),'Cost'.padStart(8),'Conv'.padStart(5));
console.log('─'.repeat(120));
const wasteFlags=[];
for(const r of terms.slice(0,50)){
  const t=r.searchTermView.searchText||r.searchTermView.searchTerm||'',
    c=r.campaign.name||'',m=r.metrics;
  const cost=micros(m.costMicros);
  const conv=Number(m.conversions||0);
  const flag=(cost>3 && conv===0)?' ⚠':'';
  console.log(
    t.slice(0,53).padEnd(55),
    c.slice(0,26).padEnd(28),
    String(m.impressions||0).padStart(5),
    String(m.clicks||0).padStart(4),
    ('$'+fmt(cost)).padStart(8),
    fmt(conv,1).padStart(5),
    flag,
  );
  if(cost>3&&conv===0)wasteFlags.push({term:t,cost,clicks:m.clicks});
}

if(wasteFlags.length){
  console.log('\n⚠ POTENTIAL WASTE (>$3 spent, 0 conversions):');
  for(const w of wasteFlags)console.log(`  - "${w.term}" — $${fmt(w.cost)} / ${w.clicks} clicks`);
}

// === Conversion actions ===
const conv=await gaql(`
  SELECT conversion_action.id, conversion_action.name, conversion_action.status,
    conversion_action.primary_for_goal, conversion_action.type,
    metrics.all_conversions, metrics.conversions
  FROM conversion_action
  WHERE conversion_action.status = 'ENABLED'
`);
console.log('\n\nCONVERSION ACTIONS');
console.log('─'.repeat(90));
for(const r of conv){
  const c=r.conversionAction,m=r.metrics;
  console.log((c.name||'').padEnd(45),(c.type||'').padEnd(20),'Primary='+!!c.primaryForGoal,'conv='+fmt(m?.conversions,1));
}

console.log('\n═══ END PULSE ═══');
