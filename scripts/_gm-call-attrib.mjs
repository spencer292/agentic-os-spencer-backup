import fs from 'node:fs';
import path from 'node:path';
const env={};
for(const line of fs.readFileSync(path.resolve('.env'),'utf8').split(/\r?\n/)){
  const m=line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);if(!m)continue;
  let v=m[2].trim();if((v.startsWith('"')&&v.endsWith('"'))||(v.startsWith("'")&&v.endsWith("'")))v=v.slice(1,-1);
  env[m[1]]=v;
}
const CID='1665761172';
const MCC=env.GOOGLE_ADS_LOGIN_CUSTOMER_ID;
async function token(){
  const r=await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:env.GOOGLE_ADS_CLIENT_ID,client_secret:env.GOOGLE_ADS_CLIENT_SECRET,refresh_token:env.GOOGLE_ADS_REFRESH_TOKEN,grant_type:'refresh_token'})});
  const j=await r.json();if(!j.access_token)throw new Error(JSON.stringify(j));return j.access_token;
}
async function q(at,gaql){
  const r=await fetch(`https://googleads.googleapis.com/v23/customers/${CID}/googleAds:search`,{method:'POST',headers:{Authorization:`Bearer ${at}`,'developer-token':env.GOOGLE_ADS_DEVELOPER_TOKEN,'login-customer-id':MCC,'Content-Type':'application/json'},body:JSON.stringify({query:gaql})});
  const j=await r.json();if(j.error)throw new Error(JSON.stringify(j.error,null,2));return j.results||[];
}
const at=await token();

// 1. Conversions by campaign x conversion action (last 30d) — proves click attribution per campaign
console.log('═══ CALL/LEAD CONVERSIONS BY CAMPAIGN (last 30d, click-attributed) ═══\n');
const rows=await q(at,`
  SELECT campaign.name, segments.conversion_action_name, metrics.conversions
  FROM campaign
  WHERE segments.date DURING LAST_30_DAYS AND metrics.conversions > 0
  ORDER BY metrics.conversions DESC`);
console.log('Campaign'.padEnd(30),'Conversion action'.padEnd(34),'Conv'.padStart(6));
console.log('─'.repeat(72));
for(const r of rows){
  console.log((r.campaign.name||'').slice(0,29).padEnd(30),(r.segments.conversionActionName||'').slice(0,33).padEnd(34),(+(r.metrics.conversions||0)).toFixed(1).padStart(6));
}

// 2. Conversion action settings — attribution window + counting
console.log('\n═══ CONVERSION ACTION SETTINGS ═══\n');
const ca=await q(at,`
  SELECT conversion_action.name, conversion_action.category, conversion_action.counting_type,
         conversion_action.click_through_lookback_window_days, conversion_action.attribution_model_settings.attribution_model,
         conversion_action.status, conversion_action.primary_for_goal
  FROM conversion_action
  WHERE conversion_action.status = 'ENABLED'`);
console.log('Action'.padEnd(34),'Counting'.padEnd(18),'ClickWin'.padStart(8),'Primary'.padStart(8));
console.log('─'.repeat(72));
for(const r of ca){
  const c=r.conversionAction;
  console.log((c.name||'').slice(0,33).padEnd(34),(c.countingType||'').slice(0,17).padEnd(18),String(c.clickThroughLookbackWindowDays||'—').padStart(8),String(c.primaryForGoal??'—').padStart(8));
}
