// Apply keyword expansion to Got Moles ads:
//  - Add ~30 T1 keywords (exact + phrase mix)
//  - Add ~25 T2 keywords (phrase)
//  - Add ~20 T3 keywords (phrase)
//  - Add ~18 negatives (medical + DIY) at account + per-campaign level
import fs from 'node:fs';
import path from 'node:path';

const env={};
for(const line of fs.readFileSync(path.resolve('.env'),'utf8').split(/\r?\n/)){
  const m=line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);if(!m)continue;
  let v=m[2].trim();if((v.startsWith('"')&&v.endsWith('"'))||(v.startsWith("'")&&v.endsWith("'")))v=v.slice(1,-1);
  env[m[1]]=v;
}
const CID='1665761172';const MCC=env.GOOGLE_ADS_LOGIN_CUSTOMER_ID;
const VERSION='v23';

const tk=await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:env.GOOGLE_ADS_CLIENT_ID,client_secret:env.GOOGLE_ADS_CLIENT_SECRET,refresh_token:env.GOOGLE_ADS_REFRESH_TOKEN,grant_type:'refresh_token'})});
const at=(await tk.json()).access_token;
const headers={'Authorization':`Bearer ${at}`,'developer-token':env.GOOGLE_ADS_DEVELOPER_TOKEN,'login-customer-id':MCC,'Content-Type':'application/json'};

// Ad group IDs from earlier audit
const AD_GROUPS={
  T1: '201392096612',
  T2: '194948641886',
  T3: '191443002130',
  Brand: '196657777816',
};
const CAMPAIGNS={
  T1: '23815936218',
  T2: '23816201508',
  T3: '23816220669',
  Brand: '23819590031',
};

// === T1 ADDITIONS ===
const T1_NEW=[
  // Geo exacts (memory: don't trust planner zeros)
  ['EXACT','mole removal seattle'],['EXACT','mole removal tacoma'],['EXACT','mole removal olympia'],
  ['EXACT','mole removal bellevue'],['EXACT','mole removal everett'],['EXACT','mole removal kent'],
  ['EXACT','mole removal redmond'],['EXACT','mole removal kirkland'],['EXACT','mole removal puyallup'],
  ['EXACT','mole removal federal way'],['EXACT','mole removal lakewood'],['EXACT','mole removal bremerton'],
  ['EXACT','mole removal gig harbor'],['EXACT','mole removal vancouver wa'],
  ['EXACT','mole exterminator seattle'],['EXACT','mole exterminator tacoma'],['EXACT','mole exterminator olympia'],
  // Fresh research finds
  ['PHRASE','moles removal price'],
  ['PHRASE','pest control for moles in my yard'],
  ['PHRASE','pest control moles near me'],
  ['PHRASE','exterminator for moles near me'],
  ['PHRASE','moles in yard removal near me'],
  ['PHRASE','ground moles removal'],
  ['PHRASE','how much does it cost to get rid of moles'],
  ['PHRASE','who gets rid of moles near me'],
  // Exact upgrades of existing phrase keywords
  ['EXACT','mole removal cost'],['EXACT','mole exterminator near me'],['EXACT','mole removal near me'],
  ['EXACT','mole catcher near me'],['EXACT','professional mole removal'],
];

// === T2 ADDITIONS (problem-aware, phrase, all 720/mo) ===
const T2_NEW=[
  ['PHRASE','how do you get rid of moles in your yard'],
  ['PHRASE','how do i get rid of moles in my yard'],
  ['PHRASE','how to get rid of moles in my yard'],
  ['PHRASE','how to get rid of moles in garden'],
  ['PHRASE','how to get rid of moles in your lawn'],
  ['PHRASE','how do you get rid of moles in your lawn'],
  ['PHRASE','how can i get rid of moles in my yard'],
  ['PHRASE','how do you get rid of moles in the yard'],
  ['PHRASE','how to get rid of moles in lawn'],
  ['PHRASE','how to get rid of moles in my lawn'],
  ['PHRASE','how to get rid of moles in your grass'],
  ['PHRASE','how can you get rid of moles in your yard'],
  ['PHRASE','how to keep moles out of yard'],
  ['PHRASE','how to keep moles out of garden'],
  ['PHRASE','how to deal with moles in your yard'],
  ['PHRASE','how to stop moles in your yard'],
  ['PHRASE','mole damage to lawn'],
  ['PHRASE','mole damage to yard'],
  ['PHRASE','small mounds in yard'],
  ['PHRASE','dirt mounds in yard'],
  ['PHRASE','tunnels in lawn'],
  ['PHRASE','tunnels in yard'],
  ['PHRASE','moles in my yard'],
  ['PHRASE','moles in my lawn'],
  ['PHRASE','lawn moles'],
];

