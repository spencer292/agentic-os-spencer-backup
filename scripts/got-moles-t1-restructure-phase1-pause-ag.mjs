// Phase 1: Pause existing T1 ad group 201392096612.
// Preserves keywords + negatives + RSAs for fallback.
import fs from 'node:fs';
import path from 'node:path';

const env={};
for(const line of fs.readFileSync(path.resolve('.env'),'utf8').split(/\r?\n/)){
  const m=line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);if(!m)continue;
  let v=m[2].trim();if((v.startsWith('"')&&v.endsWith('"'))||(v.startsWith("'")&&v.endsWith("'")))v=v.slice(1,-1);
  env[m[1]]=v;
}

const V='v23';
const CUST='1665761172';
const MCC=env.GOOGLE_ADS_LOGIN_CUSTOMER_ID;
const AG_ID='201392096612';

const tk=await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:env.GOOGLE_ADS_CLIENT_ID,client_secret:env.GOOGLE_ADS_CLIENT_SECRET,refresh_token:env.GOOGLE_ADS_REFRESH_TOKEN,grant_type:'refresh_token'})});
const at=(await tk.json()).access_token;

const r=await fetch(`https://googleads.googleapis.com/${V}/customers/${CUST}/adGroups:mutate`,{
  method:'POST',
  headers:{'Authorization':`Bearer ${at}`,'developer-token':env.GOOGLE_ADS_DEVELOPER_TOKEN,'login-customer-id':MCC,'Content-Type':'application/json'},
  body:JSON.stringify({
    operations:[{
      update:{
        resourceName:`customers/${CUST}/adGroups/${AG_ID}`,
        status:'PAUSED',
      },
      updateMask:'status',
    }],
  }),
});
const j=await r.json();
if(!r.ok){console.error('FAIL:',JSON.stringify(j,null,2));process.exit(1);}
console.log('OK:',JSON.stringify(j,null,2));
