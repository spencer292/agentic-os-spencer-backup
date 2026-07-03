// Pull current live RSAs across all 4 Got Moles campaigns to identify
// exact headlines/descriptions that need replacement (free-inspection claim).
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

const ads=await gaql(`
  SELECT
    ad_group.id, ad_group.name, ad_group.status,
    campaign.id, campaign.name, campaign.status,
    ad_group_ad.ad.id, ad_group_ad.ad.resource_name,
    ad_group_ad.ad.responsive_search_ad.headlines,
    ad_group_ad.ad.responsive_search_ad.descriptions,
    ad_group_ad.ad.responsive_search_ad.path1,
    ad_group_ad.ad.responsive_search_ad.path2,
    ad_group_ad.ad.final_urls,
    ad_group_ad.status, ad_group_ad.policy_summary.approval_status
  FROM ad_group_ad
  WHERE ad_group_ad.status = 'ENABLED'
    AND ad_group.status = 'ENABLED'
    AND campaign.status = 'ENABLED'
    AND ad_group_ad.ad.type = 'RESPONSIVE_SEARCH_AD'
`);

const out={};
for(const r of ads){
  const camp=r.campaign.name;
  out[camp]=out[camp]||[];
  const ad=r.adGroupAd.ad;
  const rsa=ad.responsiveSearchAd||{};
  out[camp].push({
    adGroup:r.adGroup.name, adGroupId:r.adGroup.id,
    campaignId:r.campaign.id,
    adId:ad.id, resourceName:ad.resourceName,
    status:r.adGroupAd.status, approval:r.adGroupAd.policySummary?.approvalStatus,
    headlines:(rsa.headlines||[]).map(h=>h.text),
    descriptions:(rsa.descriptions||[]).map(d=>d.text),
    path1:rsa.path1, path2:rsa.path2,
    finalUrls:ad.finalUrls,
  });
}

const FREE_RX=/(free [a-z- ]*?(inspection|quote|estimate|appraisal|consultation))(?!.*?(2[-\s]min|quiz))/i;

console.log('═══ GOT MOLES — LIVE RSA AUDIT (free-inspection claim) ═══\n');
for(const [camp,list] of Object.entries(out)){
  console.log(`\n═══ ${camp} ═══`);
  for(const a of list){
    console.log(`\n  Ad ${a.adId} | ${a.adGroup} | ${a.status}/${a.approval}`);
    console.log(`  Final URL: ${a.finalUrls?.[0]||'(none)'}`);
    console.log(`  Path: /${a.path1||''}/${a.path2||''}`);
    console.log('  HEADLINES:');
    for(const h of a.headlines){
      const flag=FREE_RX.test(h)?' ❌ FALSE CLAIM':(/free.*assessment/i.test(h)&&!/2[-\s]min|quiz/i.test(h))?' ⚠ AMBIGUOUS':'';
      console.log(`    - "${h}"${flag}`);
    }
    console.log('  DESCRIPTIONS:');
    for(const d of a.descriptions){
      const flag=FREE_RX.test(d)?' ❌ FALSE CLAIM':(/free.*assessment/i.test(d)&&!/2[-\s]min|quiz/i.test(d))?' ⚠ AMBIGUOUS':'';
      console.log(`    - "${d}"${flag}`);
    }
  }
}

fs.writeFileSync('scripts/_got-moles-live-rsas.json',JSON.stringify(out,null,2));
console.log('\n\nFull snapshot → scripts/_got-moles-live-rsas.json');
