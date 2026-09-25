import fs from 'node:fs';
import path from 'node:path';
const env={};
for(const line of fs.readFileSync(path.resolve('.env'),'utf8').split(/\r?\n/)){
  const m=line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);if(!m)continue;
  let v=m[2].trim();if((v.startsWith('"')&&v.endsWith('"'))||(v.startsWith("'")&&v.endsWith("'")))v=v.slice(1,-1);
  env[m[1]]=v;
}
const cust='1665761172', mcc='2845309762';
async function tok(){
  const r=await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:env.GOOGLE_ADS_CLIENT_ID,client_secret:env.GOOGLE_ADS_CLIENT_SECRET,refresh_token:env.GOOGLE_ADS_REFRESH_TOKEN,grant_type:'refresh_token'})});
  return (await r.json()).access_token;
}
async function q(query){
  const t=await tok();
  const r=await fetch(`https://googleads.googleapis.com/v23/customers/${cust}/googleAds:search`,{method:'POST',headers:{Authorization:`Bearer ${t}`,'developer-token':env.GOOGLE_ADS_DEVELOPER_TOKEN,'login-customer-id':mcc,'Content-Type':'application/json'},body:JSON.stringify({query})});
  return r.json();
}

const kw=await q(`SELECT campaign.name, ad_group.id, ad_group.name, ad_group_criterion.criterion_id, ad_group_criterion.keyword.text, ad_group_criterion.keyword.match_type, ad_group_criterion.status FROM ad_group_criterion WHERE campaign.name = 'T1 v2 — City Exact' AND ad_group_criterion.type = 'KEYWORD' AND ad_group_criterion.status = 'ENABLED'`);

const byAg={};
for(const r of kw.results||[]){
  const ag=r.adGroup.name, k=r.adGroupCriterion.keyword;
  if(!byAg[ag]) byAg[ag]={ id:r.adGroup.id, exact:[], phrase:[], broad:[] };
  if(k.matchType==='EXACT') byAg[ag].exact.push(k.text);
  else if(k.matchType==='PHRASE') byAg[ag].phrase.push(k.text);
  else byAg[ag].broad.push(k.text);
}

console.log('T1 v2 keyword inventory by ad group:');
let totalExact=0, totalPhrase=0;
for(const [ag, d] of Object.entries(byAg).sort()){
  console.log(`  ${ag} (id ${d.id})`);
  console.log(`    EXACT (${d.exact.length}): ${d.exact.join(' | ')}`);
  if(d.phrase.length) console.log(`    PHRASE (${d.phrase.length}): ${d.phrase.join(' | ')}`);
  totalExact+=d.exact.length;
  totalPhrase+=d.phrase.length;
}
console.log(`\nTOTAL EXACT: ${totalExact}  TOTAL PHRASE existing: ${totalPhrase}`);

// Brand budget
const bud=await q(`SELECT campaign.name, campaign_budget.amount_micros, campaign_budget.resource_name FROM campaign WHERE campaign.name = 'Brand'`);
for(const r of bud.results||[]){
  console.log(`\nBrand budget: $${(r.campaignBudget.amountMicros/1e6).toFixed(2)}/day  (${r.campaignBudget.resourceName})`);
}
