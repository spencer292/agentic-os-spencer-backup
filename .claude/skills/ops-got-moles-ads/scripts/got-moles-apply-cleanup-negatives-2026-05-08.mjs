// Apply cleanup negatives derived from 7-day SQR (2026-05-08).
// Targets: DIY-product cluster + mechanism word + info-intent leaking onto T1 + buyer-intent leaking onto T3.
// Skips: mole repellent / mole deterrent (T3 positive), mole removal seattle / got moles (real intent — conv tracking issue, not keyword waste).
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

// 1. Resolve campaign IDs
const camps=await gaql(`SELECT campaign.id, campaign.name FROM campaign WHERE campaign.status='ENABLED'`);
const idByName={};
for(const r of camps)idByName[r.campaign.name]=r.campaign.id;

const BRAND=idByName['Brand'];
const T1=idByName['T1 - Buyer Intent'];
const T2=idByName['T2 - Problem Aware (Stream 2)'];
const T3=idByName['T3 - Solution Research (Stream 2)'];
console.log('Resolved campaigns:',{BRAND,T1,T2,T3});

// 2. Existing negatives (lowercased text by campaign)
const existing=JSON.parse(fs.readFileSync('scripts/_got-moles-existing-negatives.json','utf8'));
const has=(camp,text)=>existing[camp]?.some(n=>n.text.toLowerCase()===text.toLowerCase());

// 3. Plan
const ACCOUNT_WIDE=[
  'best mole bait','mole killers','best mole killer','mole grub killer',
  'anti mole bulbs','mole vibration stakes','plants to deter moles',
  '12 gauge mole trap','how do you exterminate moles',
];
const T1_ONLY=[
  'how to get rid of moles in the garden','best way to get rid of moles in your yard',
  'natural way to get rid of moles in yard','how do you get rid of moles in your yard',
  'how to keep moles out of yard',
  'how to keep moles out of garden','how to deal with moles in your yard',
  'best ways to get rid of moles','will getting rid of grubs get rid of moles',
];
const T2_ONLY=['how to get rid of mo'];
const T3_ONLY=['mole removal'];

const allCamps=[
  ['Brand',BRAND],['T1 - Buyer Intent',T1],
  ['T2 - Problem Aware (Stream 2)',T2],['T3 - Solution Research (Stream 2)',T3],
];

// 4. Build operations (skip duplicates)
const ops=[];
for(const text of ACCOUNT_WIDE){
  for(const [name,id] of allCamps){
    if(has(name,text)){console.log(`  skip [${name}] "${text}" (exists)`);continue;}
    ops.push({campaign:`customers/${targetId}/campaigns/${id}`,negative:true,keyword:{text,matchType:'EXACT'},_label:`[${name}] "${text}"`});
  }
}
for(const text of T1_ONLY){
  if(has('T1 - Buyer Intent',text)){console.log(`  skip [T1] "${text}" (exists)`);continue;}
  ops.push({campaign:`customers/${targetId}/campaigns/${T1}`,negative:true,keyword:{text,matchType:'EXACT'},_label:`[T1] "${text}"`});
}
for(const text of T2_ONLY){
  if(has('T2 - Problem Aware (Stream 2)',text))continue;
  ops.push({campaign:`customers/${targetId}/campaigns/${T2}`,negative:true,keyword:{text,matchType:'EXACT'},_label:`[T2] "${text}"`});
}
for(const text of T3_ONLY){
  if(has('T3 - Solution Research (Stream 2)',text))continue;
  ops.push({campaign:`customers/${targetId}/campaigns/${T3}`,negative:true,keyword:{text,matchType:'EXACT'},_label:`[T3] "${text}"`});
}

console.log(`\nPrepared ${ops.length} negative-keyword operations:`);
for(const o of ops)console.log(' +',o._label);

// 5. Mutate
const mutateOps=ops.map(o=>{const{_label,...rest}=o;return{create:rest};});
const r=await fetch(`https://googleads.googleapis.com/${VERSION}/customers/${targetId}/campaignCriteria:mutate`,{
  method:'POST',
  headers:{'Authorization':`Bearer ${accessToken}`,'developer-token':env.GOOGLE_ADS_DEVELOPER_TOKEN,'login-customer-id':mccId,'Content-Type':'application/json'},
  body:JSON.stringify({operations:mutateOps}),
});
const txt=await r.text();
if(!r.ok){console.error('\nMUTATE FAIL:',txt);process.exit(1);}
const j=JSON.parse(txt);
console.log(`\n✅ Applied ${j.results?.length||0} new negatives across the 4 campaigns.`);
