// Probe whether the ATP dev token can use Customer Match on Got Moles (post-April-2026 gate).
// Attempts to create an EMPTY CRM_BASED user list. No email data uploaded.
import fs from 'node:fs';import path from 'node:path';
const env={};for(const line of fs.readFileSync(path.resolve('.env'),'utf8').split(/\r?\n/)){const m=line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);if(!m)continue;let v=m[2].trim();if((v.startsWith('"')&&v.endsWith('"'))||(v.startsWith("'")&&v.endsWith("'")))v=v.slice(1,-1);env[m[1]]=v;}
const V='v23',CUST='1665761172',MCC=env.GOOGLE_ADS_LOGIN_CUSTOMER_ID;
const tk=await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:env.GOOGLE_ADS_CLIENT_ID,client_secret:env.GOOGLE_ADS_CLIENT_SECRET,refresh_token:env.GOOGLE_ADS_REFRESH_TOKEN,grant_type:'refresh_token'})});
const at=(await tk.json()).access_token;

const r=await fetch(`https://googleads.googleapis.com/${V}/customers/${CUST}/userLists:mutate`,{
  method:'POST',
  headers:{'Authorization':`Bearer ${at}`,'developer-token':env.GOOGLE_ADS_DEVELOPER_TOKEN,'login-customer-id':MCC,'Content-Type':'application/json'},
  body:JSON.stringify({
    operations:[{
      create:{
        name:`probe-customer-match-${Date.now()}`,
        description:'Probe to test Customer Match unlock. Safe to delete.',
        membershipLifeSpan:540,
        crmBasedUserList:{
          uploadKeyType:'CONTACT_INFO',
          dataSourceType:'FIRST_PARTY',
        },
      },
    }],
  }),
});
const j=await r.json();
if(!r.ok){
  console.log('PROBE RESULT: ❌ Customer Match BLOCKED on this account/token combo.');
  console.log('Error details:');
  console.log(JSON.stringify(j,null,2));
  console.log('\nImplication: must use Data Manager API (newer path) for the 3K-email upload.');
  process.exit(0);
}
console.log('PROBE RESULT: ✅ Customer Match UNLOCKED — legacy OfflineUserDataJobService path is available.');
console.log('List created:',j.results[0].resourceName);
console.log('\nImplication: we can use the simpler offline_user_data_jobs path for the 3K-email upload.');
console.log('\nProbe list is empty — fine to leave for now or delete. ID:',j.results[0].resourceName);
