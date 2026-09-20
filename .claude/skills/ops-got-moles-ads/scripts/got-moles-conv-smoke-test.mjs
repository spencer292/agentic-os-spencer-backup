// Conversion-tracking smoke test (2026-05-08).
// 1. List ENABLED conversion actions with primary/type/status
// 2. Pull last-7-day conversions segmented by conversion action
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

console.log('═══ CONVERSION-TRACKING SMOKE TEST ═══\n');

// 1. List enabled conv actions
const actions=await gaql(`
  SELECT
    conversion_action.id, conversion_action.name, conversion_action.status,
    conversion_action.type, conversion_action.category,
    conversion_action.primary_for_goal, conversion_action.include_in_conversions_metric,
    conversion_action.counting_type, conversion_action.attribution_model_settings.attribution_model
  FROM conversion_action
  WHERE conversion_action.status = 'ENABLED'
`);
console.log(`ENABLED CONVERSION ACTIONS (${actions.length}):`);
console.log('─'.repeat(110));
for(const r of actions){
  const c=r.conversionAction;
  console.log(
    (c.name||'').slice(0,38).padEnd(40),
    'id='+(c.id||'').padEnd(12),
    'type='+(c.type||'').padEnd(22),
    'primary='+!!c.primaryForGoal,
    'inMetric='+!!c.includeInConversionsMetric,
  );
}

// 2. Conversions by action (last 7 days, all campaigns)
const conv=await gaql(`
  SELECT
    segments.conversion_action, segments.conversion_action_name, segments.conversion_action_category,
    metrics.all_conversions, metrics.conversions, metrics.all_conversions_value
  FROM customer
  WHERE segments.date DURING LAST_7_DAYS
`);

console.log('\n\nCONVERSIONS BY ACTION (last 7 days, all traffic incl. organic):');
console.log('─'.repeat(110));
let totAll=0,totAds=0;
if(!conv.length){
  console.log('  (no conversions reported in last 7 days for any action)');
}else{
  for(const r of conv){
    const s=r.segments,m=r.metrics;
    const all=Number(m.allConversions||0),paid=Number(m.conversions||0);
    totAll+=all;totAds+=paid;
    console.log(
      (s.conversionActionName||'').slice(0,35).padEnd(37),
      'cat='+(s.conversionActionCategory||'').padEnd(18),
      'all='+all.toFixed(1).padStart(6),
      'ads='+paid.toFixed(1).padStart(6),
    );
  }
  console.log('─'.repeat(110));
  console.log(`TOTAL last 7d: all=${totAll.toFixed(1)}  ads=${totAds.toFixed(1)}`);
}

// 3. Same but campaign-segmented (paid traffic only)
const byCamp=await gaql(`
  SELECT campaign.name, segments.conversion_action_name,
    metrics.conversions, metrics.all_conversions
  FROM campaign
  WHERE segments.date DURING LAST_7_DAYS
    AND metrics.all_conversions > 0
`);
console.log('\n\nPAID-CAMPAIGN CONVERSIONS BY ACTION (last 7 days):');
console.log('─'.repeat(110));
if(!byCamp.length){
  console.log('  (no paid-campaign conversions in last 7 days)');
}else{
  for(const r of byCamp){
    console.log(
      (r.campaign.name||'').slice(0,30).padEnd(32),
      (r.segments.conversionActionName||'').slice(0,35).padEnd(37),
      'ads='+Number(r.metrics.conversions||0).toFixed(1).padStart(6),
      'all='+Number(r.metrics.allConversions||0).toFixed(1).padStart(6),
    );
  }
}

console.log('\n═══ END ═══');
