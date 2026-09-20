// Phase 2b: Add ad schedule + mobile bid modifier to T1
// Mon-Fri 7-20, Sat-Sun 8-18. Mobile +20%.
import fs from 'node:fs';import path from 'node:path';
const env={};for(const line of fs.readFileSync(path.resolve('.env'),'utf8').split(/\r?\n/)){const m=line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);if(!m)continue;let v=m[2].trim();if((v.startsWith('"')&&v.endsWith('"'))||(v.startsWith("'")&&v.endsWith("'")))v=v.slice(1,-1);env[m[1]]=v;}
const V='v23',CUST='1665761172',MCC=env.GOOGLE_ADS_LOGIN_CUSTOMER_ID,CAMP='23815936218';
const tk=await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:env.GOOGLE_ADS_CLIENT_ID,client_secret:env.GOOGLE_ADS_CLIENT_SECRET,refresh_token:env.GOOGLE_ADS_REFRESH_TOKEN,grant_type:'refresh_token'})});
const at=(await tk.json()).access_token;

const ops=[];
const weekdayHours={start:7,end:20};
const weekendHours={start:8,end:18};
for(const day of ['MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY']){
  ops.push({create:{campaign:`customers/${CUST}/campaigns/${CAMP}`,adSchedule:{dayOfWeek:day,startHour:weekdayHours.start,startMinute:'ZERO',endHour:weekdayHours.end,endMinute:'ZERO'}}});
}
for(const day of ['SATURDAY','SUNDAY']){
  ops.push({create:{campaign:`customers/${CUST}/campaigns/${CAMP}`,adSchedule:{dayOfWeek:day,startHour:weekendHours.start,startMinute:'ZERO',endHour:weekendHours.end,endMinute:'ZERO'}}});
}

const r=await fetch(`https://googleads.googleapis.com/${V}/customers/${CUST}/campaignCriteria:mutate`,{
  method:'POST',
  headers:{'Authorization':`Bearer ${at}`,'developer-token':env.GOOGLE_ADS_DEVELOPER_TOKEN,'login-customer-id':MCC,'Content-Type':'application/json'},
  body:JSON.stringify({operations:ops}),
});
const j=await r.json();
if(!r.ok){console.error('SCHEDULE FAIL:',JSON.stringify(j,null,2));process.exit(1);}
console.log('OK schedule:',j.results.length,'entries created');

// Mobile +20%
const r2=await fetch(`https://googleads.googleapis.com/${V}/customers/${CUST}/campaignCriteria:mutate`,{
  method:'POST',
  headers:{'Authorization':`Bearer ${at}`,'developer-token':env.GOOGLE_ADS_DEVELOPER_TOKEN,'login-customer-id':MCC,'Content-Type':'application/json'},
  body:JSON.stringify({operations:[{create:{campaign:`customers/${CUST}/campaigns/${CAMP}`,device:{type:'MOBILE'},bidModifier:1.20}}]}),
});
const j2=await r2.json();
if(!r2.ok){
  // Mobile criterion may already exist - try update instead
  console.log('Mobile create failed (probably exists), trying via search+update...');
  const search=await fetch(`https://googleads.googleapis.com/${V}/customers/${CUST}/googleAds:search`,{method:'POST',headers:{'Authorization':`Bearer ${at}`,'developer-token':env.GOOGLE_ADS_DEVELOPER_TOKEN,'login-customer-id':MCC,'Content-Type':'application/json'},body:JSON.stringify({query:`SELECT campaign_criterion.resource_name, campaign_criterion.device.type FROM campaign_criterion WHERE campaign.id=${CAMP} AND campaign_criterion.type='DEVICE'`})});
  const sj=await search.json();
  const mobile=sj.results.find(r=>r.campaignCriterion.device.type==='MOBILE');
  if(mobile){
    const r3=await fetch(`https://googleads.googleapis.com/${V}/customers/${CUST}/campaignCriteria:mutate`,{
      method:'POST',
      headers:{'Authorization':`Bearer ${at}`,'developer-token':env.GOOGLE_ADS_DEVELOPER_TOKEN,'login-customer-id':MCC,'Content-Type':'application/json'},
      body:JSON.stringify({operations:[{update:{resourceName:mobile.campaignCriterion.resourceName,bidModifier:1.20},updateMask:'bid_modifier'}]}),
    });
    const j3=await r3.json();
    if(!r3.ok){console.error('Mobile update FAIL:',JSON.stringify(j3,null,2));process.exit(1);}
    console.log('OK mobile bid +20% (updated existing)');
  }
}else{
  console.log('OK mobile bid +20% (created)');
}