// === T3 ADDITIONS (solution-research) ===
const T3_NEW=[
  ['PHRASE','best way to get rid of moles'],
  ['PHRASE','best way to exterminate moles'],
  ['PHRASE','best way to get rid of moles in your yard'],
  ['PHRASE','best way to get rid of moles in yard'],
  ['PHRASE','best way to remove moles from yard'],
  ['PHRASE','best way to kill moles'],
  ['PHRASE','best way to kill moles in yard'],
  ['PHRASE','best way to kill moles in your yard'],
  ['PHRASE','best way to eliminate moles'],
  ['PHRASE','best way to repel moles'],
  ['PHRASE','best way to rid your yard of moles'],
  ['PHRASE','best treatment for moles in yard'],
  ['PHRASE','what is the best way to get rid of moles'],
  ['PHRASE','what is the best way to kill moles'],
  ['PHRASE','best way to get rid of ground moles'],
  ['PHRASE','how do i get rid of garden moles'],
  ['PHRASE','how to exterminate moles from the yard'],
  ['PHRASE','how do u get rid of moles'],
  ['PHRASE','castor oil to deter moles'],
  ['PHRASE','how to control moles in lawn'],
];

// === NEGATIVES ===
// Medical/cosmetic — mandatory at account level
const ACCOUNT_NEGATIVES=[
  ['BROAD','body mole'],['BROAD','skin mole'],['BROAD','face mole'],
  ['BROAD','beauty mark'],['BROAD','beauty marks'],['BROAD','laser removal'],
  ['BROAD','laser mole'],['BROAD','cosmetic mole'],['BROAD','dermatologist mole'],
  ['BROAD','mole on face'],['BROAD','mole on body'],
  ['BROAD','remove moles from body'],['BROAD','skin moles removal'],
];
// DIY-product / informational — campaign level on T1
const T1_NEGATIVES=[
  ['BROAD','bait'],['BROAD','mole bait'],['BROAD','grub killer'],['BROAD','mole killer'],
  ['BROAD','vibration stake'],['BROAD','vibration stakes'],['BROAD','homemade'],
];

// === Mutate via mutate API ===
async function mutateAdGroupCriteria(adGroupId,keywords,negative=false){
  const operations=keywords.map(([matchType,text])=>({
    create:{
      adGroup:`customers/${CID}/adGroups/${adGroupId}`,
      keyword:{text,matchType},
      ...(negative?{negative:true}:{status:'ENABLED'}),
    }
  }));
  const r=await fetch(`https://googleads.googleapis.com/${VERSION}/customers/${CID}/adGroupCriteria:mutate`,{
    method:'POST',headers,body:JSON.stringify({operations}),
  });
  const j=await r.json();
  if(j.error){console.log('  ✗ '+JSON.stringify(j.error.details?.[0]?.errors||j.error,null,2).slice(0,400));return 0;}
  return (j.results||[]).length;
}

async function mutateCampaignNegatives(campaignId,keywords){
  const operations=keywords.map(([matchType,text])=>({
    create:{
      campaign:`customers/${CID}/campaigns/${campaignId}`,
      keyword:{text,matchType},
      negative:true,
    }
  }));
  const r=await fetch(`https://googleads.googleapis.com/${VERSION}/customers/${CID}/campaignCriteria:mutate`,{
    method:'POST',headers,body:JSON.stringify({operations}),
  });
  const j=await r.json();
  if(j.error){console.log('  ✗ '+JSON.stringify(j.error.details?.[0]?.errors||j.error,null,2).slice(0,400));return 0;}
  return (j.results||[]).length;
}

async function mutateAccountNegatives(keywords){
  const operations=keywords.map(([matchType,text])=>({
    create:{
      keyword:{text,matchType},
    }
  }));
  const r=await fetch(`https://googleads.googleapis.com/${VERSION}/customers/${CID}/customerNegativeCriteria:mutate`,{
    method:'POST',headers,body:JSON.stringify({operations}),
  });
  const j=await r.json();
  if(j.error){console.log('  ✗ '+JSON.stringify(j.error.details?.[0]?.errors||j.error,null,2).slice(0,400));return 0;}
  return (j.results||[]).length;
}

console.log('=== APPLYING KEYWORD EXPANSION ===\n');

console.log(`T1 — adding ${T1_NEW.length} keywords to ad_group ${AD_GROUPS.T1}`);
const t1Added=await mutateAdGroupCriteria(AD_GROUPS.T1,T1_NEW);
console.log(`  ✓ ${t1Added} added`);

console.log(`\nT2 — adding ${T2_NEW.length} keywords to ad_group ${AD_GROUPS.T2}`);
const t2Added=await mutateAdGroupCriteria(AD_GROUPS.T2,T2_NEW);
console.log(`  ✓ ${t2Added} added`);

console.log(`\nT3 — adding ${T3_NEW.length} keywords to ad_group ${AD_GROUPS.T3}`);
const t3Added=await mutateAdGroupCriteria(AD_GROUPS.T3,T3_NEW);
console.log(`  ✓ ${t3Added} added`);

console.log(`\nAccount-level negatives — ${ACCOUNT_NEGATIVES.length} medical/cosmetic`);
const accAdded=await mutateAccountNegatives(ACCOUNT_NEGATIVES);
console.log(`  ✓ ${accAdded} added`);

console.log(`\nT1 campaign negatives — ${T1_NEGATIVES.length} DIY/product`);
const t1NegAdded=await mutateCampaignNegatives(CAMPAIGNS.T1,T1_NEGATIVES);
console.log(`  ✓ ${t1NegAdded} added`);

console.log(`\n═══ TOTAL ═══`);
console.log(`Keywords added:  T1=${t1Added}, T2=${t2Added}, T3=${t3Added} (total ${t1Added+t2Added+t3Added})`);
console.log(`Negatives added: account=${accAdded}, T1-campaign=${t1NegAdded}`);
