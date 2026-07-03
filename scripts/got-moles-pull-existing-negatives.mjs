// Dump existing campaign-level negatives keyed by campaign for diffing.
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

const rows=await gaql(`
  SELECT campaign.id, campaign.name,
    campaign_criterion.keyword.text, campaign_criterion.keyword.match_type, campaign_criterion.negative
  FROM campaign_criterion
  WHERE campaign_criterion.type = 'KEYWORD' AND campaign_criterion.negative = TRUE
`);

const byCamp={};
for(const r of rows){
  const cn=r.campaign.name;
  if(!byCamp[cn])byCamp[cn]=[];
  byCamp[cn].push({text:r.campaignCriterion.keyword.text,match:r.campaignCriterion.keyword.matchType});
}
fs.writeFileSync('scripts/_got-moles-existing-negatives.json',JSON.stringify(byCamp,null,2));
for(const [cn,list] of Object.entries(byCamp))console.log(`${cn}: ${list.length} negatives`);
