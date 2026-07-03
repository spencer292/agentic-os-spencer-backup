// Phase 2c: T1 location targeting
// Remove all 88 existing location criteria.
// Add 5 PROXIMITY targets (city + 15mi radius).
// Add 2 LOCATION exclusions (Oregon 21164, Idaho 21146).
import fs from 'node:fs';import path from 'node:path';
const env={};for(const line of fs.readFileSync(path.resolve('.env'),'utf8').split(/\r?\n/)){const m=line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);if(!m)continue;let v=m[2].trim();if((v.startsWith('"')&&v.endsWith('"'))||(v.startsWith("'")&&v.endsWith("'")))v=v.slice(1,-1);env[m[1]]=v;}
const V='v23',CUST='1665761172',MCC=env.GOOGLE_ADS_LOGIN_CUSTOMER_ID,CAMP='23815936218';
const tk=await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:env.GOOGLE_ADS_CLIENT_ID,client_secret:env.GOOGLE_ADS_CLIENT_SECRET,refresh_token:env.GOOGLE_ADS_REFRESH_TOKEN,grant_type:'refresh_token'})});
const at=(await tk.json()).access_token;

async function gaql(query){
  const r=await fetch(`https://googleads.googleapis.com/${V}/customers/${CUST}/googleAds:search`,{method:'POST',headers:{'Authorization':`Bearer ${at}`,'developer-token':env.GOOGLE_ADS_DEVELOPER_TOKEN,'login-customer-id':MCC,'Content-Type':'application/json'},body:JSON.stringify({query})});
  return (await r.json()).results||[];
}
async function mutate(ops){
  const r=await fetch(`https://googleads.googleapis.com/${V}/customers/${CUST}/campaignCriteria:mutate`,{method:'POST',headers:{'Authorization':`Bearer ${at}`,'developer-token':env.GOOGLE_ADS_DEVELOPER_TOKEN,'login-customer-id':MCC,'Content-Type':'application/json'},body:JSON.stringify({operations:ops})});
  const j=await r.json();if(!r.ok){console.error('FAIL:',JSON.stringify(j,null,2));process.exit(1);}
  return j;
}

// 1. List existing location criteria on T1
const existing=await gaql(`SELECT campaign_criterion.resource_name FROM campaign_criterion WHERE campaign.id=${CAMP} AND campaign_criterion.type='LOCATION'`);
console.log(`Existing location criteria: ${existing.length}`);

// 2. Remove all existing
if(existing.length>0){
  const removeOps=existing.map(r=>({remove:r.campaignCriterion.resourceName}));
  // Chunk to avoid huge payload
  const chunkSize=100;
  for(let i=0;i<removeOps.length;i+=chunkSize){
    const chunk=removeOps.slice(i,i+chunkSize);
    await mutate(chunk);
    console.log(`Removed chunk ${i+1}-${i+chunk.length}`);
  }
}

// 3. Add 5 proximity targets
const cities=[
  {name:'Seattle',lat:47.6062,lng:-122.3321},
  {name:'Tacoma',lat:47.2529,lng:-122.4443},
  {name:'Kent',lat:47.3809,lng:-122.2348},
  {name:'Bellevue',lat:47.6101,lng:-122.2015},
  {name:'Kirkland',lat:47.6815,lng:-122.2087},
];
const proximityOps=cities.map(c=>({
  create:{
    campaign:`customers/${CUST}/campaigns/${CAMP}`,
    proximity:{
      geoPoint:{
        latitudeInMicroDegrees:Math.round(c.lat*1e6),
        longitudeInMicroDegrees:Math.round(c.lng*1e6),
      },
      radius:15,
      radiusUnits:'MILES',
      address:{cityName:c.name,countryCode:'US',provinceCode:'WA'},
    },
  },
}));
const pj=await mutate(proximityOps);
console.log(`Added ${pj.results.length} proximity targets`);

// 4. Add 2 state exclusions (Oregon, Idaho)
const exclusionOps=[
  {create:{campaign:`customers/${CUST}/campaigns/${CAMP}`,negative:true,location:{geoTargetConstant:'geoTargetConstants/21164'}}},
  {create:{campaign:`customers/${CUST}/campaigns/${CAMP}`,negative:true,location:{geoTargetConstant:'geoTargetConstants/21146'}}},
];
const ej=await mutate(exclusionOps);
console.log(`Added ${ej.results.length} state exclusions (OR + ID)`);

console.log('\nDone.');
