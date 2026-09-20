// Got Moles — last 14 days stats (account total + per-campaign).
import fs from 'node:fs';import path from 'node:path';
const env={};for(const line of fs.readFileSync(path.resolve('.env'),'utf8').split(/\r?\n/)){const m=line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);if(!m)continue;let v=m[2].trim();if((v.startsWith('"')&&v.endsWith('"'))||(v.startsWith("'")&&v.endsWith("'")))v=v.slice(1,-1);env[m[1]]=v;}
const T='1665761172',MCC=env.GOOGLE_ADS_LOGIN_CUSTOMER_ID,V='v23';
const tk=await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:env.GOOGLE_ADS_CLIENT_ID,client_secret:env.GOOGLE_ADS_CLIENT_SECRET,refresh_token:env.GOOGLE_ADS_REFRESH_TOKEN,grant_type:'refresh_token'})});
const at=(await tk.json()).access_token;
async function gaql(q){const r=await fetch(`https://googleads.googleapis.com/${V}/customers/${T}/googleAds:search`,{method:'POST',headers:{'Authorization':`Bearer ${at}`,'developer-token':env.GOOGLE_ADS_DEVELOPER_TOKEN,'login-customer-id':MCC,'Content-Type':'application/json'},body:JSON.stringify({query:q})});if(!r.ok){console.error('FAIL:',await r.text());return[];}return (await r.json()).results||[];}

const M=`metrics.impressions, metrics.clicks, metrics.ctr, metrics.average_cpc, metrics.cost_micros, metrics.conversions, metrics.conversions_value, metrics.cost_per_conversion`;
const RANGE=`segments.date DURING LAST_14_DAYS`;

function row(m){
  const cost=Number(m.costMicros||0)/1e6, conv=Number(m.conversions||0);
  return {impr:Number(m.impressions||0), clk:Number(m.clicks||0), ctr:(Number(m.ctr||0)*100), cpc:Number(m.averageCpc||0)/1e6, cost, conv, cpl:conv?cost/conv:0};
}
function fmt(r){return `impr ${r.impr} | clk ${r.clk} | CTR ${r.ctr.toFixed(2)}% | avgCPC $${r.cpc.toFixed(2)} | cost $${r.cost.toFixed(2)} | conv ${r.conv.toFixed(1)} | CPL ${r.cpl?('$'+r.cpl.toFixed(2)):'—'}`;}

// Per-campaign
const camps=await gaql(`SELECT campaign.name, campaign.status, ${M} FROM campaign WHERE ${RANGE} AND metrics.impressions > 0 ORDER BY metrics.cost_micros DESC`);
console.log('=== PER-CAMPAIGN — LAST 14 DAYS ===');
let tot={impr:0,clk:0,cost:0,conv:0};
for(const r of camps){const x=row(r.metrics);tot.impr+=x.impr;tot.clk+=x.clk;tot.cost+=x.cost;tot.conv+=x.conv;
  console.log(`\n${r.campaign.name} [${r.campaign.status}]`);console.log('  '+fmt(x));}
console.log('\n=== ACCOUNT TOTAL ===');
const ctr=tot.impr?tot.clk/tot.impr*100:0, cpc=tot.clk?tot.cost/tot.clk:0, cpl=tot.conv?tot.cost/tot.conv:0;
console.log(`impr ${tot.impr} | clk ${tot.clk} | CTR ${ctr.toFixed(2)}% | avgCPC $${cpc.toFixed(2)} | cost $${tot.cost.toFixed(2)} | conv ${tot.conv.toFixed(1)} | CPL ${cpl?('$'+cpl.toFixed(2)):'—'}`);

// Date range covered
const dr=await gaql(`SELECT segments.date, metrics.cost_micros FROM campaign WHERE ${RANGE} ORDER BY segments.date`);
const dates=[...new Set(dr.map(r=>r.segments.date))];
if(dates.length)console.log(`\nRange: ${dates[0]} → ${dates[dates.length-1]} (${dates.length} days)`);
console.log('=== END ===');
