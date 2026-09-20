// Pull existing T1 ad group keywords (positive, EXACT/PHRASE/BROAD) for dedup.
import fs from 'node:fs';
const env={};for(const l of fs.readFileSync('.env','utf8').split(/\r?\n/)){const m=l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);if(!m)continue;let v=m[2].trim();if((v.startsWith('"')&&v.endsWith('"'))||(v.startsWith("'")&&v.endsWith("'")))v=v.slice(1,-1);env[m[1]]=v;}
const tk=await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:env.GOOGLE_ADS_CLIENT_ID,client_secret:env.GOOGLE_ADS_CLIENT_SECRET,refresh_token:env.GOOGLE_ADS_REFRESH_TOKEN,grant_type:'refresh_token'})});
const at=(await tk.json()).access_token;

const r=await fetch('https://googleads.googleapis.com/v23/customers/1665761172/googleAds:search',{method:'POST',headers:{'Authorization':'Bearer '+at,'developer-token':env.GOOGLE_ADS_DEVELOPER_TOKEN,'login-customer-id':env.GOOGLE_ADS_LOGIN_CUSTOMER_ID,'Content-Type':'application/json'},body:JSON.stringify({query:`
  SELECT ad_group.id, ad_group.name, ad_group_criterion.criterion_id,
    ad_group_criterion.keyword.text, ad_group_criterion.keyword.match_type,
    ad_group_criterion.negative, ad_group_criterion.final_urls
  FROM ad_group_criterion
  WHERE ad_group.name = 'T1 - Buyer Intent'
    AND ad_group_criterion.type = 'KEYWORD'
    AND ad_group_criterion.negative = FALSE
    AND ad_group.status = 'ENABLED'
`})});
const j=await r.json();
const out=(j.results||[]).map(x=>({
  text:x.adGroupCriterion.keyword.text.toLowerCase(),
  match:x.adGroupCriterion.keyword.matchType,
  finalUrls:x.adGroupCriterion.finalUrls||[],
}));
fs.writeFileSync('scripts/_t1-existing-keywords.json',JSON.stringify(out,null,2));
console.log(`T1 ad group: ${out.length} positive keywords`);
const exact=out.filter(k=>k.match==='EXACT');
const phrase=out.filter(k=>k.match==='PHRASE');
console.log(`  EXACT: ${exact.length} | PHRASE: ${phrase.length}`);
console.log('\nEXACT keywords:');
for(const k of exact.sort((a,b)=>a.text.localeCompare(b.text)))console.log('  -',k.text);
