// Pull conversions for TODAY only across all traffic — verify Roy's form fill landed.
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

console.log('═══ TODAY-ONLY CONVERSION CHECK ═══\n');

// 1. Today, segmented by hour, all traffic
const today=await gaql(`
  SELECT segments.conversion_action_name, segments.hour,
    metrics.all_conversions, metrics.conversions
  FROM customer
  WHERE segments.date = '2026-05-08'
`);
console.log('TODAY (2026-05-08) — all traffic, by hour + action:');
console.log('─'.repeat(80));
if(!today.length)console.log('  (no rows returned)');
else{
  for(const r of today){
    const all=Number(r.metrics.allConversions||0),paid=Number(r.metrics.conversions||0);
    if(all===0&&paid===0)continue;
    console.log(
      ('hour='+(r.segments.hour??'-')).padEnd(12),
      (r.segments.conversionActionName||'(unknown)').slice(0,40).padEnd(42),
      'all='+all.toFixed(1).padStart(6),
      'ads='+paid.toFixed(1).padStart(6),
    );
  }
}

// 2. Last 24 hours via TODAY + YESTERDAY date range — paid AND non-paid
const yest=await gaql(`
  SELECT segments.date, segments.conversion_action_name,
    metrics.all_conversions, metrics.conversions
  FROM customer
  WHERE segments.date BETWEEN '2026-05-07' AND '2026-05-08'
`);
console.log('\nLAST 48 HOURS (2026-05-07 + 2026-05-08):');
console.log('─'.repeat(80));
let any=false;
for(const r of yest){
  const all=Number(r.metrics.allConversions||0);
  if(all===0)continue;
  any=true;
  console.log(
    (r.segments.date||'').padEnd(12),
    (r.segments.conversionActionName||'').slice(0,40).padEnd(42),
    'all='+all.toFixed(1).padStart(6),
  );
}
if(!any)console.log('  (no conversions in last 48h on any action)');

// 3. Recent change_event log — anything modified in conversion-related infra recently
const changes=await gaql(`
  SELECT change_event.change_date_time, change_event.user_email, change_event.change_resource_type,
    change_event.resource_change_operation
  FROM change_event
  WHERE change_event.change_date_time DURING LAST_7_DAYS
    AND change_event.change_resource_type IN ('CONVERSION_ACTION','CUSTOMER','CUSTOMER_LABEL','REMARKETING_ACTION')
  ORDER BY change_event.change_date_time DESC
  LIMIT 20
`);
console.log('\nRECENT CONFIG CHANGES (last 7 days):');
console.log('─'.repeat(80));
if(!changes.length)console.log('  (none)');
else for(const r of changes){
  const c=r.changeEvent;
  console.log((c.changeDateTime||'').padEnd(28),(c.changeResourceType||'').padEnd(20),(c.resourceChangeOperation||'').padEnd(10),c.userEmail||'');
}

console.log('\n═══ END ═══');
