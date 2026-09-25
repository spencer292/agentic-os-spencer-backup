// Phase 3b: Re-attempt RSA creation with H3 phone number removed.
// H3 replaced: "Call (253) 750-0211" -> "Same-Day Call-Back" (Google PHONE_NUMBER_IN_AD_TEXT policy block).
import fs from 'node:fs';import path from 'node:path';
const env={};for(const line of fs.readFileSync(path.resolve('.env'),'utf8').split(/\r?\n/)){const m=line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);if(!m)continue;let v=m[2].trim();if((v.startsWith('"')&&v.endsWith('"'))||(v.startsWith("'")&&v.endsWith("'")))v=v.slice(1,-1);env[m[1]]=v;}
const V='v23',CUST='1665761172',MCC=env.GOOGLE_ADS_LOGIN_CUSTOMER_ID;
const tk=await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:env.GOOGLE_ADS_CLIENT_ID,client_secret:env.GOOGLE_ADS_CLIENT_SECRET,refresh_token:env.GOOGLE_ADS_REFRESH_TOKEN,grant_type:'refresh_token'})});
const at=(await tk.json()).access_token;

// Ad group IDs from Phase 3.1 output:
const CITIES=[
  {name:'Seattle',agId:'196993430536',lp:'https://got-moles.com/lp/seattle/'},
  {name:'Tacoma',agId:'196993430576',lp:'https://got-moles.com/lp/tacoma/'},
  {name:'Kent',agId:'196993430616',lp:'https://got-moles.com/lp/kent/'},
  {name:'Bellevue',agId:'196993430776',lp:'https://got-moles.com/lp/bellevue/'},
  {name:'Kirkland',agId:'196993430816',lp:'https://got-moles.com/lp/kirkland/'},
];

const SHARED_H=['No Catch, No Charge','Same-Day Call-Back','Tunnels in Your Yard?','Speak with Spencer','219+ 5-Star Reviews','Safe for Pets & Kids','Year-Round Protection','Mole Damage? Call Now','Veteran-Owned Local','$150 Deposit, $450 Max','Year-Round $100/Mo',"Spencer's 15+ Years",'No Poisons, No Chemicals'];
const D1='Got Moles: $150 deposit, 4-5 week trapping. No moles caught? You pay nothing more.';
const D2='$150 deposit. If we catch moles in 4-5 weeks, total $450. If not, no extra charge.';
const D4='Year-round protection $100/month. Unlimited visits. No extra charges.';

const ops=CITIES.map(c=>{
  const D3=`Mole tunnels in your yard? Peak season in ${c.name}. Call Got Moles today.`;
  const headlines=[
    {text:`Mole Removal ${c.name}`,pinnedField:'HEADLINE_1'},
    ...SHARED_H.map(t=>({text:t})),
    {text:`Mole Control ${c.name}`},
  ];
  const descs=[{text:D1},{text:D2},{text:D3},{text:D4}];
  return {
    create:{
      adGroup:`customers/${CUST}/adGroups/${c.agId}`,
      status:'ENABLED',
      ad:{
        responsiveSearchAd:{headlines,descriptions:descs,path1:'Mole-Removal',path2:c.name},
        finalUrls:[c.lp],
      },
    },
  };
});

const r=await fetch(`https://googleads.googleapis.com/${V}/customers/${CUST}/adGroupAds:mutate`,{
  method:'POST',
  headers:{'Authorization':`Bearer ${at}`,'developer-token':env.GOOGLE_ADS_DEVELOPER_TOKEN,'login-customer-id':MCC,'Content-Type':'application/json'},
  body:JSON.stringify({operations:ops}),
});
const j=await r.json();
if(!r.ok){console.error('FAIL:',JSON.stringify(j,null,2));process.exit(1);}
j.results.forEach((rr,i)=>console.log(`${CITIES[i].name} RSA: ${rr.resourceName.split('/').pop()}`));
