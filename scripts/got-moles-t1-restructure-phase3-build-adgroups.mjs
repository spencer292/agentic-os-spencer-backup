// Phase 3: Build 5 city ad groups + keywords + RSAs.
// Per build spec 2026-05-15_google-ads-5-ad-group-build-spec.md
import fs from 'node:fs';import path from 'node:path';
const env={};for(const line of fs.readFileSync(path.resolve('.env'),'utf8').split(/\r?\n/)){const m=line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);if(!m)continue;let v=m[2].trim();if((v.startsWith('"')&&v.endsWith('"'))||(v.startsWith("'")&&v.endsWith("'")))v=v.slice(1,-1);env[m[1]]=v;}
const V='v23',CUST='1665761172',MCC=env.GOOGLE_ADS_LOGIN_CUSTOMER_ID,CAMP='23815936218';
const tk=await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:env.GOOGLE_ADS_CLIENT_ID,client_secret:env.GOOGLE_ADS_CLIENT_SECRET,refresh_token:env.GOOGLE_ADS_REFRESH_TOKEN,grant_type:'refresh_token'})});
const at=(await tk.json()).access_token;
async function call(endpoint,ops){
  const r=await fetch(`https://googleads.googleapis.com/${V}/customers/${CUST}/${endpoint}:mutate`,{method:'POST',headers:{'Authorization':`Bearer ${at}`,'developer-token':env.GOOGLE_ADS_DEVELOPER_TOKEN,'login-customer-id':MCC,'Content-Type':'application/json'},body:JSON.stringify({operations:ops})});
  const j=await r.json();if(!r.ok){console.error(`${endpoint} FAIL:`,JSON.stringify(j,null,2));process.exit(1);}
  return j;
}

const CITIES=[
  {name:'Seattle',cpc:14.0,lp:'https://got-moles.com/lp/seattle/'},
  {name:'Tacoma',cpc:12.0,lp:'https://got-moles.com/lp/tacoma/'},
  {name:'Kent',cpc:10.0,lp:'https://got-moles.com/lp/kent/'},
  {name:'Bellevue',cpc:14.0,lp:'https://got-moles.com/lp/bellevue/'},
  {name:'Kirkland',cpc:14.0,lp:'https://got-moles.com/lp/kirkland/'},
];

// Shared headlines H2-H14 (identical across all 5)
const SHARED_HEADLINES=[
  '$150 Deposit, $450 Max',  // H2 wait we want "No Catch, No Charge" per latest spec
];
// Per spec v3 FINAL — let me re-list from the spec exactly:
// H2: No Catch, No Charge
// H3: Call (253) 750-0211
// H4: Tunnels in Your Yard?
// H5: Speak with Spencer
// H6: 219+ 5-Star Reviews
// H7: Safe for Pets & Kids
// H8: Year-Round Protection
// H9: Mole Damage? Call Now
// H10: Veteran-Owned Local
// H11: $150 Deposit, $450 Max
// H12: Year-Round $100/Mo
// H13: Spencer's 15+ Years
// H14: No Poisons, No Chemicals
const SHARED_H=['No Catch, No Charge','Call (253) 750-0211','Tunnels in Your Yard?','Speak with Spencer','219+ 5-Star Reviews','Safe for Pets & Kids','Year-Round Protection','Mole Damage? Call Now','Veteran-Owned Local','$150 Deposit, $450 Max','Year-Round $100/Mo',"Spencer's 15+ Years",'No Poisons, No Chemicals'];

// Shared descriptions D1, D2, D4 (D3 varies by city)
const D1='Got Moles: $150 deposit, 4-5 week trapping. No moles caught? You pay nothing more.';
const D2='$150 deposit. If we catch moles in 4-5 weeks, total $450. If not, no extra charge.';
const D4='Year-round protection $100/month. Unlimited visits. No extra charges.';

const created={};

// === Build 5 ad groups ===
console.log('=== Phase 3.1: Creating 5 ad groups ===');
const agOps=CITIES.map(c=>({
  create:{
    campaign:`customers/${CUST}/campaigns/${CAMP}`,
    name:c.name,
    status:'ENABLED',
    type:'SEARCH_STANDARD',
    cpcBidMicros:String(Math.round(c.cpc*1e6)),
  },
}));
const agJ=await call('adGroups',agOps);
agJ.results.forEach((r,i)=>{
  created[CITIES[i].name]={agResource:r.resourceName,agId:r.resourceName.split('/').pop()};
  console.log(`  ${CITIES[i].name} -> ${r.resourceName.split('/').pop()}`);
});

// === Build 15 keywords (3 per ad group) ===
console.log('\n=== Phase 3.2: Adding 15 keywords (3 per ad group) ===');
const kwOps=[];
for(const c of CITIES){
  const ag=created[c.name].agResource;
  const cityLower=c.name.toLowerCase();
  kwOps.push({create:{adGroup:ag,status:'ENABLED',keyword:{text:`mole removal ${cityLower}`,matchType:'EXACT'}}});
  kwOps.push({create:{adGroup:ag,status:'ENABLED',keyword:{text:`mole control ${cityLower}`,matchType:'EXACT'}}});
  kwOps.push({create:{adGroup:ag,status:'ENABLED',keyword:{text:`moles in yard ${cityLower}`,matchType:'PHRASE'}}});
}
const kwJ=await call('adGroupCriteria',kwOps);
console.log(`  Added ${kwJ.results.length} keywords`);

// === Build 5 RSAs (1 per ad group) ===
console.log('\n=== Phase 3.3: Creating 5 RSAs ===');
const rsaOps=CITIES.map(c=>{
  const ag=created[c.name].agResource;
  const D3=`Mole tunnels in your yard? Peak season in ${c.name}. Call Got Moles today.`;
  const headlines=[
    {text:`Mole Removal ${c.name}`,pinnedField:'HEADLINE_1'}, // H1 pinned
    ...SHARED_H.map(t=>({text:t})),                           // H2-H14
    {text:`Mole Control ${c.name}`},                          // H15
  ];
  const descs=[{text:D1},{text:D2},{text:D3},{text:D4}];
  return {
    create:{
      adGroup:ag,
      status:'ENABLED',
      ad:{
        responsiveSearchAd:{
          headlines,
          descriptions:descs,
          path1:'Mole-Removal',
          path2:c.name,
        },
        finalUrls:[c.lp],
      },
    },
  };
});
const rsaJ=await call('adGroupAds',rsaOps);
rsaJ.results.forEach((r,i)=>{console.log(`  ${CITIES[i].name} RSA -> ${r.resourceName.split('/').pop()}`);});

console.log('\nPhase 3 complete.');
console.log(JSON.stringify(created,null,2));
